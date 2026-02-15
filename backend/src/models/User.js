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
    enum: ['admin', 'staff', 'viewer'],
    default: 'staff'
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

// Create compound index for PIN and role to ensure uniqueness per role
userSchema.index({ pin: 1, role: 1 }, { unique: true });

// Don't return PIN in JSON responses
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.pin;
  return user;
};

module.exports = mongoose.model('User', userSchema);
