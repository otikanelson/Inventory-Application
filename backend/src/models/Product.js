const mongoose = require("mongoose");

const BatchSchema = new mongoose.Schema({
  batchNumber: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  expiryDate: { type: Date, required: false },
  manufacturerDate: { type: Date, required: false },
  receivedDate: { type: Date, default: Date.now },
  price: { type: Number }, // Cost price for this specific batch
});

const ProductSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store ID is required']
    },
    name: { type: String, required: true, trim: true },
    barcode: { type: String, sparse: true },
    internalCode: { type: String, sparse: true, trim: true },
    category: { type: String, required: true },
    isPerishable: { type: Boolean, default: false },

    imageUrl: { type: String, default: "cube" },

    // Optional generic price that can be set by admin. Null indicates not set.
    genericPrice: { type: Number, default: null },

    batches: [BatchSchema],

    totalQuantity: { type: Number, default: 0 },
    hasBarcode: { type: Boolean, default: false },

    thresholdValue: { type: Number, default: 10 },
    demandRate: { type: Number, default: 0 },
    lastRestocked: { type: Date, default: Date.now },

    // Per-product alert thresholds (overrides global settings)
    customAlertThresholds: {
      enabled: { type: Boolean, default: false },
      critical: { type: Number, default: null, min: 1, max: 30 },
      highUrgency: { type: Number, default: null, min: 1, max: 60 },
      earlyWarning: { type: Number, default: null, min: 1, max: 90 },
    },
  },
  { timestamps: true },
);

ProductSchema.pre("save", async function () {
  if (this.batches && this.batches.length > 0) {
    this.totalQuantity = this.batches.reduce((acc, batch) => {
      return acc + (Number(batch.quantity) || 0);
    }, 0);
  } else {
    this.totalQuantity = 0;
  }
});

// Indexes for multi-tenant queries
ProductSchema.index({ storeId: 1, barcode: 1 }, { unique: true, sparse: true });
ProductSchema.index({ storeId: 1, internalCode: 1 }, { unique: true, sparse: true });
ProductSchema.index({ storeId: 1, category: 1 });
ProductSchema.index({ storeId: 1, totalQuantity: 1 });

module.exports = mongoose.model("Product", ProductSchema);
