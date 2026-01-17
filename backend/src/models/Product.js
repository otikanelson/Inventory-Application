const mongoose = require("mongoose");

const BatchSchema = new mongoose.Schema({
  batchNumber: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  expiryDate: { type: Date, required: false },
  receivedDate: { type: Date, default: Date.now },
  price: { type: Number }, // Cost price for this specific batch
});

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    barcode: { type: String, unique: true, sparse: true },
    internalCode: { type: String, unique: true, sparse: true, trim: true },
    category: { type: String, required: true },
    isPerishable: {type: Boolean,default: false},

    imageUrl: { type: String, default: "https://via.placeholder.com/150" },

    batches: [BatchSchema],

    // These fields help the frontend stats
    totalQuantity: { type: Number, default: 0 },
    hasBarcode: { type: Boolean, default: false }, // Useful for UI logic

    thresholdValue: { type: Number, default: 10 },
    demandRate: { type: Number, default: 0 },
    lastRestocked: { type: Date, default: Date.now },
  },
  { timestamps: true }
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

module.exports = mongoose.model("Product", ProductSchema);
