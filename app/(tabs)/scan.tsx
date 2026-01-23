import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  Animated,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from "expo-audio";
import axios from "axios";
import Toast from "react-native-toast-message";

const { height } = Dimensions.get("window");

export default function ScanScreen() {
  const router = useRouter();
  const { initialTab } = useLocalSearchParams();
  const { theme } = useTheme();

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();

  // Tab State
  const [tab, setTab] = useState<"lookup" | "registry">(
    (initialTab as any) || "registry"
  );

  // Logic State
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torch, setTorch] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [pendingData, setPendingData] = useState<any>(null);

  // CRITICAL: Key to force camera remount when screen focuses
  const [cameraKey, setCameraKey] = useState(0);

  // Audio Players
  const BatchPlayer = useAudioPlayer(require("../../assets/sounds/beep.mp3"));
  const RegPlayer = useAudioPlayer(
    require("../../assets/sounds/beep-beep.mp3")
  );

  // Scanner animation
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

  useFocusEffect(
    React.useCallback(() => {
      // Reset all state when returning to scanner
      setScanned(false);
      setLoading(false);
      setConfirmModal(false);
      setPinModal(false);
      setAdminPin("");
      setPendingData(null);
      setTorch(false);

      // Force camera remount by changing key
      setCameraKey((prev) => prev + 1);

      return () => {
        // Cleanup on unmount
        setTorch(false);
      };
    }, [])
  );

  // Additional safety: Reset when tab changes
  React.useEffect(() => {
    setScanned(false);
    setLoading(false);
  }, [tab]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/products/registry/lookup/${data}`
      );

      // DEBUG: Log the lookup response
      console.log("Lookup Response:", {
        barcode: data,
        found: response.data.found,
        productData: response.data.productData,
        tab: tab,
      });

      if (tab === "lookup") {
        if (response.data.found) {
          BatchPlayer.play();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setScanned(false);
          router.replace(`/product/${response.data.productData._id}`);
        } else {
          RegPlayer.play();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Toast.show({
            type: "info",
            text1: "Not Found",
            text2: "Product does not exist.",
          });
          setScanned(false);
        }
        return;
      }

      // Registry Logic
      if (response.data.found) {
        BatchPlayer.play();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsNewProduct(false);
        setPendingData(response.data.productData);
      } else {
        RegPlayer.play();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setIsNewProduct(true);
        setPendingData({ barcode: data });
      }
      setConfirmModal(true);
    } catch (err) {
      console.error(" Scan Error:", err);
      Toast.show({ type: "error", text1: "Error", text2: "Check connection" });
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  // Dedicated handlers that reset state before navigation
  const handleModalProceed = () => {
    setConfirmModal(false);
    if (isNewProduct) {
      setPinModal(true);
    } else {
      setScanned(false);
      router.push({
        pathname: "/add-products",
        params: { ...pendingData, mode: "inventory", locked: "true" },
      });
    }
  };

  const handleModalCancel = () => {
    setConfirmModal(false);
    setScanned(false);
  };

  const handlePinSubmit = () => {
    if (adminPin === "1234") {
      setPinModal(false);
      setAdminPin("");
      setScanned(false);
      router.push({
        pathname: "/add-products",
        params: {
          barcode: pendingData.barcode,
          mode: "registry",
          hasBarcode: String(pendingData.hasBarcode ?? true),
        },
      });
    } else {
      Toast.show({ type: "error", text1: "Access Denied" });
      setPinModal(false);
      setAdminPin("");
      setScanned(false);
    }
  };

  const handlePinCancel = () => {
    setPinModal(false);
    setAdminPin("");
    setScanned(false);
  };

  const handleNoBarcodeEntry = () => {
    setPendingData({
      barcode: `INT-${Date.now()}`,
      hasBarcode: false,
    });
    setIsNewProduct(true);
    setPinModal(true);
  };

  // Handle camera permissions
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#666" />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <Pressable style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const tabColor = tab === "lookup" ? "#00D1FF" : "#00FF00";

  return (
    <View style={styles.container}>
      {/* CAMERA VIEW */}
      <CameraView
        key={cameraKey}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={loading ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "upc_a", "code128", "qr"],
        }}
      />

      {/* DARK OVERLAY WITH VIEWFINDER */}
      <View style={styles.overlay}>
        {/* TOP BAR WITH TABS */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconCircle}>
            <Ionicons name="close" size={28} color="#FFF" />
          </Pressable>

          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => {
                setTab("lookup");
                setScanned(false);
              }}
              style={[
                styles.tab,
                tab === "lookup" && { backgroundColor: theme.primary },
              ]}
            >
              <Text
                style={[styles.tabText, tab === "lookup" && { color: "#FFF" }]}
              >
                LOOKUP
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setTab("registry");
                setScanned(false);
              }}
              style={[
                styles.tab,
                tab === "registry" && { backgroundColor: theme.primary },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "registry" && { color: "#FFF" },
                ]}
              >
                REGISTRY
              </Text>
            </Pressable>
          </View>

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
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <Animated.View
              style={[
                styles.scanLine,
                {
                  backgroundColor: tabColor,
                  shadowColor: tabColor,
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
            {loading && (
              <View style={styles.loadingOverlay}>
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}
          </View>
        </View>

        {/* BOTTOM HINTS AND BUTTONS */}
        <View style={styles.bottomBar}>
          <Text style={styles.hintText}>
            {tab === "lookup" ?
              "Scan to find a product"
            : "Scan to Register or Add Batch"}
          </Text>
          {tab === "registry" && (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable style={styles.altBtn} onPress={handleNoBarcodeEntry}>
                <Text style={styles.altBtnText}>No Barcode?</Text>
              </Pressable>
              <Pressable
                style={styles.manualBtn}
                onPress={() => router.push("/add-products")}
              >
                <Text style={styles.manualBtnText}>Manual</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* CONFIRMATION MODAL */}
      <Modal visible={confirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Ionicons
              name={isNewProduct ? "duplicate-outline" : "cube-outline"}
              size={40}
              color={theme.primary}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isNewProduct ? "Unknown Product" : "Product Identified"}
            </Text>
            <Text
              style={{
                color: theme.subtext,
                textAlign: "center",
                marginVertical: 15,
              }}
            >
              {isNewProduct ?
                "Barcode not in registry. Register it now?"
              : `Found: ${pendingData?.name}. Add batch?`}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#444" }]}
                onPress={handleModalCancel}
              >
                <Text style={{ color: "#FFF" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={handleModalProceed}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>
                  Proceed
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADMIN PIN MODAL */}
      <Modal visible={pinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Ionicons
              name="shield-checkmark"
              size={32}
              color={theme.primary}
              style={{ marginBottom: 10 }}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Registration Password
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
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#444" }]}
                onPress={handlePinCancel}
              >
                <Text style={{ color: "#FFF" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={handlePinSubmit}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>VERIFY</Text>
              </Pressable>
            </View>
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
    paddingTop: 60,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 4,
    flex: 1,
    marginHorizontal: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  tabText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "800",
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinder: {
    width: 280,
    height: 250,
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
  },
  scanLine: {
    height: 3,
    width: "100%",
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomBar: {
    paddingBottom: 60,
    alignItems: "center",
    width: "100%",
  },
  hintText: {
    color: "#FFF",
    marginBottom: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  manualBtn: {
    backgroundColor: "#FFF",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  manualBtnText: { color: "#000", fontWeight: "800", fontSize: 14 },
  altBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "#FFF",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  altBtnText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
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
  modalTitle: { fontSize: 20, fontWeight: "900", marginBottom: 5 },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    width: "100%",
  },
  modalBtn: { padding: 16, borderRadius: 15, flex: 1, alignItems: "center" },
  pinInput: {
    width: "100%",
    height: 60,
    borderWidth: 1,
    borderRadius: 15,
    textAlign: "center",
    fontSize: 28,
    marginBottom: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    color: "#FFF",
    fontSize: 16,
    marginVertical: 20,
    textAlign: "center",
  },
  permissionBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 10,
  },
  permissionBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});