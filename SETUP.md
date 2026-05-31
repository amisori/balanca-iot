# Guia de Setup Completo - Balança IoT
> Tudo que precisa instalar para rodar e testar o projeto, mesmo sem a placa montada.

**Onde rodar cada comando:**
- `[PowerShell]` = Terminal do Windows (PowerShell ou CMD)
- `[Cloud Shell]` = Terminal do Google Firebase (ícone `>_` no console.firebase.google.com)
- `[Arduino IDE]` = Interface gráfica do Arduino IDE

---

## Pré-requisitos globais

> Todos instalados no seu Windows. Abra o **PowerShell** para verificar.

### 1. Node.js 18+
https://nodejs.org/en/download → baixe o instalador LTS (18.x ou 20.x)

Verifique `[PowerShell]`:
```powershell
node --version   # deve mostrar v18.x.x ou superior
npm --version    # deve mostrar 9.x.x ou superior
```

### 2. Git
https://git-scm.com/downloads → instale e configure `[PowerShell]`:
```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### 3. Java 17 (para build Android)
https://adoptium.net → baixe **Temurin 17 LTS**

Verifique `[PowerShell]`:
```powershell
java -version   # deve mostrar openjdk 17...
```

---

## Parte 1 — Backend (funciona 100% sem hardware)

> Todos os comandos desta seção rodam no `[PowerShell]`, dentro da pasta do projeto.

**Entrar na pasta do backend `[PowerShell]`:**
```powershell
cd "C:\Users\souza\ClaudeProjects\Balanca-IoT\Sistema - Balanca IoT\backend"
npm install
```

### Rodar o servidor `[PowerShell]`:
```powershell
node src/index.js
```
Deve aparecer: `[API] Rodando na porta 3001`

> Deixe esse PowerShell aberto com o servidor rodando. Abra um novo PowerShell para os próximos comandos.

### Testar no navegador
Abra no navegador: http://localhost:3001/health
Deve retornar: `{"status":"ok","ts":...}`

### Testar a previsão ML `[PowerShell]` (novo terminal, servidor ainda rodando):
```powershell
$body = '{"history":[{"timestamp":1748000000,"netKg":13},{"timestamp":1748086400,"netKg":12},{"timestamp":1748172800,"netKg":11},{"timestamp":1748259200,"netKg":10},{"timestamp":1748345600,"netKg":9}],"capacityKg":13}'

Invoke-WebRequest -Uri "http://localhost:3001/api/predict" -Method POST -ContentType "application/json" -Body $body |
  Select-Object -ExpandProperty Content |
  ConvertFrom-Json |
  ConvertTo-Json -Depth 5
```

**Ou via Postman** (sem terminal):
- Method: `POST`
- URL: `http://localhost:3001/api/predict`
- Body → raw → JSON:
```json
{
  "history": [
    {"timestamp": 1748000000, "netKg": 13},
    {"timestamp": 1748086400, "netKg": 12},
    {"timestamp": 1748172800, "netKg": 11},
    {"timestamp": 1748259200, "netKg": 10},
    {"timestamp": 1748345600, "netKg": 9}
  ],
  "capacityKg": 13
}
```

### Rodar os testes Jest `[PowerShell]`:
```powershell
# Na pasta backend (pode parar o servidor antes com Ctrl+C)
npm test
```
Esperado: **11 testes passando**, cobertura gerada em `backend/coverage/`

---

## Parte 2 — Firebase (banco de dados na nuvem)

### 2.1 Criar projeto
> Feito no navegador, sem terminal.

1. Acesse https://console.firebase.google.com
2. Clique em **Adicionar projeto** → dê um nome (ex: `balanca-iot`)
3. Desative o Google Analytics (opcional)

### 2.2 Ativar Realtime Database
> Feito no navegador.

1. No menu lateral: **Build → Realtime Database**
2. Clique em **Criar banco de dados**
3. Escolha a região **us-central1**
4. Selecione **Modo de teste** (permite leitura/escrita por 30 dias)
5. Copie a URL do banco: `https://SEU-PROJETO-default-rtdb.firebaseio.com`

### 2.3 Pegar o Database Secret (para o firmware)
> Feito no navegador.

1. Clique na engrenagem ⚙ → **Configurações do projeto**
2. Aba **Contas de serviço**
3. Role até **Secrets do banco de dados** → clique em **Mostrar**
4. Copie a chave — ela vai em `firmware/config.h` no campo `FIREBASE_AUTH`

### 2.4 Importar regras de segurança
> Feito no navegador.

1. No Realtime Database → aba **Regras**
2. Cole o conteúdo do arquivo `firebase/database.rules.json`
3. Clique em **Publicar**

### 2.5 Popular o banco com dados de teste (simula o ESP32)
> Feito no `[Cloud Shell]` — clique no ícone `>_` no canto superior direito do console Firebase.

Cole cada comando separadamente no Cloud Shell:

**Dados em tempo real:**
```bash
curl -X PUT "https://SEU-PROJETO-default-rtdb.firebaseio.com/scale/realtime.json?auth=SEU_DATABASE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"grossKg":15.2,"netKg":2.2,"percentage":16.9,"profile":"Botijao P13","type":"gas","taraKg":13,"capacityKg":13,"status":"low","timestamp":1748000000}'
```

**Configurações:**
```bash
curl -X PUT "https://SEU-PROJETO-default-rtdb.firebaseio.com/scale/config.json?auth=SEU_DATABASE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"activeProfile":0,"alertThreshold":15}'
```

**Commands:**
```bash
curl -X PUT "https://SEU-PROJETO-default-rtdb.firebaseio.com/scale/commands.json?auth=SEU_DATABASE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tare":false}'
```

**Histórico (7 dias de consumo para o ML funcionar):**
```bash
curl -X PUT "https://SEU-PROJETO-default-rtdb.firebaseio.com/scale/history.json?auth=SEU_DATABASE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"1747740000":{"grossKg":26,"netKg":13,"percentage":100,"profile":"Botijao P13","type":"gas","timestamp":1747740000,"status":"ok"},"1747826400":{"grossKg":24.5,"netKg":11.5,"percentage":88.5,"profile":"Botijao P13","type":"gas","timestamp":1747826400,"status":"ok"},"1747912800":{"grossKg":23,"netKg":10,"percentage":76.9,"profile":"Botijao P13","type":"gas","timestamp":1747912800,"status":"ok"},"1747999200":{"grossKg":21,"netKg":8,"percentage":61.5,"profile":"Botijao P13","type":"gas","timestamp":1747999200,"status":"ok"},"1748085600":{"grossKg":18.5,"netKg":5.5,"percentage":42.3,"profile":"Botijao P13","type":"gas","timestamp":1748085600,"status":"ok"},"1748172000":{"grossKg":16.5,"netKg":3.5,"percentage":26.9,"profile":"Botijao P13","type":"gas","timestamp":1748172000,"status":"ok"},"1748258400":{"grossKg":15.2,"netKg":2.2,"percentage":16.9,"profile":"Botijao P13","type":"gas","timestamp":1748258400,"status":"low"}}'
```

> Substitua `SEU-PROJETO` e `SEU_DATABASE_SECRET` pelos valores reais antes de rodar.
> Cada comando deve retornar o JSON enviado como confirmação.

Depois verifique no console do Firebase → Realtime Database que os dados aparecem.

### 2.6 Instalar Firebase CLI e fazer deploy das Cloud Functions
> Feito no `[PowerShell]`, na pasta do projeto.

```powershell
npm install -g firebase-tools
firebase login
```

```powershell
cd "C:\Users\souza\ClaudeProjects\Balanca-IoT\Sistema - Balanca IoT\firebase\functions"
npm install

cd ..
firebase deploy --only functions,database
```

---

## Parte 3 — App React Native (Android)

### 3.1 Android Studio
> Instalado no Windows. Download: https://developer.android.com/studio

Após instalar, abra o **SDK Manager** (Tools → SDK Manager) e instale:
- **Android SDK Platform 33** (ou 34)
- **Android SDK Build-Tools 33**
- **Android Emulator**
- **Intel x86 Emulator Accelerator (HAXM)** — se processador Intel

### 3.2 Variáveis de ambiente `[PowerShell]` (rodar uma vez, depois reiniciar o terminal):
```powershell
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
$path = [System.Environment]::GetEnvironmentVariable("Path", "User")
[System.Environment]::SetEnvironmentVariable("Path", "$path;$env:LOCALAPPDATA\Android\Sdk\emulator;$env:LOCALAPPDATA\Android\Sdk\platform-tools", "User")
```

Feche e reabra o PowerShell, depois verifique:
```powershell
adb --version   # deve aparecer a versão
```

### 3.3 Criar emulador Android
> Feito no Android Studio (interface gráfica).

1. **Device Manager** → **Create Device**
2. Escolha **Pixel 6**
3. Escolha **API Level 33** (Android 13)
4. Conclua e clique no botão ▶ para iniciar o emulador

### 3.4 Configurar Firebase no app
> Feito no navegador + Windows Explorer.

1. No console Firebase → **Configurações do projeto** → aba **Seus aplicativos**
2. Clique em **Adicionar app** → ícone Android
3. Package name: `com.balancaiot`
4. Clique em **Registrar app**
5. Baixe o `google-services.json`
6. Cole o arquivo em: `app\android\app\google-services.json`

### 3.5 Instalar dependências e rodar `[PowerShell]`:
```powershell
cd "C:\Users\souza\ClaudeProjects\Balanca-IoT\Sistema - Balanca IoT\app"
npm install
```

Com o emulador aberto:
```powershell
npx react-native run-android
```

Na primeira vez demora ~5 minutos para compilar.

### 3.6 Rodar testes do app sem emulador `[PowerShell]`:
```powershell
# Na pasta app
npm test
```

---

## Parte 4 — Firmware ESP32

> Tudo feito no `[Arduino IDE]`. Pode instalar agora e testar a compilação sem precisar da placa.

### 4.1 Arduino IDE 2.x
https://www.arduino.cc/en/software → baixe o instalador Windows

### 4.2 Adicionar suporte ao ESP32 `[Arduino IDE]`:
1. **File → Preferences**
2. Em "Additional boards manager URLs" cole:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. **Tools → Board → Boards Manager** → pesquise `esp32` → instale **esp32 by Espressif Systems** (v2.x)

### 4.3 Instalar bibliotecas `[Arduino IDE]`:
**Sketch → Include Library → Manage Libraries**, instale:

| Biblioteca | Autor | Versão |
|---|---|---|
| HX711 Arduino Library | Bogdan Necula | qualquer |
| Firebase ESP32 Client | mobizt | 4.x |
| ArduinoJson | Benoit Blanchon | 6.x |

### 4.4 Editar config.h `[Windows Explorer ou VS Code]`:
Abra `firmware\config.h` e preencha:
```cpp
#define WIFI_SSID     "nome_da_sua_rede"
#define WIFI_PASSWORD "senha_da_rede"
#define FIREBASE_HOST "SEU-PROJETO-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "seu_database_secret_aqui"
```

### 4.5 Selecionar a placa `[Arduino IDE]`:
**Tools → Board → ESP32 Arduino → ESP32 Dev Module**

### 4.6 Testar compilação sem hardware `[Arduino IDE]`:
Abra `firmware\balanca_iot.ino` e pressione **Ctrl+R** (Verify/Compile).
Se aparecer "Compilation complete" sem erros, o código está correto.

---

## Parte 5 — GitHub Actions (CI/CD)

> Comandos no `[PowerShell]`, na raiz do projeto.

### 5.1 Subir o projeto no GitHub `[PowerShell]`:
```powershell
cd "C:\Users\souza\ClaudeProjects\Balanca-IoT\Sistema - Balanca IoT"
git init
git add .
git commit -m "feat: projeto inicial balanca IoT"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/balanca-iot.git
git push -u origin main
```

### 5.2 Verificar o pipeline
> Feito no navegador, no GitHub.

1. Acesse seu repositório no GitHub
2. Clique na aba **Actions**
3. O workflow `CI/CD - Balanca IoT` deve aparecer rodando automaticamente
4. Jobs `test-backend` e `test-app` rodam em todo push
5. `build-apk` e `performance-test` rodam somente na branch `main`

### 5.3 Baixar o APK gerado
> Feito no navegador, no GitHub.

1. Actions → clique no workflow mais recente
2. Role até **Artifacts**
3. Clique em `BalancaIoT-release-[hash]` para baixar o APK

---

## O que funciona SEM o hardware

| Funcionalidade | Onde testar | Sem ESP32 | Sem emulador Android |
|---|---|---|---|
| Testes Jest do backend (11) | PowerShell | ✅ | ✅ |
| API de previsão ML | PowerShell / Postman | ✅ | ✅ |
| Testes Jest do app | PowerShell | ✅ | ✅ |
| CI/CD GitHub Actions | Navegador (GitHub) | ✅ | ✅ |
| Firebase com dados manuais | Cloud Shell | ✅ | ✅ |
| App visual | Emulador Android | ✅ | ❌ |
| Firmware (compilação) | Arduino IDE | ❌ requer Arduino IDE | ✅ |
| Leitura real de peso | Arduino IDE + placa | ❌ | ❌ |
