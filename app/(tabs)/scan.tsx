import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, Modal, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from "expo-audio";
import axios from "axios";
import Toast from "react-native-toast-message";
import { BarcodeScanner } from "../../components/BarcodeScanner";

export default function ScanScreen() {
  const router = useRouter();
  const { initialTab } = useLocalSearchParams();
  const { theme } = useTheme();

  // Tab State
  const [tab, setTab] = useState<"lookup" | "registry">((initialTab as any) || "registry");
  
  // Logic State
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torch, setTorch] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [pendingData, setPendingData] = useState<any>(null);

  // Audio Players
  const BatchPlayer = useAudioPlayer(require("../../assets/sounds/beep.mp3"));
  const RegPlayer = useAudioPlayer(require("../../assets/sounds/beep-beep.mp3"));

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/products/registry/lookup/${data}`);

      if (tab === "lookup") {
        if (response.data.found) {
          BatchPlayer.play();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace(`/product/${response.data.productData._id}`);
        } else {
          RegPlayer.play();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Toast.show({ type: "info", text1: "Not Found", text2: "Product does not exist." });
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
      Toast.show({ type: "error", text1: "Error", text2: "Check connection" });
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BarcodeScanner
        onScan={handleBarCodeScanned}
        onClose={() => router.back()}
        loading={loading}
        torch={torch}
        setTorch={setTorch}
        tabColor={tab === "lookup" ? "#00D1FF" : "#00FF00"}
      >
        {/* TOP BAR WITH TABS (Injected into Scanner) */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconCircle}>
            <Ionicons name="close" size={28} color="#FFF" />
          </Pressable>

          <View style={styles.tabContainer}>
            <Pressable 
              onPress={() => { setTab("lookup"); setScanned(false); }}
              style={[styles.tab, tab === "lookup" && { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.tabText, tab === "lookup" && { color: "#FFF" }]}>LOOKUP</Text>
            </Pressable>
            <Pressable 
              onPress={() => { setTab("registry"); setScanned(false); }}
              style={[styles.tab, tab === "registry" && { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.tabText, tab === "registry" && { color: "#FFF" }]}>REGISTRY</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => setTorch(!torch)} style={styles.iconCircle}>
            <Ionicons name={torch ? "flash" : "flash-off"} size={24} color={torch ? "#FFD700" : "#FFF"} />
          </Pressable>
        </View>

        {/* HINT TEXT AND BUTTONS */}
        <View style={styles.bottomBar}>
          <Text style={styles.hintText}>
            {tab === "lookup" ? "Scan to find a product" : "Scan to Register or Add Batch"}
          </Text>
          {tab === "registry" && (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable style={styles.altBtn} onPress={() => { setPendingData({ barcode: `INT-${Date.now()}`, hasBarcode: false }); setIsNewProduct(true); setPinModal(true); }}>
                <Text style={styles.altBtnText}>No Barcode?</Text>
              </Pressable>
              <Pressable style={styles.manualBtn} onPress={() => router.push("/add-products")}>
                <Text style={styles.manualBtnText}>Manual</Text>
              </Pressable>
            </View>
          )}
        </View>
      </BarcodeScanner>

      {/* CONFIRMATION MODAL */}
      <Modal visible={confirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Ionicons name={isNewProduct ? "duplicate-outline" : "cube-outline"} size={40} color={theme.primary} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>{isNewProduct ? "Unknown Product" : "Product Identified"}</Text>
            <Text style={{ color: theme.subtext, textAlign: "center", marginVertical: 15 }}>
              {isNewProduct ? "Barcode not in registry. Register it now?" : `Found: ${pendingData?.name}. Add batch?`}
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: "#444" }]} onPress={() => { setConfirmModal(false); setScanned(false); }}>
                <Text style={{ color: "#FFF" }}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={() => { setConfirmModal(false); if(isNewProduct) setPinModal(true); else router.push({ pathname: "/add-products", params: { ...pendingData, mode: "inventory", locked: "true" } }); }}>
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Proceed</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADMIN PIN MODAL */}
      <Modal visible={pinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Ionicons name="shield-checkmark" size={32} color={theme.primary} style={{ marginBottom: 10 }} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Registration Password</Text>
            <TextInput style={[styles.pinInput, { color: theme.text, borderColor: theme.border }]} secureTextEntry keyboardType="numeric" maxLength={4} value={adminPin} onChangeText={setAdminPin} autoFocus />
            <Pressable style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={() => {
              if (adminPin === "1234") { setPinModal(false); setAdminPin(""); router.push({ pathname: "/add-products", params: { barcode: pendingData.barcode, mode: "registry", hasBarcode: String(pendingData.hasBarcode ?? true) } }); }
              else { Toast.show({ type: "error", text1: "Access Denied" }); setPinModal(false); setAdminPin(""); setScanned(false); }
            }}>
              <Text style={styles.submitBtnText}>VERIFY & CONTINUE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topBar: { flexDirection: "row", justifyContent: "space-between", width: "90%", alignItems: "center", paddingTop: 60, position: 'absolute', top: 0, zIndex: 10 },
  tabContainer: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 4, flex: 1, marginHorizontal: 15 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabText: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "800" },
  iconCircle: { width: 45, height: 45, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  bottomBar: { position: 'absolute', bottom: 60, alignItems: "center", width: "100%", zIndex: 10 },
  hintText: { color: "#FFF", marginBottom: 20, fontWeight: "600" },
  manualBtn: { backgroundColor: "#FFF", paddingVertical: 15, paddingHorizontal: 25, borderRadius: 30 },
  manualBtnText: { color: "#000", fontWeight: "800", fontSize: 14 },
  altBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "#FFF", paddingVertical: 15, paddingHorizontal: 25, borderRadius: 30 },
  altBtnText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "80%", padding: 25, borderRadius: 30, alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "900", marginBottom: 5 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 10 },
  modalBtn: { padding: 16, borderRadius: 15, flex: 1, alignItems: "center" },
  pinInput: { width: "100%", height: 60, borderWidth: 1, borderRadius: 15, textAlign: "center", fontSize: 28, marginBottom: 20 },
  submitBtn: { width: "100%", height: 55, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  submitBtnText: { color: "#FFF", fontWeight: "900", fontSize: 14 },
});