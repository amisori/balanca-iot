import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ScrollView,
} from 'react-native';
import { setActiveProfile, setAlertThreshold, sendTareCommand } from '../services/firebase';

const PROFILES = [
  { id: 0, name: 'Botijao P13',  detail: '13kg gas / tara 13kg',  type: 'gas'   },
  { id: 1, name: 'Botijao P45',  detail: '45kg gas / tara 32kg',  type: 'gas'   },
  { id: 2, name: 'Galao 20L',    detail: '20kg agua / tara 2kg',  type: 'water' },
  { id: 3, name: 'Galao 10L',    detail: '10kg agua / tara 1kg',  type: 'water' },
];

export default function ConfigScreen() {
  const [selectedProfile, setSelectedProfile] = useState(0);
  const [threshold, setThreshold]             = useState('15');
  const [saving, setSaving]                   = useState(false);

  const saveConfig = async () => {
    const t = parseInt(threshold, 10);
    if (isNaN(t) || t < 5 || t > 50) {
      Alert.alert('Valor invalido', 'O limiar deve estar entre 5% e 50%.');
      return;
    }
    setSaving(true);
    try {
      await setActiveProfile(selectedProfile);
      await setAlertThreshold(t);
      Alert.alert('Salvo!', 'Configuracoes enviadas ao dispositivo.');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel salvar as configuracoes.');
    } finally {
      setSaving(false);
    }
  };

  const handleTare = () => {
    Alert.alert(
      'Confirmar Tara',
      'Remova todo peso da balanca antes de confirmar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tarar agora', onPress: () => sendTareCommand().catch(() => {}) },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Configuracoes</Text>

      {/* Selecao de perfil */}
      <Text style={styles.sectionLabel}>Tipo de Recipiente</Text>
      {PROFILES.map(p => (
        <TouchableOpacity
          key={p.id}
          style={[styles.profileCard, selectedProfile === p.id && styles.profileCardSelected]}
          onPress={() => setSelectedProfile(p.id)}
          testID={`profile-${p.id}`}
        >
          <View style={styles.profileIcon}>
            <Text style={styles.profileIconText}>{p.type === 'gas' ? 'Gas' : 'Agua'}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{p.name}</Text>
            <Text style={styles.profileDetail}>{p.detail}</Text>
          </View>
          {selectedProfile === p.id && (
            <Text style={styles.checkmark}>Selecionado</Text>
          )}
        </TouchableOpacity>
      ))}

      {/* Limiar de alerta */}
      <Text style={styles.sectionLabel}>Alerta de nivel baixo (%)</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={threshold}
          onChangeText={setThreshold}
          keyboardType="numeric"
          maxLength={2}
          testID="threshold-input"
        />
        <Text style={styles.inputSuffix}>%</Text>
      </View>
      <Text style={styles.hint}>Notificacao enviada quando nivel atingir esse percentual.</Text>

      {/* Botoes */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={saveConfig}
        disabled={saving}
        testID="save-button"
      >
        <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar Configuracoes'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tareBtn} onPress={handleTare} testID="tare-button">
        <Text style={styles.tareBtnText}>Tarar Balanca Remotamente</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#f9fafb', paddingTop: 48 },
  title:                { fontSize: 20, fontWeight: 'bold', color: '#111827', padding: 16 },
  sectionLabel:         { fontSize: 13, fontWeight: '600', color: '#6b7280', marginHorizontal: 16, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  profileCard:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, elevation: 1, borderWidth: 2, borderColor: 'transparent' },
  profileCardSelected:  { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  profileIcon:          { width: 44, height: 44, borderRadius: 22, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  profileIconText:      { fontSize: 10, color: '#1d4ed8', fontWeight: '700' },
  profileName:          { fontSize: 15, fontWeight: '600', color: '#111827' },
  profileDetail:        { fontSize: 12, color: '#6b7280', marginTop: 2 },
  checkmark:            { marginLeft: 'auto', fontSize: 11, color: '#3b82f6', fontWeight: '700' },

  inputRow:             { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16 },
  input:                { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', padding: 12, fontSize: 18, width: 80, textAlign: 'center' },
  inputSuffix:          { fontSize: 18, color: '#374151', marginLeft: 8 },
  hint:                 { fontSize: 12, color: '#9ca3af', marginHorizontal: 16, marginTop: 6 },

  saveBtn:              { margin: 16, marginTop: 24, backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnDisabled:      { backgroundColor: '#93c5fd' },
  saveBtnText:          { color: '#fff', fontSize: 16, fontWeight: '600' },

  tareBtn:              { marginHorizontal: 16, marginBottom: 32, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  tareBtnText:          { color: '#374151', fontSize: 15, fontWeight: '500' },
});
