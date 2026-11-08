import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import mongoose from 'mongoose';
import { config } from './config.js';
import { authRouter, readSession, requireStaff, requireUser } from './auth.js';
import { CATEGORIES, menuWithPhotos } from './menu.js';
import { ordersRouter, staffRouter } from './orders.js';
import { reviewsRouter, reviewsStaffRouter } from './reviews.js';

const app = express();
app.disable('x-powered-by');
if (config.isProduction) app.set('trust proxy', 1);

app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
app.use(readSession);

// Answers right away without touching the database, so uptime checks and Render can tell the server is up.
app.get('/api/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'up' : 'down' });
});

app.use('/api/auth', authRouter);
// The menu and reviews are open to everyone; ordering and posting a review need Google sign-in.
app.get('/api/menu', (_req, res) => {
  res.json({ categories: CATEGORIES, items: menuWithPhotos(), tableCount: config.tableCount });
});
app.use('/api/orders', requireUser, ordersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/staff/reviews', requireStaff, reviewsStaffRouter);
app.use('/api/staff', requireStaff, staffRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// In production the server also serves the built React app.
const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url));
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: "That request wasn't valid JSON." });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Try again in a moment.' });
});

try {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
} catch (err) {
  // Never log the user name or password inside the address.
  const where = config.mongoUri.replace(/\/\/[^@/]*@/, '//');
  console.error(`Can't reach MongoDB at ${where}. Check that the MongoDB service is running.`);
  console.error(err.message);
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`Cafflora API running on http://localhost:${config.port}`);
  if (!config.googleClientId) console.log('Google sign-in is off: set GOOGLE_CLIENT_ID in server/.env.');
  if (config.devLogin) console.log('Preview login is on (ALLOW_DEV_LOGIN=true).');
  if (config.keepAwakeUrl) keepAwake(config.keepAwakeUrl);
});

// Render's free plan puts the site to sleep after 15 minutes without visitors, and this service
// didn't always wake up again (2026-11-08). A visit to our own public address every 5 minutes
// goes through Render like any visitor's, so the site stays awake and opens at once.
function keepAwake(publicUrl) {
  const healthUrl = new URL('/api/health', publicUrl);
  const visit = async () => {
    try {
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) console.error(`Keep-awake visit got HTTP ${res.status}.`);
    } catch (err) {
      console.error(`Keep-awake visit failed: ${err.message}`);
    }
  };
  setInterval(visit, 5 * 60 * 1000);
  console.log(`Keeping the site awake: visiting ${healthUrl} every 5 minutes.`);
}
