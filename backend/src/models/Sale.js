const SaleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantitySold: { type: Number, required: true },
  saleDate: { type: Date, default: Date.now },
  priceAtSale: { type: Number },
}, { timestamps: true });