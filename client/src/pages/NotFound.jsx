import { Link } from 'react-router-dom';

export default function NotFound({ staffOnly = false }) {
  return (
    <main className="page" id="main">
      <div className="empty-card glass">
        <h1 className="empty-title">{staffOnly ? 'This page is for Cafflora staff' : "This page doesn't exist"}</h1>
        <p>
          {staffOnly
            ? 'Sign in with a staff Google account to see incoming orders.'
            : 'The link may be old or mistyped.'}
        </p>
        <Link className="btn btn-primary" to="/">Go to the home page</Link>
      </div>
    </main>
  );
}
