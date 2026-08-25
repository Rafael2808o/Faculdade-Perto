import { pool } from '../database/pool.js';

export async function createContact(data) {
  return (await pool.query(`INSERT INTO contacts(name,email,subject,message) VALUES ($1,$2,$3,$4) RETURNING id,created_at`, [data.name,data.email,data.subject,data.message])).rows[0];
}

export async function createCorrection(data) {
  return (await pool.query(`INSERT INTO corrections(entity_type,entity_id,description,evidence_url,name,email) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,created_at,status`, [data.entityType,data.entityId || null,data.description,data.evidenceUrl || null,data.name || null,data.email || null])).rows[0];
}
