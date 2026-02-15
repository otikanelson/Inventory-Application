import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Tabs, useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { Path, Svg } from "react-native-svg";
import Toast from "react-native-toast-message";
import { AdminTourOverlay } from "../../components/AdminTourOverlay";
import { AdminTourProvider } from "../../context/AdminTourContext";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

/**
 * Custom SVG Background for the Tab Bar with a center dip
 */
const AdminTabBg = ({ color }: { color: string }) => {
  const d = `
    M0 0 
    H${width * 0.35} 
    C${width * 0.4} 0 ${width * 0.4} 40 ${width * 0.5} 40 
    S${width * 0.6} 0 ${width * 0.65} 0 
    H${width} 
    V90 
    H0 
    Z`;

  return (
    <View style={styles.svgContainer}>
      <Svg width={width} height={90} viewBox={`0 0 ${width} 90`}>
        <Path d={d} fill={color} />
      </Svg>
    </View>
  );
};

export default function AdminLayout() {
  const { theme } = useTheme();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [autoLogoutEnabled, setAutoLogoutEnabled] = useState(true);
  const [autoLogoutTime, setAutoLogoutTime] = useState(30);

  // Check authentication on mount and when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      checkAuth();
    }, [])
  );

  const checkAuth = async () => {
    try {
      const storedPin = await AsyncStorage.getItem("admin_pin");
      const lastAuth = await AsyncStorage.getItem("admin_last_auth");
      const logoutEnabled = await AsyncStorage.getItem("admin_auto_logout");
      const logoutTime = await AsyncStorage.getItem("admin_auto_logout_time");

      // Load settings
      setAutoLogoutEnabled(logoutEnabled !== "false");
      setAutoLogoutTime(logoutTime ? parseInt(logoutTime) : 30);

      // If no PIN exists at all, allow entry but show setup prompt
      if (!storedPin) {
        setHasPin(false);
        setIsAuthenticated(true);
        setShowSetupModal(true);
        setLoading(false);
        return;
      }

      setHasPin(true);

      // Check if we have a recent auth session
      if (lastAuth) {
        const elapsed = Date.now() - parseInt(lastAuth);
        const timeoutMs = (logoutTime ? parseInt(logoutTime) : 30) * 60 * 1000;

        // If auto-logout is enabled and session is valid, authenticate
        if ((logoutEnabled === "false" || elapsed < timeoutMs)) {
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
      }

      // Need authentication
      setIsAuthenticated(false);
      setShowPinModal(true);
      setLoading(false);
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      setShowPinModal(true);
      setLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    try {
      const userRole = await AsyncStorage.getItem("auth_user_role");
      const storeId = await AsyncStorage.getItem("auth_store_id");

      // For staff, we need to verify against their admin's PIN from the backend
      if (userRole === 'staff' && storeId) {
        try {
          // Call backend to verify admin PIN for this store
          const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/verify-admin-pin`, {
            pin,
            storeId
          });

          if (response.data.success) {
            await AsyncStorage.setItem("admin_last_auth", Date.now().toString());
            setIsAuthenticated(true);
            setShowPinModal(false);
            setPin("");
            
            Toast.show({
              type: "success",
              text1: "Admin Access Granted",
              text2: "You now have temporary admin access",
            });
          } else {
            Toast.show({
              type: "error",
              text1: "Access Denied",
              text2: "Incorrect admin PIN",
            });
            setPin("");
          }
        } catch (error: any) {
          // If API fails, fall back to local storage (offline mode)
          const storedPin = await AsyncStorage.getItem("admin_pin");
          if (pin === storedPin) {
            await AsyncStorage.setItem("admin_last_auth", Date.now().toString());
            setIsAuthenticated(true);
            setShowPinModal(false);
            setPin("");
            
            Toast.show({
              type: "success",
              text1: "Admin Access Granted",
              text2: "You now have temporary admin access (offline)",
            });
          } else {
            Toast.show({
              type: "error",
              text1: "Access Denied",
              text2: "Incorrect admin PIN",
            });
            setPin("");
          }
        }
      } else {
        // For admin users, check local storage
        const storedPin = await AsyncStorage.getItem("admin_pin");
        if (pin === storedPin) {
          await AsyncStorage.setItem("admin_last_auth", Date.now().toString());
          setIsAuthenticated(true);
          setShowPinModal(false);
          setPin("");
        } else {
          Toast.show({
            type: "error",
            text1: "Access Denied",
            text2: "Incorrect PIN",
          });
          setPin("");
        }
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Authentication Error",
        text2: "Could not verify PIN",
      });
    }
  };

  const handleFirstTimeSetup = async () => {
    try {
      // Validate PIN format
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        Toast.show({
          type: "error",
          text1: "Invalid PIN",
          text2: "PIN must be exactly 4 digits",
        });
        return;
      }

      // Validate confirmation
      if (newPin !== confirmPin) {
        Toast.show({
          type: "error",
          text1: "PIN Mismatch",
          text2: "PINs do not match",
        });
        return;
      }

      // Store new PIN
      await AsyncStorage.setItem("admin_pin", newPin);
      await AsyncStorage.setItem("admin_first_setup", "completed");
      await AsyncStorage.setItem("admin_last_auth", Date.now().toString());

      setHasPin(true);
      setShowSetupModal(false);
      setNewPin("");
      setConfirmPin("");

      Toast.show({
        type: "success",
        text1: "PIN Created",
        text2: "Admin access is now secured",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Setup Failed",
        text2: "Could not save PIN",
      });
    }
  };

  const handleSkipSetup = () => {
    setShowSetupModal(false);
    Toast.show({
      type: "info",
      text1: "Setup Skipped",
      text2: "Please set your PIN in Settings for security",
    });
  };

  const handleCancel = () => {
    setShowPinModal(false);
    setPin("");
    router.replace("/(tabs)");
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!isAuthenticated && hasPin) {
    return (
      <Modal visible={showPinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + "15" }]}>
              <Ionicons name="shield-checkmark" size={40} color={theme.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Admin Access Required
            </Text>
            <Text style={[styles.modalSubtext, { color: theme.subtext }]}>
              Enter the admin PIN to continue
            </Text>
            <TextInput
              style={[
                styles.pinInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
              ]}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={pin}
              onChangeText={setPin}
              placeholder="Admin PIN"
              placeholderTextColor={theme.subtext}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
                onPress={handleCancel}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={handlePinSubmit}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Verify</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <AdminTourProvider>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: theme.subtext,
            tabBarHideOnKeyboard: true,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: "800",
              marginBottom: 0,
            },
            tabBarStyle: {
              position: "absolute",
              backgroundColor: "transparent",
              borderTopWidth: 0,
              elevation: 0,
              height: 90,
              bottom: 0,
            },
            tabBarBackground: () => <AdminTabBg color={theme.tabSurface} />,
          }}
        >
        <Tabs.Screen
          name="sales"
          options={{
            title: "SALES",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "cart" : "cart-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="inventory"
          options={{
            title: "INVENTORY",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "cube" : "cube-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="scan"
          options={{
            title: "",
            tabBarStyle: { display: "none" },
            tabBarIcon: ({ focused }) => (
              <View style={styles.centerScanButton}>
                <Ionicons
                  name="scan-circle-outline"
                  size={32}
                  color={focused ? theme.primary : theme.text}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="stats"
          options={{
            title: "STATS",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "stats-chart" : "stats-chart-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "SETTINGS",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={22}
                color={color}
              />
            ),
          }}
        />
      {/* Detail page hidden from Tab Bar */}
        <Tabs.Screen
          name="product/[id]"
          options={{
            href: null,
          }}
        />
      </Tabs>

      <AdminTourOverlay />

      {/* First-Time PIN Setup Modal */}
      <Modal visible={showSetupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + "15" }]}>
              <Ionicons name="shield-checkmark" size={40} color={theme.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Secure Your Admin Panel
            </Text>
            <Text style={[styles.modalSubtext, { color: theme.subtext }]}>
              Create a 4-digit PIN to protect your admin dashboard
            </Text>

            <TextInput
              style={[
                styles.pinInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
              ]}
              placeholder="Create PIN"
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
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
              ]}
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
                onPress={handleSkipSetup}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Skip</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={handleFirstTimeSetup}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Create PIN</Text>
              </Pressable>
            </View>

            <Text style={[styles.warningText, { color: theme.subtext }]}>
              ⚠️ You can set this up later in Settings
            </Text>
          </View>
        </View>
      </Modal>
      </View>
    </AdminTourProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  svgContainer: {
    position: "absolute",
    bottom: 0,
    width: width,
  },
  centerScanButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: 60,
    marginTop: -10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.90)",
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
  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },
  modalSubtext: {
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
  warningText: {
    fontSize: 12,
    marginTop: 15,
    textAlign: "center",
    fontWeight: "600",
  },
});