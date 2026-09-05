"""Extract factual tables from downloaded UFMG PDFs; no database writes.

Usage: python scripts/extract-ufmg-history.py .local-data/official-2026
Requires pdfplumber. PDFs remain outside Git. Every row carries its source page.
"""
import hashlib
import json
import re
import sys
from pathlib import Path
import pdfplumber

folder = Path(sys.argv[1])

def clean(value):
    return re.sub(r"\s+", " ", value or "").strip()

def decimal(value):
    if not re.fullmatch(r"\d{1,4},\d{2}", value):
        raise ValueError(f"Unexpected numeric cell: {value!r}")
    return float(value.replace(',', '.'))

manifest = json.loads((folder / 'ufmg-manifest.json').read_text(encoding='utf-8'))
reports = json.loads((folder / 'ufmg-reports-extracted.json').read_text(encoding='utf-8')) if '--terms-only' in sys.argv else []
report_entries = [] if '--terms-only' in sys.argv else manifest['reports']
for entry in report_entries:
    file, year, round_name, url = entry['file'], entry['year'], entry['round'], entry['url']
    published = None
    path = folder / file
    rows = []
    with pdfplumber.open(path) as pdf:
        first_page = pdf.pages[0].extract_text()
        for page_number, page in enumerate(pdf.pages, 1):
            for table in page.extract_tables():
                for row in table:
                    cells = [clean(v) for v in row]
                    if len(cells) != 5 or not re.fullmatch(r'\d{1,4},\d{2}', cells[3]):
                        continue
                    name, shift, competition, minimum, maximum = cells
                    if not name or shift not in ['Matutino', 'Vespertino', 'Noturno', 'Integral']:
                        raise ValueError(f'Unrecognized course/shift at {file}:{page_number}: {cells}')
                    if not (competition.startswith(('LI_', 'LB_')) or competition == 'Ampla concorrência'):
                        raise ValueError(f'Unrecognized competition: {competition}')
                    low, high = decimal(minimum), decimal(maximum)
                    if not 0 < low <= high <= 1000:
                        raise ValueError(f'Invalid score range: {cells}')
                    rows.append(dict(name=name, shift=shift.lower(), competition=competition, minimum=low, maximum=high, page=page_number))
            page.close()
        issued = re.search(r'publicada em (\d{2})/(\d{2})/(\d{4})', first_page)
        if issued:
            published = '-'.join(reversed(issued.groups()))
    if not published:
        raise ValueError(f'Publication date not found in {file}')
    keys = [(r['name'], r['shift'], r['competition']) for r in rows]
    if len(set(keys)) != len(keys) or len(rows) < 500:
        raise ValueError(f'Duplicate or unexpectedly incomplete report: {file}, {len(rows)} rows')
    reports.append(dict(file=file, year=year, round=round_name, published=published, url=url,
                        sha256=hashlib.sha256(path.read_bytes()).hexdigest(), rows=rows))
    print(file, len(rows), 'rows', flush=True)

(folder / 'ufmg-reports-extracted.json').write_text(json.dumps(reports, ensure_ascii=False), encoding='utf-8')

if '--reports-only' in sys.argv and (folder / 'ufmg-extracted.json').exists():
    previous = json.loads((folder / 'ufmg-extracted.json').read_text(encoding='utf-8'))
    previous['reports'] = reports
    (folder / 'ufmg-extracted.json').write_text(json.dumps(previous, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Reports:', len(reports), 'official snapshots', flush=True)
    sys.exit(0)

terms = []
path = folder / 'ufmg-2026-termo.pdf'
with pdfplumber.open(path) as pdf:
    for page_number, page in enumerate(pdf.pages, 1):
        text = page.extract_text() or ''
        local = re.search(r'Local de Oferta: (\d+) - (.*?) \((.*?), ([A-Z]{2})\)', text)
        if not local:
            page.close()
            continue
        code = re.search(r'(?m)^(\d+) - (.+)$', text)
        details = page.crop((0, 0, page.width / 2, page.height)).extract_text() or ''
        shift = re.search(r'Turno: ([^\n]+)', details)
        degree = re.search(r'Grau: ([^\n]+)', details)
        seats = re.search(r'Vagas ofertadas no Sisu: (\d+)', details)
        if code and shift and degree and seats:
            right = page.crop((page.width / 2, 0, page.width, page.height)).extract_text() or ''
            weight_area = right.split('Redação', 1)[1].split('Média mínima', 1)[0]
            pairs = re.findall(r'(\d+,\d{2})\s+(\d+,\d{2})', weight_area)
            if len(pairs) != 5:
                raise ValueError(f'Missing weights on page {page_number}: {pairs}')
            keys = ['essay', 'naturalSciences', 'humanities', 'languages', 'mathematics']
            weights = {key: decimal(pair[0]) for key, pair in zip(keys, pairs)}
            minima = {key: decimal(pair[1]) for key, pair in zip(keys, pairs)}
            terms.append(dict(code=code[1], name=clean(code[2]), shift=clean(shift[1]).lower(), degree=clean(degree[1]),
                              campusCode=local[1], campus=local[2], city=local[3], state=local[4],
                              seats=int(seats[1]), weights=weights, minima=minima, page=page_number))
        page.close()
        if page_number % 10 == 0:
            print('Term page', page_number, 'courses', len(terms), flush=True)
if len(terms) != 94:
    raise ValueError(f'Expected 94 participating courses in the term, extracted {len(terms)}')
payload = dict(reports=reports, term=dict(year=2026,
    url='https://www.ufmg.br/sisu/wp-content/uploads/2026/01/termo_adesao_575_UFMG-16-ASSINADO.pdf',
    sha256=hashlib.sha256(path.read_bytes()).hexdigest(), rows=terms))
(folder / 'ufmg-extracted.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
print('Term:', len(terms), 'participating course/shift combinations', flush=True)
