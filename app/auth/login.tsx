import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PinInput } from '../../components/PinInput';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
  const { theme, isDark } = useTheme();
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'staff' | null>(null);
  const [pinError, setPinError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const backgroundImage = isDark
    ? require('../../assets/images/Background7.png')
    : require('../../assets/images/Background9.png');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handlePinComplete = async (pin: string) => {
    if (!selectedRole) return;

    setIsLoading(true);
    setPinError(false);

    const success = await login(pin, selectedRole);

    if (success) {
      router.replace('/(tabs)');
    } else {
      setPinError(true);
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: 'admin' | 'staff') => {
    setSelectedRole(role);
    setPinError(false);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setPinError(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Header */}
      <View style={[styles.headerCurve, { backgroundColor: theme.header }]}>
        <Text style={styles.headerTitle}>StockQ</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {!selectedRole ? (
          // Role Selection
          <>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: theme.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Enter your admin PIN to continue
            </Text>

            <View style={styles.roleButtons}>
              <Pressable
                style={[styles.roleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => handleRoleSelect('admin')}
              >
                <View style={[styles.roleIcon, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="shield-checkmark" size={28} color={theme.primary} />
                </View>
                <Text style={[styles.roleTitle, { color: theme.text }]}>Admin Login</Text>
                <Text style={[styles.roleDesc, { color: theme.subtext }]}>
                  Full access to all features
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          // PIN Entry
          <>
            <Pressable style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={theme.primary} />
            </Pressable>

            <View style={[styles.roleIconLarge, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons
                name={selectedRole === 'admin' ? 'shield-checkmark' : 'people'}
                size={48}
                color={theme.primary}
              />
            </View>

            <Text style={[styles.title, { color: theme.text }]}>
              {selectedRole === 'admin' ? 'Admin Login' : 'Staff Login'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Enter your 4-digit PIN
            </Text>

            <View style={styles.pinContainer}>
              <PinInput
                onComplete={handlePinComplete}
                error={pinError}
                disabled={isLoading}
                onClear={() => setPinError(false)}
              />
              {pinError && (
                <Text style={[styles.errorText, { color: theme.notification }]}>
                  Incorrect PIN. Please try again.
                </Text>
              )}
            </View>
          </>
        )}
      </View>

      {/* Footer */}
      {!selectedRole && (
        <View style={styles.footer}>
          <Pressable 
            style={styles.footerButton}
            onPress={() => router.push('/auth/setup' as any)}
          >
            <Text style={[styles.footerText, { color: theme.subtext }]}>
              First time here?{' '}
            </Text>
            <Text style={[styles.footerLink, { color: theme.primary }]}>
              Set up your account
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCurve: {
    height: 150,
    borderBottomLeftRadius: 1000,
    borderBottomRightRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    width: '130%',
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 80,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 40,
    textAlign: 'center',
  },
  roleButtons: {
    width: '100%',
    gap: 16,
  },
  roleCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  roleDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: -100,
    left: 0,
    padding: 10,
  },
  roleIconLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  pinContainer: {
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
