import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { fetchHistory } from '../services/firebase';

function formatDate(timestamp) {
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getRowColor(pct) {
  if (pct > 50) return '#dcfce7';
  if (pct > 20) return '#fef9c3';
  return '#fee2e2';
}

export default function HistoryScreen() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const entries = await fetchHistory(200);
      setData(entries.reverse()); // mais recentes primeiro
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  if (error) {
    return <View style={styles.center}><Text style={styles.err}>{error}</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historico de Leituras</Text>
      <Text style={styles.subtitle}>{data.length} registros</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>Data/Hora</Text>
        <Text style={styles.th}>Liq.(kg)</Text>
        <Text style={styles.th}>%</Text>
        <Text style={styles.th}>Status</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: getRowColor(item.percentage) }]}>
            <Text style={[styles.td, { flex: 2, fontSize: 11 }]}>{formatDate(item.timestamp)}</Text>
            <Text style={styles.td}>{(item.netKg ?? 0).toFixed(2)}</Text>
            <Text style={styles.td}>{(item.percentage ?? 0).toFixed(1)}%</Text>
            <Text style={[styles.td, { color: item.status === 'low' ? '#dc2626' : '#16a34a' }]}>
              {item.status === 'low' ? 'Baixo' : 'OK'}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}><Text style={styles.empty}>Nenhum registro encontrado.</Text></View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f9fafb', paddingTop: 48 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title:       { fontSize: 20, fontWeight: 'bold', color: '#111827', paddingHorizontal: 16 },
  subtitle:    { fontSize: 12, color: '#6b7280', paddingHorizontal: 16, marginBottom: 12 },
  err:         { color: '#dc2626' },
  empty:       { color: '#9ca3af' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#e5e7eb', paddingVertical: 8, paddingHorizontal: 8 },
  th:          { flex: 1, fontSize: 11, fontWeight: '700', color: '#374151', textAlign: 'center' },
  row:         { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  td:          { flex: 1, fontSize: 12, color: '#374151', textAlign: 'center' },
});
