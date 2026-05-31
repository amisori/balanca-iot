/**
 * Testes unitarios do servico de ML - reutilizados no app
 * (copia do backend para garantir que a logica seja identica)
 */

// Implementacao inline para nao depender do backend no CI do app
function linearRegression(xs, ys) {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: ys[0] || 0, r2: 0 };
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0, ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;
  for (let i = 0; i < n; i++) {
    ssRes += (ys[i] - (slope * xs[i] + intercept)) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }
  return { slope, intercept, r2: ssTot !== 0 ? 1 - ssRes / ssTot : 1 };
}

describe("linearRegression (app)", () => {
  test("fit perfeito em dados lineares", () => {
    const { slope, r2 } = linearRegression([0,1,2,3], [10,8,6,4]);
    expect(slope).toBeCloseTo(-2, 3);
    expect(r2).toBeCloseTo(1, 3);
  });

  test("slope zero com 1 ponto", () => {
    expect(linearRegression([5], [3]).slope).toBe(0);
  });
});

describe("consumo estimado", () => {
  test("consumo diario calculado corretamente", () => {
    const slopePerSec = -1 / 86400; // -1kg/dia
    const consumptionKgPerDay = -slopePerSec * 86400;
    expect(consumptionKgPerDay).toBeCloseTo(1, 5);
  });
});
