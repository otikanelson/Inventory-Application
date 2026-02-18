const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const tenantFilter = require('../middleware/tenantFilter');

// Public routes (no authentication required)
// Author login
router.post('/author/login', authController.authorLogin);

// Login
router.post('/login', authController.login);

// Setup admin (first-time)
router.post('/setup', authController.setupAdmin);

// Check if setup is complete
router.get('/setup/status', authController.checkSetup);

// Verify admin PIN for a specific store (used by staff to access admin pages)
router.post('/verify-admin-pin', authController.verifyAdminPin);

// Protected routes (authentication required)
// Staff management
router.post('/staff', authenticate, tenantFilter, authController.createStaff);
router.get('/staff', authenticate, tenantFilter, authController.getStaff);
router.put('/staff/:id', authenticate, tenantFilter, authController.updateStaff);
router.delete('/staff/:id', authenticate, tenantFilter, authController.deleteStaff);

// Update admin PIN
router.put('/admin/pin', authenticate, authController.updateAdminPin);

module.exports = router;
