import mongoose from 'mongoose';

export const ORDER_STATUSES = ['received', 'preparing', 'ready', 'completed'];
export const ACTIVE_STATUSES = ['received', 'preparing', 'ready'];

const lineSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true },
    user: {
      googleId: { type: String, required: true, index: true },
      email: String,
      name: String,
    },
    type: { type: String, enum: ['table', 'pickup'], required: true },
    table: { type: Number, min: 1 },
    note: { type: String, maxlength: 200, default: '' },
    items: { type: [lineSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'received', index: true },
  },
  { timestamps: true },
);

orderSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret) {
    ret.id = String(ret._id);
    delete ret._id;
    if (ret.user) delete ret.user.googleId;
    return ret;
  },
});

export const Order = mongoose.model('Order', orderSchema);

const Counter = mongoose.model(
  'Counter',
  new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } }),
);

// Order numbers count up from 1 so staff can call them out.
export async function nextOrderNumber() {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'order' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return counter.seq;
}
