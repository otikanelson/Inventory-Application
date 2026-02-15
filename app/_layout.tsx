import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { TourOverlay } from '../components/TourOverlay';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { TourProvider } from '../context/TourContext';
// Import axios configuration to set up interceptors
import '../utils/axiosConfig';

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  useEffect(() => {
    checkFirstTimeSetup();
  }, []);

  const checkFirstTimeSetup = async () => {
    try {
      const setupComplete = await AsyncStorage.getItem('admin_first_setup');
      setIsFirstTime(!setupComplete);
    } catch (error) {
      console.error('Error checking first time setup:', error);
      setIsFirstTime(true);
    }
  };

  useEffect(() => {
    if (loading || isFirstTime === null) return;

    const inAuthGroup = segments[0] === 'auth';
    const inAuthorGroup = segments[0] === 'author';
    const isStaffRegister = segments[1] === 'staff-register';

    // Check if user is author
    const checkAuthorStatus = async () => {
      const isAuthor = await AsyncStorage.getItem('auth_is_author');
      return isAuthor === 'true';
    };

    checkAuthorStatus().then((isAuthor) => {
      // Skip first-time setup check for authors
      if (isAuthor && !inAuthorGroup) {
        router.replace('/author/dashboard' as any);
        return;
      }

      if (isFirstTime && !inAuthGroup) {
        // First time user - redirect to setup
        router.replace('/auth/setup' as any);
      } else if (!isFirstTime && !isAuthenticated && !inAuthGroup && !inAuthorGroup) {
        // Not first time but not authenticated - redirect to login
        router.replace('/auth/login' as any);
      } else if (isAuthenticated && inAuthGroup && !isStaffRegister) {
        // Authenticated but in auth screens (except staff-register) - redirect to app
        router.replace('/(tabs)');
      }
    });
  }, [isAuthenticated, segments, loading, isFirstTime]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/setup" />
        <Stack.Screen name="auth/staff-register" />
        <Stack.Screen name="author" options={{ headerShown: false }} />
      </Stack>
      <TourOverlay />
      <Toast />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TourProvider>
            <RootLayoutNav />
          </TourProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}