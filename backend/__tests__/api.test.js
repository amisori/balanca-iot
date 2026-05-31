const request = require("supertest");
const app     = require("../src/index");

describe("GET /health", () => {
  it("retorna status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("POST /api/predict", () => {
  const nowTs = Math.floor(Date.now() / 1000);
  const history = [
    { timestamp: nowTs - 7 * 86400, netKg: 13 },
    { timestamp: nowTs - 6 * 86400, netKg: 11 },
    { timestamp: nowTs - 5 * 86400, netKg: 9  },
    { timestamp: nowTs - 4 * 86400, netKg: 7  },
    { timestamp: nowTs - 3 * 86400, netKg: 5  },
    { timestamp: nowTs - 2 * 86400, netKg: 3  },
    { timestamp: nowTs - 1 * 86400, netKg: 1  },
  ];

  it("retorna previsão válida com dados corretos", async () => {
    const res = await request(app)
      .post("/api/predict")
      .send({ history, capacityKg: 13 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.prediction).toHaveProperty("daysRemaining");
    expect(res.body.prediction).toHaveProperty("consumptionKgPerDay");
    expect(res.body.prediction.consumptionKgPerDay).toBeGreaterThan(0);
  });

  it("retorna 400 se history não for array", async () => {
    const res = await request(app)
      .post("/api/predict")
      .send({ history: "invalido", capacityKg: 13 });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 se capacityKg for inválido", async () => {
    const res = await request(app)
      .post("/api/predict")
      .send({ history, capacityKg: -5 });
    expect(res.statusCode).toBe(400);
  });
});
