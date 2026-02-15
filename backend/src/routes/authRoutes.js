const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login
router.post('/login', authController.login);

// Setup admin (first-time)
router.post('/setup', authController.setupAdmin);

// Check if setup is complete
router.get('/setup/status', authController.checkSetup);

// Staff management
router.post('/staff', authController.createStaff);
router.get('/staff', authController.getStaff);
router.put('/staff/:id', authController.updateStaff);
router.delete('/staff/:id', authController.deleteStaff);

// Update admin PIN
router.put('/admin/pin', authController.updateAdminPin);

module.exports = router;
