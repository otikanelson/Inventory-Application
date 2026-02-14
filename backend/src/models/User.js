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
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Don't return PIN in JSON responses
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.pin;
  return user;
};

module.exports = mongoose.model('User', userSchema);
