import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  port: Number(process.env.PORT) || 4000,
  isProduction,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cafflora',
  googleClientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  sessionSecret: process.env.SESSION_SECRET || '',
  staffEmails: (process.env.STAFF_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  tableCount: Number(process.env.TABLE_COUNT) || 12,
  // The preview login can never be switched on in production.
  devLogin: !isProduction && process.env.ALLOW_DEV_LOGIN === 'true',
  // Render sets RENDER_EXTERNAL_URL to the site's public address. When it's there, the server
  // visits itself so the free plan never puts it to sleep. KEEP_AWAKE=false turns this off.
  keepAwakeUrl: process.env.KEEP_AWAKE === 'false' ? '' : (process.env.RENDER_EXTERNAL_URL || '').trim(),
};

if (config.sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET is missing or shorter than 32 characters. Set it in server/.env.');
}
