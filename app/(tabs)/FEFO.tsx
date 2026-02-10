import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useAIPredictions } from "../../hooks/useAIPredictions";
import { useProducts } from "../../hooks/useProducts";
import { Prediction } from "../../types/ai-predictions";

export default function FEFOScreen() {
  const { theme, isDark } = useTheme();
  const { products, loading, refresh } = useProducts();
  const { fetchBatchPredictions } = useAIPredictions({ enableWebSocket: false, autoFetch: false });
  const router = useRouter();

  // State to toggle view mode and sort mode
  const [viewByProduct, setViewByProduct] = useState(false);
  const [sortByAI, setSortByAI] = useState(false);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [showAIHelp, setShowAIHelp] = useState(false);

  const backgroundImage =
    isDark ?
      require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  // Fetch predictions for all perishable products
  useEffect(() => {
    const fetchPredictions = async () => {
      if (sortByAI && products.length > 0) {
        setLoadingPredictions(true);
        const perishableProducts = products.filter(p => p.isPerishable);
        const productIds = perishableProducts.map(p => p._id);
        
        if (productIds.length > 0) {
          try {
            const batchPredictions = await fetchBatchPredictions(productIds);
            const predictionsMap: Record<string, Prediction> = {};
            batchPredictions.forEach((pred: Prediction) => {
              if (pred.productId) {
                predictionsMap[pred.productId] = pred;
              }
            });
            setPredictions(predictionsMap);
          } catch (error) {
            console.error('Error fetching predictions:', error);
          }
        }
        setLoadingPredictions(false);
      }
    };
    fetchPredictions();
  }, [sortByAI, products, fetchBatchPredictions]);

  /** 
   * FEFO Technical Logic: Flattening Batches into a Priority Queue
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
          
          // Get prediction data for this product
          const prediction = predictions[product._id];
          const riskScore = prediction?.metrics?.riskScore || 0;
          
          return {
            ...batch,
            parentName: product.name,
            parentId: product._id,
            daysLeft,
            category: product.category,
            totalStock: product.totalQuantity,
            riskScore,
            prediction,
          };
        });

        if (viewByProduct) {
          // Find the batch with earliest expiry for this product
          const earliestBatch = productBatches.reduce((prev, curr) =>
            prev.daysLeft < curr.daysLeft ? prev : curr,
          );
          queue.push(earliestBatch);
        } else {
          // Push all batches normally
          queue.push(...productBatches);
        }
      }
    });

    // Sort by AI risk or expiry date
    if (sortByAI) {
      // Sort by risk score (highest first), then by days left as tiebreaker
      return queue.sort((a, b) => {
        if (b.riskScore !== a.riskScore) {
          return b.riskScore - a.riskScore;
        }
        return a.daysLeft - b.daysLeft;
      });
    } else {
      // Sort by days left (earliest first)
      return queue.sort((a, b) => a.daysLeft - b.daysLeft);
    }
  }, [products, viewByProduct, sortByAI, predictions]);

  const getStatusColor = (days: number) => {
    if (days < 0) return "#FF4444"; // Expired (Red)
    if (days < 7) return "#ff6a00ff"; // Critical (Dark Orange)
    if (days < 30) return "#FFD700"; // Warning (Yellow/Gold)
    return "#4CAF50"; // Stable (Green)
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 70) return '#FF3B30'; // Red
    if (riskScore >= 50) return '#FF9500'; // Orange
    if (riskScore >= 30) return '#FFCC00'; // Yellow
    return '#34C759'; // Green
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
            <Text style={[styles.systemTag, { color: theme.primary }]}>
              EXPIRY_MANAGEMENT
            </Text>
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

            <View style={styles.controlsRow}>
              <Pressable
                onPress={() => setSortByAI(!sortByAI)}
                style={[
                  styles.filterToggle,
                  {
                    borderColor: sortByAI ? '#FF9500' : theme.primary,
                    backgroundColor: sortByAI ? '#FF9500' : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={sortByAI ? 'sparkles' : 'sparkles-outline'}
                  size={10}
                  color={sortByAI ? '#FFF' : theme.primary}
                />
                <Text
                  style={[
                    styles.filterToggleText,
                    { color: sortByAI ? '#FFF' : theme.text },
                  ]}
                >
                  {sortByAI ? 'AI_RISK' : 'EXPIRY'}
                </Text>
              </Pressable>
              
              {/* AI Help Button */}
              {sortByAI && (
                <Pressable
                  onPress={() => setShowAIHelp(true)}
                  style={styles.helpButton}
                >
                  <Ionicons name="help-circle-outline" size={16} color={theme.primary} />
                </Pressable>
              )}

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
                  size={10}
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
          const statusColor = sortByAI ? getRiskColor(item.riskScore) : getStatusColor(item.daysLeft);

          return (
            <Pressable
              onPress={() => router.push(`/product/${item.parentId}`)}
              style={[
                styles.technicalRow,
                { 
                  backgroundColor: theme.surface, 
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[styles.indicator, { backgroundColor: statusColor }]}
              />

              <View style={styles.mainInfo}>
                <View style={styles.topLine}>
                  <View style={styles.batchIdContainer}>
                    <Text style={[styles.batchId, { color: theme.subtext }]}>
                      {viewByProduct ?
                        "SOONEST_EXPIRY"
                      : `BATCH_#${item.batchNumber?.slice(-7).toUpperCase() || "MANUAL"}`
                      }
                    </Text>
                  </View>
                  <View style={styles.rightInfo}>
                    {sortByAI && item.riskScore > 0 ? (
                      <>
                        <Text style={[styles.daysCounter, { color: statusColor }]}>
                          RISK_{item.riskScore}/100
                        </Text>
                        <Text style={[styles.priorityScore, { color: theme.subtext }]}>
                          {item.daysLeft < 0 ? 'EXPIRED' : `${item.daysLeft}d left`}
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.daysCounter, { color: statusColor }]}>
                        {item.daysLeft < 0 ?
                          "EXPIRED"
                        : `${item.daysLeft}d_REMAINING`}
                      </Text>
                    )}
                  </View>
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
                  {sortByAI && item.prediction?.recommendations?.[0] && (
                    <View style={[styles.riskBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.riskBadgeText}>
                        {item.prediction.recommendations[0].priority.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.rankContainer}>
                <Text style={[styles.rankText, { color: theme.border }]}>
                  {index + 1}
                </Text>
                {loadingPredictions && sortByAI && (
                  <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 4 }} />
                )}
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

      {/* AI Help Modal */}
      <Modal visible={showAIHelp} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.helpModal, { backgroundColor: theme.surface }]}>
            <View style={styles.helpModalHeader}>
              <Text style={[styles.helpModalTitle, { color: theme.text }]}>
                AI Risk Sorting
              </Text>
              <Pressable onPress={() => setShowAIHelp(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.helpSection}>
                <View style={[styles.helpIconBox, { backgroundColor: '#FF9500' + '15' }]}>
                  <Ionicons name="sparkles" size={24} color="#FF9500" />
                </View>
                <Text style={[styles.helpSectionTitle, { color: theme.text }]}>
                  What is AI Risk Sorting?
                </Text>
                <Text style={[styles.helpText, { color: theme.subtext }]}>
                  AI Risk Sorting uses machine learning to analyze multiple factors beyond just expiry dates. It considers sales velocity, stock levels, and historical patterns to predict which items are most at risk of expiring before being sold.
                </Text>
              </View>

              <View style={styles.helpSection}>
                <View style={[styles.helpIconBox, { backgroundColor: '#FF3B30' + '15' }]}>
                  <Ionicons name="warning" size={24} color="#FF3B30" />
                </View>
                <Text style={[styles.helpSectionTitle, { color: theme.text }]}>
                  Risk Score Explained
                </Text>
                <Text style={[styles.helpText, { color: theme.subtext }]}>
                  Risk scores range from 0-100:
                </Text>
                <View style={styles.riskLegend}>
                  <View style={styles.riskItem}>
                    <View style={[styles.riskDot, { backgroundColor: '#FF3B30' }]} />
                    <Text style={[styles.riskLabel, { color: theme.text }]}>
                      70-100: Critical Risk
                    </Text>
                  </View>
                  <View style={styles.riskItem}>
                    <View style={[styles.riskDot, { backgroundColor: '#FF9500' }]} />
                    <Text style={[styles.riskLabel, { color: theme.text }]}>
                      50-69: High Risk
                    </Text>
                  </View>
                  <View style={styles.riskItem}>
                    <View style={[styles.riskDot, { backgroundColor: '#FFCC00' }]} />
                    <Text style={[styles.riskLabel, { color: theme.text }]}>
                      30-49: Medium Risk
                    </Text>
                  </View>
                  <View style={styles.riskItem}>
                    <View style={[styles.riskDot, { backgroundColor: '#34C759' }]} />
                    <Text style={[styles.riskLabel, { color: theme.text }]}>
                      0-29: Low Risk
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.helpSection}>
                <View style={[styles.helpIconBox, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="analytics" size={24} color={theme.primary} />
                </View>
                <Text style={[styles.helpSectionTitle, { color: theme.text }]}>
                  Factors Considered
                </Text>
                <View style={styles.factorsList}>
                  <View style={styles.factorItem}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                    <Text style={[styles.factorText, { color: theme.subtext }]}>
                      Days until expiry
                    </Text>
                  </View>
                  <View style={styles.factorItem}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                    <Text style={[styles.factorText, { color: theme.subtext }]}>
                      Sales velocity (units/day)
                    </Text>
                  </View>
                  <View style={styles.factorItem}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                    <Text style={[styles.factorText, { color: theme.subtext }]}>
                      Current stock levels
                    </Text>
                  </View>
                  <View style={styles.factorItem}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                    <Text style={[styles.factorText, { color: theme.subtext }]}>
                      Historical sales patterns
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.helpTip, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}>
                <Ionicons name="bulb" size={20} color={theme.primary} />
                <Text style={[styles.helpTipText, { color: theme.text }]}>
                  Tip: Items with high risk scores should be prioritized for promotions or discounts to prevent waste.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  title: { fontSize: 25, fontWeight: "900", letterSpacing: -1 },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 5,
    marginLeft: 10,
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
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
    minHeight: 95,
  },
  indicator: { width: 6, height: "100%" },
  mainInfo: { flex: 1, padding: 15, justifyContent: "center" },
  topLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  batchIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  batchId: { fontSize: 10, fontWeight: "800", fontFamily: "monospace" },
  rightInfo: {
    alignItems: "flex-end",
  },
  daysCounter: { fontSize: 10, fontWeight: "900" },
  priorityScore: { fontSize: 8, fontWeight: "800", marginTop: 2 },
  name: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  bottomLine: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
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
  riskBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  riskBadgeText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "800",
  },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  aiExplanation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  aiExplanationText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  helpButton: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  helpModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  helpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  helpModalTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  helpSection: {
    padding: 24,
    paddingTop: 20,
  },
  helpIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  riskLegend: {
    marginTop: 12,
    gap: 12,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  riskLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  factorsList: {
    gap: 12,
    marginTop: 8,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  factorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helpTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  helpTipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
});
