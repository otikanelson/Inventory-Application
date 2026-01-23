import React, { useEffect, useState } from "react";
import { Tabs, useRouter, useSegments, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  Text,
  Pressable,
} from "react-native";
import { Svg, Path } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    V70 
    H0 
    Z`;

  return (
    <View style={styles.svgContainer}>
      <Svg width={width} height={70} viewBox={`0 0 ${width} 70`}>
        <Path d={d} fill={color} />
      </Svg>
    </View>
  );
};

export default function AdminLayout() {
  const { theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);

  // Check authentication on mount and when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      checkAuth();
    }, []),
  );

  const checkAuth = async () => {
    try {
      const authStatus = await AsyncStorage.getItem("admin_authenticated");
      const authTime = await AsyncStorage.getItem("admin_auth_time");

      if (authStatus === "true" && authTime) {
        // Check if auth is still valid (30 minutes)
        const elapsed = Date.now() - parseInt(authTime);
        if (elapsed < 30 * 60 * 1000) {
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
      }

      // Not authenticated or session expired
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
    if (pin === "1234") {
      // In production, use encrypted storage
      await AsyncStorage.setItem("admin_authenticated", "true");
      await AsyncStorage.setItem("admin_auth_time", Date.now().toString());
      setIsAuthenticated(true);
      setShowPinModal(false);
      setPin("");
    } else {
      alert("Incorrect PIN");
      setPin("");
    }
  };

  const handleCancel = () => {
    setShowPinModal(false);
    router.replace("/(tabs)");
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

  if (!isAuthenticated) {
    return (
      <Modal visible={showPinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="shield-checkmark" size={48} color={theme.primary} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Admin Access Required
            </Text>
            <Text style={[styles.modalSubtext, { color: theme.subtext }]}>
              Enter admin PIN to continue
            </Text>
            <TextInput
              style={[
                styles.pinInput,
                { color: theme.text, borderColor: theme.border },
              ]}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={pin}
              onChangeText={setPin}
              placeholder="Enter PIN"
              placeholderTextColor={theme.subtext}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background }]}
                onPress={handleCancel}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
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
            marginBottom: Platform.OS === "ios" ? 0 : 10,
          },
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            height: 70,
            bottom: Platform.OS === "ios" ? 20 : 0,
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

        {/* FAB SCAN BUTTON (Center Dip) */}
        <Tabs.Screen
          name="scan"
          options={{
            title: "",
            tabBarIcon: ({ focused }) => (
              <View style={styles.scanFab}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  svgContainer: {
    position: "absolute",
    bottom: 0,
    width: width,
  },
  scanFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 30,
    borderRadius: 30,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 15,
    marginBottom: 5,
  },
  modalSubtext: {
    fontSize: 14,
    marginBottom: 20,
  },
  pinInput: {
    width: "100%",
    height: 60,
    borderWidth: 1,
    borderRadius: 15,
    textAlign: "center",
    fontSize: 28,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
  },
});
