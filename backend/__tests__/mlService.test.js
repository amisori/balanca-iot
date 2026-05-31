const { predictConsumption, linearRegression, aggregateStats } = require("../src/services/mlService");

describe("aggregateStats", () => {
  test("retorna estrutura vazia para histórico vazio", () => {
    const s = aggregateStats([]);
    expect(s.totalRecords).toBe(0);
    expect(s.daily).toEqual([]);
    expect(s.peakConsumptionDay).toBeNull();
  });

  test("agrega métricas e consumo diário corretamente", () => {
    const day = 86400;
    const base = 1700000000;
    const history = [
      { timestamp: base + 0 * day, netKg: 13 },
      { timestamp: base + 1 * day, netKg: 10 },
      { timestamp: base + 2 * day, netKg: 6 },
    ];
    const s = aggregateStats(history);
    expect(s.totalRecords).toBe(3);
    expect(s.daily.length).toBe(3);
    expect(s.maxNetKg).toBeCloseTo(13, 3);
    expect(s.minNetKg).toBeCloseTo(6, 3);
    expect(s.avgConsumptionKgPerDay).toBeGreaterThan(0);
    expect(s.peakConsumptionDay).not.toBeNull();
  });
});

describe("linearRegression", () => {
  test("slope e intercept corretos", () => {
    const xs = [0, 1, 2, 3, 4];
    const ys = [10, 8, 6, 4, 2];
    const { slope, intercept, r2 } = linearRegression(xs, ys);
    expect(slope).toBeCloseTo(-2, 3);
    expect(intercept).toBeCloseTo(10, 3);
    expect(r2).toBeCloseTo(1.0, 3);
  });

  test("slope=0 com menos de 2 pontos", () => {
    const { slope } = linearRegression([1], [5]);
    expect(slope).toBe(0);
  });
});

describe("predictConsumption", () => {
  const capacityKg = 13;
  const nowTs = () => Math.floor(Date.now() / 1000);

  test("insufficient_data com 1 ponto", () => {
    const result = predictConsumption([{ timestamp: 1000, netKg: 5 }], capacityKg);
    expect(result.confidence).toBe("insufficient_data");
    expect(result.daysRemaining).toBeNull();
  });

  test("calcula consumo diario e dias restantes", () => {
    const ts = nowTs();
    const history = [];
    for (let i = 0; i < 7; i++) {
      history.push({ timestamp: ts - (7 - i) * 86400, netKg: 13 - i });
    }
    const result = predictConsumption(history, capacityKg);
    expect(result.consumptionKgPerDay).toBeGreaterThan(0);
    expect(result.daysRemaining).not.toBeNull();
    expect(result.daysRemaining).toBeGreaterThan(0);
    expect(result.r2).toBeGreaterThan(0.8);
  });

  test("percentageRemaining entre 0 e 100", () => {
    const ts = nowTs();
    const history = [
      { timestamp: ts - 3 * 86400, netKg: 8 },
      { timestamp: ts - 2 * 86400, netKg: 7 },
      { timestamp: ts - 1 * 86400, netKg: 6 },
    ];
    const result = predictConsumption(history, capacityKg);
    expect(result.percentageRemaining).toBeGreaterThanOrEqual(0);
    expect(result.percentageRemaining).toBeLessThanOrEqual(100);
  });

  test("daysRemaining null se consumo zero", () => {
    const ts = nowTs();
    const history = [
      { timestamp: ts - 86400, netKg: 10 },
      { timestamp: ts,         netKg: 10 },
    ];
    const result = predictConsumption(history, capacityKg);
    expect(result.daysRemaining).toBeNull();
  });

  test("estimatedEmptyDate e data valida", () => {
    const ts = nowTs();
    const history = [];
    for (let i = 0; i < 5; i++) {
      history.push({ timestamp: ts - (5 - i) * 86400, netKg: 10 - i });
    }
    const result = predictConsumption(history, capacityKg);
    if (result.estimatedEmptyDate) {
      expect(new Date(result.estimatedEmptyDate).toString()).not.toBe("Invalid Date");
    }
  });
});
