import { createHash } from 'node:crypto';

export const sha256 = value => createHash('sha256').update(value).digest('hex');

export async function saveSource(client, { name, publisher, url, hash, referencePeriod, retrievedAt, publishedAt = null, schemaVersion, sourceType = 'portal_institucional_oficial', geographicScope = 'Brasil' }) {
  const source = (await client.query(`INSERT INTO sources(name,publisher,canonical_url,source_type,trust_tier,geographic_scope)
    VALUES ($1,$2,$3,$4,1,$5)
    ON CONFLICT(name,publisher) DO UPDATE SET canonical_url=EXCLUDED.canonical_url,source_type=EXCLUDED.source_type,
      trust_tier=EXCLUDED.trust_tier,geographic_scope=EXCLUDED.geographic_scope RETURNING id`, [name,publisher,url,sourceType,geographicScope])).rows[0];
  return (await client.query(`INSERT INTO source_snapshots(source_id,reference_period,retrieved_at,published_at,sha256,original_url,schema_version)
    VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(source_id,sha256) DO UPDATE SET retrieved_at=EXCLUDED.retrieved_at RETURNING id`,
    [source.id,referencePeriod,retrievedAt,publishedAt,hash,url,schemaVersion])).rows[0].id;
}

export async function saveRecord(client, snapshotId, dataset, key, payload) {
  const text = JSON.stringify(payload);
  return (await client.query(`INSERT INTO source_records(snapshot_id,dataset,natural_key,raw_payload,row_hash)
    VALUES ($1,$2,$3,$4::jsonb,$5) ON CONFLICT(snapshot_id,dataset,natural_key)
    DO UPDATE SET raw_payload=EXCLUDED.raw_payload,row_hash=EXCLUDED.row_hash RETURNING id`,
    [snapshotId,dataset,key,text,sha256(text)])).rows[0].id;
}
