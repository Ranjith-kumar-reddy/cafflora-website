import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

const COOKIE = 'cafflora_session';
const SESSION_DAYS = 7;
const googleClient = new OAuth2Client();

export function isStaff(user) {
  if (!user) return false;
  if (user.dev) return config.devLogin;
  return Boolean(user.email) && config.staffEmails.includes(user.email.toLowerCase());
}

function publicUser(user) {
  return {
    name: user.name,
    email: user.email,
    picture: user.picture || null,
    isStaff: isStaff(user),
  };
}

function setSession(res, user) {
  const token = jwt.sign(user, config.sessionSecret, { expiresIn: `${SESSION_DAYS}d` });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

// Reads the session cookie on every request and sets req.user when it is valid.
export function readSession(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const { sub, email, name, picture, dev } = jwt.verify(token, config.sessionSecret);
      req.user = { sub, email, name, picture, dev: Boolean(dev) };
    } catch {
      // Expired or tampered cookie: treat the visitor as signed out.
    }
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in with Google to continue.' });
  next();
}

export function requireStaff(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in with Google to continue.' });
  if (!isStaff(req.user)) return res.status(403).json({ error: 'This page is for Cafflora staff only.' });
  next();
}

export const authRouter = Router();

authRouter.get('/config', (_req, res) => {
  res.json({ googleClientId: config.googleClientId || null, devLogin: config.devLogin });
});

authRouter.get('/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

authRouter.post('/google', async (req, res) => {
  if (!config.googleClientId) {
    return res.status(503).json({ error: "Google sign-in isn't set up yet. Add GOOGLE_CLIENT_ID to server/.env." });
  }
  const credential = req.body?.credential;
  if (typeof credential !== 'string' || credential.length > 4096) {
    return res.status(400).json({ error: 'Google sign-in failed. Try again.' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: config.googleClientId });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: "We couldn't verify your Google sign-in. Try again." });
  }
  if (!payload?.sub || !payload.email || !payload.email_verified) {
    return res.status(401).json({ error: 'Your Google account email must be verified to sign in.' });
  }

  const user = {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email,
    picture: payload.picture || null,
  };
  setSession(res, user);
  res.json({ user: publicUser(user) });
});

// Preview login for local testing before Google sign-in is configured.
authRouter.post('/dev', (_req, res) => {
  if (!config.devLogin) return res.status(404).json({ error: 'Not found' });
  const user = { sub: 'dev-preview', email: 'preview@localhost', name: 'Preview guest', picture: null, dev: true };
  setSession(res, user);
  res.json({ user: publicUser(user) });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});
