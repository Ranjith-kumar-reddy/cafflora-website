import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatOrderNumber, formatTime, minutesAgo } from '../format.js';

const COLUMNS = [
  { status: 'received', title: 'New', empty: 'No new orders.' },
  { status: 'preparing', title: 'Being made', empty: 'Nothing in progress.' },
  { status: 'ready', title: 'Ready', empty: 'Nothing waiting.' },
];

function nextStep(order) {
  if (order.status === 'received') return { label: 'Start making', status: 'preparing' };
  if (order.status === 'preparing') return { label: 'Mark ready', status: 'ready' };
  return { label: order.type === 'table' ? 'Mark served' : 'Mark collected', status: 'completed' };
}

export default function Staff() {
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const { orders: latest } = await api.staffOrders();
      setOrders(latest);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoaded(true);
      setNow(Date.now());
    }
  }, []);

  // New orders show up within five seconds.
  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  async function advance(order) {
    const step = nextStep(order);
    setPendingId(order.id);
    try {
      const { order: updated } = await api.setOrderStatus(order.id, step.status);
      setOrders((prev) => (updated.status === 'completed'
        ? prev.filter((o) => o.id !== updated.id)
        : prev.map((o) => (o.id === updated.id ? updated : o))));
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className="page" id="main">
      <div className="page-head">
        <h1>Orders</h1>
        <p className="lede">New orders appear here within a few seconds. Move each one along as you make it.</p>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {!loaded && <p className="status-text">Loading orders…</p>}

      {loaded && (
        <div className="board">
          {COLUMNS.map((column) => {
            const list = orders.filter((order) => order.status === column.status);
            return (
              <section key={column.status} className="board-col glass" aria-labelledby={`col-${column.status}`}>
                <h2 id={`col-${column.status}`}>
                  {column.title}
                  <span className="count-pill">{list.length}</span>
                </h2>
                {list.length === 0 && <p className="board-empty">{column.empty}</p>}
                {list.map((order) => {
                  const step = nextStep(order);
                  return (
                    <article key={order.id} className="ticket">
                      <div className="ticket-head">
                        <span className="ticket-num">{formatOrderNumber(order.number)}</span>
                        <span className="ticket-where">{order.type === 'table' ? `Table ${order.table}` : 'Pickup'}</span>
                      </div>
                      <p className="ticket-meta">
                        {order.user?.name}, {formatTime(order.createdAt)} ({minutesAgo(order.createdAt, now)})
                      </p>
                      <ul>
                        {order.items.map((item) => <li key={item.itemId}>{item.qty} × {item.name}</li>)}
                      </ul>
                      {order.note && <p className="ticket-note">{order.note}</p>}
                      <button
                        type="button"
                        className="btn btn-primary btn-small btn-block"
                        onClick={() => advance(order)}
                        disabled={pendingId === order.id}
                      >
                        {step.label}
                      </button>
                    </article>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
