INSERT INTO sources(name,publisher,canonical_url,license,source_type,trust_tier,geographic_scope)
VALUES ('Portal oficial Medicina UNIANDRADINA','Faculdades Integradas Rui Barbosa','https://medicina.firb.br/',NULL,'portal_institucional_oficial',1,'Andradina/SP')
ON CONFLICT(name,publisher) DO UPDATE SET canonical_url=EXCLUDED.canonical_url,source_type=EXCLUDED.source_type,trust_tier=EXCLUDED.trust_tier,geographic_scope=EXCLUDED.geographic_scope;

INSERT INTO source_snapshots(source_id,reference_period,retrieved_at,sha256,original_url,schema_version)
SELECT id,'2026.2','2026-09-01T00:00:00Z','626d3da24e5a0929f85422e9b76bb308a471164a8fdd42a0e368a52955916020','https://medicina.firb.br/','official-course-page-v1'
FROM sources WHERE name='Portal oficial Medicina UNIANDRADINA' AND publisher='Faculdades Integradas Rui Barbosa'
ON CONFLICT(source_id,sha256) DO UPDATE SET retrieved_at=EXCLUDED.retrieved_at,original_url=EXCLUDED.original_url;

INSERT INTO source_records(snapshot_id,dataset,natural_key,raw_payload,row_hash)
SELECT ss.id,'verified_course_offering','firb:medicina:andradina:2026-2',
  '{"institution":"Faculdades Integradas Rui Barbosa","brand":"UNIANDRADINA","course":"Medicina","degree":"bacharelado","modality":"presencial","shift":"integral","duration_semesters":12,"address":{"street":"Rua Rodrigues Alves","number":"756","neighborhood":"Centro","postalCode":"16900-900","city":"Andradina","state":"SP"},"selection_period":"2026.2"}'::jsonb,
  '626d3da24e5a0929f85422e9b76bb308a471164a8fdd42a0e368a52955916020'
FROM source_snapshots ss JOIN sources src ON src.id=ss.source_id
WHERE src.name='Portal oficial Medicina UNIANDRADINA' AND src.publisher='Faculdades Integradas Rui Barbosa' AND ss.sha256='626d3da24e5a0929f85422e9b76bb308a471164a8fdd42a0e368a52955916020'
ON CONFLICT(snapshot_id,dataset,natural_key) DO UPDATE SET raw_payload=EXCLUDED.raw_payload,row_hash=EXCLUDED.row_hash;

INSERT INTO institution_aliases(institution_id,alias,normalized_alias,source_record_id)
SELECT i.id,'UNIANDRADINA','uniandradina',sr.id
FROM institutions i CROSS JOIN (
  SELECT record.id FROM source_records record JOIN source_snapshots snapshot ON snapshot.id=record.snapshot_id JOIN sources source ON source.id=snapshot.source_id
  WHERE source.name='Portal oficial Medicina UNIANDRADINA' AND record.natural_key='firb:medicina:andradina:2026-2' LIMIT 1
) sr
WHERE i.inep_code='109'
ON CONFLICT(institution_id,normalized_alias) DO UPDATE SET source_record_id=EXCLUDED.source_record_id;

INSERT INTO campuses(institution_id,municipality_id,external_code,name,slug,address,location_status,status,source_record_id,updated_at)
SELECT i.id,m.id,'firb-andradina-centro','Unidade Andradina — Centro','firb-andradina-centro',
  '{"street":"Rua Rodrigues Alves","number":"756","neighborhood":"Centro","postalCode":"16900-900"}'::jsonb,
  'confirmado','confirmado',sr.id,'2026-09-01T00:00:00Z'
FROM institutions i JOIN municipalities m ON m.name='Andradina' JOIN states s ON s.id=m.state_id AND s.abbreviation='SP'
CROSS JOIN (
  SELECT record.id FROM source_records record JOIN source_snapshots snapshot ON snapshot.id=record.snapshot_id JOIN sources source ON source.id=snapshot.source_id
  WHERE source.name='Portal oficial Medicina UNIANDRADINA' AND record.natural_key='firb:medicina:andradina:2026-2' LIMIT 1
) sr
WHERE i.inep_code='109'
ON CONFLICT(institution_id,slug) DO UPDATE SET municipality_id=EXCLUDED.municipality_id,address=EXCLUDED.address,location_status='confirmado',status='confirmado',source_record_id=EXCLUDED.source_record_id,updated_at=EXCLUDED.updated_at;

INSERT INTO course_offerings(institution_id,course_id,campus_id,external_code,degree,modality,shift,regulatory_status,data_status,source_record_id,updated_at)
SELECT i.id,c.id,cp.id,'firb-medicina-2026','bacharelado','presencial','integral','ativo','confirmado',sr.id,'2026-09-01T00:00:00Z'
FROM institutions i JOIN courses c ON lower(c.canonical_name)='medicina' JOIN campuses cp ON cp.institution_id=i.id AND cp.slug='firb-andradina-centro'
CROSS JOIN (
  SELECT record.id FROM source_records record JOIN source_snapshots snapshot ON snapshot.id=record.snapshot_id JOIN sources source ON source.id=snapshot.source_id
  WHERE source.name='Portal oficial Medicina UNIANDRADINA' AND record.natural_key='firb:medicina:andradina:2026-2' LIMIT 1
) sr
WHERE i.inep_code='109'
  AND NOT EXISTS (SELECT 1 FROM course_offerings existing WHERE existing.institution_id=i.id AND existing.external_code='firb-medicina-2026');
