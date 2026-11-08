import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useCart } from '../cart.jsx';
import { formatOrderNumber, formatPrice } from '../format.js';
import { CloseIcon, MinusIcon, PlusIcon } from './Icons.jsx';

const FOCUSABLE = 'button:not([disabled]), select, textarea, input, a[href]';

export default function CartDrawer({ tableCount }) {
  const { lines, setQty, clear, total, isOpen, setOpen, scannedTable, showToast } = useCart();
  const navigate = useNavigate();
  const [type, setType] = useState(scannedTable ? 'table' : 'pickup');
  const [table, setTable] = useState(scannedTable ? String(scannedTable) : '');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const panel = useRef(null);

  // Focus handling for the dialog: move focus in, trap Tab, close on Escape, restore on close.
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.activeElement;
    panel.current?.querySelector(FOCUSABLE)?.focus();
    document.body.classList.add('no-scroll');

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('no-scroll');
      previous?.focus?.();
    };
  }, [isOpen, setOpen]);

  async function placeOrder(event) {
    event.preventDefault();
    setError('');
    if (type === 'table' && !table) {
      setError('Choose your table number.');
      return;
    }
    setSubmitting(true);
    try {
      const { order } = await api.placeOrder({
        items: lines.map((line) => ({ id: line.id, qty: line.qty })),
        type,
        table: type === 'table' ? Number(table) : undefined,
        note,
      });
      clear();
      setNote('');
      setOpen(false);
      showToast(`Order ${formatOrderNumber(order.number)} placed`);
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function browseMenu() {
    setOpen(false);
    navigate({ pathname: '/', hash: '#menu' });
  }

  return (
    <>
      <div className={`drawer-backdrop${isOpen ? ' is-open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside
        ref={panel}
        className={`drawer${isOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        inert={!isOpen}
      >
        <div className="drawer-head">
          <h2 id="drawer-title">Your order</h2>
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close your order">
            <CloseIcon />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="drawer-empty">
            <p className="drawer-empty-title">Your order is empty</p>
            <p>Add a coffee from the menu to get started.</p>
            <button type="button" className="btn btn-primary" onClick={browseMenu}>Browse the menu</button>
          </div>
        ) : (
          <form className="drawer-form" onSubmit={placeOrder}>
            <div className="drawer-body">
              <ul className="cart-list">
                {lines.map((line) => (
                  <li key={line.id} className="cart-line">
                    <div>
                      <p className="cart-line-name">{line.name}</p>
                      <p className="cart-line-price">{formatPrice(line.price * line.qty)}</p>
                    </div>
                    <div className="qty">
                      <button type="button" onClick={() => setQty(line.id, line.qty - 1)} aria-label={`Remove one ${line.name}`}>
                        <MinusIcon />
                      </button>
                      <output aria-label={`${line.name} quantity`}>{line.qty}</output>
                      <button type="button" onClick={() => setQty(line.id, line.qty + 1)} aria-label={`Add one more ${line.name}`} disabled={line.qty >= 20}>
                        <PlusIcon />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <fieldset className="field">
                <legend className="field-label">How would you like it?</legend>
                <div className="choice">
                  <label>
                    <input type="radio" name="order-type" value="table" checked={type === 'table'} onChange={() => setType('table')} />
                    At my table
                  </label>
                  <label>
                    <input type="radio" name="order-type" value="pickup" checked={type === 'pickup'} onChange={() => setType('pickup')} />
                    Pickup at the counter
                  </label>
                </div>
              </fieldset>

              {type === 'table' && (
                <div className="field">
                  <label className="field-label" htmlFor="table-number">Table number</label>
                  <select id="table-number" className="input" value={table} onChange={(e) => setTable(e.target.value)}>
                    <option value="">Choose your table</option>
                    {Array.from({ length: tableCount }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>Table {n}</option>
                    ))}
                  </select>
                  {scannedTable && <p className="field-hint">Filled in from the code on your table.</p>}
                </div>
              )}

              <div className="field">
                <label className="field-label" htmlFor="order-note">Notes for the barista (optional)</label>
                <textarea
                  id="order-note"
                  className="input textarea"
                  maxLength={200}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Oat milk, less sugar, extra hot"
                />
              </div>
            </div>

            <div className="drawer-foot">
              <div className="total-row">
                <span>Total</span>
                <span className="total-amount">{formatPrice(total)}</span>
              </div>
              <p className="field-hint">You pay at the café. There's no online payment.</p>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Placing order…' : 'Place order'}
              </button>
            </div>
          </form>
        )}
      </aside>
    </>
  );
}
