const express = require('express');
const router = express.Router();
// We added loginUser to the import below
const { registerUser, loginUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser); // <-- New login route added

module.exports = router;