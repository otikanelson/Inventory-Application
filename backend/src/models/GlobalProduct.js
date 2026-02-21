const mongoose = require("mongoose");

const GlobalProductSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: false, // Optional for backward compatibility, but should be set for new entries
      index: true,
    },
    barcode: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: "cube",
    },
    genericPrice: { type: Number, default: null },
    isPerishable: {
      type: Boolean,
      default: true,
    },
    internalId: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true },
);

// Compound index: barcode must be unique per store (not globally unique)
GlobalProductSchema.index({ barcode: 1, storeId: 1 }, { unique: true });

module.exports = mongoose.model("GlobalProduct", GlobalProductSchema);
