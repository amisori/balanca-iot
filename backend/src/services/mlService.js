/**
 * mlService.js - Machine Learning para previsão de consumo
 *
 * Usa Regressão Linear simples (método dos mínimos quadrados) sobre o histórico
 * de pesagens para prever:
 *   - Taxa de consumo diário (kg/dia)
 *   - Dias restantes até acabar
 *   - Data estimada de fim
 *
 * Não usa biblioteca externa — implementação pura para fins didáticos.
 * Em produção: substituir por TensorFlow.js ou chamar API Python/scikit-learn.
 */

/**
 * Regressão Linear simples (y = a*x + b) por mínimos quadrados.
 * @param {number[]} xs - timestamps em segundos
 * @param {number[]} ys - pesos líquidos em kg
 * @returns {{ slope: number, intercept: number, r2: number }}
 */
function linearRegression(xs, ys) {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: ys[0] || 0, r2: 0 };

  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;

  let num = 0, den = 0, ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    den += dx * dx;
  }

  const slope     = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;

  for (let i = 0; i < n; i++) {
    const pred = slope * xs[i] + intercept;
    ssRes += (ys[i] - pred) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }

  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 1;

  return { slope, intercept, r2 };
}

/**
 * Calcula previsão de consumo baseada no histórico.
 *
 * @param {Array<{ timestamp: number, netKg: number }>} history
 *   Histórico ordenado por timestamp (Unix seconds).
 * @param {number} capacityKg Capacidade total do recipiente.
 * @returns {{
 *   consumptionKgPerDay: number,
 *   daysRemaining: number | null,
 *   estimatedEmptyDate: string | null,
 *   currentNetKg: number,
 *   percentageRemaining: number,
 *   confidence: string,
 *   r2: number,
 *   dataPoints: number
 * }}
 */
function predictConsumption(history, capacityKg) {
  if (!history || history.length < 2) {
    return {
      consumptionKgPerDay: 0,
      daysRemaining: null,
      estimatedEmptyDate: null,
      currentNetKg: history?.[0]?.netKg ?? 0,
      percentageRemaining: 0,
      confidence: "insufficient_data",
      r2: 0,
      dataPoints: history?.length ?? 0,
    };
  }

  // Ordena por timestamp crescente
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);

  const xs = sorted.map((h) => h.timestamp);
  const ys = sorted.map((h) => h.netKg);

  const { slope, intercept, r2 } = linearRegression(xs, ys);

  // slope está em kg/segundo; converte para kg/dia
  const consumptionKgPerDay = -slope * 86400; // negativo pois peso cai

  const nowTs      = Date.now() / 1000;
  const currentNetKg = Math.max(0, slope * nowTs + intercept);
  const percentageRemaining = capacityKg > 0
    ? Math.min(100, (currentNetKg / capacityKg) * 100)
    : 0;

  let daysRemaining     = null;
  let estimatedEmptyDate = null;

  if (consumptionKgPerDay > 0 && currentNetKg > 0) {
    daysRemaining = currentNetKg / consumptionKgPerDay;
    const emptyDate = new Date((nowTs + daysRemaining * 86400) * 1000);
    estimatedEmptyDate = emptyDate.toISOString().split("T")[0];
  }

  const confidence =
    r2 >= 0.85 ? "high" :
    r2 >= 0.60 ? "medium" : "low";

  return {
    consumptionKgPerDay: parseFloat(consumptionKgPerDay.toFixed(4)),
    daysRemaining: daysRemaining !== null ? parseFloat(daysRemaining.toFixed(1)) : null,
    estimatedEmptyDate,
    currentNetKg: parseFloat(currentNetKg.toFixed(3)),
    percentageRemaining: parseFloat(percentageRemaining.toFixed(1)),
    confidence,
    r2: parseFloat(r2.toFixed(4)),
    dataPoints: sorted.length,
  };
}

module.exports = { predictConsumption, linearRegression };
