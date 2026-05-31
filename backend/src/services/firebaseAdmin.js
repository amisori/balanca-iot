/**
 * firebaseAdmin.js - Inicialização preguiçosa do Firebase Admin SDK.
 *
 * O SDK só é inicializado quando há credenciais disponíveis via variáveis de
 * ambiente. Isso permite que os testes e o pipeline de CI rodem sem credenciais,
 * sem quebrar a aplicação.
 *
 * Credenciais aceitas (ordem de prioridade):
 *   1. FIREBASE_SERVICE_ACCOUNT  -> JSON da service account em string
 *   2. GOOGLE_APPLICATION_CREDENTIALS -> caminho para o arquivo JSON (padrão do SDK)
 *
 * Sempre exija também:
 *   FIREBASE_DATABASE_URL -> URL do Realtime Database
 */

let admin = null;
let initialized = false;
let available = false;

function init() {
  if (initialized) return available;
  initialized = true;

  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  const saJson      = process.env.FIREBASE_SERVICE_ACCOUNT;
  const saPath      = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  // Sem URL do banco ou sem nenhuma credencial -> roda em modo "indisponível".
  if (!databaseURL || (!saJson && !saPath)) {
    available = false;
    return false;
  }

  try {
    admin = require("firebase-admin");

    const credential = saJson
      ? admin.credential.cert(JSON.parse(saJson))
      : admin.credential.applicationDefault();

    if (!admin.apps.length) {
      admin.initializeApp({ credential, databaseURL });
    }

    available = true;
  } catch (err) {
    // Falha de credencial não deve derrubar a API; apenas desativa a fonte real.
    console.error("[firebaseAdmin] Falha ao inicializar:", err.message);
    available = false;
  }

  return available;
}

/**
 * Indica se o Firebase Admin está configurado e pronto para uso.
 */
function isAvailable() {
  return init();
}

/**
 * Busca o histórico de pesagens do Realtime Database.
 *
 * @param {number} limit Número máximo de registros (mais recentes).
 * @returns {Promise<Array<{ timestamp: number, netKg: number, grossKg?: number, status?: string }>>}
 */
async function fetchHistory(limit = 100) {
  if (!init()) return [];

  const snapshot = await admin
    .database()
    .ref("scale/history")
    .orderByKey()
    .limitToLast(limit)
    .once("value");

  const raw = snapshot.val() || {};

  return Object.values(raw)
    .map((item) => ({
      timestamp: Number(item.timestamp),
      netKg: Number(item.netKg),
      grossKg: item.grossKg != null ? Number(item.grossKg) : undefined,
      status: item.status,
    }))
    .filter((item) => Number.isFinite(item.timestamp) && Number.isFinite(item.netKg))
    .sort((a, b) => a.timestamp - b.timestamp);
}

module.exports = { isAvailable, fetchHistory };
