import { config } from 'dotenv';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

if(process.env.NODE_ENV!=='test') config({path:resolve(dirname(fileURLToPath(import.meta.url)),'../../../../.env')});

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  PUBLIC_SITE_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1).default('postgres://faculdade:faculdade@localhost:5432/faculdade_perto'),
  DATABASE_PROVIDER: z.enum(['local','cockroach','oracle','supabase','postgres']).default('local'),
  DATABASE_SSL: z.enum(['auto','true','false']).default('auto'),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(8),
  DATABASE_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  DATA_MODE: z.enum(['database','demo']).default(process.env.NODE_ENV === 'test' ? 'demo' : 'database'),
  TRUST_PROXY: z.string().default('false').transform((value) => value === 'true'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(30)
});

export const env = schema.parse(process.env);
