const { loginUser } = require('../auth/authService');
const jwt = require('jsonwebtoken');

async function login(req, res) {
  const { email, password } = req.body;

  const user = await loginUser(email, password);

  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
}


module.exports = { login };




