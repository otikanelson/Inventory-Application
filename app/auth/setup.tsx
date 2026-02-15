import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { PinInput } from '../../components/PinInput';
import { useTheme } from '../../context/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

type SetupStep = 'welcome' | 'admin-name' | 'admin-pin' | 'complete';

export default function SetupScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>('welcome');
  const [adminName, setAdminName] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isFirstPin, setIsFirstPin] = useState(true);
  const [pinKey, setPinKey] = useState(0); // Key to force PinInput reset

  const backgroundImage = isDark
    ? require('../../assets/images/Background7.png')
    : require('../../assets/images/Background9.png');

  const handlePinComplete = async (pin: string) => {
    if (isFirstPin) {
      setAdminPin(pin);
      setIsFirstPin(false);
      setPinError(false);
      setPinKey(prev => prev + 1); // Force PinInput to reset
    } else {
      setConfirmPin(pin);
      
      if (pin === adminPin) {
        // Save admin credentials to backend and local storage
        try {
          console.log('=== ADMIN SETUP DEBUG ===');
          console.log('1. API_URL:', API_URL);
          console.log('2. Admin Name:', adminName);
          console.log('3. PIN:', '****');

          // Create admin user in backend
          console.log('4. Sending POST request to:', `${API_URL}/auth/setup`);
          const response = await axios.post(`${API_URL}/auth/setup`, {
            name: adminName || 'Admin',
            pin: pin
          });

          console.log('5. Response Status:', response.status);
          console.log('6. Response Data:', response.data);

          if (response.data.success) {
            const adminId = response.data.data.user.id;
            console.log('7. Admin ID from response:', adminId);

            // Also save to local storage
            await AsyncStorage.multiSet([
              ['admin_pin', pin],
              ['admin_first_setup', 'completed'],
              ['auth_user_name', adminName || 'Admin'],
              ['auth_user_id', adminId],
              ['auth_user_role', 'admin']
            ]);
            console.log('8. Saved to AsyncStorage');

            Toast.show({
              type: 'success',
              text1: 'Admin Created',
              text2: 'Your account has been set up successfully',
            });

            setStep('complete');
            console.log('9. Setup complete!');
          } else {
            console.error('10. Backend returned unsuccessful response:', response.data);
            throw new Error('Backend returned unsuccessful response');
          }
        } catch (error: any) {
          console.error('=== ADMIN SETUP ERROR ===');
          console.error('Error Type:', error.constructor.name);
          console.error('Error Message:', error.message);
          console.error('Error Response:', error.response?.data);
          console.error('Error Status:', error.response?.status);
          console.error('Full Error:', error);

          // Fallback to local storage only if API fails
          console.log('Falling back to local storage only');
          await AsyncStorage.multiSet([
            ['admin_pin', pin],
            ['admin_first_setup', 'completed'],
            ['auth_user_name', adminName || 'Admin'],
          ]);

          Toast.show({
            type: 'success',
            text1: 'Admin Created',
            text2: 'Account saved locally (offline mode)',
          });

          setStep('complete');
        }
      } else {
        setPinError(true);
        setIsFirstPin(true);
        setAdminPin('');
        setConfirmPin('');
        setPinKey(prev => prev + 1); // Force PinInput to reset
      }
    }
  };

  const handleContinue = () => {
    if (step === 'welcome') {
      setStep('admin-name');
    } else if (step === 'admin-name') {
      if (!adminName.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Name Required',
          text2: 'Please enter your name',
        });
        return;
      }
      setStep('admin-pin');
    } else if (step === 'complete') {
      router.replace('/auth/login' as any);
    }
  };

  const handleBack = () => {
    if (step === 'admin-name') {
      setStep('welcome');
    } else if (step === 'admin-pin') {
      setStep('admin-name');
      setIsFirstPin(true);
      setAdminPin('');
      setConfirmPin('');
      setPinError(false);
      setPinKey(prev => prev + 1);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
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
        {step !== 'welcome' && step !== 'complete' && (
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </Pressable>
        )}

        {step === 'welcome' && (
          <>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: theme.text }]}>
              Welcome to StockQ
            </Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Let's set up your admin account to get started
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>
                    Secure Access
                  </Text>
                  <Text style={[styles.featureDesc, { color: theme.subtext }]}>
                    Protect your inventory with PIN authentication
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="people" size={24} color={theme.primary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>
                    Staff Management
                  </Text>
                  <Text style={[styles.featureDesc, { color: theme.subtext }]}>
                    Add staff members with limited access
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="analytics" size={24} color={theme.primary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>
                    Full Control
                  </Text>
                  <Text style={[styles.featureDesc, { color: theme.subtext }]}>
                    Access all features and settings
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {step === 'admin-name' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="person" size={48} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              What's your name?
            </Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              This will be displayed in the app
            </Text>

            <TextInput
              style={[
                styles.nameInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
              ]}
              placeholder="Enter your name"
              placeholderTextColor={theme.subtext}
              value={adminName}
              onChangeText={setAdminName}
              autoFocus
            />
          </>
        )}

        {step === 'admin-pin' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="key" size={48} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              {isFirstPin ? 'Create Admin PIN' : 'Confirm PIN'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              {isFirstPin
                ? 'Choose a 4-digit PIN to secure your account'
                : 'Enter your PIN again to confirm'}
            </Text>

            <View style={styles.pinContainer}>
              <PinInput
                key={pinKey}
                onComplete={handlePinComplete}
                error={pinError}
                onClear={() => {
                  setPinError(false);
                  if (!isFirstPin) {
                    setIsFirstPin(true);
                    setAdminPin('');
                    setConfirmPin('');
                    setPinKey(prev => prev + 1);
                  }
                }}
              />
              {pinError && (
                <Text style={[styles.errorText, { color: theme.notification }]}>
                  PINs don't match. Please try again.
                </Text>
              )}
            </View>
          </>
        )}

        {step === 'complete' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: '#34C759' + '15' }]}>
              <Ionicons name="checkmark-circle" size={64} color="#34C759" />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              All Set!
            </Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Your admin account has been created successfully
            </Text>

            <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.subtext }]}>Name:</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{adminName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.subtext }]}>Role:</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>Admin</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.subtext }]}>PIN:</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>••••</Text>
              </View>
            </View>

            <View style={[styles.tipCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}>
              <Ionicons name="information-circle" size={20} color={theme.primary} />
              <Text style={[styles.tipText, { color: theme.text }]}>
                You can add staff members later from Admin Settings
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Footer Button */}
      {(step === 'welcome' || step === 'admin-name' || step === 'complete') && (
        <View style={styles.footer}>
          <Pressable
            style={[styles.continueButton, { backgroundColor: theme.primary }]}
            onPress={handleContinue}
          >
            <Text style={styles.continueText}>
              {step === 'complete' ? 'Go to Login' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
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
  },
  backButton: {
    position: 'absolute',
    top: -100,
    left: 0,
    padding: 10,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  featureList: {
    width: '100%',
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  nameInput: {
    width: '100%',
    height: 55,
    borderWidth: 2,
    borderRadius: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '600',
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
  infoCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
    marginTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  continueText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
});
