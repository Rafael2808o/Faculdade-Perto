import { pool } from '../database/pool.js';
import { foldedSql, foldText } from '../database/sqlText.js';

export function parseLocationFilter(city, state) {
  let cityName = city?.trim() || '';
  let stateCode = state?.trim().toUpperCase() || '';
  if (!stateCode && /^[a-z]{2}$/i.test(cityName)) {
    stateCode = cityName.toUpperCase();
    cityName = '';
  } else if (!stateCode) {
    const match = cityName.match(/^(.+?)(?:,|\s+-)\s*([a-z]{2})$/i);
    if (match) {
      cityName = match[1].trim();
      stateCode = match[2].toUpperCase();
    }
  }
  return { city: cityName, state: stateCode };
}

export const institutionOrganizationValues = Object.freeze({
  universidade: 'Universidade',
  centro_universitario: 'Centro Universitário',
  faculdade: 'Faculdade',
  instituto_federal: 'Instituto Federal',
  cefet: 'CEFET'
});

export const administrativeCategoryValues = Object.freeze({
  publica_federal: 'Pública Federal',
  publica_estadual: 'Pública Estadual',
  publica_municipal: 'Pública Municipal',
  privada_com_fins: 'Privada com fins lucrativos',
  privada_sem_fins: 'Privada sem fins lucrativos',
  especial: 'Especial'
});

export const foldedInstitutionSearchSql = () => `SELECT DISTINCT i.id FROM institutions i LEFT JOIN institution_aliases ia ON ia.institution_id=i.id
  WHERE ${foldedSql('i.name')} LIKE $1 OR ia.normalized_alias LIKE $1`;

export const courseRelevanceOrderSql = (exactParam,prefixParam) => `CASE WHEN ${foldedSql('c.canonical_name')} = ${exactParam} THEN 0 WHEN ${foldedSql('c.canonical_name')} LIKE ${prefixParam} THEN 1 ELSE 2 END, c.canonical_name`;
export const exactCityMatchSql = (column='m.name') => `${foldedSql(column)} = ?`;

export function greatCircleDistanceSql(latitudeSql,longitudeSql,latitudeParam,longitudeParam) {
  return `6371.0::float8 * 2.0::float8 * asin(sqrt(power(sin(radians(${latitudeSql}::float8-${latitudeParam}::float8)/2.0::float8),2.0::float8)+cos(radians(${latitudeParam}::float8))*cos(radians(${latitudeSql}::float8))*power(sin(radians(${longitudeSql}::float8-${longitudeParam}::float8)/2.0::float8),2.0::float8)))`;
}

export async function listInstitutions({ page, limit, q, state, city, network }) {
  const values = [];
  const where = [];
  const add = (sql, value) => { values.push(value); where.push(sql.replace('?', `$${values.length}`)); };
  if (q) {
    values.push(`%${foldText(q)}%`);
    where.push(`(${foldedSql('i.name')} LIKE $1 OR ${foldedSql("COALESCE(i.acronym,'')")} LIKE $1 OR EXISTS (SELECT 1 FROM institution_aliases ia WHERE ia.institution_id=i.id AND ia.normalized_alias LIKE $1))`);
  }
  const location = parseLocationFilter(city, state);
  if (location.state) add(`s.abbreviation = ?`, location.state);
  if (location.city) add(exactCityMatchSql(), foldText(location.city));
  if (network) add(`i.education_network = ?`, network);
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  let ordering = 'i.name, i.id';
  if (q) {
    values.push(foldText(q));
    const exact = `$${values.length}`;
    ordering = `CASE WHEN ${foldedSql("COALESCE(i.acronym,'')")} = ${exact} OR ${foldedSql('i.name')} = ${exact} THEN 0 ELSE 1 END, i.name, i.id`;
  }
  values.push(limit, (page - 1) * limit);
  const sql = `SELECT i.*, m.name municipality_name, m.slug municipality_slug, s.name state_name, s.abbreviation state_abbreviation,
    src.name source_name, src.canonical_url source_url, ss.imported_at, count(*) OVER() total
    FROM institutions i JOIN municipalities m ON m.id=i.headquarters_municipality_id JOIN states s ON s.id=m.state_id
    LEFT JOIN source_snapshots ss ON ss.id=i.snapshot_id LEFT JOIN sources src ON src.id=ss.source_id
    ${clause} ORDER BY ${ordering} LIMIT $${values.length - 1} OFFSET $${values.length}`;
  return (await pool.query(sql, values)).rows;
}

export async function findInstitution(idOrSlug) {
  const result = await pool.query(`SELECT i.*, m.name municipality_name, m.slug municipality_slug, s.name state_name, s.abbreviation state_abbreviation,
    mt.name maintainer_name, src.name source_name, src.canonical_url source_url, ss.imported_at, ss.reference_period
    FROM institutions i JOIN municipalities m ON m.id=i.headquarters_municipality_id JOIN states s ON s.id=m.state_id
    LEFT JOIN maintainers mt ON mt.id=i.maintainer_id LEFT JOIN source_snapshots ss ON ss.id=i.snapshot_id LEFT JOIN sources src ON src.id=ss.source_id
    WHERE i.slug=$1 OR i.id::text=$1 OR i.inep_code=$1 LIMIT 1`, [String(idOrSlug)]);
  return result.rows[0] || null;
}

export async function listInstitutionCourses(institutionId,{page=1,limit=30}={}) {
  return (await pool.query(`SELECT ccr.id, ccr.inep_course_code, ccr.original_name, ccr.degree, ccr.modality, ccr.free_indicator, ccr.census_year,
    c.id course_id, c.slug course_slug, c.cine_code, c.canonical_name, m.name municipality_name,count(*) OVER() total,
    ccr.census_seats,ccr.enrolled
    FROM course_catalog_records ccr JOIN courses c ON c.id=ccr.course_id LEFT JOIN municipalities m ON m.id=ccr.municipality_id
    WHERE ccr.institution_id=$1 ORDER BY c.canonical_name,ccr.inep_course_code LIMIT $2 OFFSET $3`, [institutionId,limit,(page-1)*limit])).rows;
}

export async function listCourses({ page, limit, q, degree, modality }) {
  const values = [];
  const where = [];
  let ordering = 'c.canonical_name';
  const add = (sql, value) => { values.push(value); where.push(sql.replace('?', `$${values.length}`)); };
  if (q) {
    const normalizedQuery=foldText(q);
    add(`${foldedSql('c.canonical_name')} LIKE ?`, `%${normalizedQuery}%`);
    values.push(normalizedQuery,`${normalizedQuery}%`);
    ordering=courseRelevanceOrderSql(`$${values.length-1}`,`$${values.length}`);
  }
  if (degree) add(`ccr.degree = ?`, degree);
  if (modality) add(`ccr.modality = ?`, modality);
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  values.push(limit, (page - 1) * limit);
  return (await pool.query(`SELECT c.id,c.cine_code,c.canonical_name,c.slug,c.cine_general_area_name,
    count(DISTINCT ccr.id)::int record_count, count(DISTINCT ccr.institution_id)::int institution_count, count(*) OVER() total
    FROM courses c JOIN course_catalog_records ccr ON ccr.course_id=c.id ${clause}
    GROUP BY c.id ORDER BY ${ordering} LIMIT $${values.length - 1} OFFSET $${values.length}`, values)).rows;
}

export async function searchCatalog({ q, city, state, network, modality, degree, organization, category, free, shift, dimension, minSeats, radiusKm, page, limit, sort, lat, lng }) {
  const values = [];
  const where = [];
  let relevanceOrder = 'c.canonical_name,i.name';
  const add = (sql, value) => { values.push(value); where.push(sql.replace('?', `$${values.length}`)); };
  if (q) {
    const normalizedQuery = foldText(q);
    const like=`%${normalizedQuery}%`;
    const [matchedCourses,matchedInstitutions]=await Promise.all([
      pool.query(`SELECT id FROM courses WHERE ${foldedSql('canonical_name')} LIKE $1`,[like]),
      pool.query(foldedInstitutionSearchSql(),[like])
    ]);
    const courseIds=matchedCourses.rows.map(({id})=>String(id));
    const institutionIds=matchedInstitutions.rows.map(({id})=>String(id));
    if (!courseIds.length&&!institutionIds.length) return [];
    if (courseIds.length&&institutionIds.length) {
      values.push(courseIds,institutionIds);
      where.push(`(ccr.course_id = ANY($${values.length-1}::bigint[]) OR ccr.institution_id = ANY($${values.length}::bigint[]))`);
    } else if (courseIds.length) add('ccr.course_id = ANY(?::bigint[])',courseIds);
    else add('ccr.institution_id = ANY(?::bigint[])',institutionIds);
    if (sort === 'relevance') {
      values.push(normalizedQuery, `${normalizedQuery}%`);
      relevanceOrder = `CASE WHEN ${foldedSql('c.canonical_name')} LIKE $${values.length - 1} THEN 0 WHEN ${foldedSql('i.name')} LIKE $${values.length - 1} THEN 1 WHEN ${foldedSql('c.canonical_name')} LIKE $${values.length} THEN 2 WHEN ${foldedSql('i.name')} LIKE $${values.length} THEN 3 ELSE 4 END,c.canonical_name,i.name`;
    }
  }
  const location = parseLocationFilter(city, state);
  if (location.city) add(exactCityMatchSql(), foldText(location.city));
  if (location.state) add(`s.abbreviation = ?`, location.state);
  if (network) add(`i.education_network = ?`, network);
  if (modality) add(`ccr.modality = ?`, modality);
  if (degree) add(`ccr.degree = ?`, degree);
  if (organization) add(`i.academic_organization = ?`, institutionOrganizationValues[organization]);
  if (category) add(`i.administrative_category = ?`, administrativeCategoryValues[category]);
  if (free) add(`ccr.free_indicator = ?`, free === 'sim');
  if (shift === 'diurno') where.push('ccr.daytime_seats > 0');
  if (shift === 'noturno') where.push('ccr.nighttime_seats > 0');
  if (dimension) add(`ccr.dimension = ?`, dimension);
  if (minSeats !== undefined) add(`ccr.census_seats >= ?`, minSeats);
  const hasOrigin = Number.isFinite(lat) && Number.isFinite(lng);
  let distanceSql = 'NULL::double precision';
  if (hasOrigin) {
    values.push(lat, lng);
    const latParam = `$${values.length - 1}`; const lngParam = `$${values.length}`;
    distanceSql = `CASE WHEN m.reference_latitude IS NULL THEN NULL ELSE ${greatCircleDistanceSql('m.reference_latitude','m.reference_longitude',latParam,lngParam)} END`;
    if (radiusKm !== undefined) {
      values.push(radiusKm);
      where.push(`m.reference_latitude IS NOT NULL AND ${greatCircleDistanceSql('m.reference_latitude','m.reference_longitude',latParam,lngParam)} <= $${values.length}`);
    }
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order = sort === 'distance' && hasOrigin ? 'distance_km NULLS LAST,c.canonical_name,i.name' : sort === 'name' ? 'c.canonical_name,i.name' : sort === 'seats' ? 'ccr.census_seats DESC NULLS LAST,c.canonical_name' : relevanceOrder;
  values.push(limit, (page - 1) * limit);
  return (await pool.query(`SELECT ccr.id, ccr.inep_course_code, ccr.original_name, ccr.degree, ccr.modality, ccr.dimension, ccr.free_indicator, ccr.census_year,
    ccr.daytime_seats,ccr.nighttime_seats,
    c.id course_id,c.slug course_slug,c.cine_code,c.canonical_name,i.id institution_id,i.name institution_name,i.acronym,i.slug institution_slug,
    i.education_network,i.administrative_category,i.academic_organization,m.name municipality_name,m.slug municipality_slug,s.abbreviation state_abbreviation,
    m.reference_longitude lng,m.reference_latitude lat,m.location_note,${distanceSql} distance_km,
    src.name source_name,src.canonical_url source_url,ss.imported_at,
    ccr.census_seats,ccr.enrolled,count(*) OVER() total
    FROM course_catalog_records ccr JOIN courses c ON c.id=ccr.course_id JOIN institutions i ON i.id=ccr.institution_id
    LEFT JOIN municipalities m ON m.id=ccr.municipality_id LEFT JOIN states s ON s.id=m.state_id
    LEFT JOIN source_snapshots ss ON ss.id=ccr.snapshot_id LEFT JOIN sources src ON src.id=ss.source_id ${clause}
    ORDER BY ${order}
    LIMIT $${values.length - 1} OFFSET $${values.length}`, values)).rows;
}

export async function searchCatalogMap(filters) {
  const rows = await searchCatalog({ ...filters, page: 1, limit: 5000, sort: filters.lat === undefined ? 'relevance' : 'distance' });
  const total = Number(rows[0]?.total || 0);
  const groups = new Map();
  for (const row of rows) {
    if (row.lat === null || row.lng === null) continue;
    const key = `${row.municipality_slug}:${row.state_abbreviation}`;
    if (!groups.has(key)) groups.set(key, {
      city: row.municipality_name, citySlug: row.municipality_slug, state: row.state_abbreviation,
      lat: Number(row.lat), lng: Number(row.lng), records: 0, institutions: new Map()
    });
    const group = groups.get(key);
    group.records += 1;
    if (!group.institutions.has(String(row.institution_id))) group.institutions.set(String(row.institution_id), {
      id: row.institution_id, name: row.institution_name, acronym: row.acronym, slug: row.institution_slug, records: 0
    });
    group.institutions.get(String(row.institution_id)).records += 1;
  }
  return {
    groups: [...groups.values()].map((group) => ({
      ...group,
      institutions: [...group.institutions.values()].sort((a,b)=>b.records-a.records||a.name.localeCompare(b.name,'pt-BR'))
    })),
    total, represented: rows.length, truncated: total > rows.length
  };
}

export async function findCatalogRecord(id) {
  const result = await pool.query(`SELECT ccr.*,c.canonical_name,c.cine_code,c.slug course_slug,c.cine_general_area_name,
    i.name institution_name,i.slug institution_slug,i.acronym,i.education_network,i.administrative_category,
    m.name municipality_name,m.slug municipality_slug,s.abbreviation state_abbreviation,
    src.name source_name,src.canonical_url source_url,ss.imported_at,ss.reference_period,
    ccr.raw_payload,
    jsonb_strip_nulls(jsonb_build_object('QT_VG_TOTAL',ccr.census_seats,'QT_MAT',ccr.enrolled)) statistics
    FROM course_catalog_records ccr JOIN courses c ON c.id=ccr.course_id JOIN institutions i ON i.id=ccr.institution_id
    LEFT JOIN municipalities m ON m.id=ccr.municipality_id LEFT JOIN states s ON s.id=m.state_id
    LEFT JOIN source_snapshots ss ON ss.id=ccr.snapshot_id LEFT JOIN sources src ON src.id=ss.source_id
    WHERE ccr.id=$1`, [id]);
  return result.rows[0] || null;
}

export async function nearbyCampuses({ lat, lng, radiusKm, limit }) {
  const distanceSql=greatCircleDistanceSql('cp.latitude','cp.longitude','$1','$2');
  return (await pool.query(`SELECT cp.id,cp.name,cp.slug,cp.status,cp.location_status,i.name institution_name,i.slug institution_slug,
    m.name municipality_name,s.abbreviation state_abbreviation,cp.longitude lng,cp.latitude lat,
    ${distanceSql} distance_km
    FROM campuses cp JOIN institutions i ON i.id=cp.institution_id LEFT JOIN municipalities m ON m.id=cp.municipality_id LEFT JOIN states s ON s.id=m.state_id
    WHERE cp.latitude IS NOT NULL AND cp.longitude IS NOT NULL AND ${distanceSql} <= $3
    ORDER BY distance_km LIMIT $4`, [lat,lng,radiusKm,limit])).rows;
}

export async function listOfferings({ page, limit, q, city, state, modality, degree }) {
  const values=[];const where=[`o.data_status IN ('confirmado','importado')`];
  const add=(sql,value)=>{values.push(value);where.push(sql.replace('?',`$${values.length}`));};
  if(q){values.push(`%${foldText(q)}%`);const queryParam=`$${values.length}`;where.push(`(${foldedSql('c.canonical_name')} LIKE ${queryParam} OR ${foldedSql('i.name')} LIKE ${queryParam} OR ${foldedSql("COALESCE(i.acronym,'')")} LIKE ${queryParam} OR ${foldedSql("COALESCE(cp.name,p.name,'')")} LIKE ${queryParam} OR EXISTS (SELECT 1 FROM institution_aliases ia WHERE ia.institution_id=i.id AND ia.normalized_alias LIKE ${queryParam}))`)}
  if(city)add(exactCityMatchSql(),foldText(city));
  if(state)add('s.abbreviation = ?',state);
  if(modality)add('o.modality = ?',modality);
  if(degree)add('o.degree = ?',degree);
  values.push(limit,(page-1)*limit);
  return (await pool.query(`SELECT o.*,c.canonical_name,c.slug course_slug,i.name institution_name,i.slug institution_slug,i.acronym,
    COALESCE(cp.name,p.name) campus_name,COALESCE(cp.address,p.address) campus_address,COALESCE(cp.latitude,p.latitude) latitude,COALESCE(cp.longitude,p.longitude) longitude,
    CASE WHEN cp.id IS NOT NULL THEN cp.location_status ELSE p.status END location_status,m.name municipality_name,s.abbreviation state_abbreviation,
    src.name source_name,src.canonical_url source_url,ss.reference_period,ss.imported_at,count(*) OVER() total
    FROM course_offerings o JOIN courses c ON c.id=o.course_id JOIN institutions i ON i.id=o.institution_id
    LEFT JOIN campuses cp ON cp.id=o.campus_id LEFT JOIN poles p ON p.id=o.pole_id
    LEFT JOIN municipalities m ON m.id=COALESCE(cp.municipality_id,p.municipality_id) LEFT JOIN states s ON s.id=m.state_id
    LEFT JOIN source_records sr ON sr.id=o.source_record_id LEFT JOIN source_snapshots ss ON ss.id=sr.snapshot_id LEFT JOIN sources src ON src.id=ss.source_id
    WHERE ${where.join(' AND ')} ORDER BY c.canonical_name,i.name LIMIT $${values.length-1} OFFSET $${values.length}`,values)).rows;
}

export async function findOffering(id) {
  return (await pool.query(`SELECT o.*,c.canonical_name,c.slug course_slug,i.name institution_name,i.slug institution_slug,
    i.acronym,COALESCE(cp.name,p.name) campus_name,COALESCE(cp.address,p.address) campus_address,COALESCE(cp.latitude,p.latitude) latitude,COALESCE(cp.longitude,p.longitude) longitude,
    CASE WHEN cp.id IS NOT NULL THEN cp.location_status ELSE p.status END location_status,m.name municipality_name,s.abbreviation state_abbreviation,
    src.name source_name,src.canonical_url source_url,ss.reference_period,ss.imported_at
    FROM course_offerings o JOIN courses c ON c.id=o.course_id JOIN institutions i ON i.id=o.institution_id
    LEFT JOIN campuses cp ON cp.id=o.campus_id LEFT JOIN poles p ON p.id=o.pole_id
    LEFT JOIN municipalities m ON m.id=COALESCE(cp.municipality_id,p.municipality_id) LEFT JOIN states s ON s.id=m.state_id
    LEFT JOIN source_records sr ON sr.id=o.source_record_id LEFT JOIN source_snapshots ss ON ss.id=sr.snapshot_id LEFT JOIN sources src ON src.id=ss.source_id
    WHERE o.id=$1 LIMIT 1`,[id])).rows[0]||null;
}

export async function listCutoffs({page,limit,q,city,state,competitionModality,score}) {
  const values=[];const where=[];
  const add=(sql,value)=>{values.push(value);where.push(sql.replace('?',`$${values.length}`));};
  if(q)add(`(${foldedSql('c.canonical_name')} LIKE ? OR ${foldedSql('i.name')} LIKE $${values.length+1})`,`%${foldText(q)}%`);
  if(city)add(exactCityMatchSql(),foldText(city));
  if(state)add('s.abbreviation = ?',state);
  if(competitionModality)add(`${foldedSql('cs.competition_modality')} LIKE ?`,`%${foldText(competitionModality)}%`);
  const clause=where.length?`WHERE ${where.join(' AND ')}`:'';
  values.push(limit,(page-1)*limit);
  const limitParam=`$${values.length-1}`,offsetParam=`$${values.length}`;
  const difference=score===undefined?'NULL::numeric':'$'+(values.push(score));
  return (await pool.query(`SELECT cs.id,cs.score,cs.competition_modality,cs.round,cs.updated_at,ao.program,ao.edition,ao.year,ao.seats,
    c.canonical_name,i.name institution_name,i.acronym,cp.name campus_name,m.name municipality_name,s.abbreviation state_abbreviation,
    src.name source_name,src.canonical_url source_url,ss.reference_period,(${difference}::numeric-cs.score)::numeric score_difference,count(*) OVER() total
    FROM cutoff_scores cs JOIN admission_offers ao ON ao.id=cs.admission_offer_id
    JOIN course_offerings o ON o.id=ao.offering_id JOIN courses c ON c.id=o.course_id JOIN institutions i ON i.id=o.institution_id
    LEFT JOIN campuses cp ON cp.id=o.campus_id LEFT JOIN poles p ON p.id=o.pole_id
    LEFT JOIN municipalities m ON m.id=COALESCE(cp.municipality_id,p.municipality_id) LEFT JOIN states s ON s.id=m.state_id
    LEFT JOIN source_records sr ON sr.id=cs.source_record_id LEFT JOIN source_snapshots ss ON ss.id=sr.snapshot_id LEFT JOIN sources src ON src.id=ss.source_id
    ${clause} ORDER BY ao.year DESC,abs(COALESCE(${difference}::numeric-cs.score,0)),c.canonical_name,cs.competition_modality
    LIMIT ${limitParam} OFFSET ${offsetParam}`,values)).rows;
}

export async function sitemapCoreData() {
  const [institutions, municipalities] = await Promise.all([
    pool.query('SELECT slug,updated_at FROM institutions ORDER BY id'),
    pool.query(`SELECT m.slug,s.abbreviation FROM municipalities m JOIN states s ON s.id=m.state_id ORDER BY m.id`)
  ]);
  return { institutions: institutions.rows, municipalities: municipalities.rows };
}

export async function sitemapRecordCount() {
  return Number((await pool.query('SELECT count(*) count FROM course_catalog_records')).rows[0].count);
}

export async function sitemapRecordsPage(page, limit) {
  return (await pool.query(`SELECT ccr.id,ss.imported_at
    FROM course_catalog_records ccr
    LEFT JOIN source_snapshots ss ON ss.id=ccr.snapshot_id
    ORDER BY ccr.id LIMIT $1 OFFSET $2`, [limit, (page - 1) * limit])).rows;
}

export async function sitemapData() {
  const [core, recordCount] = await Promise.all([sitemapCoreData(), sitemapRecordCount()]);
  return { ...core, recordCount };
}
