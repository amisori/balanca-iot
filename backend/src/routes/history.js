const express = require("express");
const router  = express.Router();

const { isAvailable, fetchHistory } = require("../services/firebaseAdmin");
const { aggregateStats } = require("../services/mlService");
const { getSampleHistory } = require("../services/sampleHistory");

/**
 * GET /api/history/stats?limit=100
 *
 * Retorna estatísticas agregadas do histórico de pesagens (camada de análise
 * de dados sobre os registros coletados pelo sensor IoT).
 *
 * Fonte dos dados (campo "source"):
 *   - "firebase": lido do Realtime Database via Firebase Admin SDK (quando há
 *      credenciais configuradas nas variáveis de ambiente).
 *   - "sample": Firebase não configurado -> usa um conjunto de pesagens de
 *      demonstração (7 dias) para que a análise retorne métricas reais.
 */
router.get("/stats", async (req, res) => {
  const parsedLimit = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, 1000)
    : 100;

  try {
    if (!isAvailable()) {
      const history = getSampleHistory().slice(-limit);
      return res.json({
        success: true,
        source: "sample",
        message:
          "Firebase Admin não configurado: exibindo análise sobre dados de " +
          "demonstração. Configure FIREBASE_DATABASE_URL e a service account " +
          "para usar dados reais do Realtime Database.",
        limit,
        stats: aggregateStats(history),
      });
    }

    const history = await fetchHistory(limit);
    const stats = aggregateStats(history);

    return res.json({
      success: true,
      source: "firebase",
      limit,
      stats,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
