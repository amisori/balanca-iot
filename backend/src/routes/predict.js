const express = require("express");
const { predictConsumption } = require("../services/mlService");

const router = express.Router();

/**
 * POST /api/predict
 * Body: { history: [{ timestamp, netKg }], capacityKg }
 *
 * Retorna previsão de consumo e data estimada de fim.
 */
router.post("/", (req, res) => {
  const { history, capacityKg } = req.body;

  if (!Array.isArray(history)) {
    return res.status(400).json({ error: "'history' deve ser um array." });
  }
  if (typeof capacityKg !== "number" || capacityKg <= 0) {
    return res.status(400).json({ error: "'capacityKg' deve ser número positivo." });
  }

  try {
    const result = predictConsumption(history, capacityKg);
    return res.json({ success: true, prediction: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
