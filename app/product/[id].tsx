import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useProducts } from "../../hooks/useProducts";

const { width } = Dimensions.get("window");

interface Batch {
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  receivedDate?: string;
  price?: number;
}

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { getProductById } = useProducts();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    const data = await getProductById(id as string);
    setProduct(data);
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
    const avgBatchPrice = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length;
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

  // Expiry analytics
  const expiryAnalytics = useMemo(() => {
    if (!product || !product.batches) return null;

    const now = new Date();
    const batches = product.batches;

    const expiringSoon = batches.filter((b: Batch) => {
      const expiry = new Date(b.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });

    const expired = batches.filter((b: Batch) => {
      const expiry = new Date(b.expiryDate);
      return expiry < now;
    });

    return {
      expiringSoonCount: expiringSoon.length,
      expiredCount: expired.length,
      totalBatches: batches.length,
    };
  }, [product]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>
          Product not found
        </Text>
      </View>
    );
  }

  const stockStatus =
    product.totalQuantity === 0
      ? "Out of Stock"
      : product.totalQuantity < 10
        ? "Low Stock"
        : "In Stock";

  const stockColor =
    product.totalQuantity === 0
      ? "#EF4444"
      : product.totalQuantity < 10
        ? "#F59E0B"
        : "#10B981";

  return (
    <ImageBackground
      source={require("../../assets/images/Background9.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView
        style={[styles.container, { backgroundColor: "transparent" }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Product Details
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Product Image */}
        <View style={[styles.imageContainer, { backgroundColor: theme.surface }]}>
          <Image
            source={
              product.imageUrl
                ? { uri: product.imageUrl }
                : require("../../assets/images/icon.png")
            }
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        {/* Product Info Card */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.productName, { color: theme.text }]}>
            {product.name}
          </Text>
          <Text style={[styles.category, { color: theme.subtext }]}>
            {product.category}
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="cube-outline" size={20} color={theme.primary} />
              <Text style={[styles.infoLabel, { color: theme.subtext }]}>
                Stock
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {product.totalQuantity}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="barcode-outline" size={20} color={theme.primary} />
              <Text style={[styles.infoLabel, { color: theme.subtext }]}>
                Barcode
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {product.barcode || "N/A"}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={stockColor}
              />
              <Text style={[styles.infoLabel, { color: theme.subtext }]}>
                Status
              </Text>
              <Text style={[styles.infoValue, { color: stockColor }]}>
                {stockStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Price Information */}
        {priceAnalytics && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash-outline" size={20} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Price Information
              </Text>
            </View>

            {priceAnalytics.genericPrice && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: theme.subtext }]}>
                  Generic Price:
                </Text>
                <Text style={[styles.priceValue, { color: theme.text }]}>
                  ${priceAnalytics.genericPrice.toFixed(2)}
                </Text>
              </View>
            )}

            {priceAnalytics.hasBatchPrices && (
              <>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: theme.subtext }]}>
                    Avg Batch Price:
                  </Text>
                  <Text style={[styles.priceValue, { color: theme.text }]}>
                    ${priceAnalytics.avgBatchPrice?.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: theme.subtext }]}>
                    Price Range:
                  </Text>
                  <Text style={[styles.priceValue, { color: theme.text }]}>
                    ${priceAnalytics.minBatchPrice?.toFixed(2)} - $
                    {priceAnalytics.maxBatchPrice?.toFixed(2)}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Expiry Analytics */}
        {product.isPerishable && expiryAnalytics && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={20} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Expiry Status
              </Text>
            </View>

            <View style={styles.expiryGrid}>
              <View style={styles.expiryItem}>
                <Text style={[styles.expiryCount, { color: "#F59E0B" }]}>
                  {expiryAnalytics.expiringSoonCount}
                </Text>
                <Text style={[styles.expiryLabel, { color: theme.subtext }]}>
                  Expiring Soon
                </Text>
              </View>

              <View style={styles.expiryItem}>
                <Text style={[styles.expiryCount, { color: "#EF4444" }]}>
                  {expiryAnalytics.expiredCount}
                </Text>
                <Text style={[styles.expiryLabel, { color: theme.subtext }]}>
                  Expired
                </Text>
              </View>

              <View style={styles.expiryItem}>
                <Text style={[styles.expiryCount, { color: theme.primary }]}>
                  {expiryAnalytics.totalBatches}
                </Text>
                <Text style={[styles.expiryLabel, { color: theme.subtext }]}>
                  Total Batches
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Batches */}
        {product.batches && product.batches.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="layers-outline" size={20} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Batches ({product.batches.length})
              </Text>
            </View>

            {product.batches.map((batch: Batch, index: number) => {
              const expiryDate = new Date(batch.expiryDate);
              const now = new Date();
              const daysUntilExpiry = Math.ceil(
                (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );

              const isExpired = daysUntilExpiry < 0;
              const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

              const expiryColor = isExpired
                ? "#EF4444"
                : isExpiringSoon
                  ? "#F59E0B"
                  : "#10B981";

              return (
                <View
                  key={index}
                  style={[
                    styles.batchItem,
                    { borderLeftColor: expiryColor, borderLeftWidth: 4 },
                  ]}
                >
                  <View style={styles.batchHeader}>
                    <Text style={[styles.batchNumber, { color: theme.text }]}>
                      {batch.batchNumber}
                    </Text>
                    <Text style={[styles.batchQuantity, { color: theme.primary }]}>
                      Qty: {batch.quantity}
                    </Text>
                  </View>

                  <View style={styles.batchDetails}>
                    <View style={styles.batchDetailRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={theme.subtext}
                      />
                      <Text style={[styles.batchDetailText, { color: theme.subtext }]}>
                        Expires: {expiryDate.toLocaleDateString()}
                      </Text>
                    </View>

                    {batch.price && (
                      <View style={styles.batchDetailRow}>
                        <Ionicons
                          name="cash-outline"
                          size={16}
                          color={theme.subtext}
                        />
                        <Text style={[styles.batchDetailText, { color: theme.subtext }]}>
                          Price: ${batch.price.toFixed(2)}
                        </Text>
                      </View>
                    )}

                    <View style={styles.batchDetailRow}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={16}
                        color={expiryColor}
                      />
                      <Text style={[styles.batchDetailText, { color: expiryColor }]}>
                        {isExpired
                          ? "Expired"
                          : isExpiringSoon
                            ? `Expires in ${daysUntilExpiry} days`
                            : "Good condition"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  imageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "80%",
    height: "80%",
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  infoItem: {
    alignItems: "center",
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  expiryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  expiryItem: {
    alignItems: "center",
    gap: 4,
  },
  expiryCount: {
    fontSize: 24,
    fontWeight: "bold",
  },
  expiryLabel: {
    fontSize: 12,
  },
  batchItem: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  batchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  batchNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  batchQuantity: {
    fontSize: 14,
    fontWeight: "600",
  },
  batchDetails: {
    gap: 6,
  },
  batchDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  batchDetailText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
});
