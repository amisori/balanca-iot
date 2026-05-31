/**
 * Balança IoT - ESP32 + 2x HX711 + Firebase
 * ExpoTech 2026 - UniFECAF - 5º Semestre ADS
 *
 * Dependências (instale via Library Manager):
 *   - HX711 by Bogdan Necula (ou HX711 Arduino Library by olkal)
 *   - Firebase ESP32 Client by mobizt (v4.x)
 *   - ArduinoJson by Benoit Blanchon
 */

#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <HX711.h>
#include <ArduinoJson.h>
#include "config.h"

// ===== Objetos globais =====
HX711 scale1;
HX711 scale2;

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig fbConfig;

// ===== Estado =====
struct ContainerProfile {
  String name;
  float  taraKg;
  float  capacityKg;
  String type; // "gas" | "water"
};

ContainerProfile profiles[] = {
  { "Botijão P13",  BOTIJAO_P13_TARA_KG, BOTIJAO_P13_CAP_KG, "gas"   },
  { "Botijão P45",  BOTIJAO_P45_TARA_KG, BOTIJAO_P45_CAP_KG, "gas"   },
  { "Galão 20L",    GALAO_20L_TARA_KG,   GALAO_20L_CAP_KG,   "water" },
  { "Galão 10L",    GALAO_10L_TARA_KG,   GALAO_10L_CAP_KG,   "water" },
};

int activeProfile = 0;  // índice do perfil ativo (lido do Firebase)

unsigned long lastSendMs    = 0;
unsigned long lastTareMs    = 0;
bool          tareRequested = false;

// ===== Protótipos =====
float readTotalWeightKg();
float calcPercentage(float grossKg, ContainerProfile& p);
void  sendToFirebase(float grossKg, float netKg, float percentage);
void  fetchProfileFromFirebase();
void  handleTareButton();
void  connectWifi();
void  initFirebase();

// ===== Setup =====
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== Balança IoT iniciando ===");

  // Botão de tara
  pinMode(TARE_BUTTON_PIN, INPUT_PULLUP);

  // HX711 - Célula 1
  scale1.begin(HX711_DOUT_1, HX711_SCK_1);
  scale1.set_scale(CALIBRATION_FACTOR_1);
  scale1.tare();

  // HX711 - Célula 2
  scale2.begin(HX711_DOUT_2, HX711_SCK_2);
  scale2.set_scale(CALIBRATION_FACTOR_2);
  scale2.tare();

  Serial.println("HX711 inicializado.");

  connectWifi();
  initFirebase();
  fetchProfileFromFirebase();

  Serial.println("Setup completo. Iniciando leituras...");
}

// ===== Loop =====
void loop() {
  handleTareButton();

  unsigned long now = millis();
  if (now - lastSendMs >= SEND_INTERVAL_MS) {
    lastSendMs = now;

    if (!scale1.is_ready() || !scale2.is_ready()) {
      Serial.println("[WARN] HX711 não pronto.");
      return;
    }

    float grossKg    = readTotalWeightKg();
    ContainerProfile& p = profiles[activeProfile];
    float netKg      = max(0.0f, grossKg - p.taraKg);
    float percentage = calcPercentage(grossKg, p);

    Serial.printf("[INFO] Bruto: %.2f kg | Líquido: %.2f kg | %%: %.1f\n",
                  grossKg, netKg, percentage);

    sendToFirebase(grossKg, netKg, percentage);
  }

  // Verifica perfil no Firebase a cada 30s
  static unsigned long lastProfileCheck = 0;
  if (now - lastProfileCheck >= 30000) {
    lastProfileCheck = now;
    fetchProfileFromFirebase();
  }
}

// ===== Funções =====

float readTotalWeightKg() {
  // Média de 5 leituras por célula para estabilidade
  float w1 = scale1.get_units(5);
  float w2 = scale2.get_units(5);
  // Garante valores não-negativos
  w1 = max(0.0f, w1);
  w2 = max(0.0f, w2);
  return w1 + w2;
}

float calcPercentage(float grossKg, ContainerProfile& p) {
  float netKg = grossKg - p.taraKg;
  if (netKg <= 0)             return 0.0f;
  if (netKg >= p.capacityKg) return 100.0f;
  return (netKg / p.capacityKg) * 100.0f;
}

void sendToFirebase(float grossKg, float netKg, float percentage) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] WiFi desconectado. Reconectando...");
    connectWifi();
    return;
  }

  ContainerProfile& p = profiles[activeProfile];
  unsigned long timestamp = millis(); // Em produção, use NTP

  // Dados em tempo real
  FirebaseJson json;
  json.set("grossKg",     grossKg);
  json.set("netKg",       netKg);
  json.set("percentage",  percentage);
  json.set("profile",     p.name.c_str());
  json.set("type",        p.type.c_str());
  json.set("taraKg",      p.taraKg);
  json.set("capacityKg",  p.capacityKg);
  json.set("timestamp",   (int)timestamp);
  json.set("status",      percentage <= 15.0f ? "low" : "ok");

  if (Firebase.updateNode(fbdo, "/scale/realtime", json)) {
    Serial.println("[OK] Dados enviados ao Firebase.");
  } else {
    Serial.printf("[ERR] Firebase: %s\n", fbdo.errorReason().c_str());
  }

  // Histórico: salva uma leitura por minuto
  static unsigned long lastHistoryMs = 0;
  if (millis() - lastHistoryMs >= 60000) {
    lastHistoryMs = millis();
    String path = "/scale/history/" + String(timestamp);
    if (Firebase.setJSON(fbdo, path, json)) {
      Serial.println("[OK] Histórico salvo.");
    }
  }
}

void fetchProfileFromFirebase() {
  if (Firebase.getInt(fbdo, "/scale/config/activeProfile")) {
    int idx = fbdo.intData();
    if (idx >= 0 && idx < 4) {
      activeProfile = idx;
      Serial.printf("[INFO] Perfil ativo: %s\n", profiles[activeProfile].name.c_str());
    }
  }

  // Verifica se há comando de tara remoto
  if (Firebase.getBool(fbdo, "/scale/commands/tare")) {
    if (fbdo.boolData()) {
      Serial.println("[CMD] Tara remota recebida.");
      scale1.tare();
      scale2.tare();
      Firebase.setBool(fbdo, "/scale/commands/tare", false);
    }
  }
}

void handleTareButton() {
  if (digitalRead(TARE_BUTTON_PIN) == LOW) {
    if (!tareRequested && (millis() - lastTareMs > 2000)) {
      tareRequested = true;
      lastTareMs = millis();
      Serial.println("[BTN] Tara física pressionada.");
      scale1.tare();
      scale2.tare();
      delay(500);
    }
  } else {
    tareRequested = false;
  }
}

void connectWifi() {
  Serial.printf("[WiFi] Conectando a %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Conectado! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WiFi] Falha na conexão. Continuando sem WiFi.");
  }
}

void initFirebase() {
  fbConfig.host           = FIREBASE_HOST;
  fbConfig.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&fbConfig, &auth);
  Firebase.reconnectWiFi(true);
  Firebase.setDoubleDigits(3);

  Serial.println("[Firebase] Inicializado.");
}
