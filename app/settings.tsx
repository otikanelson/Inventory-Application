import React, { useState } from "react";
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

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();

  // Local state for system settings
  const [apiUrl, setApiUrl] = useState(process.env.EXPO_PUBLIC_API_URL || "");
  const [rapidScan, setRapidScan] = useState(true);

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
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>ADMINISTRATION</Text>
        <SettingRow 
          icon="shield" 
          label="Admin Dashboard" 
          description="Manage inventory, sales, and security"
          // onPress={() => setPinModal(true)}
          onPress={() => router.push("../admin")}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
        </SettingRow>
      </View>

      {/* Admin Login Modal */}
      <Modal visible={pinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Admin Login</Text>
            <TextInput 
              style={[styles.pinInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="Enter PIN" secureTextEntry keyboardType="numeric"
              value={pin} onChangeText={setPin}
            />
            <Pressable style={[styles.saveBtn, { backgroundColor: theme.primary, width: '100%' }]} onPress={handleAdminAuth}>
              <Text style={styles.saveBtnText}>ACCESS DASHBOARD</Text>
            </Pressable>
            <Pressable onPress={() => setPinModal(false)} style={{ marginTop: 15 }}>
              <Text style={{ color: theme.subtext }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 15, color: theme.primary }]}>
          DEVELOPER SETTINGS
        </Text>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          NETWORK CONFIG
        </Text>
        <View
          style={[
            styles.configCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.inputLabel, { color: theme.subtext }]}>
            BACKEND API ENDPOINT
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border },
            ]}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://192.168.x.x:5000"
            placeholderTextColor={theme.subtext}
          />
          <Pressable
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            onPress={handleSaveConfig}
          >
            <Text style={styles.saveBtnText}>UPDATE ENDPOINT</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Pressable
          style={[styles.logoutBtn, { borderColor: "#FF4444" }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF4444" />
          <Text style={styles.logoutText}>TERMINATE SESSION</Text>
        </Pressable>
        <Text style={styles.versionText}>
          Build v2.0.4 - Production Environment
        </Text>
      </View>
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
    marginTop: 25,
    letterSpacing: 1,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', padding: 30, borderRadius: 25, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  pinInput: { width: '100%', height: 50, borderWidth: 1, borderRadius: 12, textAlign: 'center', fontSize: 20, marginBottom: 20 },
});
