import path from 'node:path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '..', '.env.e2e'), quiet: true });

const baseURL = (process.env.BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
const isLocalTarget = ['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname);

function setting(name: string, localDefault: string): string {
  const value = process.env[name];
  if (value) return value;
  if (isLocalTarget) return localDefault;
  throw new Error(`${name} must be set when BASE_URL (${baseURL}) is not local.`);
}

export const env = {
  baseURL,
  apiURL: (process.env.API_URL ?? `${baseURL}/api`).replace(/\/$/, ''),
  /** Undefined against a remote target unless set; tests that need it skip. */
  dbURL: process.env.DB_URL ?? (isLocalTarget ? 'postgres://cliq:cliq@localhost:55432/cliq' : undefined),
};

export const credentials = {
  superAdmin: {
    email: setting('SUPER_ADMIN_EMAIL', 'superadmin@cliq.test'),
    password: setting('SUPER_ADMIN_PASSWORD', 'SuperAdmin#e2e1'),
    firstName: 'E2E',
    lastName: 'Super Admin',
  },
};
