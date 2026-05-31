import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useScale } from '../hooks/useScale';
import GaugeWidget from '../components/GaugeWidget';
import { sendTareCommand } from '../services/firebase';

export default function HomeScreen() {
  const { realtime, prediction, loading, error, refreshHistory } = useScale();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHistory();
    setRefreshing(false);
  };

  const handleTare = () => {
    Alert.alert(
      'Tarar Balanca',
      'Remova todo o peso da balanca e confirme.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tarar',
          onPress: async () => {
            try {
              await sendTareCommand();
              Alert.alert('Tara enviada!', 'O ESP32 ira tarar em instantes.');
            } catch {
              Alert.alert('Erro', 'Nao foi possivel enviar o comando.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Conectando ao sensor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erro: {error}</Text>
      </View>
    );
  }

  const data = realtime || {};
  const pct  = data.percentage ?? 0;
  const isLow = pct <= 15;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Balanca IoT</Text>
        <View style={[styles.statusBadge, { backgroundColor: isLow ? '#fee2e2' : '#dcfce7' }]}>
          <Text style={[styles.statusText, { color: isLow ? '#dc2626' : '#16a34a' }]}>
            {isLow ? '⚠ Nivel Baixo' : '✓ Normal'}
          </Text>
        </View>
      </View>

      {/* Gauge */}
      <View style={styles.gaugeContainer}>
        <GaugeWidget
          percentage={pct}
          label={data.profile ?? '-'}
          sublabel={data.type === 'gas' ? 'Gas' : 'Agua'}
        />
      </View>

      {/* Cards de dados */}
      <View style={styles.cardRow}>
        <DataCard label="Peso Bruto" value={`${(data.grossKg ?? 0).toFixed(2)} kg`} />
        <DataCard label="Peso Liq." value={`${(data.netKg ?? 0).toFixed(2)} kg`} />
      </View>
      <View style={styles.cardRow}>
        <DataCard label="Capacidade" value={`${(data.capacityKg ?? 0).toFixed(0)} kg`} />
        <DataCard label="Tara" value={`${(data.taraKg ?? 0).toFixed(0)} kg`} />
      </View>

      {/* Previsao ML */}
      {prediction && (
        <View style={styles.predCard}>
          <Text style={styles.predTitle}>Previsao de Consumo (IA)</Text>
          <View style={styles.predRow}>
            <PredItem label="Consumo/dia" value={`${prediction.consumptionKgPerDay} kg`} />
            <PredItem
              label="Dias restantes"
              value={prediction.daysRemaining != null ? `~${prediction.daysRemaining}d` : 'N/A'}
            />
          </View>
          {prediction.estimatedEmptyDate && (
            <Text style={styles.predDate}>
              Previsao de fim: {prediction.estimatedEmptyDate}
            </Text>
          )}
          <Text style={styles.predConf}>
            Confianca: {prediction.confidence === 'high' ? 'Alta' :
                        prediction.confidence === 'medium' ? 'Media' : 'Baixa'}
            {' '}(R²={prediction.r2})
          </Text>
        </View>
      )}

      {/* Botao de tara */}
      <TouchableOpacity style={styles.tareButton} onPress={handleTare}>
        <Text style={styles.tareButtonText}>Tarar Balanca</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function DataCard({ label, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

function PredItem({ label, value }) {
  return (
    <View style={styles.predItem}>
      <Text style={styles.predLabel}>{label}</Text>
      <Text style={styles.predValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f9fafb' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:     { color: '#6b7280', fontSize: 16 },
  errorText:       { color: '#dc2626', fontSize: 16 },

  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 48 },
  headerTitle:     { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  statusBadge:     { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText:      { fontSize: 13, fontWeight: '600' },

  gaugeContainer:  { alignItems: 'center', paddingVertical: 24 },

  cardRow:         { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, gap: 8 },
  card:            { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  cardLabel:       { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  cardValue:       { fontSize: 20, fontWeight: 'bold', color: '#111827' },

  predCard:        { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  predTitle:       { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  predRow:         { flexDirection: 'row', justifyContent: 'space-between' },
  predItem:        { alignItems: 'center' },
  predLabel:       { fontSize: 11, color: '#9ca3af' },
  predValue:       { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  predDate:        { marginTop: 12, fontSize: 13, color: '#374151', textAlign: 'center' },
  predConf:        { marginTop: 4, fontSize: 11, color: '#9ca3af', textAlign: 'center' },

  tareButton:      { margin: 16, backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center' },
  tareButtonText:  { color: '#fff', fontSize: 16, fontWeight: '600' },
});
