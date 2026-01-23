import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ImageBackground,
  Modal,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useProducts } from "../../hooks/useProducts";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from "expo-audio";
import axios from "axios";
import Toast from "react-native-toast-message";

export default function AdminSales() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { products, refresh } = useProducts();

  // State
  const [cart, setCart] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showFefoModal, setShowFefoModal] = useState(false);

  // Audio
  const scanBeep = useAudioPlayer(require("../../assets/sounds/beep.mp3"));

  // Handle scanned product from scanner
  useEffect(() => {
    if (params.scannedProduct) {
      try {
        const product = JSON.parse(params.scannedProduct as string);
        
        // Check if already in cart
        const existingItem = cart.find(item => item._id === product._id);
        
        if (existingItem) {
          // Increment quantity
          setCart(cart.map(item => 
            item._id === product._id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ));
          Toast.show({
            type: "success",
            text1: "Quantity Updated",
            text2: `${product.name} quantity increased`,
          });
        } else {
          // Add new item with quantity 1
          setCart([...cart, { ...product, quantity: 1 }]);
          scanBeep.play();
          Toast.show({
            type: "success",
            text1: "Added to Cart",
            text2: `${product.name} added to sales ledger`,
          });
        }
        
        // Clear the param
        router.setParams({ scannedProduct: undefined });
      } catch (err) {
        console.error("Error parsing scanned product:", err);
      }
    }
  }, [params.scannedProduct]);

  // Remove item from cart
  const removeItem = (productId: string) => {
    setCart(cart.filter(item => item._id !== productId));
    Toast.show({
      type: "info",
      text1: "Item Removed",
      text2: "Product removed from cart",
    });
  };

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
        text1: "Sale Completed",
        text2: "Inventory updated via FEFO",
      });
    } catch (err) {
      console.error("Sale Error:", err);
      Toast.show({
        type: "error",
        text1: "Sale Failed",
        text2: "Could not process sale. Check backend.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.systemTag, { color: theme.primary }]}>
              ADMIN_PANEL_v2.0
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Sales Ledger
            </Text>
          </View>
          
          <Pressable
            onPress={() => router.push("./scan")}
            style={[styles.scanBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="scan" size={20} color="#FFF" />
            <Text style={styles.scanBtnText}>SCAN</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollPadding}
          showsVerticalScrollIndicator={false}
        >
          {/* Active Session Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.primary }]}>
                ACTIVE_SESSION
              </Text>
              <View style={[styles.itemCount, { backgroundColor: theme.primary + "20" }]}>
                <Text style={[styles.itemCountText, { color: theme.primary }]}>
                  {totalItems} ITEM{totalItems !== 1 ? 'S' : ''}
                </Text>
              </View>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={60} color={theme.subtext + "40"} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  NO_ITEMS_LOGGED
                </Text>
                <Text style={[styles.emptyText, { color: theme.subtext }]}>
                  Scan products to add to session
                </Text>
              </View>
            ) : (
              <View style={styles.cartList}>
                {cart.map((item) => (
                  <View
                    key={item._id}
                    style={[
                      styles.cartItem,
                      { 
                        backgroundColor: theme.background + "80",
                        borderColor: theme.border 
                      },
                    ]}
                  >
                    {/* Product Image */}
                    <View style={[styles.productThumb, { backgroundColor: theme.background }]}>
                      {item.imageUrl ? (
                        <Image 
                          source={{ uri: item.imageUrl }} 
                          style={styles.thumbImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="cube-outline" size={24} color={theme.subtext} />
                      )}
                    </View>

                    {/* Product Info */}
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: theme.text }]}>
                        {item.name}
                      </Text>
                      <View style={styles.itemMeta}>
                        <Ionicons name="barcode-outline" size={12} color={theme.subtext} />
                        <Text style={[styles.itemBarcode, { color: theme.subtext }]}>
                          {item.barcode}
                        </Text>
                        <Text style={[styles.itemStock, { color: theme.subtext }]}>
                          • {item.quantityInStock} available
                        </Text>
                      </View>
                    </View>

                    {/* Quantity Controls */}
                    <View style={styles.qtySection}>
                      <View style={styles.qtyControls}>
                        <Pressable
                          style={[styles.qtyBtn, { backgroundColor: theme.background }]}
                          onPress={() => {
                            if (item.quantity === 1) {
                              removeItem(item._id);
                            } else {
                              setCart(cart.map(i =>
                                i._id === item._id
                                  ? { ...i, quantity: i.quantity - 1 }
                                  : i
                              ));
                            }
                          }}
                        >
                          <Ionicons 
                            name={item.quantity === 1 ? "trash-outline" : "remove"} 
                            size={16} 
                            color={item.quantity === 1 ? theme.notification : theme.text} 
                          />
                        </Pressable>

                        <Text style={[styles.qtyValue, { color: theme.text }]}>
                          {item.quantity}
                        </Text>

                        <Pressable
                          style={[
                            styles.qtyBtn, 
                            { 
                              backgroundColor: theme.background,
                              opacity: item.quantity >= item.quantityInStock ? 0.5 : 1
                            }
                          ]}
                          onPress={() => {
                            if (item.quantity < item.quantityInStock) {
                              setCart(cart.map(i =>
                                i._id === item._id
                                  ? { ...i, quantity: i.quantity + 1 }
                                  : i
                              ));
                            } else {
                              Toast.show({
                                type: "error",
                                text1: "Stock Limit",
                                text2: "Cannot exceed available quantity",
                              });
                            }
                          }}
                          disabled={item.quantity >= item.quantityInStock}
                        >
                          <Ionicons name="add" size={16} color={theme.text} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Complete Transaction Button */}
          {cart.length > 0 && (
            <Pressable
              style={[styles.finalizeBtn, { backgroundColor: theme.primary }]}
              onPress={() => setShowFefoModal(true)}
            >
              <Ionicons name="checkmark-done-outline" size={22} color="#FFF" />
              <Text style={styles.finalizeText}>COMPLETE_TRANSACTION</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* FEFO Confirmation Modal */}
      <Modal visible={showFefoModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={60}
              color={theme.primary}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Confirm Sale
            </Text>
            <Text style={[styles.modalSub, { color: theme.subtext }]}>
              Inventory will be deducted using First-Expired, First-Out (FEFO)
              logic. This ensures stock freshness and proper rotation.
            </Text>

            <View style={styles.modalStats}>
              <View style={styles.modalStat}>
                <Text style={[styles.modalStatValue, { color: theme.primary }]}>
                  {cart.length}
                </Text>
                <Text style={[styles.modalStatLabel, { color: theme.subtext }]}>
                  Products
                </Text>
              </View>
              <View style={styles.modalDivider} />
              <View style={styles.modalStat}>
                <Text style={[styles.modalStatValue, { color: theme.primary }]}>
                  {totalItems}
                </Text>
                <Text style={[styles.modalStatLabel, { color: theme.subtext }]}>
                  Total Units
                </Text>
              </View>
            </View>

            {isSyncing ? (
              <ActivityIndicator
                size="large"
                color={theme.primary}
                style={{ margin: 20 }}
              />
            ) : (
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: theme.background }]}
                  onPress={() => setShowFefoModal(false)}
                >
                  <Text style={[styles.modalBtnText, { color: theme.text }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.modalBtn,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={finalizeSale}
                >
                  <Text style={[styles.modalBtnText, { color: "#FFF" }]}>
                    Confirm Sale
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  systemTag: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: { 
    fontSize: 32, 
    fontWeight: "900",
    letterSpacing: -1,
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  scanBtnText: { 
    color: "#FFF", 
    fontWeight: "900", 
    fontSize: 14,
    letterSpacing: 1,
  },

  scrollPadding: { paddingHorizontal: 20, paddingBottom: 100 },
  
  card: { 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: { 
    fontSize: 12, 
    fontWeight: "900", 
    letterSpacing: 2,
  },
  itemCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },

  emptyContainer: { 
    alignItems: "center", 
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "600",
  },

  cartList: {
    gap: 12,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  productThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  itemInfo: { 
    flex: 1,
    gap: 4,
  },
  itemName: { 
    fontSize: 15, 
    fontWeight: "800",
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  itemBarcode: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  itemStock: {
    fontSize: 11,
    fontWeight: "600",
  },

  qtySection: {
    alignItems: "flex-end",
  },
  qtyControls: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: "900",
    minWidth: 30,
    textAlign: "center",
  },

  finalizeBtn: {
    height: 60,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  finalizeText: { 
    color: "#FFF", 
    fontWeight: "900", 
    fontSize: 15,
    letterSpacing: 1,
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
    borderRadius: 28,
    alignItems: "center",
  },
  modalTitle: { 
    fontSize: 24, 
    fontWeight: "900", 
    marginTop: 16,
    marginBottom: 12,
  },
  modalSub: {
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    fontSize: 13,
  },
  modalStats: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(150,150,150,0.2)",
  },
  modalStat: {
    flex: 1,
    alignItems: "center",
  },
  modalStatValue: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modalDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(150,150,150,0.2)",
  },
  modalActions: { 
    flexDirection: "row", 
    gap: 12,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});