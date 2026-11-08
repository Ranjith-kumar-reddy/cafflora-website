import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { CheckIcon } from '../components/Icons.jsx';
import { formatOrderNumber, formatPrice, formatTime } from '../format.js';

const STEPS = [
  { status: 'received', label: 'Received' },
  { status: 'preparing', label: 'Being made' },
  { status: 'ready', label: 'Ready' },
];
const ORDER = ['received', 'preparing', 'ready', 'completed'];

function statusMessage(order) {
  switch (order.status) {
    case 'received': return "We've got your order.";
    case 'preparing': return 'Your coffee is being made.';
    case 'ready': return order.type === 'table'
      ? `It's on its way to table ${order.table}.`
      : "It's ready. Collect it at the counter.";
    default: return 'Enjoy your coffee.';
  }
}

export default function OrderPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  // Check for status changes every few seconds until the order is complete.
  useEffect(() => {
    let cancelled = false;
    let timer;
    async function load() {
      try {
        const { order: latest } = await api.order(id);
        if (cancelled) return;
        setOrder(latest);
        setError('');
        if (latest.status !== 'completed') timer = setTimeout(load, 5000);
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        if (err.status !== 404) timer = setTimeout(load, 8000);
      }
    }
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (!order) {
    return (
      <main className="page" id="main">
        <div className="order-card glass">
          {error
            ? <><p>{error}</p><Link className="btn btn-ghost" to="/orders">See my orders</Link></>
            : <p className="status-text">Loading your order…</p>}
        </div>
      </main>
    );
  }

  const position = ORDER.indexOf(order.status);

  return (
    <main className="page" id="main">
      <article className="order-card glass">
        <p className="order-kicker">Order</p>
        <h1 className="order-number">{formatOrderNumber(order.number)}</h1>
        <p className="order-message" aria-live="polite">{statusMessage(order)}</p>

        <ol className="steps" aria-label="Order progress">
          {STEPS.map((step, index) => {
            const done = position > index || order.status === 'completed';
            const current = position === index && !done;
            return (
              <li key={step.status} className={`step${done ? ' is-done' : ''}${current ? ' is-current' : ''}`} aria-current={current ? 'step' : undefined}>
                <span className="step-dot">{done ? <CheckIcon /> : index + 1}</span>
                <span>{step.label}</span>
              </li>
            );
          })}
        </ol>

        <ul className="order-lines">
          {order.items.map((item) => (
            <li key={item.itemId}>
              <span>{item.qty} × {item.name}</span>
              <span>{formatPrice(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="order-total"><span>Total</span><span>{formatPrice(order.total)}</span></div>

        <p className="order-meta">
          {order.type === 'table' ? `Table ${order.table}` : 'Pickup at the counter'}, placed at {formatTime(order.createdAt)}.
          {' '}You pay at the café.
        </p>
        {order.note && <p className="order-note">“{order.note}”</p>}
        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="order-actions">
          <Link className="btn btn-primary" to={{ pathname: '/', hash: '#menu' }}>Back to the menu</Link>
          <Link className="btn btn-ghost" to="/orders">My orders</Link>
        </div>
      </article>
    </main>
  );
}
