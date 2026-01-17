import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="alerts" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <Toast />
      </ThemeProvider>
    </ErrorBoundary>
  );
}