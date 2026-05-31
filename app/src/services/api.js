// URL do backend Node.js (altere para IP/domínio do seu servidor)
const API_BASE = __DEV__
  ? 'http://10.0.2.2:3001'  // emulador Android aponta para localhost do PC
  : 'https://seu-backend.com';

/**
 * Solicita previsão de consumo ao backend ML.
 * @param {Array} history - array de { timestamp, netKg }
 * @param {number} capacityKg
 */
export async function fetchPrediction(history, capacityKg) {
  const response = await fetch(`${API_BASE}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, capacityKg }),
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }

  const data = await response.json();
  return data.prediction;
}
