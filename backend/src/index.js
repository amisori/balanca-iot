require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const helmet   = require("helmet");

const predictRouter = require("./routes/predict");
const historyRouter = require("./routes/history");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", ts: Date.now() }));
app.use("/api/predict", predictRouter);
app.use("/api/history", historyRouter);

// Handler de erro global
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erro interno do servidor" });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`[API] Rodando na porta ${PORT}`));
}

module.exports = app; // exporta para testes
