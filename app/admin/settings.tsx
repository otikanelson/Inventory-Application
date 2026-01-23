import React, { useState, useEffect } from "react";
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

  const handlePinUpdate = async () => {
    try {
      // Get stored PIN or use default
      const storedPin = await AsyncStorage.getItem('admin_pin') || '1234';
      
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

      // Store new PIN
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
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not update PIN'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('admin_session');
      await AsyncStorage.removeItem('admin_session_time');
      
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'Admin session ended'
      });

      router.replace('../../(tabs)/');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: 'Could not end session'
      });
    }
  };

  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

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
            icon="key-outline"
            label="Update Admin PIN"
            description="Change your admin access code"
            onPress={() => setShowPinModal(true)}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </SettingRow>

          <SettingRow
            icon="shield-checkmark-outline"
            label="Require PIN for Delete"
            description="Additional security for product deletion"
          >
            <Switch
              value={requirePinForDelete}
              onValueChange={setRequirePinForDelete}
              trackColor={{ true: theme.primary }}
            />
          </SettingRow>

          <SettingRow
            icon="time-outline"
            label="Auto-Logout"
            description="End session after 30 minutes of inactivity"
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
            icon="cloud-upload-outline"
            label="Auto Backup"
            description="Automatically backup inventory data"
          >
            <Switch
              value={enableBackup}
              onValueChange={setEnableBackup}
              trackColor={{ true: theme.primary }}
            />
          </SettingRow>

          <SettingRow
            icon="download-outline"
            label="Export Data"
            description="Download inventory as CSV"
            onPress={() => Toast.show({ type: 'info', text1: 'Coming Soon', text2: 'Export feature in development' })}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </SettingRow>
        </View>

        {/* LOGOUT */}
        <Pressable
          style={[styles.logoutBtn, { borderColor: '#FF4444' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#FF4444" />
          <Text style={styles.logoutText}>Logout from Admin</Text>
        </Pressable>

        <Text style={styles.versionText}>
          Build v2.0.5 - Production Environment
        </Text>
      </ScrollView>

      {/* PIN UPDATE MODAL */}
      <Modal visible={showPinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconBox, { backgroundColor: theme.primary + "15" }]}>
              <Ionicons name="key" size={32} color={theme.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Update Admin PIN
            </Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>
              Enter your current PIN and choose a new 4-digit code
            </Text>

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

            <TextInput
              style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="New PIN"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={newPin}
              onChangeText={setNewPin}
            />

            <TextInput
              style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
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
                onPress={handlePinUpdate}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Update PIN</Text>
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
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    marginTop: 20,
    marginBottom: 10,
  },
  logoutText: { color: "#FF4444", fontWeight: "900", fontSize: 14 },
  versionText: {
    textAlign: "center",
    color: "#888",
    fontSize: 10,
    marginBottom: 100,
    letterSpacing: 1,
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