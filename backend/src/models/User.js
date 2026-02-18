const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  pin: {
    type: String,
    required: true,
    length: 4
  },
  role: {
    type: String,
    enum: ['author', 'admin', 'staff', 'viewer'],
    default: 'staff'
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: false,
    default: null
  },
  storeName: {
    type: String,
    required: false,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

// Create compound index for PIN, role, and storeId to ensure uniqueness per role per store
userSchema.index({ pin: 1, role: 1, storeId: 1 }, { unique: true });

// Index for querying users by store and role
userSchema.index({ storeId: 1, role: 1 });

// Index for querying users by role (for author queries)
userSchema.index({ role: 1 });

// Don't return PIN in JSON responses
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.pin;
  return user;
};

module.exports = mongoose.model('User', userSchema);
