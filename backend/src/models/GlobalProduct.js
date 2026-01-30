const mongoose = require("mongoose");

const GlobalProductSchema = new mongoose.Schema(
  {
    barcode: {
      type: String,
      required: true,
      unique: true,
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
      default: "",
    },
    genericPrice: { type: Number, default: null },
    isPerishable: {
      type: Boolean,
      default: true,
    },
    internalId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("GlobalProduct", GlobalProductSchema);
