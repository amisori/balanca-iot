# Balança IoT - ExpoTech 2026
**UniFECAF | 5º Semestre ADS | Mobile Development Track**

Sistema completo de balança inteligente para botijões de gás e galões de água usando ESP32, Firebase, React Native e ML para previsão de consumo.

---

## Arquitetura do Sistema

```
[2x Células de Carga 50kg]
         |
      [HX711]
         |
       [ESP32]  ──WiFi──►  [Firebase Realtime DB]
                                     |
                          ┌──────────┴──────────┐
                    [Cloud Functions]      [React Native App]
                    (alertas FCM)               |
                                        [Backend Node.js]
                                        (ML / Previsão)
```

---

## Hardware

### Componentes
| Componente | Qtd | Descrição |
|---|---|---|
| ESP32 DevKit v1 | 1 | Microcontrolador WiFi |
| Célula de carga 50kg | 2 | Sensor de peso |
| HX711 | 1 ou 2 | Amplificador ADC 24-bit |
| Resistor 10kΩ | 1 | Pull-up botão de tara |

### Pinagem ESP32

```
HX711 (Célula 1)          HX711 (Célula 2)
  DOUT ──► GPIO 4           DOUT ──► GPIO 18
  SCK  ──► GPIO 5           SCK  ──► GPIO 19
  VCC  ──► 3.3V             VCC  ──► 3.3V
  GND  ──► GND              GND  ──► GND

Botão de Tara
  PIN1 ──► GPIO 0 (BOOT)
  PIN2 ──► GND
```

### Ligação das células de carga (ponte de Wheatstone)

```
Célula 1 e Célula 2 em paralelo → entrada do HX711
          Vermelho → E+
          Preto    → E-
          Branco   → A-
          Verde    → A+
```

> **Dica:** Para maior precisão, use as duas células com o mesmo fabricante e lote.

---

## Perfis de Recipiente

| ID | Nome | Capacidade | Tara | Tipo |
|---|---|---|---|---|
| 0 | Botijão P13 | 13 kg | 13 kg | Gás |
| 1 | Botijão P45 | 45 kg | 32 kg | Gás |
| 2 | Galão 20L | 20 kg | 2 kg | Água |
| 3 | Galão 10L | 10 kg | 1 kg | Água |

---

## Setup

### 1. Firebase
1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Ative **Realtime Database** (modo teste inicialmente)
3. Copie a URL do banco e o Database Secret
4. Importe as regras: `firebase/database.rules.json`
5. Deploy das Cloud Functions:
   ```bash
   cd firebase/functions && npm install
   firebase deploy --only functions,database
   ```

### 2. Firmware ESP32
1. Instale as bibliotecas no Arduino IDE:
   - **HX711** by Bogdan Necula
   - **Firebase ESP32 Client** by mobizt (v4.x)
   - **ArduinoJson** by Benoit Blanchon
2. Copie `firmware/balanca_iot/config.example.h` para `firmware/balanca_iot/config.h` e preencha com seu WiFi e Firebase
3. Abra `firmware/calibracao.ino` e siga as instruções no Serial Monitor
4. Anote o `CALIBRATION_FACTOR` e cole em `firmware/balanca_iot/config.h`
5. Carregue `firmware/balanca_iot/balanca_iot.ino` no ESP32

### 3. Backend
```bash
cd backend
npm install
cp .env.example .env   # configure PORT=3001
npm start
```

### 4. App React Native
```bash
cd app
npm install
# Configure google-services.json (Android) do Firebase no app/android/app/
npx react-native run-android
```

---

## Calibração

1. Carregue o sketch `calibracao.ino`
2. Abra Serial Monitor a **115200 baud**
3. Com a balança vazia, pressione `t` para tarar
4. Coloque um peso conhecido (ex: garrafa de 2L = ~2kg)
5. Use `+` e `-` para ajustar até o display mostrar o valor correto
6. Anote o fator e atualize `CALIBRATION_FACTOR_1` e `CALIBRATION_FACTOR_2` em `config.h`

---

## API de Previsão ML

### `POST /api/predict`
```json
{
  "history": [
    { "timestamp": 1748000000, "netKg": 13.0 },
    { "timestamp": 1748086400, "netKg": 12.5 }
  ],
  "capacityKg": 13
}
```

Resposta:
```json
{
  "success": true,
  "prediction": {
    "consumptionKgPerDay": 0.4821,
    "daysRemaining": 25.9,
    "estimatedEmptyDate": "2026-06-25",
    "currentNetKg": 12.5,
    "percentageRemaining": 96.2,
    "confidence": "high",
    "r2": 0.9823,
    "dataPoints": 2
  }
}
```

**Algoritmo:** Regressão Linear (mínimos quadrados) sobre o histórico de pesagens. Confiança alta se R² ≥ 0.85.

---

## QA e CI/CD

### Rodar testes localmente
```bash
# Backend
cd backend && npm test

# App
cd app && npm test
```

### Pipeline GitHub Actions
O pipeline em `.github/workflows/ci-cd.yml` executa automaticamente:

| Job | Trigger | O que faz |
|---|---|---|
| `test-backend` | Todo push | Jest + cobertura do backend |
| `test-app` | Todo push | Jest + cobertura do app |
| `build-apk` | Push em `main` | Compila APK Release |
| `performance-test` | Push em `main` | JMeter: 10 usuários, 10 loops |

O APK é publicado como artefato do GitHub Actions após cada build aprovado.

---

## Estrutura de Pastas

```
Sistema - Balanca IoT/
├── firmware/
│   ├── balanca_iot/
│   │   ├── balanca_iot.ino     # Firmware principal
│   │   ├── config.h            # Credenciais reais (gitignored)
│   │   └── config.example.h   # Template de configuração
│   └── calibracao.ino          # Sketch de calibração
├── backend/
│   ├── src/
│   │   ├── index.js        # Servidor Express
│   │   ├── routes/         # predict.js, history.js
│   │   └── services/
│   │       └── mlService.js # Regressão linear + previsão
│   └── __tests__/          # Testes Jest (11 casos)
├── firebase/
│   ├── database.rules.json # Regras de segurança
│   ├── database-structure.json
│   └── functions/
│       └── index.js        # Cloud Functions (alertas + getHistory)
├── app/
│   ├── App.js              # Navegação principal
│   ├── src/
│   │   ├── screens/        # Home, History, Config
│   │   ├── components/     # GaugeWidget
│   │   ├── hooks/          # useScale (dados em tempo real)
│   │   └── services/       # firebase.js, api.js
│   └── __tests__/          # Testes Jest + UI Tests
└── .github/
    ├── workflows/
    │   └── ci-cd.yml       # Pipeline CI/CD
    └── jmeter/
        └── api-performance.jmx
```

---

## Requisitos Atendidos (ExpoTech 2026)

| Requisito | Status |
|---|---|
| App híbrido React Native | ✅ |
| Integração IoT (ESP32 + HX711) | ✅ |
| Banco de dados NoSQL (Firebase) | ✅ |
| Big Data / histórico de leituras | ✅ |
| Machine Learning (previsão consumo) | ✅ |
| API inteligente REST | ✅ |
| Testes unitários Jest | ✅ |
| Testes de interface (UI Tests) | ✅ |
| Testes de performance JMeter | ✅ |
| CI/CD GitHub Actions | ✅ |
| Publicação do APK | ✅ |
