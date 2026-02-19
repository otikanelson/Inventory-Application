import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ImageBackground,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from "react-native";
import Toast from "react-native-toast-message";
import { useTheme } from "../../../context/ThemeContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function SecuritySettingsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  // PIN Update State
  const [showPinModal, setShowPinModal] = useState(false);
  const [showRemovePinModal, setShowRemovePinModal] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [removePinConfirm, setRemovePinConfirm] = useState("");

  // Security Settings State
  const [autoLogout, setAutoLogout] = useState(true);
  const [autoLogoutTime, setAutoLogoutTime] = useState(30); // minutes
  const [requirePinForDelete, setRequirePinForDelete] = useState(true);
  const [hasPin, setHasPin] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const pin = await AsyncStorage.getItem('admin_pin');
      const pinRequired = await AsyncStorage.getItem('admin_require_pin_delete');
      const logoutEnabled = await AsyncStorage.getItem('admin_auto_logout');
      const logoutTime = await AsyncStorage.getItem('admin_auto_logout_time');
      
      setHasPin(!!pin);
      if (pinRequired !== null) setRequirePinForDelete(pinRequired === 'true');
      if (logoutEnabled !== null) setAutoLogout(logoutEnabled === 'true');
      if (logoutTime !== null) setAutoLogoutTime(parseInt(logoutTime));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleRequirePinToggle = async (value: boolean) => {
    setRequirePinForDelete(value);
    try {
      await AsyncStorage.setItem('admin_require_pin_delete', value.toString());
      Toast.show({
        type: 'success',
        text1: 'Setting Updated',
        text2: `Login PIN ${value ? 'required' : 'not required'} for deletions`
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Please try again'
      });
    }
  };

  const handleAutoLogoutToggle = async (value: boolean) => {
    setAutoLogout(value);
    try {
      await AsyncStorage.setItem('admin_auto_logout', value.toString());
      Toast.show({
        type: 'success',
        text1: 'Setting Updated',
        text2: `Auto-logout ${value ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Please try again'
      });
    }
  };

  const handleAutoLogoutTimeChange = async (minutes: number) => {
    setAutoLogoutTime(minutes);
    try {
      await AsyncStorage.setItem('admin_auto_logout_time', minutes.toString());
      Toast.show({
        type: 'success',
        text1: 'Timeout Updated',
        text2: `Auto-logout set to ${minutes} minutes`
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Please try again'
      });
    }
  };

  const handleFirstTimeSetup = async () => {
    try {
      // Validate PIN format
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        Toast.show({
          type: 'error',
          text1: 'Invalid PIN',
          text2: 'PIN must be exactly 4 digits'
        });
        return;
      }

      // Validate confirmation
      if (newPin !== confirmPin) {
        Toast.show({
          type: 'error',
          text1: 'PIN Mismatch',
          text2: 'PINs do not match'
        });
        return;
      }

      // Get admin name from AsyncStorage or use default
      const adminName = await AsyncStorage.getItem('auth_user_name') || 'Admin';

      // Create admin user in database
      try {
        const response = await axios.post(`${API_URL}/auth/setup`, {
          name: adminName,
          pin: newPin
        });

        if (response.data.success) {
          const adminId = response.data.data.user.id;
          
          // Store admin data locally
          await AsyncStorage.multiSet([
            ['admin_pin', newPin],
            ['admin_first_setup', 'completed'],
            ['auth_user_id', adminId],
            ['auth_user_name', adminName],
            ['auth_user_role', 'admin']
          ]);
          
          setHasPin(true);
          
          Toast.show({
            type: 'success',
            text1: 'Login PIN Created',
            text2: 'Admin Login PIN has been set successfully'
          });

          setShowPinModal(false);
          setOldPin("");
          setNewPin("");
          setConfirmPin("");
        }
      } catch (apiError: any) {
        console.log('API setup failed, using local storage only:', apiError.message);
        
        // Fallback to local storage only if API fails
        await AsyncStorage.setItem('admin_pin', newPin);
        await AsyncStorage.setItem('admin_first_setup', 'completed');
        
        setHasPin(true);
        
        Toast.show({
          type: 'success',
          text1: 'Login PIN Created',
          text2: 'Admin Login PIN has been set successfully (local only)'
        });

        setShowPinModal(false);
        setOldPin("");
        setNewPin("");
        setConfirmPin("");
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Setup Failed',
        text2: 'Please try again'
      });
    }
  };

  const handleRemovePin = async () => {
    try {
      const storedPin = await AsyncStorage.getItem('admin_pin');
      
      if (!storedPin) {
        Toast.show({
          type: 'error',
          text1: 'No Login PIN Set',
          text2: 'There is no Admin Login PIN to remove'
        });
        setShowRemovePinModal(false);
        return;
      }

      if (removePinConfirm !== storedPin) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Failed',
          text2: 'Incorrect PIN'
        });
        return;
      }

      // Remove PIN from storage
      await AsyncStorage.removeItem('admin_pin');
      await AsyncStorage.removeItem('admin_first_setup');
      
      setHasPin(false);
      
      Toast.show({
        type: 'success',
        text1: 'Login PIN Removed',
        text2: 'Admin dashboard access is now unrestricted'
      });

      setShowRemovePinModal(false);
      setRemovePinConfirm("");
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Removal Failed',
        text2: 'Please try again'
      });
    }
  };

  const handlePinUpdate = async () => {
    try {
      // Get stored PIN - NO DEFAULT VALUE
      const storedPin = await AsyncStorage.getItem('admin_pin');
      
      if (!storedPin) {
        Toast.show({
          type: 'error',
          text1: 'No Login PIN Set',
          text2: 'Please set up your Admin Login PIN first'
        });
        return;
      }
      
      // Validate old PIN
      if (oldPin !== storedPin) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Failed',
          text2: 'Current PIN is incorrect'
        });
        return;
      }

      // Validate new PIN format
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        Toast.show({
          type: 'error',
          text1: 'Invalid PIN',
          text2: 'PIN must be exactly 4 digits'
        });
        return;
      }

      // Validate confirmation
      if (newPin !== confirmPin) {
        Toast.show({
          type: 'error',
          text1: 'PIN Mismatch',
          text2: 'New PIN and confirmation do not match'
        });
        return;
      }

      // Try to update in database first
      try {
        const response = await axios.put(`${API_URL}/auth/admin/pin`, {
          oldPin: oldPin,
          newPin: newPin
        });

        if (response.data.success) {
          // Update local storage
          await AsyncStorage.setItem('admin_pin', newPin);
          
          Toast.show({
            type: 'success',
            text1: 'Login PIN Updated',
            text2: 'Admin Login PIN has been changed successfully'
          });

          setShowPinModal(false);
          setOldPin("");
          setNewPin("");
          setConfirmPin("");
        }
      } catch (apiError: any) {
        console.log('API update failed, using local storage only:', apiError.message);
        
        // Fallback to local storage only
        await AsyncStorage.setItem('admin_pin', newPin);
        
        Toast.show({
          type: 'success',
          text1: 'Login PIN Updated',
          text2: 'Admin Login PIN has been changed successfully (local only)'
        });

        setShowPinModal(false);
        setOldPin("");
        setNewPin("");
        setConfirmPin("");
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Please try again'
      });
    }
  };

  const backgroundImage = isDark
    ? require("../../../assets/images/Background7.png")
    : require("../../../assets/images/Background9.png");

  const SettingRow = ({ icon, label, description, onPress, children }: any) => {
    const row = (
      <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
        <View style={styles.settingMain}>
          <View style={[styles.iconBox, { backgroundColor: theme.primary + "15" }]}>
            <Ionicons name={icon} size={20} color={theme.primary} />
          </View>
          <View style={styles.textStack}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              {label}
            </Text>
            {description && (
              <Text style={[styles.settingDesc, { color: theme.subtext }]}>
                {description}
              </Text>
            )}
          </View>
        </View>
        {children}
      </View>
    );

    if (onPress) {
      return (
        <Pressable onPress={onPress} android_ripple={{ color: theme.primary + "25" }}>
          {row}
        </Pressable>
      );
    }

    return row;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <Pressable 
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </Pressable>
          <View>
            <Text style={[styles.headerSub, { color: theme.primary }]}>
              ADMIN_SETTINGS
            </Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              SECURITY
            </Text>
          </View>
        </View>

        {/* SECURITY SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              PIN MANAGEMENT
            </Text>
            {!hasPin && (
              <View style={[styles.statusBadge, { backgroundColor: '#FF9500' + '15', borderColor: '#FF9500' }]}>
                <Ionicons name="alert-circle" size={14} color="#FF9500" />
                <Text style={[styles.statusBadgeText, { color: '#FF9500' }]}>
                  NO PIN SET
                </Text>
              </View>
            )}
            {hasPin && (
              <View style={[styles.statusBadge, { backgroundColor: '#34C759' + '15', borderColor: '#34C759' }]}>
                <Ionicons name="shield-checkmark" size={14} color="#34C759" />
                <Text style={[styles.statusBadgeText, { color: '#34C759' }]}>
                  PROTECTED
                </Text>
              </View>
            )}
          </View>

          <SettingRow
            icon="log-in-outline"
            label={hasPin ? "Update Admin Login PIN" : "Set Admin Login PIN"}
            description="Access admin dashboard"
            onPress={() => setShowPinModal(true)}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </SettingRow>

          <SettingRow
            icon="shield-outline"
            label="Admin Security PIN"
            description="Required for registering new products"
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Coming Soon',
                text2: 'Security PIN management will be available in the next update'
              });
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </SettingRow>

          {hasPin && (
            <SettingRow
              icon="lock-open-outline"
              label="Remove Login PIN"
              description="Disable PIN protection"
              onPress={() => setShowRemovePinModal(true)}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
            </SettingRow>
          )}

          {!hasPin && (
            <View style={[styles.warningBanner, { backgroundColor: '#FF9500' + '15', borderColor: '#FF9500' }]}>
              <Ionicons name="warning-outline" size={20} color="#FF9500" />
              <Text style={[styles.warningText, { color: '#FF9500' }]}>
                No Admin Login PIN set. Anyone can access admin dashboard.
              </Text>
            </View>
          )}
        </View>

        {/* AUTO-LOGOUT SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primary, marginBottom: 15 }]}>
            SESSION MANAGEMENT
          </Text>

          <SettingRow
            icon="shield-checkmark-outline"
            label="Require Login PIN for Delete"
            description="Ask for PIN before deleting products"
          >
            <Switch
              value={requirePinForDelete}
              onValueChange={handleRequirePinToggle}
              trackColor={{ true: theme.primary }}
              disabled={!hasPin}
            />
          </SettingRow>

          <SettingRow
            icon="time-outline"
            label="Auto-Logout"
            description={`End session after ${autoLogoutTime} minutes of inactivity`}
          >
            <Switch
              value={autoLogout}
              onValueChange={handleAutoLogoutToggle}
              trackColor={{ true: theme.primary }}
            />
          </SettingRow>

          {autoLogout && (
            <View style={[styles.timeoutSelector, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.timeoutLabel, { color: theme.text }]}>Auto-logout Time</Text>
              <View style={styles.timeoutButtons}>
                <Pressable
                  style={[
                    styles.timeoutBtn,
                    { backgroundColor: autoLogoutTime === 30 ? theme.primary : theme.surface, borderColor: theme.border }
                  ]}
                  onPress={() => handleAutoLogoutTimeChange(30)}
                >
                  <Text style={[styles.timeoutBtnText, { color: autoLogoutTime === 30 ? '#FFF' : theme.text }]}>
                    30 min
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.timeoutBtn,
                    { backgroundColor: autoLogoutTime === 45 ? theme.primary : theme.surface, borderColor: theme.border }
                  ]}
                  onPress={() => handleAutoLogoutTimeChange(45)}
                >
                  <Text style={[styles.timeoutBtnText, { color: autoLogoutTime === 45 ? '#FFF' : theme.text }]}>
                    45 min
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.timeoutBtn,
                    { backgroundColor: autoLogoutTime === 60 ? theme.primary : theme.surface, borderColor: theme.border }
                  ]}
                  onPress={() => handleAutoLogoutTimeChange(60)}
                >
                  <Text style={[styles.timeoutBtnText, { color: autoLogoutTime === 60 ? '#FFF' : theme.text }]}>
                    60 min
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* PIN UPDATE MODAL */}
      <Modal visible={showPinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconBox, { backgroundColor: theme.primary + "15" }]}>
              <Ionicons name="key" size={32} color={theme.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {hasPin ? "Update Admin Login PIN" : "Set Admin Login PIN"}
            </Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>
              {hasPin 
                ? "Enter current PIN and choose a new 4-digit code."
                : "Create a 4-digit PIN to access the admin dashboard."
              }
            </Text>

            {hasPin && (
              <TextInput
                style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Current PIN"
                placeholderTextColor={theme.subtext}
                secureTextEntry
                keyboardType="numeric"
                maxLength={4}
                value={oldPin}
                onChangeText={setOldPin}
              />
            )}

            <TextInput
              style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder={hasPin ? "New PIN" : "Enter PIN"}
              placeholderTextColor={theme.subtext}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={newPin}
              onChangeText={setNewPin}
            />

            <TextInput
              style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Confirm PIN"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={confirmPin}
              onChangeText={setConfirmPin}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => {
                  setShowPinModal(false);
                  setOldPin("");
                  setNewPin("");
                  setConfirmPin("");
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={hasPin ? handlePinUpdate : handleFirstTimeSetup}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>
                  {hasPin ? "UPDATE PIN" : "CREATE PIN"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* REMOVE PIN MODAL */}
      <Modal visible={showRemovePinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconBox, { backgroundColor: '#FF4444' + "15" }]}>
              <Ionicons name="warning" size={32} color="#FF4444" />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Remove Admin Login PIN
            </Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>
              Warning: Removing the PIN allows unrestricted admin access.
            </Text>

            <TextInput
              style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Enter Current PIN to Confirm"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={removePinConfirm}
              onChangeText={setRemovePinConfirm}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => {
                  setShowRemovePinModal(false);
                  setRemovePinConfirm("");
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: '#FF4444' }]}
                onPress={handleRemovePin}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Remove PIN</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { 
    marginTop: 70, 
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSub: { fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  headerTitle: { fontSize: 25, fontWeight: "900", letterSpacing: -1 },
  section: { marginBottom: 50 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingMain: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textStack: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: "600" },
  settingDesc: { fontSize: 12, marginTop: 2 },
  timeoutSelector: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  timeoutLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  timeoutButtons: {
    flexDirection: "row",
    gap: 10,
  },
  timeoutBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  timeoutBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    padding: 30,
    borderRadius: 30,
    alignItems: "center",
  },
  modalIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: "900", marginBottom: 10, textAlign: "center" },
  modalDesc: { fontSize: 14, textAlign: "center", marginBottom: 25, lineHeight: 20 },
  pinInput: {
    width: "100%",
    height: 55,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 10, width: "100%" },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
});
