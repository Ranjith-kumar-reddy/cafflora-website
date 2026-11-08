import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Logo from '../components/Logo.jsx';
import SignInPanel from '../components/SignInPanel.jsx';

// Only paths inside this site, so ?next= can't send visitors elsewhere.
function safeNext(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

// The sign-in card. On /signin it returns to ?next= once signed in; on pages that
// need an account (my orders, an order, staff) the page itself appears once signed in.
export default function SignIn({ text, returnAfter = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    if (returnAfter && user) navigate(safeNext(params.get('next')), { replace: true });
  }, [returnAfter, user, params, navigate]);

  return (
    <main className="gate gate-page" id="main">
      <div className="gate-card glass">
        <Logo size={104} title="Cafflora" />
        <h1 className="gate-title">Cafflora</h1>
        <p className="gate-place">Whitefield, Bengaluru</p>
        <p className="gate-text">{text}</p>
        <SignInPanel />
      </div>
    </main>
  );
}
