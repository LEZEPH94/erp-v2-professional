const express = require('express');
const router = express.Router();
const axios = require('axios');

const PYTHON_URL = process.env.PYTHON_URL || 'http://python_engine:8000';

// Lire le stock
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_URL}/stock`);
    res.json(response.data);
  } catch (error) { res.status(500).json({ error: "Erreur lecture stock" }); }
});

// Ajouter un produit
router.post('/produit', async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_URL}/stock/produit`, req.body);
    res.json(response.data);
  } catch (error) { res.status(500).json({ error: "Erreur ajout produit" }); }
});

module.exports = router;