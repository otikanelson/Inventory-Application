import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { TourOverlay } from '../components/TourOverlay';
import { ThemeProvider } from '../context/ThemeContext';
import { TourProvider } from '../context/TourContext';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TourProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="alerts" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="product/[id]" />
          </Stack>
          <TourOverlay />
          <Toast />
        </TourProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}