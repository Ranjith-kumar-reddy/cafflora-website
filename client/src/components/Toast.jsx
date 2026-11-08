import { useEffect, useState } from 'react';
import { useCart } from '../cart.jsx';

export default function Toast() {
  const { toast, isOpen } = useCart();
  const [visible, setVisible] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    setVisible(toast);
    const timer = setTimeout(() => setVisible(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {/* Hidden while the order drawer is open so it never covers "Place order". */}
      {visible && !isOpen && <div className="toast" key={visible.key}>{visible.message}</div>}
    </div>
  );
}
