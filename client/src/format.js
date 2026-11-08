const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatPrice = (amount) => rupees.format(amount);

export const formatOrderNumber = (number) => `#${String(number).padStart(3, '0')}`;

export const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export function minutesAgo(iso, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  return minutes < 1 ? 'just now' : `${minutes} min ago`;
}

export const STATUS_LABEL = {
  received: 'Received',
  preparing: 'Being made',
  ready: 'Ready',
  completed: 'Completed',
};

export const summarizeItems = (items) => items.map((item) => `${item.qty} × ${item.name}`).join(', ');
