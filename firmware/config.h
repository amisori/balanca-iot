#ifndef CONFIG_H
#define CONFIG_H

// ===== WiFi =====
#define WIFI_SSID     "SEU_WIFI_AQUI"
#define WIFI_PASSWORD "SUA_SENHA_AQUI"

// ===== Firebase =====
#define FIREBASE_HOST "seu-projeto.firebaseio.com"
#define FIREBASE_AUTH "sua_database_secret_aqui"

// ===== HX711 - Pinos =====
// Célula 1
#define HX711_DOUT_1  4
#define HX711_SCK_1   5
// Célula 2
#define HX711_DOUT_2  18
#define HX711_SCK_2   19

// ===== Calibração =====
// Rode o sketch de calibração para encontrar esses valores
#define CALIBRATION_FACTOR_1  420.0f
#define CALIBRATION_FACTOR_2  420.0f

// ===== Configurações =====
#define SEND_INTERVAL_MS      5000   // Envio ao Firebase a cada 5s
#define TARE_BUTTON_PIN       0      // GPIO0 = BOOT button do ESP32

// ===== Perfis de recipientes =====
// Botijão P13 (mais comum no Brasil)
#define BOTIJAO_P13_TARA_KG   13.0f
#define BOTIJAO_P13_CAP_KG    13.0f

// Botijão P45
#define BOTIJAO_P45_TARA_KG   32.0f
#define BOTIJAO_P45_CAP_KG    45.0f

// Galão de água 20L
#define GALAO_20L_TARA_KG     2.0f
#define GALAO_20L_CAP_KG      20.0f

// Galão de água 10L
#define GALAO_10L_TARA_KG     1.0f
#define GALAO_10L_CAP_KG      10.0f

#endif // CONFIG_H
