#ifndef CONFIG_H
#define CONFIG_H

// ===== WiFi =====
#define WIFI_SSID     "SUA_REDE_WIFI"
#define WIFI_PASSWORD "SUA_SENHA_WIFI"

// ===== Firebase =====
#define FIREBASE_HOST "SEU-PROJETO-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "SEU_DATABASE_SECRET"

// ===== HX711 - Pinos =====
#define HX711_DOUT_1  4
#define HX711_SCK_1   5
#define HX711_DOUT_2  18
#define HX711_SCK_2   19

// ===== Calibracao =====
#define CALIBRATION_FACTOR_1  420.0f
#define CALIBRATION_FACTOR_2  420.0f

// ===== Configuracoes =====
#define SEND_INTERVAL_MS      5000
#define TARE_BUTTON_PIN       0

// ===== Perfis de recipientes =====
#define BOTIJAO_P13_TARA_KG   13.0f
#define BOTIJAO_P13_CAP_KG    13.0f
#define BOTIJAO_P45_TARA_KG   32.0f
#define BOTIJAO_P45_CAP_KG    45.0f
#define GALAO_20L_TARA_KG     2.0f
#define GALAO_20L_CAP_KG      20.0f
#define GALAO_10L_TARA_KG     1.0f
#define GALAO_10L_CAP_KG      10.0f

#endif // CONFIG_H
