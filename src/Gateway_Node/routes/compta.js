const express = require('express');
const router = express.Router();
const axios = require('axios');

const PYTHON_URL = process.env.PYTHON_URL || 'http://python_engine:8000';

router.post('/facture', async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_URL}/compta/facture`, req.body);
    res.json(response.data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/depense', async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_URL}/compta/depense`, req.body);
    res.json(response.data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/ecritures', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_URL}/compta/ecritures`);
    res.json(response.data);
  } catch (error) { res.status(500).json({ error: "Erreur lecture" }); }
});

router.get('/kpi', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_URL}/compta/kpi`);
    res.json(response.data);
  } catch (error) { res.json({ ca_total: 0, depenses_total: 0, benefice_net: 0 }); }
});

router.get('/facture/:id/pdf', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_URL}/compta/facture/${req.params.id}/pdf`, { responseType: 'stream' });
    res.setHeader('Content-Type', 'application/pdf');
    response.data.pipe(res);
  } catch (error) { res.status(500).send("Erreur PDF"); }
});

module.exports = router;