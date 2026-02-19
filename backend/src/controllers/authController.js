const User = require('../models/User');
const Store = require('../models/Store');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Author login with secret key
exports.authorLogin = async (req, res) => {
  try {
    const { secretKey } = req.body;

    if (!secretKey) {
      return res.status(400).json({
        success: false,
        error: 'Secret key is required'
      });
    }

    // Hardcoded author password for simplicity
    const validSecretKey = 'RADson29';
    
    if (secretKey !== validSecretKey) {
      console.log('Invalid secret key provided');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token for author
    const sessionToken = jwt.sign(
      { 
        userId: 'author',
        role: 'author'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: 'author',
          name: 'Author',
          role: 'author'
        },
        sessionToken
      }
    });
  } catch (error) {
    console.error('Author login error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { pin, role, storeName } = req.body;

    console.log('Login attempt:', { pin: pin ? '****' : 'missing', role, storeName });
    console.log('PIN details:', { value: pin, type: typeof pin, length: pin ? pin.length : 0 });

    if (!pin || !role) {
      return res.status(400).json({
        success: false,
        error: 'PIN and role are required'
      });
    }

    // Build query - use loginPin for authentication
    const query = { loginPin: pin, role, isActive: true };
    
    // For admin login, optionally filter by storeName if provided
    if (role === 'admin' && storeName) {
      query.storeName = storeName;
    }

    console.log('Query:', JSON.stringify(query));

    // Find user by loginPin and role
    const user = await User.findOne(query);

    console.log('User found:', user ? `Yes - ${user.name}` : 'No');
    
    if (!user) {
      // Debug: Check if user exists with different criteria
      const allUsers = await User.find({ role, isActive: true }).select('name loginPin');
      console.log('Available users for role:', allUsers.map(u => ({ name: u.name, loginPin: u.loginPin })));
      
      console.log('User not found with provided credentials');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT session token
    const sessionToken = jwt.sign(
      { 
        userId: user._id.toString(),
        role: user.role,
        storeId: user.storeId ? user.storeId.toString() : null
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('Login successful for user:', user._id);
    console.log('User Security PIN from DB:', user.securityPin);
    console.log('User role:', user.role);

    // Prepare response data
    const responseData = {
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        storeId: user.storeId,
        storeName: user.storeName
      },
      sessionToken
    };

    // Include Security PIN for admin users (needed for app functionality)
    if (user.role === 'admin' && user.securityPin) {
      responseData.user.securityPin = user.securityPin;
      console.log('✅ Security PIN added to response:', user.securityPin);
    } else {
      console.log('⚠️ Security PIN NOT added to response:', {
        role: user.role,
        hasSecurityPin: !!user.securityPin,
        securityPinValue: user.securityPin
      });
    }

    res.json({
      success: true,
      data: responseData
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
    
    const { name, pin, storeName } = req.body;

    console.log('Extracted data:', { name, pin: pin ? '****' : 'missing', storeName });

    if (!name || !pin || !storeName) {
      console.log('❌ Validation failed: Missing name, PIN, or store name');
      return res.status(400).json({
        success: false,
        error: 'Name, PIN, and store name are required'
      });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      console.log('❌ Validation failed: Invalid PIN format');
      return res.status(400).json({
        success: false,
        error: 'PIN must be exactly 4 digits'
      });
    }

    if (!storeName.trim()) {
      console.log('❌ Validation failed: Empty store name');
      return res.status(400).json({
        success: false,
        error: 'Store name cannot be empty'
      });
    }

    console.log('✅ Validation passed, checking for existing store...');

    // Check if store name already exists (case-insensitive)
    const existingStore = await Store.findOne({
      name: { $regex: new RegExp(`^${storeName.trim()}$`, 'i') }
    });

    if (existingStore) {
      console.log('❌ Store name already exists:', existingStore._id);
      return res.status(400).json({
        success: false,
        error: 'Store name already exists'
      });
    }

    // Check if PIN is already in use by any admin
    const existingAdmin = await User.findOne({ 
      loginPin: pin, 
      role: 'admin'
    });
    
    if (existingAdmin) {
      console.log('❌ PIN already in use by another admin:', existingAdmin._id);
      return res.status(400).json({
        success: false,
        error: 'This PIN is already in use. Please choose a different PIN.'
      });
    }

    console.log('✅ Store name and PIN available, creating admin and store...');

    // Use a transaction-like approach: create admin first, then store, then update admin
    // This avoids the unique constraint issue with null storeId
    
    // Step 1: Create admin user with a temporary storeId placeholder
    const tempStoreId = new mongoose.Types.ObjectId(); // Generate a temporary ID
    
    const admin = new User({
      name,
      loginPin: pin,
      securityPin: pin, // For admin, both PINs are initially the same
      role: 'admin',
      storeId: tempStoreId,
      storeName: storeName.trim()
    });

    console.log('Admin object created (before save):', {
      name: admin.name,
      role: admin.role,
      storeName: admin.storeName
    });

    const savedAdmin = await admin.save();
    console.log('✅ Admin saved successfully:', savedAdmin._id);

    // Step 2: Create store with the admin's ID as ownerId
    const store = new Store({
      name: storeName.trim(),
      ownerId: savedAdmin._id
    });

    const savedStore = await store.save();
    console.log('✅ Store created:', savedStore._id);

    // Step 3: Update admin with the actual storeId
    savedAdmin.storeId = savedStore._id;
    await savedAdmin.save();
    console.log('✅ Admin updated with actual storeId');

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: savedAdmin._id,
          name: savedAdmin.name,
          role: savedAdmin.role,
          storeId: savedAdmin.storeId,
          storeName: savedAdmin.storeName
        },
        store: {
          id: savedStore._id,
          name: savedStore.name
        }
      }
    });
  } catch (error) {
    console.error('❌ SETUP ADMIN ERROR:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Handle duplicate store name error from pre-save hook
    if (error.code === 'DUPLICATE_STORE_NAME') {
      return res.status(400).json({
        success: false,
        error: 'Store name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create admin user and store'
    });
  }
};

// Create staff user
exports.createStaff = async (req, res) => {
  try {
    console.log('=== CREATE STAFF REQUEST RECEIVED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request user:', req.user);
    
    const { name, pin } = req.body;

    // Validate admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can create staff members'
      });
    }

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

    console.log('✅ Validation passed, checking for existing user...');

    // Check if PIN is already in use in this store
    const existingUser = await User.findOne({ 
      loginPin: pin, 
      storeId: req.user.storeId,
      role: 'staff'
    });
    
    if (existingUser) {
      console.log('❌ PIN already in use by user:', existingUser._id);
      return res.status(400).json({
        success: false,
        error: 'This PIN is already in use. Please choose a different PIN.'
      });
    }

    console.log('✅ PIN is available, creating new staff user...');

    // Create staff user with admin's store information
    const staff = new User({
      name,
      loginPin: pin,
      role: 'staff',
      storeId: req.user.storeId,
      storeName: req.user.storeName,
      createdBy: req.user.id
    });

    console.log('Staff object created (before save):', {
      name: staff.name,
      role: staff.role,
      storeId: staff.storeId,
      storeName: staff.storeName
    });

    const savedStaff = await staff.save();
    
    console.log('✅ Staff saved successfully!');
    console.log('Saved staff ID:', savedStaff._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: savedStaff._id,
          name: savedStaff.name,
          role: savedStaff.role,
          storeId: savedStaff.storeId,
          storeName: savedStaff.storeName,
          createdBy: savedStaff.createdBy
        }
      }
    });
  } catch (error) {
    console.error('❌ CREATE STAFF ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create staff user'
    });
  }
};

// Get all staff members
exports.getStaff = async (req, res) => {
  try {
    // Build query based on user role
    let query = { role: 'staff' };
    
    // If not author, filter by store
    if (!req.user.isAuthor) {
      query.storeId = req.user.storeId;
    }

    const staff = await User.find(query)
      .select('-loginPin -securityPin -pin')
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

      // Check if new PIN is already in use by another user in the same store
      const existingUser = await User.findOne({ 
        loginPin: pin, 
        storeId: staff.storeId,
        _id: { $ne: id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'This PIN is already in use in your store. Please choose a different PIN.'
        });
      }

      staff.loginPin = pin;
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

    // Validate admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can delete staff members'
      });
    }

    const staff = await User.findOne({ _id: id, role: 'staff' });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    // Verify staff belongs to admin's store
    if (staff.storeId.toString() !== req.user.storeId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this store'
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
    const { oldPin, newPin, pinType } = req.body; // pinType: 'login' or 'security'

    if (!oldPin || !newPin || !pinType) {
      return res.status(400).json({
        success: false,
        error: 'Old PIN, new PIN, and PIN type are required'
      });
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        error: 'New PIN must be exactly 4 digits'
      });
    }

    // Find admin user
    const admin = await User.findOne({ _id: req.user.id, role: 'admin' });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }

    // Verify old PIN based on type
    if (pinType === 'login') {
      if (admin.loginPin !== oldPin) {
        return res.status(401).json({
          success: false,
          error: 'Invalid current Login PIN'
        });
      }

      // Check if new PIN is already in use by another user in the same store
      const existingUser = await User.findOne({ 
        loginPin: newPin, 
        storeId: admin.storeId,
        _id: { $ne: admin._id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'This PIN is already in use in your store. Please choose a different PIN.'
        });
      }

      // Update Login PIN
      admin.loginPin = newPin;
      await admin.save();

      res.json({
        success: true,
        message: 'Login PIN updated successfully'
      });
    } else if (pinType === 'security') {
      if (admin.securityPin !== oldPin) {
        return res.status(401).json({
          success: false,
          error: 'Invalid current Security PIN'
        });
      }

      // Update Security PIN
      admin.securityPin = newPin;
      await admin.save();

      res.json({
        success: true,
        message: 'Security PIN updated successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid PIN type. Must be "login" or "security"'
      });
    }
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

// Verify admin PIN for a specific store (used by staff to access admin pages)
exports.verifyAdminPin = async (req, res) => {
  try {
    const { pin, storeId } = req.body;

    if (!pin || !storeId) {
      return res.status(400).json({
        success: false,
        error: 'PIN and store ID are required'
      });
    }

    // Find admin user for this store
    const admin = await User.findOne({ 
      role: 'admin', 
      storeId: storeId,
      isActive: true 
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found for this store'
      });
    }

    // Verify Security PIN (not Login PIN)
    if (admin.securityPin === pin) {
      res.json({
        success: true,
        message: 'Admin Security PIN verified'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Incorrect admin Security PIN'
      });
    }
  } catch (error) {
    console.error('Verify admin PIN error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify admin PIN'
    });
  }
};


// Verify admin Security PIN for sensitive operations (used by staff for product registration/deletion)
exports.verifyAdminSecurityPin = async (req, res) => {
  try {
    const { pin, storeId } = req.body;

    if (!pin || !storeId) {
      return res.status(400).json({
        success: false,
        error: 'PIN and store ID are required'
      });
    }

    // Find admin user for this store
    const admin = await User.findOne({ 
      role: 'admin', 
      storeId: storeId,
      isActive: true 
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found for this store'
      });
    }

    // Verify Security PIN
    if (admin.securityPin === pin) {
      res.json({
        success: true,
        message: 'Admin Security PIN verified'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Incorrect Admin Security PIN'
      });
    }
  } catch (error) {
    console.error('Verify admin Security PIN error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify admin Security PIN'
    });
  }
};

// Get admin info by store ID (used by staff to display admin name when accessing admin dashboard)
exports.getAdminInfo = async (req, res) => {
  try {
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store ID is required'
      });
    }

    // Find admin user for this store
    const admin = await User.findOne({ 
      role: 'admin', 
      storeId: storeId,
      isActive: true 
    }).select('name storeId storeName');

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found for this store'
      });
    }

    res.json({
      success: true,
      data: {
        name: admin.name,
        storeId: admin.storeId,
        storeName: admin.storeName
      }
    });
  } catch (error) {
    console.error('Get admin info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get admin info'
    });
  }
};
