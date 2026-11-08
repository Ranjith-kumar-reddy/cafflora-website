import { useEffect } from 'react';
import { usePrefersReducedMotion } from '../hooks.js';
import Logo from './Logo.jsx';

// The title card shown once, right after signing in. Letterbox bars close in,
// the badge and greeting appear while the 3D camera glides forward, then it all lifts away.
export default function Welcome({ name, onDone }) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const timer = setTimeout(onDone, reduced ? 1500 : 3600);
    return () => clearTimeout(timer);
  }, [onDone, reduced]);

  const firstName = (name || '').trim().split(/\s+/)[0];

  return (
    <div className="welcome" role="status">
      <div className="letterbox letterbox-top" aria-hidden="true" />
      <div className="letterbox letterbox-bottom" aria-hidden="true" />
      <div className="welcome-content">
        <Logo size={112} className="welcome-logo" />
        <p className="welcome-title">Welcome to Cafflora</p>
        {firstName && <p className="welcome-name">{firstName}</p>}
      </div>
    </div>
  );
}
