import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  
  // Use ref to track navigation without causing re-renders
  const hasNavigatedRef = useRef(false);
  const lastSegmentRef = useRef('');

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

  // Reset navigation flag when segments change (user manually navigated)
  useEffect(() => {
    const currentSegment = segments.join('/');
    if (currentSegment !== lastSegmentRef.current) {
      lastSegmentRef.current = currentSegment;
      hasNavigatedRef.current = false;
    }
  }, [segments.join('/')]);

  useEffect(() => {
    if (loading || isFirstTime === null || hasNavigatedRef.current) return;

    const inAuthGroup = segments[0] === 'auth';
    const inAuthorGroup = segments[0] === 'author';
    const isStaffRegister = segments[1] === 'staff-register';
    const isInSetup = segments[1] === 'setup';
    const isInLogin = segments[1] === 'login';

    // Check if user is author
    const checkAuthorStatus = async () => {
      const isAuthor = await AsyncStorage.getItem('auth_is_author');
      return isAuthor === 'true';
    };

    checkAuthorStatus().then((isAuthor) => {
      // Authors bypass all first-time setup checks
      if (isAuthor) {
        // Only redirect if not already in author group
        if (!inAuthorGroup) {
          hasNavigatedRef.current = true;
          router.replace('/author/dashboard' as any);
        }
        return;
      }

      // Regular user flow (admin/staff)
      // Priority 1: If authenticated, ensure they're in the app (not auth screens)
      if (isAuthenticated) {
        if (inAuthGroup && !isStaffRegister) {
          // Authenticated but in auth screens - redirect to app
          hasNavigatedRef.current = true;
          router.replace('/(tabs)');
        }
        return;
      }

      // Priority 2: Not authenticated - check if first time or returning user
      // CRITICAL: Don't redirect if already in auth screens (let user navigate freely)
      if (!inAuthGroup && !inAuthorGroup) {
        if (isFirstTime) {
          // First time user - redirect to setup
          hasNavigatedRef.current = true;
          router.replace('/auth/setup' as any);
        } else {
          // Returning user not authenticated - redirect to login
          hasNavigatedRef.current = true;
          router.replace('/auth/login' as any);
        }
      }
      // If already in auth screens (setup or login), don't interfere - let user navigate
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