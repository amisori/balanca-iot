const express = require("express");
const router  = express.Router();

/**
 * GET /api/history/stats
 * Body/Query: histórico mockado para demonstração.
 * Em produção: busca do Firebase Admin SDK.
 */
router.get("/stats", (req, res) => {
  res.json({
    message: "Conecte ao Firebase Admin SDK para dados reais.",
    endpoint: "GET /api/history/stats?limit=100",
  });
});

module.exports = router;
