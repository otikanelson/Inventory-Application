import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { AIStatusIndicator } from "../components/AIStatusIndicator";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTour } from "../context/TourContext";

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const { resetTour, startTour } = useTour();
  const { logout: authLogout } = useAuth();

  const backgroundImage = isDark
    ? require("../assets/images/Background7.png")
    : require("../assets/images/Background9.png");

  // Admin Login State
  const [pinModal, setPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [hasAdminPin, setHasAdminPin] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    checkAdminPinStatus();
  }, []);

  const checkAdminPinStatus = async () => {
    try {
      const adminPin = await AsyncStorage.getItem('admin_pin');
      setHasAdminPin(!!adminPin);
    } catch (error) {
      console.error('Error checking admin PIN:', error);
    }
  };

  const handleAdminAuth = async () => {
    try {
      const storedPin = await AsyncStorage.getItem('admin_pin');
      
      // If no PIN is set, allow entry but prompt them to set one
      if (!storedPin) {
        setPinModal(false);
        setPin("");
        
        Toast.show({
          type: 'info',
          text1: 'No PIN Set',
          text2: 'Please set up your admin PIN in Security settings'
        });
        
        router.push("../admin");
        return;
      }

      // Validate PIN if it exists
      if (pin === storedPin) {
        // Update last auth time
        await AsyncStorage.setItem('admin_last_auth', Date.now().toString());
        
        setPinModal(false);
        setPin("");
        router.push("../admin");
      } else {
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: 'Incorrect PIN'
        });
        setPin("");
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Could not verify credentials'
      });
    }
  };

  const SettingRow = ({ icon, label, children, description, onPress }: any) => {
    const row = (
      <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
        <View style={styles.settingMain}>
          <View
            style={[styles.iconBox, { backgroundColor: theme.primary + "15" }]}
          >
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

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerSub, { color: theme.primary }]}>
            SYSTEM_CONFIGURATION
          </Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            SETTINGS
          </Text>
        </View>

      {/* APPEARANCE SECTION */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          APPEARANCE
        </Text>
        <SettingRow
          icon="moon-outline"
          label="Dark Mode"
          description="Switch between light and dark themes"
        >
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ true: theme.primary }}
          />
        </SettingRow>
      </View>

      {/* ADMINISTRATION SECTION */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          ADMINISTRATION
        </Text>
        <SettingRow
          icon="person-circle-outline"
          label="My Profile"
          description="View your account details and permissions"
          onPress={() => router.push('/profile' as any)}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
        </SettingRow>
        <SettingRow
          icon="shield"
          label="Admin Dashboard"
          description={hasAdminPin ? "Manage inventory, sales, and security" : "Set up admin PIN to secure your dashboard"}
          onPress={() => setPinModal(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {!hasAdminPin && (
              <View style={[styles.badge, { backgroundColor: '#FF9500' + '20' }]}>
                <Text style={[styles.badgeText, { color: '#FF9500' }]}>SETUP REQUIRED</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </View>
        </SettingRow>
      </View>

      {/* HELP & SUPPORT SECTION */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          HELP & SUPPORT
        </Text>
        
        {/* AI Status Indicator */}
        <AIStatusIndicator onPress={() => router.push("/ai-info" as any)} />
        
        <SettingRow
          icon="pulse-outline"
          label="API Diagnostics"
          description="Test backend connectivity and view network status"
          onPress={() => router.push("/test-api" as any)}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
        </SettingRow>
        
        <SettingRow
          icon="log-out-outline"
          label="Logout from Store"
          description="Clear store data and return to setup page"
          onPress={async () => {
            try {
              // CRITICAL: Clear token FIRST to prevent API calls with invalid token
              await AsyncStorage.multiRemove([
                'auth_session_token',
                'auth_last_login',
                'auth_user_role',
                'auth_user_id',
                'auth_user_name',
                'auth_store_id',
                'auth_store_name',
                'admin_pin',
                'admin_first_setup',
                'admin_last_auth',
                'auth_is_author',
              ]);
              
              // Update auth context state
              await authLogout();
              
              // Navigate after clearing data
              router.replace('/auth/setup' as any);
              
              // Show toast after navigation
              setTimeout(() => {
                Toast.show({
                  type: 'success',
                  text1: 'Logged Out',
                  text2: 'Returning to setup...'
                });
              }, 100);
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Could not logout'
              });
            }
          }}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
        </SettingRow>
        
        <SettingRow
          icon="help-circle-outline"
          label="Restart App Tour"
          description="See the onboarding tour again to learn about all features"
          onPress={async () => {
            try {
              resetTour();
              Toast.show({
                type: 'success',
                text1: 'Tour Reset',
                text2: 'Go to Dashboard to see the tour again'
              });
              // Navigate to dashboard and start tour
              router.push('/');
              setTimeout(() => {
                startTour();
              }, 500);
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Could not reset tour'
              });
            }
          }}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
        </SettingRow>
      </View>

      <View style={{ height: 10 }} />

        <Text style={styles.versionText}>
          Build v2.0.5 - Production Environment
        </Text>
      </ScrollView>

      {/* Admin Login Modal */}
      <Modal visible={pinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <View style={[styles.modalIconBox, { backgroundColor: theme.primary + "15" }]}>
              <Ionicons name="shield-checkmark" size={32} color={theme.primary} />
            </View>
            
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {hasAdminPin ? "Admin Access" : "First Time Access"}
            </Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>
              {hasAdminPin 
                ? "Enter your admin PIN to continue"
                : "No PIN set yet. You'll be prompted to create one inside."
              }
            </Text>

            {hasAdminPin && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.pinInput,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                  placeholder="Enter PIN"
                  placeholderTextColor={theme.subtext}
                  secureTextEntry={!showPin}
                  keyboardType="numeric"
                  maxLength={4}
                  value={pin}
                  onChangeText={setPin}
                  autoFocus
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowPin(!showPin)}
                >
                  <Ionicons
                    name={showPin ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={theme.subtext}
                  />
                </Pressable>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={[
                  styles.modalBtn,
                  { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
                ]}
                onPress={() => {
                  setPinModal(false);
                  setPin("");
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={handleAdminAuth}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>
                  {hasAdminPin ? "VERIFY" : "CONTINUE"}
                </Text>
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
  header: { marginTop: 70, marginBottom: 30 },
  headerSub: { fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  headerTitle: { fontSize: 25, fontWeight: "900", letterSpacing: -1 },
  section: { marginBottom: 35 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 15,
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
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
  versionText: {
    textAlign: "center",
    color: "#888",
    fontSize: 10,
    marginBottom: 100,
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },
  inputContainer: {
    width: "100%",
    position: "relative",
    marginBottom: 15,
  },
  pinInput: {
    width: "100%",
    height: 55,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingRight: 50,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 16,
    padding: 5,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
});
