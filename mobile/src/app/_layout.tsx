import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Prevent native splash screen from hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#999',
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '首页',
            tabBarIcon: ({ focused }) => (
              <Text style={styles.tabIcon}>{focused ? '🏠' : '🏡'}</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="rubrics"
          options={{
            title: '标准',
            tabBarIcon: ({ focused }) => (
              <Text style={styles.tabIcon}>{focused ? '📋' : '📄'}</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="essay"
          options={{
            title: '批改',
            tabBarIcon: ({ focused }) => (
              <Text style={styles.tabIcon}>{focused ? '✍️' : '📝'}</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '我的',
            tabBarIcon: ({ focused }) => (
              <Text style={styles.tabIcon}>{focused ? '👤' : '🧑'}</Text>
            ),
          }}
        />
      </Tabs>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
