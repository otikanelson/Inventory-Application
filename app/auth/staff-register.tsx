import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View} from 'react-native';
import Toast from 'react-native-toast-message';
import { PinInput } from '../../components/PinInput';
import { useTheme } from '../../context/ThemeContext';

type RegistrationStep = 'name' | 'pin' | 'complete';

export default function StaffRegisterScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<RegistrationStep>('name');
  const [staffName, setStaffName] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isFirstPin, setIsFirstPin] = useState(true);
  const [pinKey, setPinKey] = useState(0); // Key to force PinInput reset

  const handlePinComplete = async (pin: string) => {
    if (isFirstPin) {
      setStaffPin(pin);
      setIsFirstPin(false);
      setPinError(false);
      setPinKey(prev => prev + 1); // Force PinInput to reset
    } else {
      setConfirmPin(pin);
      
      if (pin === staffPin) {
        // Save staff credentials to backend and local storage
        try {
          const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
          
          console.log('=== STAFF REGISTRATION DEBUG ===');
          console.log('1. API_URL:', API_URL);
          console.log('2. Staff Name:', staffName);
          console.log('3. PIN:', '****');
          
          // Get admin ID for createdBy field
          const adminId = await AsyncStorage.getItem('auth_user_id');
          console.log('4. Admin ID:', adminId);
          
          const requestData = {
            name: staffName,
            pin: pin,
            createdBy: adminId
          };
          console.log('5. Request Data:', { ...requestData, pin: '****' });
          
          // Create staff user in backend
          console.log('6. Sending POST request to:', `${API_URL}/auth/staff`);
          const response = await axios.post(`${API_URL}/auth/staff`, requestData);
          console.log('7. Response Status:', response.status);
          console.log('8. Response Data:', response.data);

          if (response.data.success) {
            const staffId = response.data.data.user.id;
            console.log('9. Staff ID from response:', staffId);
            
            // Also save to local storage as fallback
            await AsyncStorage.multiSet([
              ['auth_staff_pin', pin],
              ['auth_staff_id', staffId],
              ['auth_staff_name', staffName],
            ]);
            console.log('10. Saved to AsyncStorage');

            Toast.show({
              type: 'success',
              text1: 'Staff Added',
              text2: `${staffName} has been registered successfully`,
            });

            setStep('complete');
            console.log('11. Registration complete!');
          } else {
            console.error('12. Backend returned unsuccessful response:', response.data);
            throw new Error('Backend returned unsuccessful response');
          }
        } catch (error: any) {
          let errorMessage = 'Could not create staff account';
          
          try {
            if (error.response) {
              // Server responded with error
              const status = error.response.status;
              const serverError = error.response.data?.error;
              
              if (status === 401) {
                errorMessage = 'Authentication failed - please log in again';
              } else if (status === 403) {
                errorMessage = 'You do not have permission to add staff';
              } else if (status === 400) {
                // Validation errors like duplicate PIN - don't log, just show message
                errorMessage = serverError || 'Invalid staff information';
              } else if (status >= 500) {
                errorMessage = 'Server error - please try again later';
                console.error('Staff registration server error:', status);
              } else {
                errorMessage = serverError || errorMessage;
              }
            } else if (error.code === 'ECONNABORTED') {
              errorMessage = 'Connection timeout - please check your internet';
            } else if (error.code === 'ERR_NETWORK' || !error.response) {
              errorMessage = 'Network error - please check your connection';
            } else if (error.message) {
              errorMessage = error.message;
            }
          } catch (parseError) {
            // Silently handle parsing errors
          }
          
          Toast.show({
            type: 'error',
            text1: 'Registration Failed',
            text2: errorMessage,
            visibilityTime: 4000,
          });
          
          // Reset on error
          setPinError(true);
          setIsFirstPin(true);
          setStaffPin('');
          setConfirmPin('');
          setPinKey(prev => prev + 1);
        }
      } else {
        setPinError(true);
        setIsFirstPin(true);
        setStaffPin('');
        setConfirmPin('');
        setPinKey(prev => prev + 1); // Force PinInput to reset
      }
    }
  };

  const handleContinue = () => {
    if (step === 'name') {
      if (!staffName.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Name Required',
          text2: 'Please enter staff member name',
        });
        return;
      }
      setStep('pin');
    } else if (step === 'complete') {
      router.replace('/admin/settings' as any);
    }
  };

  const handleBack = () => {
    if (step === 'pin') {
      setStep('name');
      setIsFirstPin(true);
      setStaffPin('');
      setConfirmPin('');
      setPinError(false);
      setPinKey(prev => prev + 1);
    } else {
      router.replace('/admin/settings' as any);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Add Staff Member
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === 'name' && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="person-add" size={48} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>
                Staff Information
              </Text>
              <Text style={[styles.subtitle, { color: theme.subtext }]}>
                Enter the name of the staff member
              </Text>

              <TextInput
                style={[
                  styles.nameInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
                ]}
                placeholder="Staff member name"
                placeholderTextColor={theme.subtext}
                value={staffName}
                onChangeText={setStaffName}
                autoFocus
              />

              <View style={[styles.infoCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}>
                <Ionicons name="information-circle" size={20} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.text }]}>
                  Staff members can manage inventory, add products, and process sales but cannot access admin settings.
                </Text>
              </View>
            </>
          )}

          {step === 'pin' && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="key" size={48} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>
                {isFirstPin ? 'Create Staff PIN' : 'Confirm PIN'}
              </Text>
              <Text style={[styles.subtitle, { color: theme.subtext }]}>
                {isFirstPin
                  ? 'Choose a 4-digit PIN for this staff member'
                  : 'Enter the PIN again to confirm'}
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
                      setStaffPin('');
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

              <View style={[styles.warningCard, { backgroundColor: '#FF9500' + '10', borderColor: '#FF9500' }]}>
                <Ionicons name="warning" size={20} color="#FF9500" />
                <Text style={[styles.warningText, { color: theme.text }]}>
                  Make sure to share this PIN securely with the staff member. It cannot be recovered if lost.
                </Text>
              </View>
            </>
          )}

          {step === 'complete' && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: '#34C759' + '15' }]}>
                <Ionicons name="checkmark-circle" size={64} color="#34C759" />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>
                Staff Added!
              </Text>
              <Text style={[styles.subtitle, { color: theme.subtext }]}>
                {staffName} can now log in with their PIN
              </Text>

              <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.subtext }]}>Name:</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>{staffName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.subtext }]}>Role:</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>Staff</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.subtext }]}>PIN:</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>••••</Text>
                </View>
              </View>

              <View style={[styles.permissionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.permissionsTitle, { color: theme.text }]}>
                  Staff Permissions
                </Text>
                <View style={styles.permissionsList}>
                  <View style={styles.permissionItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    <Text style={[styles.permissionText, { color: theme.text }]}>
                      View inventory
                    </Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    <Text style={[styles.permissionText, { color: theme.text }]}>
                      Add products
                    </Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    <Text style={[styles.permissionText, { color: theme.text }]}>
                      Process sales
                    </Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    <Text style={[styles.permissionText, { color: theme.text }]}>
                      Scan barcodes
                    </Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    <Text style={[styles.permissionText, { color: theme.subtext }]}>
                      Access admin settings
                    </Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    <Text style={[styles.permissionText, { color: theme.subtext }]}>
                      Delete products
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Footer Button */}
        {(step === 'name' || step === 'complete') && (
          <View style={styles.footer}>
            <Pressable
              style={[styles.continueButton, { backgroundColor: theme.primary }]}
              onPress={handleContinue}
            >
              <Text style={styles.continueText}>
                {step === 'complete' ? 'Done' : 'Continue'}
              </Text>
              <Ionicons
                name={step === 'complete' ? 'checkmark' : 'arrow-forward'}
                size={20}
                color="#FFF"
              />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
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
  nameInput: {
    width: '100%',
    height: 55,
    borderWidth: 2,
    borderRadius: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  pinContainer: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  summaryCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  permissionsCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  permissionsTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  permissionsList: {
    gap: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 30,
    paddingVertical: 20,
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
