const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true }, // Denormalized for faster queries
  category: { type: String },
  quantitySold: { type: Number, required: true },
  priceAtSale: { type: Number, required: true },
  totalAmount: { type: Number, required: true }, // quantitySold * priceAtSale
  saleDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['cash', 'card', 'transfer'], default: 'cash' },
}, { timestamps: true });

// Index for faster analytics queries
SaleSchema.index({ saleDate: -1 });
SaleSchema.index({ productId: 1, saleDate: -1 });
SaleSchema.index({ category: 1, saleDate: -1 });

module.exports = mongoose.model('Sale', SaleSchema);