const User = require('../models/User');

// Login user
exports.login = async (req, res) => {
  try {
    const { pin, role } = req.body;

    if (!pin || !role) {
      return res.status(400).json({
        success: false,
        error: 'PIN and role are required'
      });
    }

    // Find user by PIN and role
    const user = await User.findOne({ pin, role, isActive: true });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate session token
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          role: user.role
        },
        sessionToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

// Create admin user (first-time setup)
exports.setupAdmin = async (req, res) => {
  try {
    const { name, pin } = req.body;

    if (!name || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Name and PIN are required'
      });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be exactly 4 digits'
      });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin user already exists'
      });
    }

    // Create admin user
    const admin = new User({
      name,
      pin,
      role: 'admin'
    });

    await admin.save();

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('Setup admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create admin user'
    });
  }
};

// Create staff user
exports.createStaff = async (req, res) => {
  try {
    const { name, pin, createdBy } = req.body;

    if (!name || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Name and PIN are required'
      });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be exactly 4 digits'
      });
    }

    // Check if PIN is already in use
    const existingUser = await User.findOne({ pin });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'PIN already in use'
      });
    }

    // Create staff user
    const staff = new User({
      name,
      pin,
      role: 'staff',
      createdBy: createdBy || null
    });

    await staff.save();

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: staff._id,
          name: staff.name,
          role: staff.role
        }
      }
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create staff user'
    });
  }
};

// Get all staff members
exports.getStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' })
      .select('-pin')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff members'
    });
  }
};

// Update staff member
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pin, isActive } = req.body;

    const staff = await User.findOne({ _id: id, role: 'staff' });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    if (name) staff.name = name;
    if (isActive !== undefined) staff.isActive = isActive;
    
    if (pin) {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({
          success: false,
          error: 'PIN must be exactly 4 digits'
        });
      }

      // Check if new PIN is already in use by another user
      const existingUser = await User.findOne({ pin, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'PIN already in use'
        });
      }

      staff.pin = pin;
    }

    await staff.save();

    res.json({
      success: true,
      data: {
        user: {
          id: staff._id,
          name: staff.name,
          role: staff.role,
          isActive: staff.isActive
        }
      }
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff member'
    });
  }
};

// Delete staff member
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await User.findOne({ _id: id, role: 'staff' });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    await User.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete staff member'
    });
  }
};

// Update admin PIN
exports.updateAdminPin = async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;

    if (!oldPin || !newPin) {
      return res.status(400).json({
        success: false,
        error: 'Old PIN and new PIN are required'
      });
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        error: 'New PIN must be exactly 4 digits'
      });
    }

    // Find admin user
    const admin = await User.findOne({ role: 'admin', pin: oldPin });

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid current PIN'
      });
    }

    // Update PIN
    admin.pin = newPin;
    await admin.save();

    res.json({
      success: true,
      message: 'Admin PIN updated successfully'
    });
  } catch (error) {
    console.error('Update admin PIN error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update admin PIN'
    });
  }
};

// Check if setup is complete
exports.checkSetup = async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' });

    res.json({
      success: true,
      data: {
        setupComplete: !!admin
      }
    });
  } catch (error) {
    console.error('Check setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check setup status'
    });
  }
};
