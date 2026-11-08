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

function Shell() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [origin, setOrigin] = useState('chikmagalur');
  const [welcoming, setWelcoming] = useState(false);
  const endWelcome = useCallback(() => setWelcoming(false), []);

  // The 3D camera holds back on the sign-in screen, glides in once signed in,
  // and steps back again on the order and staff pages.
  let mode = 'site';
  if (!user) mode = 'gate';
  else if (welcoming) mode = 'welcome';
  else if (pathname !== '/') mode = 'page';

  return (
    <>
      <Suspense fallback={null}>
        <CoffeeScene origin={origin} mode={mode} />
      </Suspense>
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {user === null && <SignIn onSignedIn={() => setWelcoming(true)} />}
      {user && (
        <>
          {welcoming && <Welcome name={user.name} onDone={endWelcome} />}
          <Site user={user} hidden={welcoming} origin={origin} setOrigin={setOrigin} />
        </>
      )}

      <Toast />
    </>
  );
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
        <Route path="/orders" element={<MyOrders />} />
        <Route path="/orders/:id" element={<OrderPage />} />
        <Route path="/staff" element={user.isStaff ? <Staff /> : <NotFound staffOnly />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CartDrawer tableCount={menu.data?.tableCount ?? 12} />
    </div>
  );
}
