import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import { CartProvider } from './cart.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Nav from './components/Nav.jsx';
import Toast from './components/Toast.jsx';
import Welcome from './components/Welcome.jsx';
import { useMenu } from './hooks.js';
import Home from './pages/Home.jsx';
import MyOrders from './pages/MyOrders.jsx';
import NotFound from './pages/NotFound.jsx';
import OrderPage from './pages/OrderPage.jsx';
import SignIn from './pages/SignIn.jsx';
import Staff from './pages/Staff.jsx';

// The 3D scene (three.js) loads in its own file so the page text appears first.
const CoffeeScene = lazy(() => import('./three/CoffeeScene.jsx'));

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Shell />
      </CartProvider>
    </AuthProvider>
  );
}

const WELCOMED_KEY = 'cafflora.welcomed';

// The welcome title card plays once per browser session, on the first page a visitor opens.
function firstVisitThisSession() {
  try {
    if (sessionStorage.getItem(WELCOMED_KEY)) return false;
    sessionStorage.setItem(WELCOMED_KEY, '1');
  } catch {
    // Storage blocked: show the welcome on this load.
  }
  return true;
}

function Shell() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [origin, setOrigin] = useState('chikmagalur');
  const [welcoming, setWelcoming] = useState(firstVisitThisSession);
  const endWelcome = useCallback(() => setWelcoming(false), []);

  // The 3D camera glides in during the welcome, holds back on the sign-in card,
  // and steps back again on the order and staff pages.
  let mode = 'site';
  if (welcoming) mode = 'welcome';
  else if (pathname === '/signin') mode = 'gate';
  else if (pathname !== '/') mode = 'page';

  return (
    <>
      <Suspense fallback={null}>
        <CoffeeScene origin={origin} mode={mode} />
      </Suspense>
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {welcoming && <Welcome name={user?.name} onDone={endWelcome} />}
      <Site user={user} hidden={welcoming} origin={origin} setOrigin={setOrigin} />

      <Toast />
    </>
  );
}

// Pages that need an account show the sign-in card until the visitor signs in.
function RequireSignIn({ user, text, children }) {
  if (user === undefined) {
    return (
      <main className="page" id="main">
        <p className="status-text" role="status">Loading…</p>
      </main>
    );
  }
  if (user === null) return <SignIn text={text} />;
  return children;
}

function Site({ user, hidden, origin, setOrigin }) {
  const menu = useMenu();
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
    // Only on page changes, not on in-page hash links.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className={`site${hidden ? ' is-hidden' : ''}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <Nav user={user} />
      <Routes>
        <Route path="/" element={<Home menu={menu} origin={origin} setOrigin={setOrigin} />} />
        <Route
          path="/signin"
          element={<SignIn text="Sign in with your Google account to order coffee and follow your orders." returnAfter />}
        />
        <Route
          path="/orders"
          element={(
            <RequireSignIn user={user} text="Sign in with your Google account to see your orders.">
              <MyOrders />
            </RequireSignIn>
          )}
        />
        <Route
          path="/orders/:id"
          element={(
            <RequireSignIn user={user} text="Sign in with the Google account you ordered with to follow this order.">
              <OrderPage />
            </RequireSignIn>
          )}
        />
        <Route
          path="/staff"
          element={(
            <RequireSignIn user={user} text="Sign in with a staff Google account to see incoming orders.">
              {user?.isStaff ? <Staff /> : <NotFound staffOnly />}
            </RequireSignIn>
          )}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CartDrawer tableCount={menu.data?.tableCount ?? 12} />
    </div>
  );
}
