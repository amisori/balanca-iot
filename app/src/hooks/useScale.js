import { useState, useEffect, useCallback } from 'react';
import { subscribeRealtime, fetchHistory } from '../services/firebase';
import { fetchPrediction } from '../services/api';

const PROFILES = [
  { id: 0, name: 'Botijao P13',  taraKg: 13, capacityKg: 13, type: 'gas'   },
  { id: 1, name: 'Botijao P45',  taraKg: 32, capacityKg: 45, type: 'gas'   },
  { id: 2, name: 'Galao 20L',    taraKg: 2,  capacityKg: 20, type: 'water' },
  { id: 3, name: 'Galao 10L',    taraKg: 1,  capacityKg: 10, type: 'water' },
];

export function useScale() {
  const [realtime, setRealtime]     = useState(null);
  const [history, setHistory]       = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // Assina dados em tempo real
  useEffect(() => {
    const unsubscribe = subscribeRealtime(data => {
      setRealtime(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Carrega histórico e previsão
  const refreshHistory = useCallback(async () => {
    try {
      const hist = await fetchHistory(200);
      setHistory(hist);

      if (hist.length >= 2 && realtime) {
        const profile = PROFILES.find(p => p.name === realtime.profile) || PROFILES[0];
        const pred = await fetchPrediction(hist, profile.capacityKg);
        setPrediction(pred);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [realtime]);

  useEffect(() => {
    if (realtime) refreshHistory();
  }, [realtime?.profile]);

  return { realtime, history, prediction, loading, error, refreshHistory, PROFILES };
}
