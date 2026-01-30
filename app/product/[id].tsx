import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useProducts } from "../../hooks/useProducts";
import axios from "axios";

const { width } = Dimensions.get("window");

interface Batch {
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  receivedDate?: string;
  price?: number;
}

interface PredictionData {
  nextWeekDemand?: number;
  stockoutRisk?: number;
  optimalOrderQty?: number;
  trend?: string;
  demandVelocity?: number;
  averageSalesPerDay?: number;
  daysUntilStockout?: number;
}

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { getProductById } = useProducts();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);

  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    const data = await getProductById(id as string);
    if (data) {
      setProduct(data);
      
      // Fetch AI predictions
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/analytics/predictions/${id}`
        );
        if (response.ok) {
          const predData = await response.json();
          setPrediction(predData.data);
        }
      } catch (err) {
        console.log("Predictions not available");
      }
    }
    setLoading(false);
  };

  // Price analytics
  const priceAnalytics = useMemo(() => {
    if (!product) return null;

    const genericPrice = product.genericPrice || null;
    const batches = product.batches || [];
    
    // Calculate batch price statistics
    const batchesWithPrice = batches.filter((b: Batch) => b.price && b.price > 0);
    
    if (batchesWithPrice.length === 0) {
      return {
        genericPrice,
        hasBatchPrices: false,
        avgBatchPrice: null,
        minBatchPrice: null,
        maxBatchPrice: null,
      };
    }

    const prices = batchesWithPrice.map((b: Batch) => b.price!);
    const avgBatchPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const minBatchPrice = Math.min(...prices);
    const maxBatchPrice = Math.max(...prices);

    return {
      genericPrice,
      hasBatchPrices: true,
      avgBatchPrice,
      minBatchPrice,
      maxBatchPrice,
      priceVariance: maxBatchPrice - minBatchPrice,
    };
  }, [product]);

  const getRiskLevel = () => {
    const stockoutRisk = prediction?.stockoutRisk || 0;
    if (stockoutRisk > 0.7) return { label: "CRITICAL", color: "#FF3B30" };
    if (stockoutRisk > 0.4) return { label: "HIGH", color: "#FF9500" };
    if (stockoutRisk > 0.2) return { label: "MODERATE", color: "#FFD60A" };
    return { label: "LOW", color: "#34C759" };
  };

  const getDemandVelocityLabel = () => {
    const velocity = prediction?.demandVelocity || 0;
    if (velocity > 10) return { label: "Very High", color: "#FF3B30" };
    if (velocity > 5) return { label: "High", color: "#FF9500" };
    if (velocity > 2) return { label: "Moderate", color: "#FFD60A" };
    if (velocity > 0.5) return { label: "Low", color: "#34C759" };
    return { label: "Very Low", color: theme.subtext };
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="cube-outline" size={80} color={theme.subtext} />
        <Text style={[styles.errorText, { color: theme.text }]}>
          Product Not Found
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.button, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const riskLevel = getRiskLevel();
  const velocityInfo = getDemandVelocityLabel();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: theme.surface }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Large Hero Image */}
        <View style={[styles.heroImageContainer, { backgroundColor: theme.surface }]}>
          {product.imageUrl && product.imageUrl !== "cube" ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="cube-outline" size={120} color={theme.subtext} />
            </View>
          )}
        </View>

        {/* Product Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Text style={[styles.badgeText, { color: theme.primary }]}>
                {product.category || "Uncategorized"}
              </Text>
            </View>
            {product.isPerishable && (
              <View
                style={[
                  styles.perishableBadge,
                  { backgroundColor: "#FF9500" + "20" },
                ]}
              >
                <Ionicons name="timer-outline" size={12} color="#FF9500" />
                <Text style={[styles.badgeText, { color: "#FF9500" }]}>
                  Perishable
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.productName, { color: theme.text }]}>
            {product.name}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="barcode-outline" size={16} color={theme.subtext} />
              <Text style={[styles.metaText, { color: theme.subtext }]}>
                {product.barcode}
              </Text>
            </View>
          </View>
        </View>

        {/* PRICING CARD - NEW */}
        {priceAnalytics && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="pricetag-outline" size={20} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Pricing Information
              </Text>
            </View>

            {/* Generic Price */}
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.subtext }]}>
                Generic Price
              </Text>
              <Text style={[styles.priceValue, { color: theme.text }]}>
                {priceAnalytics.genericPrice
                  ? `₦${priceAnalytics.genericPrice.toFixed(2)}`
                  : "N/A"}
              </Text>
            </View>

            {/* Batch Prices */}
            {priceAnalytics.hasBatchPrices && (
              <>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: theme.subtext }]}>
                    Avg Batch Price
                  </Text>
                  <Text style={[styles.priceValue, { color: theme.text }]}>
                    ₦{priceAnalytics.avgBatchPrice!.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: theme.subtext }]}>
                    Price Range
                  </Text>
                  <Text style={[styles.priceValue, { color: theme.text }]}>
                    ₦{priceAnalytics.minBatchPrice!.toFixed(2)} - ₦
                    {priceAnalytics.maxBatchPrice!.toFixed(2)}
                  </Text>
                </View>

                {priceAnalytics.priceVariance! > 0 && (
                  <View
                    style={[
                      styles.varianceBanner,
                      { backgroundColor: "#FFD60A" + "15", borderColor: "#FFD60A" },
                    ]}
                  >
                    <Ionicons name="trending-up" size={16} color="#FFD60A" />
                    <Text style={[styles.varianceText, { color: "#FFD60A" }]}>
                      Price variance: ₦{priceAnalytics.priceVariance!.toFixed(2)}
                    </Text>
                  </View>
                )}
              </>
            )}

            {!priceAnalytics.genericPrice && !priceAnalytics.hasBatchPrices && (
              <View style={styles.noPriceState}>
                <Ionicons name="alert-circle-outline" size={40} color={theme.subtext} />
                <Text style={[styles.noPriceText, { color: theme.subtext }]}>
                  No pricing information available
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Stock Status Card */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="cube-outline" size={20} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Stock Status
            </Text>
          </View>

          <View style={styles.stockGrid}>
            <View style={styles.stockItem}>
              <Text style={[styles.stockValue, { color: theme.text }]}>
                {product.totalQuantity}
              </Text>
              <Text style={[styles.stockLabel, { color: theme.subtext }]}>
                Total Units
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.stockItem}>
              <Text style={[styles.stockValue, { color: theme.text }]}>
                {product.batches?.length || 0}
              </Text>
              <Text style={[styles.stockLabel, { color: theme.subtext }]}>
                Batches
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor:
                  product.totalQuantity === 0 ? "#FF3B30" + "15"
                  : product.totalQuantity < 10 ? "#FF9500" + "15"
                  : "#34C759" + "15",
                borderColor:
                  product.totalQuantity === 0 ? "#FF3B30"
                  : product.totalQuantity < 10 ? "#FF9500"
                  : "#34C759",
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    product.totalQuantity === 0 ? "#FF3B30"
                    : product.totalQuantity < 10 ? "#FF9500"
                    : "#34C759",
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    product.totalQuantity === 0 ? "#FF3B30"
                    : product.totalQuantity < 10 ? "#FF9500"
                    : "#34C759",
                },
              ]}
            >
              {product.totalQuantity === 0 ? "Out of Stock"
                : product.totalQuantity < 10 ? "Low Stock"
                : "In Stock"}
            </Text>
          </View>
        </View>

        {/* AI Predictions Card */}
        {prediction && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up-outline" size={20} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                AI Forecast & Analytics
              </Text>
            </View>

            <View style={styles.predictionGrid}>
              <View style={styles.predictionItem}>
                <Text style={[styles.predictionValue, { color: theme.primary }]}>
                  {prediction.nextWeekDemand || 0}
                </Text>
                <Text style={[styles.predictionLabel, { color: theme.subtext }]}>
                  Predicted Demand (7d)
                </Text>
              </View>

              <View style={styles.predictionItem}>
                <Text style={[styles.predictionValue, { color: riskLevel.color }]}>
                  {riskLevel.label}
                </Text>
                <Text style={[styles.predictionLabel, { color: theme.subtext }]}>
                  Stockout Risk
                </Text>
              </View>

              <View style={styles.predictionItem}>
                <Text style={[styles.predictionValue, { color: theme.primary }]}>
                  {prediction.optimalOrderQty || 0}
                </Text>
                <Text style={[styles.predictionLabel, { color: theme.subtext }]}>
                  Recommended Order
                </Text>
              </View>
            </View>

            {/* Demand Velocity */}
            {prediction.demandVelocity !== undefined && (
              <View
                style={[
                  styles.velocityBanner,
                  { backgroundColor: velocityInfo.color + "15", borderColor: velocityInfo.color },
                ]}
              >
                <Ionicons name="speedometer-outline" size={18} color={velocityInfo.color} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.velocityTitle, { color: velocityInfo.color }]}>
                    Demand Velocity: {velocityInfo.label}
                  </Text>
                  <Text style={[styles.velocityDesc, { color: theme.subtext }]}>
                    {prediction.averageSalesPerDay?.toFixed(1) || 0} units/day average
                  </Text>
                </View>
              </View>
            )}

            {/* Days Until Stockout */}
            {prediction.daysUntilStockout !== undefined && prediction.daysUntilStockout > 0 && (
              <View
                style={[
                  styles.stockoutBanner,
                  {
                    backgroundColor:
                      prediction.daysUntilStockout < 7 ? "#FF3B30" + "15"
                      : prediction.daysUntilStockout < 14 ? "#FF9500" + "15"
                      : "#34C759" + "15",
                    borderColor:
                      prediction.daysUntilStockout < 7 ? "#FF3B30"
                      : prediction.daysUntilStockout < 14 ? "#FF9500"
                      : "#34C759",
                  },
                ]}
              >
                <Ionicons
                  name="timer-outline"
                  size={18}
                  color={
                    prediction.daysUntilStockout < 7 ? "#FF3B30"
                    : prediction.daysUntilStockout < 14 ? "#FF9500"
                    : "#34C759"
                  }
                />
                <Text
                  style={[
                    styles.stockoutText,
                    {
                      color:
                        prediction.daysUntilStockout < 7 ? "#FF3B30"
                        : prediction.daysUntilStockout < 14 ? "#FF9500"
                        : "#34C759",
                    },
                  ]}
                >
                  Estimated stockout in {Math.ceil(prediction.daysUntilStockout)} days
                </Text>
              </View>
            )}

            {prediction.trend && (
              <View style={[styles.trendBanner, { backgroundColor: theme.background }]}>
                <Ionicons
                  name={
                    prediction.trend === "increasing" ? "trending-up"
                    : prediction.trend === "decreasing" ? "trending-down"
                    : "remove"
                  }
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.trendText, { color: theme.text }]}>
                  Trend: {prediction.trend.charAt(0).toUpperCase() + prediction.trend.slice(1)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Batch Records */}
        {product.batches && product.batches.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="layers-outline" size={20} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Batch Records ({product.batches.length})
              </Text>
            </View>

            <View style={styles.batchList}>
              {product.batches.map((batch: Batch, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.batchItem,
                    { backgroundColor: theme.background + "80", borderColor: theme.border },
                  ]}
                >
                  <View style={styles.batchTop}>
                    <Text style={[styles.batchNumber, { color: theme.text }]}>
                      Batch #{batch.batchNumber?.slice(-6) || "N/A"}
                    </Text>
                    <Text style={[styles.batchQty, { color: theme.primary }]}>
                      {batch.quantity} units
                    </Text>
                  </View>

                  <View style={styles.batchBottom}>
                    {batch.expiryDate && batch.expiryDate !== "N/A" && (
                      <View style={styles.batchMeta}>
                        <Ionicons name="calendar-outline" size={14} color={theme.subtext} />
                        <Text style={[styles.batchExpiry, { color: theme.subtext }]}>
                          Expires: {new Date(batch.expiryDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    {batch.price && batch.price > 0 && (
                      <View style={styles.batchMeta}>
                        <Ionicons name="pricetag-outline" size={14} color={theme.subtext} />
                        <Text style={[styles.batchPrice, { color: theme.primary }]}>
                          ₦{batch.price.toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: "700",
    marginVertical: 20,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  header: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  headerBtn: {
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

  scrollContent: {
    paddingBottom: 40,
  },

  heroImageContainer: {
    width: "100%",
    height: 380,
    marginBottom: 20,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  infoCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  perishableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  productName: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "600",
  },

  card: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  // Pricing Styles
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  dividerLine: {
    height: 1,
    marginVertical: 8,
  },
  varianceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
  },
  varianceText: {
    fontSize: 13,
    fontWeight: "700",
  },
  noPriceState: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noPriceText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },

  stockGrid: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stockItem: {
    flex: 1,
    alignItems: "center",
  },
  stockValue: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 4,
  },
  stockLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(150,150,150,0.2)",
  },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
  },

  predictionGrid: {
    flexDirection: "row",
    marginBottom: 12,
  },
  predictionItem: {
    flex: 1,
    alignItems: "center",
  },
  predictionValue: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  predictionLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

  velocityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
  },
  velocityTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  velocityDesc: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  stockoutBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
  },
  stockoutText: {
    fontSize: 13,
    fontWeight: "700",
  },

  trendBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  trendText: {
    fontSize: 13,
    fontWeight: "600",
  },

  batchList: {
    gap: 10,
  },
  batchItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  batchTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  batchNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  batchQty: {
    fontSize: 14,
    fontWeight: "800",
  },
  batchBottom: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  batchMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  batchExpiry: {
    fontSize: 12,
    fontWeight: "600",
  },
  batchPrice: {
    fontSize: 13,
    fontWeight: "800",
  },
});