const User = require('../models/User');

// Login user
exports.login = async (req, res) => {
  try {
    const { pin, role } = req.body;

    console.log('Login attempt:', { pin: pin ? '****' : 'missing', role });

    if (!pin || !role) {
      return res.status(400).json({
        success: false,
        error: 'PIN and role are required'
      });
    }

    // Find user by PIN and role
    const user = await User.findOne({ pin, role, isActive: true });

    if (!user) {
      console.log('User not found with provided credentials');
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

    console.log('Login successful for user:', user._id);

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
    console.log('=== SETUP ADMIN REQUEST RECEIVED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { name, pin } = req.body;

    console.log('Extracted data:', { name, pin: pin ? '****' : 'missing' });

    if (!name || !pin) {
      console.log('❌ Validation failed: Missing name or PIN');
      return res.status(400).json({
        success: false,
        error: 'Name and PIN are required'
      });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      console.log('❌ Validation failed: Invalid PIN format');
      return res.status(400).json({
        success: false,
        error: 'PIN must be exactly 4 digits'
      });
    }

    console.log('✅ Validation passed, checking for existing admin...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('❌ Admin already exists:', existingAdmin._id);
      return res.status(400).json({
        success: false,
        error: 'Admin user already exists'
      });
    }

    console.log('✅ No existing admin, creating new admin user...');

    // Create admin user
    const admin = new User({
      name,
      pin,
      role: 'admin'
    });

    console.log('Admin object created (before save):', {
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive
    });

    console.log('Attempting to save to database...');
    const savedAdmin = await admin.save();
    
    console.log('✅ Admin saved successfully!');
    console.log('Saved admin ID:', savedAdmin._id);
    console.log('Saved admin data:', {
      id: savedAdmin._id,
      name: savedAdmin.name,
      role: savedAdmin.role,
      createdAt: savedAdmin.createdAt
    });

    // Verify it was actually saved
    const verifyUser = await User.findById(savedAdmin._id);
    console.log('Verification check - User exists in DB:', !!verifyUser);
    if (verifyUser) {
      console.log('Verified user data:', {
        id: verifyUser._id,
        name: verifyUser.name,
        role: verifyUser.role
      });
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: savedAdmin._id,
          name: savedAdmin.name,
          role: savedAdmin.role
        }
      }
    });
  } catch (error) {
    console.error('❌ SETUP ADMIN ERROR:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to create admin user'
    });
  }
};

// Create staff user
exports.createStaff = async (req, res) => {
  try {
    console.log('=== CREATE STAFF REQUEST RECEIVED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { name, pin, createdBy } = req.body;

    console.log('Extracted data:', { name, pin: pin ? '****' : 'missing', createdBy });

    if (!name || !pin) {
      console.log('❌ Validation failed: Missing name or PIN');
      return res.status(400).json({
        success: false,
        error: 'Name and PIN are required'
      });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      console.log('❌ Validation failed: Invalid PIN format');
      return res.status(400).json({
        success: false,
        error: 'PIN must be exactly 4 digits'
      });
    }

    console.log('✅ Validation passed, checking for existing user...');

    // Check if PIN is already in use
    const existingUser = await User.findOne({ pin });
    if (existingUser) {
      console.log('❌ PIN already in use by user:', existingUser._id);
      return res.status(400).json({
        success: false,
        error: 'This PIN is already in use. Please choose a different PIN.'
      });
    }

    console.log('✅ PIN is available, creating new staff user...');

    // Validate createdBy - must be a valid ObjectId or null
    let validCreatedBy = null;
    if (createdBy) {
      // Check if it's a valid MongoDB ObjectId (24 character hex string)
      if (/^[0-9a-fA-F]{24}$/.test(createdBy)) {
        validCreatedBy = createdBy;
        console.log('✅ Valid ObjectId for createdBy:', validCreatedBy);
      } else {
        console.log('⚠️  Invalid createdBy ObjectId format:', createdBy, '- setting to null');
      }
    } else {
      console.log('ℹ️  No createdBy provided, setting to null');
    }

    console.log('Creating staff with createdBy:', validCreatedBy);

    // Create staff user
    const staff = new User({
      name,
      pin,
      role: 'staff',
      createdBy: validCreatedBy
    });

    console.log('Staff object created (before save):', {
      name: staff.name,
      role: staff.role,
      isActive: staff.isActive
    });

    console.log('Attempting to save to database...');
    const savedStaff = await staff.save();
    
    console.log('✅ Staff saved successfully!');
    console.log('Saved staff ID:', savedStaff._id);
    console.log('Saved staff data:', {
      id: savedStaff._id,
      name: savedStaff.name,
      role: savedStaff.role,
      createdAt: savedStaff.createdAt
    });

    // Verify it was actually saved
    const verifyUser = await User.findById(savedStaff._id);
    console.log('Verification check - User exists in DB:', !!verifyUser);
    if (verifyUser) {
      console.log('Verified user data:', {
        id: verifyUser._id,
        name: verifyUser.name,
        role: verifyUser.role
      });
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: savedStaff._id,
          name: savedStaff.name,
          role: savedStaff.role
        }
      }
    });
  } catch (error) {
    console.error('❌ CREATE STAFF ERROR:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create staff user'
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
