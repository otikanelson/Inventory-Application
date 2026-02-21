const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      unique: true,
      trim: true,
      minlength: [1, 'Store name cannot be empty'],
      maxlength: [100, 'Store name cannot exceed 100 characters']
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Store owner is required']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Indexes
storeSchema.index({ ownerId: 1 });

// Case-insensitive unique validation for store name
storeSchema.pre('save', async function() {
  if (this.isModified('name')) {
    const existingStore = await mongoose.model('Store').findOne({
      name: { $regex: new RegExp(`^${this.name}$`, 'i') },
      _id: { $ne: this._id }
    });
    
    if (existingStore) {
      const error = new Error('Store name already exists');
      error.code = 'DUPLICATE_STORE_NAME';
      throw error;
    }
  }
});

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;
