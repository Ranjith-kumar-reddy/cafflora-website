import { useEffect, useLayoutEffect, useRef } from 'react';

let scriptPromise;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = undefined;
      script.remove();
      reject(new Error("Couldn't load Google sign-in. Check your internet connection and reload the page."));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Renders Google's own "Continue with Google" button and hands back the ID token.
export default function GoogleButton({ clientId, onCredential, onError }) {
  const container = useRef(null);
  const handlers = useRef({ onCredential, onError });

  useLayoutEffect(() => {
    handlers.current = { onCredential, onError };
  });

  useEffect(() => {
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !container.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => handlers.current.onCredential(response.credential),
          ux_mode: 'popup',
        });
        window.google.accounts.id.renderButton(container.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'left',
          width: 280,
        });
      })
      .catch((err) => {
        if (!cancelled) handlers.current.onError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return <div ref={container} className="google-button" />;
}
