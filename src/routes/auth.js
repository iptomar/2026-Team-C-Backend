const express = require('express');
const { register, login, logout } = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', login);
router.post('/logout', authMiddleware, logout); // Protected route for logout

router.post('/register', register);

module.exports = router;
