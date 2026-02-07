const express = require('express');
const cors = require('cors');
const stockRoutes = require('./routes/stock');
const app = express();

const comptaRoutes = require('./routes/compta');
const authRoutes = require('./routes/auth'); // Sécurité

app.use(cors());
app.use(express.json());

app.use('/compta', comptaRoutes);
app.use('/auth', authRoutes);
app.use('/stock', stockRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'Online 🟢', service: 'Gateway Node.js Secured' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});