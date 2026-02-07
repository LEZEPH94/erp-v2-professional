const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const SECRET_KEY = "super_secret_key_2026";

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) return res.status(401).json({ error: "Utilisateur inconnu" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(401).json({ error: "Mot de passe incorrect" });

  const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
  res.json({ token });
});

module.exports = router;