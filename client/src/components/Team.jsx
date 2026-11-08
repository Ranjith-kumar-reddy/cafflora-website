import { useAllImagesLoaded } from '../hooks.js';
import Depth from './Depth.jsx';

// Staff photos: client/public/images/staff/barista-1.jpg to -3.jpg (900x1200).
// The row only appears once all three exist, so it stays symmetric.
const STAFF_PHOTOS = ['/images/staff/barista-1.jpg', '/images/staff/barista-2.jpg', '/images/staff/barista-3.jpg'];

export default function Team() {
  const showPhotos = useAllImagesLoaded(STAFF_PHOTOS);

  return (
    <section id="team" className="section" aria-labelledby="team-title">
      <div className="section-head">
        <h2 id="team-title">Our baristas</h2>
        <p className="lede">The people behind every cup you drink here.</p>
      </div>

      {showPhotos && (
        <div className="cafe-photos">
          {STAFF_PHOTOS.map((src, index) => (
            <Depth key={src} index={index} frameClassName="photo-frame">
              <img src={src} alt="A Cafflora barista at work" loading="lazy" />
            </Depth>
          ))}
        </div>
      )}

      <figure className="team-statement glass">
        <blockquote>
          <p>
            Our baristas are the heart of Cafflora. Every morning they taste the espresso and adjust the grind
            until it's just right. They steam the milk fresh for every cup, and they give a ₹140 espresso
            the same care as a slow pour-over. They love talking about coffee, so ask them anything. I'm proud of
            this team, and I think you'll taste why.
          </p>
        </blockquote>
        <figcaption>Ranjith, owner of Cafflora</figcaption>
      </figure>
    </section>
  );
}
