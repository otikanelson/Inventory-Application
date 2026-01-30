import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ImageBackground,
  RefreshControl,
  Pressable,
  Dimensions,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useProducts } from "../../hooks/useProducts";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function FEFOScreen() {
  const { theme, isDark } = useTheme();
  const { products, loading, refresh } = useProducts();
  const router = useRouter();

  // New state to toggle view mode
  const [viewByProduct, setViewByProduct] = useState(false);

  const backgroundImage =
    isDark ?
      require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  /** * FEFO Technical Logic: Flattening Batches into a Priority Queue
   * Enhanced to support grouping by product (showing only the soonest batch)
   **/
  const priorityQueue = useMemo(() => {
    const queue: any[] = [];

    products.forEach((product) => {
      if (
        product.isPerishable &&
        product.batches &&
        product.batches.length > 0
      ) {
        const productBatches = product.batches.map((batch) => {
          const daysLeft = Math.ceil(
            (new Date(batch.expiryDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          );
          return {
            ...batch,
            parentName: product.name,
            parentId: product._id,
            daysLeft,
            category: product.category,
          };
        });

        if (viewByProduct) {
          // Find only the batch closest to expiry for this product
          const soonestBatch = productBatches.reduce((prev, curr) =>
            prev.daysLeft < curr.daysLeft ? prev : curr,
          );
          queue.push(soonestBatch);
        } else {
          // Push all batches normally
          queue.push(...productBatches);
        }
      }
    });

    // Sort the final queue by most urgent (lowest daysLeft)
    return queue.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [products, viewByProduct]);

  const getStatusColor = (days: number) => {
    if (days < 0) return "#FF4444"; // Expired (Red)
    if (days < 7) return "#ff6a00ff"; // Critical (Dark Orange)
    if (days < 30) return "#FFD700"; // Warning (Yellow/Gold)
    return "#4CAF50"; // Stable (Green)
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
      />

      <FlatList
        data={priorityQueue}
        keyExtractor={(item, idx) => (item._id || item.batchNumber) + idx}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.primary}
          />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <View style={styles.navRow}>
              <Text style={[styles.systemTag, { color: theme.primary }]}>
                SYSTEM_STATUS_v2.0
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <Text style={[styles.title, { color: theme.text }]}>
                FEFO_QUEUE
              </Text>

              <Pressable
                onPress={() => setViewByProduct(!viewByProduct)}
                style={[
                  styles.filterToggle,
                  {
                    borderColor: theme.primary,
                    backgroundColor:
                      viewByProduct ? theme.primary : "transparent",
                  },
                ]}
              >
                <Ionicons
                  name={viewByProduct ? "copy" : "copy-outline"}
                  size={14}
                  color={viewByProduct ? "#FFF" : theme.primary}
                />
                <Text
                  style={[
                    styles.filterToggleText,
                    { color: viewByProduct ? "#FFF" : theme.text },
                  ]}
                >
                  {viewByProduct ? "BY_PRODUCT" : "BY_BATCH"}
                </Text>
              </Pressable>
            </View>

            <View style={[styles.statsStrip, { borderColor: theme.border }]}>
              <Text style={[styles.statsText, { color: theme.subtext }]}>
                MONITORING{" "}
                <Text style={{ color: theme.text, fontWeight: "900" }}>
                  {priorityQueue.length}
                </Text>{" "}
                {viewByProduct ? "UNIQUE_ITEMS" : "ACTIVE_BATCHES"}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const statusColor = getStatusColor(item.daysLeft);

          return (
            <Pressable
              onPress={() => router.push(`/product/${item.parentId}`)}
              style={[
                styles.technicalRow,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View
                style={[styles.indicator, { backgroundColor: statusColor }]}
              />

              <View style={styles.mainInfo}>
                <View style={styles.topLine}>
                  <Text style={[styles.batchId, { color: theme.subtext }]}>
                    {viewByProduct ?
                      "SOONEST_EXPIRY"
                    : `BATCH_#${item.batchNumber?.slice(-7).toUpperCase() || "MANUAL"}`
                    }
                  </Text>
                  <Text style={[styles.daysCounter, { color: statusColor }]}>
                    {item.daysLeft < 0 ?
                      "EXPIRED"
                    : `${item.daysLeft}d_REMAINING`}
                  </Text>
                </View>

                <Text
                  style={[styles.name, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {item.parentName.toUpperCase()}
                </Text>

                <View style={styles.bottomLine}>
                  <View style={styles.tag}>
                    <Ionicons
                      name="cube-outline"
                      size={10}
                      color={theme.primary}
                    />
                    <Text style={[styles.tagText, { color: theme.subtext }]}>
                      {viewByProduct ? "Multi-Batch" : `${item.quantity} units`}
                    </Text>
                  </View>
                  <View style={styles.tag}>
                    <Ionicons
                      name="calendar-outline"
                      size={10}
                      color={theme.primary}
                    />
                    <Text style={[styles.tagText, { color: theme.subtext }]}>
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.rankContainer}>
                <Text style={[styles.rankText, { color: theme.border }]}>
                  {index + 1}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !loading ?
            <View style={styles.emptyContainer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={48}
                color={theme.subtext + "40"}
              />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                ALL_SYSTEMS_STABLE
              </Text>
              <Text
                style={{ color: theme.subtext, fontSize: 12, marginTop: 5 }}
              >
                No expiring items detected in current registry
              </Text>
            </View>
          : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 110 },
  headerArea: { marginTop: 40, marginBottom: 25 },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 5,
  },
  systemTag: { fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  title: { fontSize: 30, fontWeight: "900", letterSpacing: -1 },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginBottom: 5,
  },
  filterToggleText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statsStrip: {
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderStyle: "dashed",
  },
  statsText: { fontSize: 11, fontWeight: "600" },
  technicalRow: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
    height: 95,
  },
  indicator: { width: 6, height: "100%" },
  mainInfo: { flex: 1, padding: 15, justifyContent: "center" },
  topLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  batchId: { fontSize: 10, fontWeight: "800", fontFamily: "monospace" },
  daysCounter: { fontSize: 10, fontWeight: "900" },
  name: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  bottomLine: { flexDirection: "row", gap: 12 },
  tag: { flexDirection: "row", alignItems: "center", gap: 4 },
  tagText: { fontSize: 10, fontWeight: "700" },
  rankContainer: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(150,150,150,0.1)",
  },
  rankText: { fontSize: 24, fontWeight: "900" },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
