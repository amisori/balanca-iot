/**
 * Balanca IoT - ESP32 + Firebase
 * Versao de teste: sem HX711, envia dados fixos ao Firebase
 */

#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include "config.h"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig fbConfig;

unsigned long lastSendMs = 0;
int contador = 0;

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("\n=== Balanca IoT iniciando ===");

  // WiFi
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
    Serial.println("\n[WiFi] Falha na conexao.");
    return;
  }

  // Firebase
  fbConfig.host = FIREBASE_HOST;
  fbConfig.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&fbConfig, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("[Firebase] Inicializado.");
}

void loop() {
  if (millis() - lastSendMs >= 5000) {
    lastSendMs = millis();
    contador++;

    // Dados simulados (sem celulas de carga)
    float grossKg    = 15.2f;
    float netKg      = 2.2f;
    float percentage = 16.9f;

    FirebaseJson json;
    json.set("grossKg",    grossKg);
    json.set("netKg",      netKg);
    json.set("percentage", percentage);
    json.set("profile",    "Botijao P13");
    json.set("type",       "gas");
    json.set("taraKg",     13);
    json.set("capacityKg", 13);
    json.set("timestamp",  (int)(millis() / 1000));
    json.set("status",     "low");
    json.set("simulado",   true);

    Serial.printf("[INFO] Enviando leitura #%d | %.2f kg | %.1f%%\n",
                  contador, netKg, percentage);

    if (Firebase.updateNode(fbdo, "/scale/realtime", json)) {
      Serial.println("[OK] Firebase atualizado.");
    } else {
      Serial.printf("[ERR] %s\n", fbdo.errorReason().c_str());
    }
  }
}
