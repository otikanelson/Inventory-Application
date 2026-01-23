import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "expo-router";
import { useAlerts } from "../hooks/useAlerts";
import Toast from "react-native-toast-message";

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const { settings: alertSettings, updateSettings } = useAlerts();

  // Local state for system settings
  const [apiUrl, setApiUrl] = useState(process.env.EXPO_PUBLIC_API_URL || "");
  const [rapidScan, setRapidScan] = useState(true);

  // Alert threshold state
  const [thresholds, setThresholds] = useState({
    critical: 7,
    highUrgency: 14,
    earlyWarning: 30
  });

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

  const handleAdminAuth = () => {
    if (pin === "1234") {
      setPinModal(false);
      setPin("");
      router.push("../admin");
    } else {
      Alert.alert("Access Denied", "Incorrect Admin PIN");
    }
  };

  const handleSaveConfig = () => {
    Alert.alert(
      "Configuration Saved",
      "The API endpoint has been updated for this session."
    );
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
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Settings
        </Text>
        <Text style={[styles.headerSub, { color: theme.subtext }]}>
          System Configuration & Preferences
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
          description="Manage inventory, sales, and security"
          onPress={() => setPinModal(true)}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
        </SettingRow>
      </View>

      {/* Admin Login Modal */}
      <Modal visible={pinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Admin Login
            </Text>
            <TextInput
              style={[
                styles.pinInput,
                { color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Enter PIN"
              secureTextEntry
              keyboardType="numeric"
              value={pin}
              onChangeText={setPin}
            />
            <Pressable
              style={[
                styles.saveBtn,
                { backgroundColor: theme.primary, width: "100%" },
              ]}
              onPress={handleAdminAuth}
            >
              <Text style={styles.saveBtnText}>ACCESS DASHBOARD</Text>
            </Pressable>
            <Pressable
              onPress={() => setPinModal(false)}
              style={{ marginTop: 15 }}
            >
              <Text style={{ color: theme.subtext }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

            {/* OPERATIONS SECTION */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          OPERATIONS
        </Text>
        <SettingRow
          icon="barcode-outline"
          label="Rapid Scan"
          description="Skip confirmation modals after scanning"
        >
          <Switch
            value={rapidScan}
            onValueChange={setRapidScan}
            trackColor={{ true: theme.primary }}
          />
        </SettingRow>
      </View>

      {/* ALERT THRESHOLDS SECTION */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          ALERT THRESHOLDS
        </Text>

        <View
          style={[
            styles.configCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Multi-Threshold Configuration
          </Text>
          <Text style={[styles.cardDesc, { color: theme.subtext }]}>
            Configure when alerts are triggered based on days until expiry
          </Text>

          {/* Critical Threshold */}
          <View style={styles.thresholdRow}>
            <View style={styles.thresholdInfo}>
              <View style={[styles.thresholdDot, { backgroundColor: '#FF4444' }]} />
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
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }
                ]}
                value={String(thresholds.critical)}
                keyboardType="number-pad"
                maxLength={2}
                onChangeText={(val) =>
                  setThresholds({ ...thresholds, critical: parseInt(val) || 0 })
                }
              />
              <Text style={[styles.thresholdUnit, { color: theme.subtext }]}>
                days
              </Text>
            </View>
          </View>

          {/* High Urgency Threshold */}
          <View style={styles.thresholdRow}>
            <View style={styles.thresholdInfo}>
              <View style={[styles.thresholdDot, { backgroundColor: '#FF9500' }]} />
              <View style={styles.thresholdTextContainer}>
                <Text style={[styles.thresholdLabel, { color: theme.text }]}>
                  High Urgency
                </Text>
                <Text style={[styles.thresholdDesc, { color: theme.subtext }]}>
                  Close monitoring needed
                </Text>
              </View>
            </View>
            <View style={styles.thresholdInput}>
              <TextInput
                style={[
                  styles.numberInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }
                ]}
                value={String(thresholds.highUrgency)}
                keyboardType="number-pad"
                maxLength={2}
                onChangeText={(val) =>
                  setThresholds({ ...thresholds, highUrgency: parseInt(val) || 0 })
                }
              />
              <Text style={[styles.thresholdUnit, { color: theme.subtext }]}>
                days
              </Text>
            </View>
          </View>

          {/* Early Warning Threshold */}
          <View style={styles.thresholdRow}>
            <View style={styles.thresholdInfo}>
              <View style={[styles.thresholdDot, { backgroundColor: '#FFCC00' }]} />
              <View style={styles.thresholdTextContainer}>
                <Text style={[styles.thresholdLabel, { color: theme.text }]}>
                  Early Warning
                </Text>
                <Text style={[styles.thresholdDesc, { color: theme.subtext }]}>
                  Plan ahead for stock rotation
                </Text>
              </View>
            </View>
            <View style={styles.thresholdInput}>
              <TextInput
                style={[
                  styles.numberInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }
                ]}
                value={String(thresholds.earlyWarning)}
                keyboardType="number-pad"
                maxLength={2}
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

        <Text style={styles.versionText}>
          Build v2.0.4 - Production Environment
        </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 70, marginBottom: 30 },
  headerTitle: { fontSize: 32, fontWeight: "900" },
  headerSub: { fontSize: 14, marginTop: 4 },
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
  configCard: { padding: 15, borderRadius: 20, borderWidth: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 12,
    marginBottom: 20,
    lineHeight: 18,
  },
  thresholdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150,150,150,0.1)",
  },
  thresholdInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  thresholdDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  thresholdTextContainer: {
    flex: 1,
  },
  thresholdLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  thresholdDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  thresholdInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  numberInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  thresholdUnit: {
    fontSize: 12,
    fontWeight: "600",
  },
  inputLabel: { fontSize: 10, fontWeight: "800", marginBottom: 8 },
  input: {
    height: 45,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  saveBtn: {
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 20,
  },
  logoutText: { color: "#FF4444", fontWeight: "900", fontSize: 13 },
  versionText: {
    textAlign: "center",
    color: "#888",
    fontSize: 10,
    marginBottom: 25,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 30,
    borderRadius: 25,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 20 },
  pinInput: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    marginBottom: 20,
  },
});