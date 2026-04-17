const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const formsRouter = require('./routes/forms');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/', formsRouter);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});