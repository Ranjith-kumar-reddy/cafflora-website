import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined while checking the session, null when signed out.
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    api.me()
      .then(({ user }) => !cancelled && setUser(user))
      .catch(() => !cancelled && setUser(null));
    const onSignedOut = () => setUser(null);
    window.addEventListener('cafflora:signed-out', onSignedOut);
    return () => {
      cancelled = true;
      window.removeEventListener('cafflora:signed-out', onSignedOut);
    };
  }, []);

  const signOut = useCallback(async () => {
    window.google?.accounts?.id?.disableAutoSelect();
    await api.signOut().catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, setUser, signOut }), [user, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
