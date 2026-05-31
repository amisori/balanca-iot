import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';

// ===== Auth =====

export async function signInAnonymously() {
  const { user } = await auth().signInAnonymously();
  return user;
}

export function getCurrentUser() {
  return auth().currentUser;
}

// ===== Realtime data =====

/**
 * Assina atualizações em tempo real da balança.
 * @param {function} onData - callback com os dados
 * @returns {function} unsubscribe
 */
export function subscribeRealtime(onData) {
  const ref = database().ref('/scale/realtime');
  const handler = ref.on('value', snap => {
    if (snap.exists()) onData(snap.val());
  });
  return () => ref.off('value', handler);
}

/**
 * Busca histórico dos últimos N minutos.
 * @param {number} limitCount
 */
export async function fetchHistory(limitCount = 100) {
  const snap = await database()
    .ref('/scale/history')
    .orderByKey()
    .limitToLast(limitCount)
    .once('value');

  if (!snap.exists()) return [];

  const entries = [];
  snap.forEach(child => {
    entries.push({ id: child.key, ...child.val() });
  });
  return entries.sort((a, b) => a.timestamp - b.timestamp);
}

// ===== Config =====

export async function setActiveProfile(profileIndex) {
  await database().ref('/scale/config/activeProfile').set(profileIndex);
}

export async function setAlertThreshold(percent) {
  await database().ref('/scale/config/alertThreshold').set(percent);
}

export async function sendTareCommand() {
  await database().ref('/scale/commands/tare').set(true);
}

// ===== FCM Push Notifications =====

export async function registerPushToken() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) return;

  const token = await messaging().getToken();
  if (token) {
    await database().ref('/scale/config/fcmToken').set(token);
  }
}
