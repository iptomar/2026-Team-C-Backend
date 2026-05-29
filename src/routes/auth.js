const express = require('express');
const { register, login, logout, generateResetLink, resetUserPassword, changeUserPassword, me } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.post('/password-reset', resetUserPassword);
router.post('/password-reset-link', generateResetLink);
router.post('/change-password', authMiddleware, changeUserPassword);
router.get('/me', authMiddleware, me);
module.exports = router;
