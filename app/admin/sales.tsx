import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ImageBackground,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useProducts } from "../../hooks/useProducts";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from "expo-audio";
import axios from "axios";
import Toast from "react-native-toast-message";

export default function AdminSales() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { products, refresh } = useProducts();

  // State
  const [cart, setCart] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showFefoModal, setShowFefoModal] = useState(false);

  // Audio
  const scanBeep = useAudioPlayer(require("../../assets/sounds/beep.mp3"));

  // Logic: Process FEFO Sale
  const finalizeSale = async () => {
    setIsSyncing(true);
    try {
      const saleData = cart.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
      }));

      await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/products/process-sale`,
        { items: saleData }
      );

      setCart([]);
      setShowFefoModal(false);
      refresh();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Inventory updated via FEFO.",
      });
    } catch (err) {
      console.error("Sale Error:", err);
      Alert.alert(
        "System Error",
        "Could not update inventory. Ensure backend route /process-sale exists."
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={
          isDark
            ? require("../../assets/images/Background7.png")
            : require("../../assets/images/Background9.png")
        }
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Sales Ledger
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollPadding}
          showsVerticalScrollIndicator={false}
        >
          {/* LEDGER CARD - FULL SCREEN */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface + "CC",
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                ACTIVE SALES SESSION
              </Text>
              <Pressable
                onPress={() => router.push("../scan")}
                style={[styles.scanBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="scan" size={18} color="#FFF" />
                <Text style={styles.scanBtnText}>SCAN</Text>
              </Pressable>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={50} color={theme.subtext} />
                <Text style={{ color: theme.subtext, marginTop: 10 }}>
                  No items in current session.
                </Text>
              </View>
            ) : (
              cart.map((item) => (
                <View key={item._id} style={styles.cartItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text }]}>
                      {item.name}
                    </Text>
                    <Text style={{ color: theme.subtext, fontSize: 12 }}>
                      Available: {item.quantityInStock}
                    </Text>
                  </View>
                  <View style={styles.qtyControls}>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() =>
                        setCart((c) =>
                          c.map((i) =>
                            i._id === item._id
                              ? { ...i, quantity: Math.max(1, i.quantity - 1) }
                              : i
                          )
                        )
                      }
                    >
                      <Ionicons name="remove" size={16} color={theme.text} />
                    </Pressable>
                    <Text style={{ color: theme.text, fontWeight: "900" }}>
                      {item.quantity}
                    </Text>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() =>
                        setCart((c) =>
                          c.map((i) =>
                            i._id === item._id
                              ? { ...i, quantity: i.quantity + 1 }
                              : i
                          )
                        )
                      }
                    >
                      <Ionicons name="add" size={16} color={theme.text} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>

          {cart.length > 0 && (
            <Pressable
              style={[styles.finalizeBtn, { backgroundColor: theme.primary }]}
              onPress={() => setShowFefoModal(true)}
            >
              <Text style={styles.finalizeText}>COMPLETE TRANSACTION</Text>
              <Ionicons name="checkmark-done" size={20} color="#FFF" />
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* CUSTOM FEFO CONFIRMATION MODAL */}
      <Modal visible={showFefoModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Ionicons
              name="hourglass-outline"
              size={50}
              color={theme.primary}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Confirm Deduction
            </Text>
            <Text style={[styles.modalSub, { color: theme.subtext }]}>
              Inventory will be deducted using First-Expired, First-Out (FEFO)
              logic to ensure stock freshness.
            </Text>

            {isSyncing ? (
              <ActivityIndicator
                size="large"
                color={theme.primary}
                style={{ margin: 20 }}
              />
            ) : (
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalBtnCancel}
                  onPress={() => setShowFefoModal(false)}
                >
                  <Text style={{ color: "#FFF" }}>Back</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.modalBtnConfirm,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={finalizeSale}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>
                    Confirm Sync
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    gap: 15,
    marginBottom: 20,
  },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "900" },
  scrollPadding: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { padding: 25, borderRadius: 30, borderWidth: 1, flex: 1 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  scanBtnText: { color: "#FFF", fontWeight: "900", fontSize: 12 },
  emptyContainer: { alignItems: "center", paddingVertical: 40, opacity: 0.5 },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150,150,150,0.1)",
  },
  itemName: { fontSize: 16, fontWeight: "800" },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(150,150,150,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  finalizeBtn: {
    marginTop: 20,
    height: 65,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  finalizeText: { color: "#FFF", fontWeight: "900", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 30,
    borderRadius: 35,
    alignItems: "center",
  },
  modalTitle: { fontSize: 22, fontWeight: "900", marginTop: 15 },
  modalSub: {
    textAlign: "center",
    marginVertical: 15,
    lineHeight: 22,
  },
  modalActions: { flexDirection: "row", gap: 15, marginTop: 10 },
  modalBtnCancel: {
    flex: 1,
    height: 55,
    backgroundColor: "#444",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBtnConfirm: {
    flex: 1,
    height: 55,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});