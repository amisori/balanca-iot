/**
 * sampleHistory.js - Conjunto de pesagens de exemplo.
 *
 * Usado como fonte de demonstracao quando o Firebase Admin nao esta configurado,
 * para que a rota de analise agregada (/api/history/stats) retorne metricas reais
 * calculadas - e nao zeros. Representa 7 dias de consumo de um botijao P13 (13 kg),
 * com o peso liquido caindo gradualmente.
 *
 * @returns {Array<{ timestamp: number, netKg: number, grossKg: number, status: string }>}
 */
function getSampleHistory() {
  const day = 86400;
  const nowSec = Math.floor(Date.now() / 1000);
  const start = nowSec - 6 * day; // 7 pontos: hoje e os 6 dias anteriores
  const tara = 13.0; // tara do botijao P13
  const netSeries = [13.0, 11.2, 9.5, 7.6, 5.4, 3.1, 1.2];

  return netSeries.map((netKg, i) => {
    const percentage = (netKg / 13.0) * 100;
    return {
      timestamp: start + i * day,
      netKg: parseFloat(netKg.toFixed(2)),
      grossKg: parseFloat((netKg + tara).toFixed(2)),
      status: percentage <= 15 ? "low" : "ok",
    };
  });
}

module.exports = { getSampleHistory };
