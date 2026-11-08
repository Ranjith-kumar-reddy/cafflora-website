import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const MAX_TEXT = 400;

function Stars({ value, size = 'small' }) {
  const rounded = Math.round(value);
  return (
    <span className={`stars stars-${size}`} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => <span key={n} aria-hidden="true" className={n <= rounded ? 'is-on' : ''}>★</span>)}
    </span>
  );
}

// Real reviews from guests who have ordered. Nothing here is written by the café.
export default function Reviews() {
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });

  const load = useCallback(() => {
    api.reviews()
      .then((data) => setState({ status: 'ready', data, error: '' }))
      .catch((err) => setState({ status: 'error', data: null, error: err.message }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function hide(id) {
    try {
      await api.hideReview(id);
      load();
    } catch (err) {
      setState((prev) => ({ ...prev, error: err.message }));
    }
  }

  const data = state.data;

  return (
    <section id="reviews" className="section" aria-labelledby="reviews-title">
      <div className="section-head">
        <h2 id="reviews-title">What guests say</h2>
        {data?.count > 0 ? (
          <p className="review-summary">
            <Stars value={data.average} size="large" />
            <span>{data.average.toFixed(1)} from {data.count} {data.count === 1 ? 'review' : 'reviews'}</span>
          </p>
        ) : (
          <p className="lede">Reviews from our guests will appear here. Had a coffee with us? Tell us how it was.</p>
        )}
      </div>

      {state.status === 'error' && <p className="form-error status-text" role="alert">{state.error}</p>}

      {data?.reviews.length > 0 && (
        <ul className="review-grid">
          {data.reviews.map((review) => (
            <li key={review.id} className="review-card glass">
              <Stars value={review.rating} />
              <p className="review-text">“{review.text}”</p>
              <p className="review-name">{review.name}</p>
              {user?.isStaff && (
                <button type="button" className="review-hide" onClick={() => hide(review.id)}>Hide this review</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {data && <ReviewForm canReview={data.canReview} mine={data.mine} onSaved={load} />}
    </section>
  );
}

function ReviewForm({ canReview, mine, onSaved }) {
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [text, setText] = useState(mine?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!canReview) {
    return <p className="review-note">You can leave a review after your first order.</p>;
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!rating) {
      setError('Choose a star rating.');
      return;
    }
    setBusy(true);
    try {
      await api.saveReview({ rating, text });
      setMessage(mine ? 'Your review is updated. Thank you!' : 'Thank you! Your review is now on the page.');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="review-form glass" onSubmit={submit}>
      <h3>{mine ? 'Update your review' : 'Leave a review'}</h3>
      <fieldset className="star-input">
        <legend className="field-label">Your rating</legend>
        <div className="star-input-row">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={n <= rating ? 'is-on' : ''}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} />
              <span aria-hidden="true">★</span>
              <span className="visually-hidden">{n} {n === 1 ? 'star' : 'stars'}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label className="field-label" htmlFor="review-text">Your review</label>
        <textarea
          id="review-text"
          className="input textarea"
          maxLength={MAX_TEXT}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did you have, and how was it?"
          required
        />
        <p className="field-hint">{text.length} of {MAX_TEXT} characters. Your first name and last initial are shown.</p>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="review-thanks" role="status">{message}</p>}
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Saving…' : mine ? 'Update review' : 'Post review'}
      </button>
    </form>
  );
}
