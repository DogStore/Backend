// models/Product.ts
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  size: String,
  slug: { type: String, required: true, unique: true },
  description: String,
  rating: { type: Number, default: 0 },
  images: [String],
  regularPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  salePrice: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  stock: { type: Number, required: true },
  soldCount: { type: Number, default: 0 },
  isPromoted: { type: Boolean, default: false },
  isActive: {type: Boolean, default:true},
  countryFlag: {type: String, default: null}
}, { timestamps: true });

export default mongoose.model('Product', productSchema);