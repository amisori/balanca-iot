import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import HomeScreen   from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ConfigScreen from './src/screens/ConfigScreen';

import { signInAnonymously, registerPushToken } from './src/services/firebase';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }) {
  const icons = { Home: 'Casa', Historico: 'Lista', Config: 'Config' };
  return (
    <Text style={{ fontSize: 10, color: focused ? '#3b82f6' : '#9ca3af', fontWeight: focused ? '700' : '400' }}>
      {icons[name] || name}
    </Text>
  );
}

export default function App() {
  useEffect(() => {
    signInAnonymously().then(() => registerPushToken()).catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
            tabBarActiveTintColor: '#3b82f6',
            tabBarInactiveTintColor: '#9ca3af',
            tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb' },
          })}
        >
          <Tab.Screen name="Home"      component={HomeScreen}    options={{ title: 'Balanca' }} />
          <Tab.Screen name="Historico" component={HistoryScreen} options={{ title: 'Historico' }} />
          <Tab.Screen name="Config"    component={ConfigScreen}  options={{ title: 'Config' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
