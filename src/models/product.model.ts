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
  countryFlag: {type: String, default: null},
  countryName: {type: String, default: ''},
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  avgRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);