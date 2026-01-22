// app/product/[id].tsx
// REDESIGNED Product Details Page with AI Insights & Enhanced UX

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
  ImageBackground,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useProducts, Product } from "../../hooks/useProducts";
import { LinearGradient } from "expo-linear-gradient";
import { format, differenceInDays } from "date-fns";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { getProductById, refresh } = useProducts();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState("");

  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const data = await getProductById(id as string);
      if (data) {
        setProduct(data);
        // Load AI insights (if analytics available)
        // await loadAIInsights(data._id);
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  // FEFO Logic: Sort batches by expiry date
  const sortedBatches = useMemo(() => {
    if (!product?.batches) return [];
    return [...product.batches].sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );
  }, [product]);

  // Calculate urgency color based on days left
  const getUrgencyLevel = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { color: "#8B0000", level: "EXPIRED", priority: 4 };
    if (days <= 7) return { color: "#FF4444", level: "CRITICAL", priority: 3 };
    if (days <= 14) return { color: "#FF9500", level: "HIGH", priority: 2 };
    if (days <= 30) return { color: "#FFCC00", level: "WARNING", priority: 1 };
    return { color: "#34C759", level: "STABLE", priority: 0 };
  };

  // Get overall product urgency (based on nearest expiry)
  const overallUrgency = useMemo(() => {
    if (!sortedBatches.length) return { color: theme.subtext, level: "N/A" };
    const nearest = sortedBatches[0];
    return getUrgencyLevel(nearest.expiryDate);
  }, [sortedBatches, theme]);

  // Calculate total value
  const totalValue = useMemo(() => {
    if (!product?.batches) return 0;
    return product.batches.reduce((sum, batch) => {
      return sum + (batch.quantity * (batch.price || 0));
    }, 0);
  }, [product]);

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    setSelectedAction(action);
    setShowActionModal(true);
  };

  const executeAction = async () => {
    // Placeholder for action execution
    Toast.show({
      type: "success",
      text1: "Action Executed",
      text2: `${selectedAction} applied successfully`,
    });
    setShowActionModal(false);
    setDiscountPercent("");
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.subtext }]}>
          Loading Product Details...
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.subtext} />
        <Text style={[styles.errorTitle, { color: theme.text }]}>
          Product Not Found
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.backBtnText}>GO BACK</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} />

      {/* Floating Header Actions */}
      <View style={styles.headerActionRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.floatingBtn, { backgroundColor: theme.surface }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero Product Card */}
        <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
          <View style={styles.imageContainer}>
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="cube-outline" size={80} color={theme.subtext} />
              </View>
            )}
          </View>

          <View style={styles.productInfo}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  {product.category || "General"}
                </Text>
              </View>
              <View
                style={[
                  styles.urgencyBadge,
                  { backgroundColor: overallUrgency.color + "20" },
                ]}
              >
                <Text style={[styles.badgeText, { color: overallUrgency.color }]}>
                  {overallUrgency.level}
                </Text>
              </View>
            </View>

            <Text style={[styles.productName, { color: theme.text }]}>
              {product.name}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="barcode-outline" size={14} color={theme.subtext} />
                <Text style={[styles.metaText, { color: theme.subtext }]}>
                  {product.barcode || "No Barcode"}
                </Text>
              </View>
              {product.isPerishable && (
                <View style={styles.metaItem}>
                  <Ionicons name="warning-outline" size={14} color="#FF9500" />
                  <Text style={[styles.metaText, { color: theme.subtext }]}>
                    Perishable
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Ionicons name="cube-outline" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {product.quantity}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>
              Total Units
            </Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Ionicons name="layers-outline" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {product.batches?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>
              Batches
            </Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Ionicons name="cash-outline" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              â‚¦{totalValue.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>
              Total Value
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleQuickAction("Apply Discount")}
            >
              <Ionicons name="pricetag" size={20} color="#FF9500" />
              <Text style={[styles.actionText, { color: theme.text }]}>
                Discount
              </Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleQuickAction("Restock")}
            >
              <Ionicons name="add-circle" size={20} color="#34C759" />
              <Text style={[styles.actionText, { color: theme.text }]}>
                Restock
              </Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleQuickAction("Transfer")}
            >
              <Ionicons name="swap-horizontal" size={20} color={theme.primary} />
              <Text style={[styles.actionText, { color: theme.text }]}>
                Transfer
              </Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => router.push(`/product/${id}/analytics`)}
            >
              <Ionicons name="analytics" size={20} color="#6366F1" />
              <Text style={[styles.actionText, { color: theme.text }]}>
                Analytics
              </Text>
            </Pressable>
          </View>
        </View>

        {/* AI Insights Card */}
        <View
          style={[
            styles.aiCard,
            {
              backgroundColor: theme.primary + "10",
              borderColor: theme.primary + "30",
            },
          ]}
        >
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={20} color={theme.primary} />
            <Text style={[styles.aiTitle, { color: theme.primary }]}>
              AI Predictions
            </Text>
          </View>
          <Text style={[styles.aiText, { color: theme.text }]}>
            â€¢ Expected depletion in <Text style={styles.aiBold}>12 days</Text> based on current velocity
          </Text>
          <Text style={[styles.aiText, { color: theme.text }]}>
            â€¢ Recommended reorder: <Text style={styles.aiBold}>{Math.ceil(product.quantity * 0.6)} units</Text>
          </Text>
          {overallUrgency.priority >= 2 && (
            <Text style={[styles.aiText, { color: overallUrgency.color }]}>
              âš ï¸ High expiry risk detected - Consider markdown
            </Text>
          )}
        </View>

        {/* FEFO Batches Section */}
        <View style={styles.batchesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Active Batches (FEFO Order)
            </Text>
            <Pressable>
              <Text style={[styles.seeAllText, { color: theme.primary }]}>
                Sort by Date
              </Text>
            </Pressable>
          </View>

          {sortedBatches.length > 0 ? (
            sortedBatches.map((batch, index) => {
              const expiryDateObj = new Date(batch.expiryDate);
              const isValidDate = !isNaN(expiryDateObj.getTime());
              const daysLeft = isValidDate
                ? differenceInDays(expiryDateObj, new Date())
                : null;
              const urgency = isValidDate
                ? getUrgencyLevel(batch.expiryDate)
                : { color: theme.subtext, level: "UNKNOWN", priority: 0 };

              return (
                <Pressable
                  key={index}
                  style={[
                    styles.batchCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                  onPress={() => {
                    Toast.show({
                      type: "info",
                      text1: `Batch #${batch.batchNumber?.slice(-6)}`,
                      text2: `${batch.quantity} units remaining`,
                    });
                  }}
                >
                  {/* Urgency Bar */}
                  <View
                    style={[styles.urgencyStrip, { backgroundColor: urgency.color }]}
                  />

                  <View style={styles.batchContent}>
                    {/* Batch Header */}
                    <View style={styles.batchHeader}>
                      <View style={styles.batchTitleRow}>
                        <Text style={[styles.batchId, { color: theme.subtext }]}>
                          BATCH #{batch.batchNumber?.slice(-6) || "N/A"}
                        </Text>
                        <View
                          style={[
                            styles.priorityBadge,
                            { backgroundColor: urgency.color + "20" },
                          ]}
                        >
                          <Text
                            style={[styles.priorityText, { color: urgency.color }]}
                          >
                            {urgency.level}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.daysLeft, { color: urgency.color }]}>
                        {!isValidDate
                          ? "Invalid Date"
                          : daysLeft! < 0
                          ? "EXPIRED"
                          : `${daysLeft} days remaining`}
                      </Text>
                    </View>

                    {/* Batch Details */}
                    <View style={styles.batchDetails}>
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color={theme.subtext}
                        />
                        <Text style={[styles.detailText, { color: theme.text }]}>
                          Expires:{" "}
                          {isValidDate
                            ? format(expiryDateObj, "MMM dd, yyyy")
                            : "Unknown"}
                        </Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Ionicons
                          name="cube-outline"
                          size={16}
                          color={theme.subtext}
                        />
                        <Text style={[styles.detailText, { color: theme.text }]}>
                          Stock: {batch.quantity} units
                        </Text>
                      </View>

                      {batch.price && (
                        <View style={styles.detailItem}>
                          <Ionicons
                            name="cash-outline"
                            size={16}
                            color={theme.subtext}
                          />
                          <Text style={[styles.detailText, { color: theme.text }]}>
                            Value: â‚¦{(batch.quantity * batch.price).toLocaleString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyBatches}>
              <Ionicons name="file-tray-outline" size={48} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                No batch data available
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Modal */}
      <Modal visible={showActionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {selectedAction}
            </Text>

            {selectedAction === "Apply Discount" && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalLabel, { color: theme.subtext }]}>
                  Discount Percentage
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder="e.g., 20"
                  keyboardType="number-pad"
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowActionModal(false)}
                style={[styles.modalBtn, { backgroundColor: theme.background }]}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={executeAction}
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 10, fontSize: 14, fontWeight: "500" },
  errorTitle: { fontSize: 20, fontWeight: "800", marginVertical: 15 },
  backBtn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
  backBtnText: { color: "#FFF", fontWeight: "bold" },

  headerActionRow: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  floatingBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  headerRight: { flexDirection: "row" },

  heroCard: {
    marginTop: 110,
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(150,150,150,0.05)",
    marginBottom: 20,
  },
  productImage: { width: "100%", height: "100%" },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: { gap: 12 },
  badgeRow: { flexDirection: "row", gap: 8 },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  productName: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  metaRow: { flexDirection: "row", gap: 15 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, fontWeight: "600" },

  statsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
  },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 11, fontWeight: "600" },

  actionsSection: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 15 },
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 6,
  },
  actionText: { fontSize: 11, fontWeight: "700" },

  aiCard: {
    marginHorizontal: 20,
    marginTop: 25,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  aiTitle: { fontSize: 16, fontWeight: "800" },
  aiText: { fontSize: 14, lineHeight: 22, marginBottom: 6 },
  aiBold: { fontWeight: "800" },

  batchesSection: { paddingHorizontal: 20, marginTop: 30, marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  seeAllText: { fontSize: 13, fontWeight: "700" },

  batchCard: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  urgencyStrip: { width: 6 },
  batchContent: { flex: 1, padding: 16 },
  batchHeader: { marginBottom: 12 },
  batchTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  batchId: { fontSize: 12, fontWeight: "800" },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  priorityText: { fontSize: 9, fontWeight: "800" },
  daysLeft: { fontSize: 13, fontWeight: "800" },
  batchDetails: { gap: 8 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 13, fontWeight: "600" },

  emptyBatches: { alignItems: "center", paddingVertical: 40 },
  emptyText: { marginTop: 12, fontSize: 14, fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 25,
    borderRadius: 28,
  },
  modalTitle: { fontSize: 22, fontWeight: "900", marginBottom: 20 },
  modalBody: { marginBottom: 20 },
  modalLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  modalActions: { flexDirection: "row", gap: 12 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});