/**
 * Firebase Cloud Functions - Balança IoT
 * Alertas automáticos quando nível está baixo
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Trigger: dispara sempre que /scale/realtime é atualizado.
 * Se percentage <= threshold, envia notificação push.
 */
exports.alertLowLevel = functions.database
  .ref("/scale/realtime")
  .onUpdate(async (change) => {
    const data = change.after.val();
    if (!data) return null;

    const { percentage, profile, type, status } = data;

    if (status !== "low") return null;

    // Busca token FCM do usuário nas configs
    const configSnap = await admin.database().ref("/scale/config").once("value");
    const config = configSnap.val();
    if (!config || !config.fcmToken) return null;

    const unit = type === "gas" ? "gás" : "água";
    const message = {
      token: config.fcmToken,
      notification: {
        title: `⚠️ Nível baixo de ${unit}!`,
        body: `${profile}: apenas ${percentage.toFixed(1)}% restante.`,
      },
      data: {
        percentage: String(percentage),
        profile,
        type,
      },
      android: {
        priority: "high",
        notification: { channelId: "balanca_alerts" },
      },
    };

    try {
      await admin.messaging().send(message);
      console.log(`Alerta enviado: ${profile} - ${percentage.toFixed(1)}%`);
    } catch (err) {
      console.error("Erro ao enviar notificação:", err);
    }

    return null;
  });

/**
 * Função HTTP: retorna últimas N leituras do histórico.
 * Usada pelo backend Node.js para análise ML.
 */
exports.getHistory = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  const limit = parseInt(req.query.limit) || 100;

  try {
    const snap = await admin
      .database()
      .ref("/scale/history")
      .orderByKey()
      .limitToLast(limit)
      .once("value");

    const entries = [];
    snap.forEach((child) => {
      entries.push({ id: child.key, ...child.val() });
    });

    res.json({ success: true, count: entries.length, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
