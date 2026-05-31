/**
 * Sketch de Calibração - Balança IoT
 * Execute ESTE sketch antes do principal para encontrar o CALIBRATION_FACTOR.
 *
 * Como usar:
 *  1. Carregue este sketch no ESP32.
 *  2. Abra o Serial Monitor a 115200 baud.
 *  3. Deixe a balança vazia e pressione 't' para tarar.
 *  4. Coloque um peso CONHECIDO (ex: 1kg, 2kg) sobre a balança.
 *  5. Ajuste com '+' e '-' até o display mostrar o peso correto.
 *  6. Anote o fator exibido e cole em config.h (CALIBRATION_FACTOR_1/2).
 *
 * IMPORTANTE: faça a calibração com ambas as células juntas como serão usadas.
 */

#include <HX711.h>

// Use os mesmos pinos do firmware principal
#define DOUT_1  4
#define SCK_1   5
#define DOUT_2  18
#define SCK_2   19

HX711 scale1;
HX711 scale2;

float calibFactor = 420.0;

void setup() {
  Serial.begin(115200);
  delay(500);

  scale1.begin(DOUT_1, SCK_1);
  scale2.begin(DOUT_2, SCK_2);

  scale1.set_scale();
  scale2.set_scale();
  scale1.tare();
  scale2.tare();

  Serial.println("=== Calibração de Balança IoT ===");
  Serial.println("Comandos: t=tarar | +=aumentar fator | -=diminuir fator");
  Serial.println("Coloque um peso CONHECIDO e ajuste até o valor bater.");
}

void loop() {
  if (scale1.is_ready() && scale2.is_ready()) {
    scale1.set_scale(calibFactor);
    scale2.set_scale(calibFactor);

    float w1 = scale1.get_units(10);
    float w2 = scale2.get_units(10);
    float total = w1 + w2;

    Serial.printf("Célula1: %.3f kg | Célula2: %.3f kg | Total: %.3f kg | Fator: %.1f\n",
                  w1, w2, total, calibFactor);
  }

  if (Serial.available()) {
    char c = Serial.read();
    if (c == '+') calibFactor += 10;
    if (c == '-') calibFactor -= 10;
    if (c == 't') {
      scale1.tare();
      scale2.tare();
      Serial.println(">> Tarado!");
    }
  }

  delay(1000);
}
