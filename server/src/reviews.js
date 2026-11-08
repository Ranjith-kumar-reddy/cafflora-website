import { Router } from 'express';
import mongoose from 'mongoose';
import { Order } from './models/Order.js';
import { Review, displayNameFor } from './models/Review.js';

const SHOWN = 6;
const MAX_TEXT = 400;

export const reviewsRouter = Router();

// Latest visible reviews, the average rating, and whether this guest can review.
reviewsRouter.get('/', async (req, res) => {
  const [reviews, stats, mine, hasOrdered] = await Promise.all([
    Review.find({ hidden: false }).sort({ updatedAt: -1 }).limit(SHOWN),
    Review.aggregate([{ $match: { hidden: false } }, { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }]),
    Review.findOne({ 'user.googleId': req.user.sub }),
    Order.exists({ 'user.googleId': req.user.sub }),
  ]);
  res.json({
    reviews,
    average: stats[0]?.average ?? null,
    count: stats[0]?.count ?? 0,
    mine,
    canReview: Boolean(hasOrdered),
  });
});

// Only guests who have ordered can leave a review, so every review comes from a real customer.
reviewsRouter.post('/', async (req, res) => {
  const rating = Number(req.body?.rating);
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Choose a rating from 1 to 5 stars.' });
  if (text.length < 3) return res.status(400).json({ error: 'Write a few words about your visit.' });
  if (text.length > MAX_TEXT) return res.status(400).json({ error: `Keep your review under ${MAX_TEXT} characters.` });

  if (!(await Order.exists({ 'user.googleId': req.user.sub }))) {
    return res.status(403).json({ error: 'You can leave a review after your first order.' });
  }

  const review = await Review.findOneAndUpdate(
    { 'user.googleId': req.user.sub },
    { $set: { rating, text, 'user.displayName': displayNameFor(req.user.name) }, $setOnInsert: { hidden: false } },
    { new: true, upsert: true, runValidators: true },
  );
  res.json({ review });
});

export const reviewsStaffRouter = Router();

// Staff can hide a review (for example spam or abuse). It stays in the database.
reviewsStaffRouter.patch('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "We couldn't find that review." });
  const hidden = req.body?.hidden !== false;
  const review = await Review.findByIdAndUpdate(req.params.id, { hidden }, { new: true });
  if (!review) return res.status(404).json({ error: "We couldn't find that review." });
  res.json({ review });
});
