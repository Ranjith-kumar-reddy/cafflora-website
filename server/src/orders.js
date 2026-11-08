import { Router } from 'express';
import mongoose from 'mongoose';
import { config } from './config.js';
import { isStaff } from './auth.js';
import { MENU } from './menu.js';
import { ACTIVE_STATUSES, ORDER_STATUSES, Order, nextOrderNumber } from './models/Order.js';

const menuById = new Map(MENU.map((item) => [item.id, item]));
const MAX_QTY = 20;
const MAX_LINES = 30;
const NOT_FOUND = { error: "We couldn't find that order." };

// Checks an order from the website and prices it from the server's menu,
// so the browser can never set its own prices.
function parseOrder(body) {
  const { items, type, table, note } = body ?? {};

  if (!Array.isArray(items) || items.length === 0) return { error: 'Add at least one coffee to your order.' };
  if (items.length > MAX_LINES) return { error: 'That order has too many lines. Split it into two orders.' };

  const quantities = new Map();
  for (const raw of items) {
    const item = menuById.get(raw?.id);
    const qty = Number(raw?.qty);
    if (!item) return { error: 'One of the items is no longer on the menu. Remove it and try again.' };
    if (!Number.isInteger(qty) || qty < 1) return { error: 'Each item needs a quantity of at least 1.' };
    quantities.set(item.id, (quantities.get(item.id) ?? 0) + qty);
  }

  const lines = [];
  for (const [id, qty] of quantities) {
    if (qty > MAX_QTY) return { error: `You can order up to ${MAX_QTY} of each item.` };
    const item = menuById.get(id);
    lines.push({ itemId: id, name: item.name, price: item.price, qty });
  }

  if (type !== 'table' && type !== 'pickup') return { error: 'Choose whether you want it at your table or for pickup.' };

  let tableNumber;
  if (type === 'table') {
    tableNumber = Number(table);
    if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > config.tableCount) {
      return { error: `Choose a table number from 1 to ${config.tableCount}.` };
    }
  }

  return {
    order: {
      type,
      table: tableNumber,
      note: typeof note === 'string' ? note.trim().slice(0, 200) : '',
      items: lines,
      total: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
    },
  };
}

export const ordersRouter = Router();

ordersRouter.post('/', async (req, res) => {
  const parsed = parseOrder(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const order = await Order.create({
    ...parsed.order,
    number: await nextOrderNumber(),
    user: { googleId: req.user.sub, email: req.user.email, name: req.user.name },
  });
  res.status(201).json({ order });
});

ordersRouter.get('/mine', async (req, res) => {
  const orders = await Order.find({ 'user.googleId': req.user.sub }).sort({ createdAt: -1 }).limit(20);
  res.json({ orders });
});

ordersRouter.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json(NOT_FOUND);
  const order = await Order.findById(req.params.id);
  // Customers can only see their own orders; staff can see all of them.
  if (!order || (order.user.googleId !== req.user.sub && !isStaff(req.user))) {
    return res.status(404).json(NOT_FOUND);
  }
  res.json({ order });
});

export const staffRouter = Router();

staffRouter.get('/orders', async (_req, res) => {
  const orders = await Order.find({ status: { $in: ACTIVE_STATUSES } }).sort({ createdAt: 1 }).limit(200);
  res.json({ orders });
});

staffRouter.patch('/orders/:id', async (req, res) => {
  const { status } = req.body ?? {};
  if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'That order status is not valid.' });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json(NOT_FOUND);

  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
  if (!order) return res.status(404).json(NOT_FOUND);
  res.json({ order });
});
