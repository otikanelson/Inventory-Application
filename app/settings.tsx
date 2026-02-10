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
import { useTheme } from "../context/ThemeContext";
import { useTour } from "../context/TourContext";
import { useAlerts } from "../hooks/useAlerts";

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const { settings: alertSettings, updateSettings } = useAlerts();
  const { resetTour, startTour } = useTour();

  const backgroundImage = isDark
    ? require("../assets/images/Background7.png")
    : require("../assets/images/Background9.png");

  // Local state for system settings
  const [apiUrl, setApiUrl] = useState(process.env.EXPO_PUBLIC_API_URL || "");
  const [rapidScan, setRapidScan] = useState(true);

  // Alert threshold state
  const [thresholds, setThresholds] = useState({
    critical: 7,
    highUrgency: 14,
    earlyWarning: 30
  });

  // Load rapid scan setting from AsyncStorage
  useEffect(() => {
    loadRapidScanSetting();
  }, []);

  const loadRapidScanSetting = async () => {
    try {
      const saved = await AsyncStorage.getItem('rapid_scan_enabled');
      if (saved !== null) {
        setRapidScan(saved === 'true');
      }
    } catch (error) {
      console.error('Error loading rapid scan setting:', error);
    }
  };

  const handleRapidScanToggle = async (value: boolean) => {
    setRapidScan(value);
    try {
      await AsyncStorage.setItem('rapid_scan_enabled', value.toString());
      Toast.show({
        type: 'success',
        text1: 'Setting Updated',
        text2: `Rapid scan ${value ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not save setting'
      });
    }
  };

  // Load alert settings when they become available
  useEffect(() => {
    if (alertSettings?.thresholds) {
      setThresholds({
        critical: alertSettings.thresholds.critical || 7,
        highUrgency: alertSettings.thresholds.highUrgency || 14,
        earlyWarning: alertSettings.thresholds.earlyWarning || 30
      });
    }
  }, [alertSettings]);

  // Admin Login State
  const [pinModal, setPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [hasAdminPin, setHasAdminPin] = useState(false);

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

  const handleSaveConfig = () => {
    Toast.show({
      type: 'success',
      text1: 'Configuration Saved',
      text2: 'The API endpoint has been updated for this session.'
    });
  };

  // Save alert thresholds
  const handleSaveThresholds = async () => {
    // Validate threshold ordering
    if (thresholds.critical >= thresholds.highUrgency) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Configuration',
        text2: 'Critical must be less than High Urgency'
      });
      return;
    }

    if (thresholds.highUrgency >= thresholds.earlyWarning) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Configuration',
        text2: 'High Urgency must be less than Early Warning'
      });
      return;
    }

    const result = await updateSettings({ thresholds });

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Settings Saved',
        text2: 'Alert thresholds updated successfully'
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Could not update settings'
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

      {/* SCANNER SECTION */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          SCANNER
        </Text>
        <SettingRow
          icon="scan-outline"
          label="Rapid Scan Mode"
          description="Faster scanning with reduced validation"
        >
          <Switch
            value={rapidScan}
            onValueChange={handleRapidScanToggle}
            trackColor={{ true: theme.primary }}
          />
        </SettingRow>
      </View>

      {/* HELP & SUPPORT SECTION */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          HELP & SUPPORT
        </Text>
        <SettingRow
          icon="help-circle-outline"
          label="Restart App Tour"
          description="See the onboarding tour again to learn about all features"
          onPress={async () => {
            try {
              await resetTour();
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

      {/* ALERTS CONFIGURATION */}
      <View style={[styles.section, {marginBottom: 0}]}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          ALERTS CONFIGURATION
        </Text>

        <View
          style={[
            styles.configCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Expiry Thresholds
          </Text>
          <Text style={[styles.cardDesc, { color: theme.subtext }]}>
            Configure when alerts trigger based on days until expiration
          </Text>

          {/* Critical Alert */}
          <View style={styles.thresholdRow}>
            <View style={styles.thresholdInfo}>
              <View style={[styles.thresholdDot, { backgroundColor: "#FF3B30" }]} />
              <View style={styles.thresholdTextContainer}>
                <Text style={[styles.thresholdLabel, { color: theme.text }]}>
                  Critical Alert
                </Text>
                <Text style={[styles.thresholdDesc, { color: theme.subtext }]}>
                  Immediate action required
                </Text>
              </View>
            </View>
            <View style={styles.thresholdInput}>
              <TextInput
                style={[
                  styles.numberInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                ]}
                keyboardType="numeric"
                value={thresholds.critical.toString()}
                onChangeText={(val) =>
                  setThresholds({ ...thresholds, critical: parseInt(val) || 0 })
                }
              />
              <Text style={[styles.thresholdUnit, { color: theme.subtext }]}>
                days
              </Text>
            </View>
          </View>

          {/* High Urgency Alert */}
          <View style={styles.thresholdRow}>
            <View style={styles.thresholdInfo}>
              <View style={[styles.thresholdDot, { backgroundColor: "#FF9500" }]} />
              <View style={styles.thresholdTextContainer}>
                <Text style={[styles.thresholdLabel, { color: theme.text }]}>
                  High Urgency
                </Text>
                <Text style={[styles.thresholdDesc, { color: theme.subtext }]}>
                  Prioritize for sale
                </Text>
              </View>
            </View>
            <View style={styles.thresholdInput}>
              <TextInput
                style={[
                  styles.numberInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                ]}
                keyboardType="numeric"
                value={thresholds.highUrgency.toString()}
                onChangeText={(val) =>
                  setThresholds({ ...thresholds, highUrgency: parseInt(val) || 0 })
                }
              />
              <Text style={[styles.thresholdUnit, { color: theme.subtext }]}>
                days
              </Text>
            </View>
          </View>

          {/* Early Warning Alert */}
          <View style={[styles.thresholdRow, { borderBottomWidth: 0 }]}>
            <View style={styles.thresholdInfo}>
              <View style={[styles.thresholdDot, { backgroundColor: "#FFD60A" }]} />
              <View style={styles.thresholdTextContainer}>
                <Text style={[styles.thresholdLabel, { color: theme.text }]}>
                  Early Warning
                </Text>
                <Text style={[styles.thresholdDesc, { color: theme.subtext }]}>
                  Plan ahead
                </Text>
              </View>
            </View>
            <View style={styles.thresholdInput}>
              <TextInput
                style={[
                  styles.numberInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                ]}
                keyboardType="numeric"
                value={thresholds.earlyWarning.toString()}
                onChangeText={(val) =>
                  setThresholds({ ...thresholds, earlyWarning: parseInt(val) || 0 })
                }
              />
              <Text style={[styles.thresholdUnit, { color: theme.subtext }]}>
                days
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            onPress={handleSaveThresholds}
          >
            <Text style={styles.saveBtnText}>SAVE THRESHOLDS</Text>
          </Pressable>
        </View>
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
              <TextInput
                style={[
                  styles.pinInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                ]}
                placeholder="Enter PIN"
                placeholderTextColor={theme.subtext}
                secureTextEntry
                keyboardType="numeric"
                maxLength={4}
                value={pin}
                onChangeText={setPin}
                autoFocus
              />
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
  configCard: { padding: 20, borderRadius: 20, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  cardDesc: { fontSize: 12, marginBottom: 20, lineHeight: 18 },
  thresholdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150,150,150,0.1)",
  },
  thresholdInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  thresholdDot: { width: 12, height: 12, borderRadius: 6 },
  thresholdTextContainer: { flex: 1 },
  thresholdLabel: { fontSize: 14, fontWeight: "700" },
  thresholdDesc: { fontSize: 11, marginTop: 2 },
  thresholdInput: { flexDirection: "row", alignItems: "center", gap: 8 },
  numberInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  thresholdUnit: { fontSize: 12, fontWeight: "600" },
  saveBtn: {
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  saveBtnText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
  apiInput: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 15,
  },
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