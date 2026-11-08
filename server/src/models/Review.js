import mongoose from 'mongoose';

// One review per Google account. Customers can update theirs; staff can hide one.
const reviewSchema = new mongoose.Schema(
  {
    user: {
      googleId: { type: String, required: true, unique: true },
      displayName: { type: String, required: true },
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, maxlength: 400 },
    hidden: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

reviewSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret) {
    ret.id = String(ret._id);
    delete ret._id;
    ret.name = ret.user?.displayName;
    delete ret.user;
    return ret;
  },
});

export const Review = mongoose.model('Review', reviewSchema);

// "Ranjith Kumar" becomes "Ranjith K." so full names aren't shown publicly.
export function displayNameFor(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Cafflora guest';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}
