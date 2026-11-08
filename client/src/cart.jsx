import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_KEY = 'cafflora.cart';
const TABLE_KEY = 'cafflora.table';
const MAX_QTY = 20;

function readStorage(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked (private mode): the cart still works for this page view.
  }
}

// A QR code on each table links to the site with ?table=<number>.
function tableFromUrl() {
  const n = Number(new URLSearchParams(window.location.search).get('table'));
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(() => readStorage(CART_KEY, []));
  const [scannedTable] = useState(() => {
    const fromUrl = tableFromUrl();
    if (fromUrl) writeStorage(TABLE_KEY, fromUrl);
    return fromUrl ?? readStorage(TABLE_KEY, null);
  });
  const [isOpen, setOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => writeStorage(CART_KEY, lines), [lines]);

  const showToast = useCallback((message) => setToast({ message, key: Date.now() }), []);

  const add = useCallback((item) => {
    setLines((prev) => {
      const found = prev.find((line) => line.id === item.id);
      if (found) {
        return prev.map((line) => (line.id === item.id ? { ...line, qty: Math.min(line.qty + 1, MAX_QTY) } : line));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
    showToast(`Added ${item.name} to your order`);
  }, [showToast]);

  const setQty = useCallback((id, qty) => {
    setLines((prev) => (qty <= 0
      ? prev.filter((line) => line.id !== id)
      : prev.map((line) => (line.id === id ? { ...line, qty: Math.min(qty, MAX_QTY) } : line))));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => ({
    lines,
    add,
    setQty,
    clear,
    count: lines.reduce((sum, line) => sum + line.qty, 0),
    total: lines.reduce((sum, line) => sum + line.qty * line.price, 0),
    isOpen,
    setOpen,
    scannedTable,
    toast,
    showToast,
  }), [lines, add, setQty, clear, isOpen, scannedTable, toast, showToast]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
