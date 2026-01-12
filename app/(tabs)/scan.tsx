import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import axios from "axios";
import Toast from "react-native-toast-message";

export default function ScanScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torch, setTorch] = useState(false);

  const [confirmModal, setConfirmModal] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [pendingData, setPendingData] = useState<any>(null);

  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  async function playBeep(isWarning = false) {
    try {
      const soundFile = isWarning
        ? require("../../assets/sounds/beep-beep.mp3")
        : require("../../assets/sounds/beep.mp3");
      const { sound } = await Audio.Sound.createAsync(soundFile);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((s: any) => {
        if (s.didJustFinish) sound.unloadAsync();
      });
    } catch (e) {
      console.log("Sound asset error");
    }
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const response = await axios.get(
        `${API_URL}/products/registry/lookup/${data}`
      );

      if (response.data.found) {
        await playBeep(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({ type: "info", text1: "Registered Product Found" });
        setIsNewProduct(false);
        setPendingData(response.data.productData);
      } else {
        await playBeep(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Toast.show({ type: "error", text1: "Unregistered Product" });
        setIsNewProduct(true);
        setPendingData({ barcode: data });
      }
      setConfirmModal(true);
    } catch (err) {
      Toast.show({ type: "error", text1: "Network Error" });
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmYes = () => {
    setConfirmModal(false);
    if (isNewProduct) {
      setPinModal(true);
    } else {
      router.push({
        pathname: "/add-products",
        params: {
          ...pendingData,
          mode: "inventory",
          locked: "true",
          isPerishable: String(pendingData.isPerishable),
        },
      });
    }
  };

  if (!permission?.granted)
    return (
      <View style={styles.container}>
        <Pressable style={styles.manualBtn} onPress={requestPermission}>
          <Text>Grant Permission</Text>
        </Pressable>
      </View>
    );

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.iconCircle}>
              <Ionicons name="close" size={28} color="#FFF" />
            </Pressable>
            <Text style={styles.topTitle}>Inventory Scan</Text>
            <Pressable
              onPress={() => setTorch(!torch)}
              style={styles.iconCircle}
            >
              <Ionicons
                name={torch ? "flash" : "flash-off"}
                size={24}
                color={torch ? "#FFD700" : "#FFF"}
              />
            </Pressable>
          </View>

          {/* VIEWFINDER */}
          <View style={styles.viewfinder}>
            {loading && (
              <View style={styles.loadingInner}>
                <ActivityIndicator size="large" color="#00FF00" />
                <Text
                  style={{ color: "#00FF00", marginTop: 10, fontWeight: "900" }}
                >
                  IDENTIFYING...
                </Text>
              </View>
            )}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 250],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <View style={styles.bottomBar}>
            <Text style={styles.hintText}>Align barcode inside the frame</Text>
            <Pressable
              style={styles.manualBtn}
              onPress={() => router.push("/add-products")}
            >
              <Text style={styles.manualBtnText}>Manual Entry</Text>
            </Pressable>
          </View>
        </View>
      </CameraView>

      {/* REGISTRY/BATCH CONFIRMATION MODAL */}
      <Modal visible={confirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isNewProduct ? "Register Product?" : "Add New Batch?"}
            </Text>
            <Text
              style={{
                color: theme.subtext,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {isNewProduct
                ? "This item is not in the registry. Would you like to add it?"
                : `Existing product found: ${pendingData?.name}`}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#444" }]}
                onPress={() => {
                  setConfirmModal(false);
                  setScanned(false);
                }}
              >
                <Text style={{ color: "#FFF" }}>No</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={handleConfirmYes}
              >
                <Text style={{ color: "#FFF" }}>Yes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADMIN PIN MODAL */}
      <Modal visible={pinModal} transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Ionicons
              name="lock-closed"
              size={32}
              color={theme.primary}
              style={{ marginBottom: 10 }}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Admin Password
            </Text>
            <TextInput
              style={[
                styles.pinInput,
                { color: theme.text, borderColor: theme.border },
              ]}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={adminPin}
              onChangeText={setAdminPin}
              autoFocus
            />
            <Pressable
              style={[
                styles.modalBtn,
                { backgroundColor: theme.primary, width: "100%" },
              ]}
              onPress={() => {
                if (adminPin === "1234") {
                  setPinModal(false);
                  setAdminPin("");
                  router.push({
                    pathname: "/add-products",
                    params: {
                      barcode: pendingData.barcode,
                      mode: "registry",
                      locked: "false",
                    },
                  });
                } else {
                  Toast.show({ type: "error", text1: "Incorrect Password" });
                  setPinModal(false);
                  setAdminPin("");
                  setScanned(false);
                }
              }}
            >
              <Text style={{ color: "#FFF", fontWeight: "bold" }}>Unlock</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "85%",
    alignItems: "center",
    paddingTop: 60,
  },
  topTitle: { color: "#FFF", fontSize: 18, fontWeight: "900" },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinder: {
    width: 280,
    height: 250,
    borderRadius: 30,
    overflow: "hidden",
    position: "relative",
  },
  loadingInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  scanLine: { height: 3, width: "100%", backgroundColor: "#00FF00" },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#FFF",
    borderWidth: 5,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  bottomBar: { paddingBottom: 60, alignItems: "center" },
  hintText: { color: "#FFF", marginBottom: 20, fontWeight: "600" },
  manualBtn: {
    backgroundColor: "#FFF",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  manualBtnText: { color: "#000", fontWeight: "800", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 25,
    borderRadius: 30,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "900", marginBottom: 15 },
  modalActions: { flexDirection: "row", gap: 15 },
  modalBtn: { padding: 15, borderRadius: 15, flex: 1, alignItems: "center" },
  pinInput: {
    width: "100%",
    height: 55,
    borderWidth: 1,
    borderRadius: 15,
    textAlign: "center",
    fontSize: 24,
    marginBottom: 20,
  },
});
