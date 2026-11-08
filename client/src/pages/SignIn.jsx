import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import Logo from '../components/Logo.jsx';

export default function SignIn({ onSignedIn }) {
  const { setUser } = useAuth();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.authConfig().then(setConfig).catch((err) => setError(err.message));
  }, []);

  async function finish(request) {
    setBusy(true);
    setError('');
    try {
      const { user } = await request();
      setUser(user);
      onSignedIn();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="gate" id="main">
      <div className="gate-card glass">
        <Logo size={104} title="Cafflora" />
        <h1 className="gate-title">Cafflora</h1>
        <p className="gate-place">Whitefield, Bengaluru</p>
        <p className="gate-text">Sign in with your Google account to see our menu and order your coffee.</p>

        {config?.googleClientId && (
          <GoogleButton
            clientId={config.googleClientId}
            onCredential={(credential) => finish(() => api.googleSignIn(credential))}
            onError={setError}
          />
        )}

        {config && !config.googleClientId && !config.devLogin && (
          <p className="gate-text">Google sign-in isn't set up yet. Add GOOGLE_CLIENT_ID to server/.env and restart the server.</p>
        )}

        {config?.devLogin && (
          <div className="dev-login">
            <button type="button" className="btn btn-ghost" onClick={() => finish(api.devSignIn)} disabled={busy}>
              Preview without Google
            </button>
            <p className="dev-note">
              For testing on this computer only. It turns off automatically when the site goes live.
              {!config.googleClientId && ' Google sign-in appears here once GOOGLE_CLIENT_ID is set in server/.env.'}
            </p>
          </div>
        )}

        {busy && <p className="gate-text" role="status">Signing you in…</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </main>
  );
}
