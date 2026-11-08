import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useCart } from '../cart.jsx';
import GoogleButton from './GoogleButton.jsx';
import InAppBrowserNotice, { detectInAppBrowser } from './InAppBrowserNotice.jsx';

const inAppBrowser = detectInAppBrowser();

// Google sign-in: the "Continue with Google" button, plus the in-app browser
// help and the local preview login. Used on the sign-in page and in the order drawer.
export default function SignInPanel() {
  const { setUser } = useAuth();
  const { showToast } = useCart();
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
      const firstName = (user.name || '').trim().split(/\s+/)[0];
      showToast(firstName ? `Signed in as ${firstName}` : 'Signed in');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="signin-panel">
      {inAppBrowser && <InAppBrowserNotice app={inAppBrowser} />}

      {config?.googleClientId && (
        <GoogleButton
          clientId={config.googleClientId}
          onCredential={(credential) => finish(() => api.googleSignIn(credential))}
          onError={setError}
        />
      )}

      {config && !config.googleClientId && !config.devLogin && (
        <p className="gate-text">Google sign-in isn&apos;t set up yet. Add GOOGLE_CLIENT_ID to server/.env and restart the server.</p>
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
  );
}
