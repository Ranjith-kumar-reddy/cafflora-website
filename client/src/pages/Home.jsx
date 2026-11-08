import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../cart.jsx';
import Depth from '../components/Depth.jsx';
import Logo from '../components/Logo.jsx';
import Reviews from '../components/Reviews.jsx';
import Team from '../components/Team.jsx';
import { ORIGIN_ORDER, ORIGINS } from '../data/origins.js';
import { formatPrice } from '../format.js';
import { useAllImagesLoaded, useHeroDepth, usePrefersReducedMotion } from '../hooks.js';

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Cafflora+Whitefield+Bengaluru';
const CAFE_PHOTOS = ['/images/cafe/interior-1.jpg', '/images/cafe/interior-2.jpg', '/images/cafe/interior-3.jpg'];

export default function Home({ menu, origin, setOrigin }) {
  const location = useLocation();
  const reduced = usePrefersReducedMotion();

  // Scroll to #estates, #menu or #visit when a nav link points there.
  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    target?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }, [location.key, location.hash, menu.status, reduced]);

  return (
    <main id="main">
      <Hero />
      <Estates origin={origin} setOrigin={setOrigin} />
      <MenuSection menu={menu} />
      <Team />
      <Reviews />
      <Visit />
      <Footer />
    </main>
  );
}

function Hero() {
  const ref = useHeroDepth();
  return (
    <section ref={ref} className="hero" aria-labelledby="hero-title">
      {/* A roasted bean bursting into grounds and dripping into a Cafflora cup. */}
      <div className="hero-visual" aria-hidden="true">
        <div className="hero-frame">
          <img src="/images/hero/bean-pour.jpg" alt="" />
        </div>
      </div>
      <div className="hero-copy">
        <h1 id="hero-title" className="hero-title">Cafflora</h1>
        <p className="hero-tagline">Every cup begins as a blossom</p>
        <p className="hero-text">
          Coffee from the hills of Karnataka, brewed every way you like it, in the heart of Whitefield.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to={{ pathname: '/', hash: '#menu' }}>See the menu</Link>
          <Link className="btn btn-ghost" to={{ pathname: '/', hash: '#estates' }}>Meet our estates</Link>
        </div>
      </div>
    </section>
  );
}

function Estates({ origin, setOrigin }) {
  const estate = ORIGINS[origin];
  return (
    <section id="estates" className="section" aria-labelledby="estates-title">
      <div className="section-head">
        <h2 id="estates-title">Our estates</h2>
        <p className="lede">We roast beans from three coffee regions of South India. Choose one to see its beans.</p>
      </div>

      <div className="segmented" role="group" aria-label="Choose an estate">
        {ORIGIN_ORDER.map((key) => (
          <button key={key} type="button" aria-pressed={key === origin} onClick={() => setOrigin(key)}>
            {ORIGINS[key].name}
          </button>
        ))}
      </div>

      <article className="estate-card glass" aria-live="polite">
        <h3 className="estate-name">{estate.name}</h3>
        <p className="estate-region">{estate.region}</p>
        <p className="estate-story">{estate.story}</p>
        <dl className="estate-facts">
          <div><dt>Altitude</dt><dd>{estate.altitude}</dd></div>
          <div><dt>Process</dt><dd>{estate.process}</dd></div>
          <div><dt>Roast</dt><dd>{estate.roast}</dd></div>
        </dl>
        <p className="estate-notes"><span>Tasting notes</span>{estate.notes}</p>
      </article>
    </section>
  );
}

function MenuSection({ menu }) {
  const [active, setActive] = useState('all');
  const { add } = useCart();

  return (
    <section id="menu" className="section menu-section" aria-labelledby="menu-title">
      <div className="section-head">
        <h2 id="menu-title">The menu</h2>
        <p className="lede">Every kind of coffee, from single-estate pour-over to nitro cold brew, with fresh bites, shakes and sundaes to go with it.</p>
      </div>

      {menu.status === 'loading' && <p className="status-text">Loading the menu…</p>}

      {menu.status === 'error' && (
        <div className="status-block">
          <p>{menu.error}</p>
          <button type="button" className="btn btn-ghost" onClick={menu.reload}>Try again</button>
        </div>
      )}

      {menu.status === 'ready' && (
        <>
          <div className="tabs" role="group" aria-label="Filter the menu">
            {[{ id: 'all', name: 'All' }, ...menu.data.categories].map((category) => (
              <button
                key={category.id}
                type="button"
                className="tab"
                aria-pressed={active === category.id}
                onClick={() => setActive(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {menu.data.categories
            .filter((category) => active === 'all' || category.id === active)
            .map((category) => {
              const items = menu.data.items.filter((item) => item.category === category.id);
              // Groups with photos give every card a photo frame (the logo stands in until a
              // photo is added), so cards stay the same size. Groups with none use text cards.
              const withPhotos = items.some((item) => item.photo);
              return (
                <div key={category.id} className="menu-group">
                  <header className="menu-group-head">
                    <h3>{category.name}</h3>
                    <p>{category.description}</p>
                  </header>
                  <ul className={`menu-grid${withPhotos ? '' : ' is-text'}`}>
                    {items.map((item, index) => (
                      <MenuCard key={item.id} item={item} index={index} withPhoto={withPhotos} onAdd={add} />
                    ))}
                  </ul>
                </div>
              );
            })}
        </>
      )}
    </section>
  );
}

function MenuCard({ item, index, withPhoto, onAdd }) {
  return (
    <Depth as="li" index={index} frameClassName={`menu-card${withPhoto ? '' : ' is-text'}`}>
      {withPhoto && (
        <div className="menu-photo">
          {item.photo
            ? <img src={item.photo} alt="" loading="lazy" />
            : <Logo size={72} variant="mark" className="menu-photo-mark" />}
        </div>
      )}
      <div className="menu-body">
        <h4 className="menu-name">{item.name}</h4>
        <p className="menu-notes">{item.notes}</p>
      </div>
      <div className="menu-foot">
        <span className="price">{formatPrice(item.price)}</span>
        <button type="button" className="btn btn-outline btn-small" onClick={() => onAdd(item)} aria-label={`Add ${item.name} to your order`}>
          Add
        </button>
      </div>
    </Depth>
  );
}

function Visit() {
  // The interior photos only appear once all three exist, so the row stays symmetric.
  const showPhotos = useAllImagesLoaded(CAFE_PHOTOS);
  return (
    <section id="visit" className="section" aria-labelledby="visit-title">
      <div className="section-head">
        <h2 id="visit-title">Visit us</h2>
        <p className="lede">Find us in Whitefield, Bengaluru. Sit in, or order ahead and collect.</p>
      </div>

      {showPhotos && (
        <div className="cafe-photos">
          {CAFE_PHOTOS.map((src, index) => (
            <Depth key={src} index={index} frameClassName="photo-frame">
              <img src={src} alt="Inside Cafflora" />
            </Depth>
          ))}
        </div>
      )}

      <div className="visit-grid">
        <article className="visit-card glass">
          <h3>At your table</h3>
          <p>Scan the code on your table, or choose your table number when you order. We bring it over when it's ready.</p>
        </article>
        <article className="visit-card glass">
          <h3>Pickup at the counter</h3>
          <p>Order from anywhere, then collect it when your order page says it's ready.</p>
        </article>
      </div>

      <div className="visit-cta">
        <a className="btn btn-ghost" href={MAPS_URL} target="_blank" rel="noreferrer">Open in Google Maps</a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <Logo size={64} />
      <p>Whitefield, Bengaluru</p>
      <p>© {new Date().getFullYear()} Cafflora</p>
    </footer>
  );
}
