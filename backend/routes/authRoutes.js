const express = require('express');
const router = express.Router();

// We are importing the exact function names we defined in the controller
const { register, login } = require('../controllers/authController');

// Route 1: Handle User Registration
router.post('/register', register);

// Route 2: Handle User Login
router.post('/login', login);

module.exports = router;