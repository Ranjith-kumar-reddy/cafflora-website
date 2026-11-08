import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useCart } from '../cart.jsx';
import { BagIcon, CloseIcon, MenuIcon } from './Icons.jsx';
import Logo from './Logo.jsx';

const SECTIONS = [
  { hash: '#estates', label: 'Our estates' },
  { hash: '#menu', label: 'Menu' },
  { hash: '#team', label: 'Baristas' },
  { hash: '#reviews', label: 'Reviews' },
  { hash: '#visit', label: 'Visit' },
];

export default function Nav({ user }) {
  const { count, setOpen } = useCart();
  const { pathname, search } = useLocation();
  const signInLink = `/signin?next=${encodeURIComponent(pathname === '/signin' ? '/' : pathname + search)}`;
  const orderLabel = count ? `Your order, ${count} ${count === 1 ? 'item' : 'items'}` : 'Your order, empty';

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="Cafflora home">
          <Logo size={38} variant="mark" />
          <span className="wordmark">Cafflora</span>
        </Link>

        <nav className="nav-links" aria-label="Sections">
          {SECTIONS.map((section) => (
            <Link key={section.hash} to={{ pathname: '/', hash: section.hash }}>{section.label}</Link>
          ))}
        </nav>

        <div className="nav-actions">
          <SectionsMenu />
          <button type="button" className="icon-btn" onClick={() => setOpen(true)} aria-label={orderLabel}>
            <BagIcon />
            {count > 0 && <span className="badge" aria-hidden="true">{count}</span>}
          </button>
          {user && <AccountMenu user={user} />}
          {user === null && pathname !== '/signin' && (
            <Link className="btn btn-outline btn-small nav-signin" to={signInLink}>Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}

// Phones and tablets: the section links move into a panel under the header.
function SectionsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { key } = useLocation();

  // Close after following a link (each navigation gets a new location key).
  useEffect(() => {
    setOpen(false);
  }, [key]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="sections" ref={ref}>
      <button
        type="button"
        className="icon-btn sections-btn"
        aria-expanded={open}
        aria-controls="sections-menu"
        aria-label={open ? 'Close the page sections' : 'Open the page sections'}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      {open && (
        <nav id="sections-menu" className="sections-menu" aria-label="Sections">
          {SECTIONS.map((section) => (
            <Link key={section.hash} to={{ pathname: '/', hash: section.hash }} onClick={() => setOpen(false)}>
              {section.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

function AccountMenu({ user }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const initial = (user.name || '?').trim().charAt(0).toUpperCase();

  async function handleSignOut() {
    setOpen(false);
    navigate('/');
    await signOut();
  }

  return (
    <div className="account" ref={ref}>
      <button
        type="button"
        className="icon-btn avatar-btn"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Your account"
        onClick={() => setOpen((value) => !value)}
      >
        {user.picture
          ? <img className="avatar" src={user.picture} alt="" referrerPolicy="no-referrer" />
          : <span className="avatar-initial" aria-hidden="true">{initial}</span>}
      </button>
      {open && (
        <div className="account-menu">
          <div className="account-who">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <Link to="/orders" onClick={() => setOpen(false)}>My orders</Link>
          {user.isStaff && <Link to="/staff" onClick={() => setOpen(false)}>Staff orders</Link>}
          <button type="button" onClick={handleSignOut}>Sign out</button>
        </div>
      )}
    </div>
  );
}
