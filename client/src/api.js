// Small wrapper around fetch for the Cafflora API.
// Turns server errors into Error objects with a readable message.
async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the Cafflora server. Check your connection and try again.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Not JSON (for example the dev proxy failing): handled below.
  }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event('cafflora:signed-out'));
    }
    const message = data?.error
      || (res.status >= 500 ? "Can't reach the Cafflora server. Check that it's running and try again." : `Request failed (${res.status}).`);
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  authConfig: () => request('/auth/config'),
  me: () => request('/auth/me'),
  googleSignIn: (credential) => request('/auth/google', { method: 'POST', body: { credential } }),
  devSignIn: () => request('/auth/dev', { method: 'POST', body: {} }),
  signOut: () => request('/auth/logout', { method: 'POST', body: {} }),
  menu: () => request('/menu'),
  placeOrder: (order) => request('/orders', { method: 'POST', body: order }),
  myOrders: () => request('/orders/mine'),
  order: (id) => request(`/orders/${encodeURIComponent(id)}`),
  reviews: () => request('/reviews'),
  saveReview: (review) => request('/reviews', { method: 'POST', body: review }),
  hideReview: (id) => request(`/staff/reviews/${encodeURIComponent(id)}`, { method: 'PATCH', body: { hidden: true } }),
  staffOrders: () => request('/staff/orders'),
  setOrderStatus: (id, status) => request(`/staff/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status } }),
};
