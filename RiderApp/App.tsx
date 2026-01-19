import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import './src/i18n/config'; // Initialize i18n

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LanguageProvider>
              <AppNavigator />
              <StatusBar style="auto" />
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
