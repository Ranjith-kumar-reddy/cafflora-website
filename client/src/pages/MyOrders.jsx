import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { STATUS_LABEL, formatOrderNumber, formatPrice, summarizeItems } from '../format.js';

export default function MyOrders() {
  const [state, setState] = useState({ status: 'loading', orders: [], error: '' });

  useEffect(() => {
    let cancelled = false;
    api.myOrders()
      .then(({ orders }) => !cancelled && setState({ status: 'ready', orders, error: '' }))
      .catch((err) => !cancelled && setState({ status: 'error', orders: [], error: err.message }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page" id="main">
      <div className="page-head">
        <h1>My orders</h1>
        <p className="lede">Your last 20 orders at Cafflora.</p>
      </div>

      {state.status === 'loading' && <p className="status-text">Loading your orders…</p>}
      {state.status === 'error' && <p className="form-error" role="alert">{state.error}</p>}

      {state.status === 'ready' && state.orders.length === 0 && (
        <div className="empty-card glass">
          <p>You haven't ordered yet.</p>
          <Link className="btn btn-primary" to={{ pathname: '/', hash: '#menu' }}>Browse the menu</Link>
        </div>
      )}

      {state.orders.length > 0 && (
        <ul className="order-list">
          {state.orders.map((order) => (
            <li key={order.id}>
              <Link to={`/orders/${order.id}`} className="order-row glass">
                <span className="order-row-num">{formatOrderNumber(order.number)}</span>
                <span className="order-row-items">{summarizeItems(order.items)}</span>
                <span className={`status-pill status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
                <span className="order-row-total">{formatPrice(order.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
