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

/**
 * Agrega o histórico de pesagens em estatísticas para análise de dados.
 *
 * Faz o "rollup" dos registros brutos em métricas diárias e globais, servindo
 * de base para dashboards e insights (camada de análise sobre os dados IoT).
 *
 * @param {Array<{ timestamp: number, netKg: number }>} history
 * @returns {{
 *   totalRecords: number,
 *   periodDays: number,
 *   firstTimestamp: number | null,
 *   lastTimestamp: number | null,
 *   avgNetKg: number,
 *   minNetKg: number | null,
 *   maxNetKg: number | null,
 *   avgConsumptionKgPerDay: number,
 *   peakConsumptionDay: { date: string, consumptionKg: number } | null,
 *   daily: Array<{ date: string, records: number, avgNetKg: number, consumptionKg: number }>
 * }}
 */
function aggregateStats(history) {
  const empty = {
    totalRecords: 0,
    periodDays: 0,
    firstTimestamp: null,
    lastTimestamp: null,
    avgNetKg: 0,
    minNetKg: null,
    maxNetKg: null,
    avgConsumptionKgPerDay: 0,
    peakConsumptionDay: null,
    daily: [],
  };

  if (!Array.isArray(history) || history.length === 0) return empty;

  const sorted = [...history]
    .filter((h) => Number.isFinite(h.timestamp) && Number.isFinite(h.netKg))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (sorted.length === 0) return empty;

  const nets = sorted.map((h) => h.netKg);
  const avgNetKg = nets.reduce((s, v) => s + v, 0) / nets.length;
  const minNetKg = Math.min(...nets);
  const maxNetKg = Math.max(...nets);

  const firstTimestamp = sorted[0].timestamp;
  const lastTimestamp  = sorted[sorted.length - 1].timestamp;
  const periodDays = Math.max(0, (lastTimestamp - firstTimestamp) / 86400);

  // Agrupa por dia (UTC)
  const buckets = new Map();
  for (const h of sorted) {
    const date = new Date(h.timestamp * 1000).toISOString().split("T")[0];
    if (!buckets.has(date)) buckets.set(date, []);
    buckets.get(date).push(h.netKg);
  }

  const dailyKeys = [...buckets.keys()].sort();
  const daily = dailyKeys.map((date, idx) => {
    const vals = buckets.get(date);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    // Consumo do dia = queda do peso médio em relação ao dia anterior
    let consumptionKg = 0;
    if (idx > 0) {
      const prevVals = buckets.get(dailyKeys[idx - 1]);
      const prevAvg = prevVals.reduce((s, v) => s + v, 0) / prevVals.length;
      consumptionKg = Math.max(0, prevAvg - avg);
    }
    return {
      date,
      records: vals.length,
      avgNetKg: parseFloat(avg.toFixed(3)),
      consumptionKg: parseFloat(consumptionKg.toFixed(3)),
    };
  });

  const totalConsumption = daily.reduce((s, d) => s + d.consumptionKg, 0);
  const avgConsumptionKgPerDay = periodDays > 0 ? totalConsumption / periodDays : 0;

  let peakConsumptionDay = null;
  for (const d of daily) {
    if (!peakConsumptionDay || d.consumptionKg > peakConsumptionDay.consumptionKg) {
      peakConsumptionDay = { date: d.date, consumptionKg: d.consumptionKg };
    }
  }
  if (peakConsumptionDay && peakConsumptionDay.consumptionKg === 0) {
    peakConsumptionDay = null;
  }

  return {
    totalRecords: sorted.length,
    periodDays: parseFloat(periodDays.toFixed(2)),
    firstTimestamp,
    lastTimestamp,
    avgNetKg: parseFloat(avgNetKg.toFixed(3)),
    minNetKg: parseFloat(minNetKg.toFixed(3)),
    maxNetKg: parseFloat(maxNetKg.toFixed(3)),
    avgConsumptionKgPerDay: parseFloat(avgConsumptionKgPerDay.toFixed(4)),
    peakConsumptionDay,
    daily,
  };
}

module.exports = { predictConsumption, linearRegression, aggregateStats };
