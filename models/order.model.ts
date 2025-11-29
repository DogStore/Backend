// models/Order.ts
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  slug: String,
  image: String,
  price: Number,
  quantity: Number
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  shippingAddress: {
    title: String,
    street: String,
    city: String,
    country: String,
    postalCode: String
  },
  phone: String,
  status: {
    type: String,
    enum: ['pending','paid','processing','shipped','delivered','canceled'],
    default: 'pending'
  },
  appliedCoupon: {
    code: String,
    discountAmount: Number
  }
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
export default mongoose.model('Order', orderSchema);