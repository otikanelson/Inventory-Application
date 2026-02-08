import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useAudioPlayer } from "expo-audio";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    ImageBackground,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useTheme } from "../../context/ThemeContext";
import { useProducts } from "../../hooks/useProducts";

const { width } = Dimensions.get("window");

export default function AdminSales() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { products, refresh } = useProducts();
  const { cartData } = useLocalSearchParams();

  // State
  const [cart, setCart] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showFefoModal, setShowFefoModal] = useState(false);

  // Audio
  const scanBeep = useAudioPlayer(require("../../assets/sounds/beep.mp3"));

  // Initialize cart from scanner if data is passed
  useEffect(() => {
    if (cartData && typeof cartData === 'string') {
      try {
        const parsedCart = JSON.parse(cartData);
        setCart(parsedCart);
        Toast.show({
          type: 'success',
          text1: 'Cart Loaded',
          text2: `${parsedCart.length} items ready for checkout`
        });
      } catch (error) {
        console.error('Error parsing cart data:', error);
      }
    }
  }, [cartData]);

  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  // Process FEFO Sale
  const finalizeSale = async () => {
    setIsSyncing(true);
    try {
      const saleData = cart.map((item) => {
        // Get price from the product - use genericPrice or average batch price
        const product = products.find(p => p._id === item._id);
        let price = 0;
        
        if (product) {
          if (product.genericPrice && product.genericPrice > 0) {
            price = product.genericPrice;
          } else if (product.batches && product.batches.length > 0) {
            // Calculate average price from batches with prices
            const batchesWithPrice = product.batches.filter(b => b.price && b.price > 0);
            if (batchesWithPrice.length > 0) {
              price = batchesWithPrice.reduce((sum, b) => sum + b.price, 0) / batchesWithPrice.length;
            }
          }
        }

        return {
          productId: item._id,
          quantity: item.quantity,
          price: price,
          paymentMethod: 'cash' // Default payment method
        };
      });

      await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/products/process-sale`,
        { items: saleData }
      );

      setCart([]);
      setShowFefoModal(false);
      refresh();
      Toast.show({
        type: "success",
        text1: "Transaction Complete",
        text2: "Inventory updated via FEFO logic",
      });
    } catch (err) {
      console.error("Sale Error:", err);
      Toast.show({
        type: "error",
        text1: "Transaction Failed",
        text2: "Could not process sale",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item._id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          const maxStock = item.totalQuantity || 999; // Fallback if totalQuantity is missing
          return {
            ...item,
            quantity: Math.min(newQty, maxStock),
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
      />

      {/* Technical Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.systemLabel, { color: theme.primary }]}>
            ADMIN//SALES_TERMINAL
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            TRANSACTION_LOG
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/admin/scan")}
          style={[styles.scanButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="scan" size={20} color="#FFF" />
          <Text style={styles.scanButtonText}>SCAN</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sales Session Panel */}
        <View
          style={[
            styles.sessionPanel,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.panelHeader}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: cart.length > 0 ? "#34C759" : theme.border },
                ]}
              />
              <Text style={[styles.panelTitle, { color: theme.text }]}>
                ACTIVE SESSION
              </Text>
            </View>
            <Text style={[styles.itemCount, { color: theme.subtext }]}>
              {cart.length} {cart.length === 1 ? "ITEM" : "ITEMS"}
            </Text>
          </View>

          {/* Product List - Professional Table Style */}
          {cart.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={64} color={theme.subtext + "40"} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                NO ITEMS IN SESSION
              </Text>
              <Text style={[styles.emptyHint, { color: theme.subtext }]}>
                Scan products to begin transaction
              </Text>
            </View>
          ) : (
            <View style={styles.productList}>
              {/* Table Header */}
              <View
                style={[
                  styles.tableHeader,
                  { borderBottomColor: theme.border },
                ]}
              >
                <Text
                  style={[
                    styles.tableHeaderText,
                    { color: theme.subtext, flex: 1 },
                  ]}
                >
                  PRODUCT
                </Text>
                <Text
                  style={[
                    styles.tableHeaderText,
                    { color: theme.subtext, width: 120, textAlign: "center" },
                  ]}
                >
                  QUANTITY
                </Text>
                <Text
                  style={[
                    styles.tableHeaderText,
                    { color: theme.subtext, width: 40 },
                  ]}
                >
                  {" "}
                </Text>
              </View>

              {/* Product Rows */}
              {cart.map((item, index) => (
                <View
                  key={item._id}
                  style={[
                    styles.productRow,
                    {
                      borderBottomColor: theme.border,
                      borderBottomWidth: index < cart.length - 1 ? 1 : 0,
                    },
                  ]}
                >
                  {/* Product Info */}
                  <View style={styles.productInfo}>
                    <Text
                      style={[styles.productName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.productMeta, { color: theme.subtext }]}>
                      Available: {item.totalQuantity || 0} units
                    </Text>
                  </View>

                  {/* Quantity Controls */}
                  <View style={styles.quantityControls}>
                    <Pressable
                      style={[
                        styles.qtyButton,
                        { 
                          backgroundColor: theme.background,
                          borderWidth: 1,
                          borderColor: theme.border,
                        },
                      ]}
                      onPress={() => updateQuantity(item._id, -1)}
                    >
                      <Ionicons name="remove" size={16} color={theme.text} />
                    </Pressable>

                    <View style={styles.qtyDisplay}>
                      <Text style={[styles.qtyText, { color: theme.text }]}>
                        {item.quantity}
                      </Text>
                    </View>

                    <Pressable
                      style={[
                        styles.qtyButton,
                        { 
                          backgroundColor: theme.background,
                          borderWidth: 1,
                          borderColor: theme.border,
                        },
                      ]}
                      onPress={() => updateQuantity(item._id, 1)}
                    >
                      <Ionicons name="add" size={16} color={theme.text} />
                    </Pressable>
                  </View>

                  {/* Remove Button */}
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeFromCart(item._id)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Complete Transaction Button */}
          {cart.length > 0 && (
            <Pressable
              style={[styles.completeButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowFefoModal(true)}
            >
              <Ionicons name="checkmark-done" size={20} color="#FFF" />
              <Text style={styles.completeButtonText}>
                COMPLETE TRANSACTION
              </Text>
            </Pressable>
          )}
        </View>

        {/* Info Panel */}
        <View
          style={[
            styles.infoPanel,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.subtext }]}>
            All sales use FEFO (First-Expired-First-Out) logic to automatically
            deduct from batches closest to expiry
          </Text>
        </View>
      </ScrollView>

      {/* FEFO Confirmation Modal */}
      <Modal visible={showFefoModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={64}
              color={theme.primary}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              CONFIRM TRANSACTION
            </Text>
            <Text style={[styles.modalText, { color: theme.subtext }]}>
              Inventory will be deducted using FEFO logic to ensure stock
              freshness. This action cannot be undone.
            </Text>

            {isSyncing ? (
              <ActivityIndicator
                size="large"
                color={theme.primary}
                style={{ marginVertical: 20 }}
              />
            ) : (
              <View style={styles.modalActions}>
                <Pressable
                  style={[
                    styles.modalButton,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                  onPress={() => setShowFefoModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.modalButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={finalizeSale}
                >
                  <Text
                    style={[styles.modalButtonText, { color: "#FFF" }]}
                  >
                    Confirm
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  systemLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scanButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  sessionPanel: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150,150,150,0.1)",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  itemCount: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 16,
    letterSpacing: 0.5,
  },
  emptyHint: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },

  productList: {},
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderStyle: "dashed",
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  productMeta: {
    fontSize: 11,
    fontWeight: "600",
  },

  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: 120,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyDisplay: {
    flex: 1,
    alignItems: "center",
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  removeButton: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  completeButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  infoPanel: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
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
    borderRadius: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 16,
    marginBottom: 10,
    letterSpacing: 1,
  },
  modalText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});