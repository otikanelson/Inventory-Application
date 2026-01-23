import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Modal,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import { useAlerts } from "../../hooks/useAlerts";
import Toast from "react-native-toast-message";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminSettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const { settings: alertSettings, updateSettings } = useAlerts();

  // PIN Update State
  const [showPinModal, setShowPinModal] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // System Settings State
  const [autoLogout, setAutoLogout] = useState(true);
  const [requirePinForDelete, setRequirePinForDelete] = useState(true);
  const [enableBackup, setEnableBackup] = useState(false);

  // Alert threshold state (from useAlerts)
  const [thresholds, setThresholds] = useState({
    critical: alertSettings?.thresholds?.critical || 7,
    highUrgency: alertSettings?.thresholds?.highUrgency || 14,
    earlyWarning: alertSettings?.thresholds?.earlyWarning || 30
  });

  React.useEffect(() => {
    if (alertSettings?.thresholds) {
      setThresholds({
        critical: alertSettings.thresholds.critical || 7,
        highUrgency: alertSettings.thresholds.highUrgency || 14,
        earlyWarning: alertSettings.thresholds.earlyWarning || 30
      });
    }
  }, [alertSettings]);

  const handlePinUpdate = async () => {
    // Validate old PIN
    if (oldPin !== "1234") {
      Toast.show({
        type: 'error',
        text1: 'Authentication Failed',
        text2: 'Current PIN is incorrect'
      });
      return;
    }

    // Validate new PIN
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

    // In production, encrypt and store securely
    await AsyncStorage.setItem('admin_pin', newPin);
    
    Toast.show({
      type: 'success',
      text1: 'PIN Updated',
      text2: 'Admin PIN has been changed successfully'
    });

    setShowPinModal(false);
    setOldPin("");
    setNewPin("");
    setConfirmPin("");
  };

  const handleSaveThresholds = async () => {
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

  const handleLogout = async () => {
    await AsyncStorage.removeItem('admin_authenticated');
    await AsyncStorage.removeItem('admin_auth_time');
    router.replace("../(tabs)");
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
          Admin Settings
        </Text>
        <Text style={[styles.headerSub, { color: theme.subtext }]}>
          System Configuration & Security
        </Text>
      </View>

      {/* SECURITY SECTION */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          SECURITY
        </Text>
        
        <SettingRow
          icon="lock-closed"
          label="Update Admin PIN"
          description="Change your admin access PIN"
          onPress={() => setShowPinModal(true)}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
        </SettingRow>

        <SettingRow
          icon="shield-checkmark"
          label="Require PIN for Deletion"
          description="Extra security for product deletion"
        >
          <Switch
            value={requirePinForDelete}
            onValueChange={setRequirePinForDelete}
            trackColor={{ true: theme.primary }}
          />
        </SettingRow>

        <SettingRow
          icon="time"
          label="Auto-Logout"
          description="Automatically log out after 30 minutes"
        >
          <Switch
            value={autoLogout}
            onValueChange={setAutoLogout}
            trackColor={{ true: theme.primary }}
          />
        </SettingRow>
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

      {/* DATA MANAGEMENT */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          DATA MANAGEMENT
        </Text>

        <SettingRow
          icon="cloud-upload"
          label="Backup Data"
          description="Export inventory data to cloud"
        >
          <Switch
            value={enableBackup}
            onValueChange={setEnableBackup}
            trackColor={{ true: theme.primary }}
          />
        </SettingRow>

        <SettingRow
          icon="download"
          label="Export to CSV"
          description="Download inventory as CSV file"
          onPress={() => {
            Toast.show({
              type: 'info',
              text1: 'Feature Coming Soon',
              text2: 'CSV export will be available in next update'
            });
          }}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
        </SettingRow>
      </View>

      {/* LOGOUT */}
      <Pressable
        style={[styles.logoutBtn, { borderColor: "#FF4444" }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out" size={20} color="#FF4444" />
        <Text style={styles.logoutText}>LOGOUT FROM ADMIN</Text>
      </Pressable>

      <Text style={styles.versionText}>
        Admin Portal v2.0.4 - Production Environment
      </Text>

      {/* PIN UPDATE MODAL */}
      <Modal visible={showPinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="lock-closed" size={40} color={theme.primary} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Update Admin PIN
            </Text>

            <TextInput
              style={[
                styles.pinInput,
                { color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Current PIN"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={oldPin}
              onChangeText={setOldPin}
            />

            <TextInput
              style={[
                styles.pinInput,
                { color: theme.text, borderColor: theme.border },
              ]}
              placeholder="New PIN"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={newPin}
              onChangeText={setNewPin}
            />

            <TextInput
              style={[
                styles.pinInput,
                { color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Confirm New PIN"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={confirmPin}
              onChangeText={setConfirmPin}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background }]}
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
                onPress={handlePinUpdate}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Update PIN</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    marginVertical: 25,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 30,
    borderRadius: 25,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "800", marginVertical: 15 },
  pinInput: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 18,
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
});