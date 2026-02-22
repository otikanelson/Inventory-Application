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

// Verify admin Security PIN for sensitive operations (product registration/deletion)
router.post('/verify-admin-security-pin', authController.verifyAdminSecurityPin);

// Get admin info by store ID (used by staff to display admin name)
router.get('/admin-info/:storeId', authController.getAdminInfo);

// Check if admin has security PIN set (used by staff before registering products)
router.get('/check-admin-security-pin/:storeId', authController.checkAdminSecurityPin);

// Protected routes (authentication required)
// Staff management
router.post('/staff', authenticate, tenantFilter, authController.createStaff);
router.get('/staff', authenticate, tenantFilter, authController.getStaff);
router.put('/staff/:id', authenticate, tenantFilter, authController.updateStaff);
router.delete('/staff/:id', authenticate, tenantFilter, authController.deleteStaff);

// Admin impersonate staff
router.post('/staff/:staffId/impersonate', authenticate, tenantFilter, authController.impersonateStaff);

// Update admin PIN
router.put('/admin/pin', authenticate, authController.updateAdminPin);

module.exports = router;
