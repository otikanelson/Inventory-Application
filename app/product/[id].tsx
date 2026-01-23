import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useProducts } from "../../hooks/useProducts";

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { getProductById } = useProducts();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    }
    setLoading(false);
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
        <Ionicons name="alert-circle-outline" size={80} color={theme.subtext} />
        <Text style={[styles.errorText, { color: theme.text }]}>
          PRODUCT_NOT_FOUND
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.button, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.buttonText}>GO_BACK</Text>
        </Pressable>
      </View>
    );
  }

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
        {/* Hero Card - Technical Style */}
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
                  {product.category || "GENERAL"}
                </Text>
              </View>
            </View>

            <Text style={[styles.productName, { color: theme.text }]}>
              {product.name}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="barcode-outline"
                  size={14}
                  color={theme.subtext}
                />
                <Text style={[styles.metaText, { color: theme.subtext }]}>
                  {product.barcode || "NO_BARCODE"}
                </Text>
              </View>
              {product.isPerishable && (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="warning-outline"
                    size={14}
                    color="#FF9500"
                  />
                  <Text style={[styles.metaText, { color: theme.subtext }]}>
                    PERISHABLE
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
              {product.totalQuantity || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>
              TOTAL_UNITS
            </Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Ionicons name="layers-outline" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {product.batches?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>
              BATCHES
            </Text>
          </View>
        </View>

        {/* Batches List */}
        {product.batches && product.batches.length > 0 && (
          <View style={[styles.batchesCard, { backgroundColor: theme.surface }]}>
            <View style={styles.batchHeader}>
              <Ionicons name="layers-outline" size={20} color={theme.primary} />
              <Text style={[styles.batchHeaderText, { color: theme.primary }]}>
                BATCH_REGISTRY
              </Text>
            </View>

            {product.batches.map((batch: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.batchItem,
                  { backgroundColor: theme.background + "80", borderColor: theme.border },
                ]}
              >
                <View style={styles.batchLeft}>
                  <Text style={[styles.batchNumber, { color: theme.text }]}>
                    BATCH_#{batch.batchNumber?.slice(-6) || "MANUAL"}
                  </Text>
                  <View style={styles.batchMeta}>
                    <Ionicons name="cube-outline" size={12} color={theme.subtext} />
                    <Text style={[styles.batchMetaText, { color: theme.subtext }]}>
                      {batch.quantity} units
                    </Text>
                    {batch.expiryDate && batch.expiryDate !== "N/A" && (
                      <>
                        <Text style={[styles.batchMetaText, { color: theme.subtext }]}>
                          •
                        </Text>
                        <Ionicons name="calendar-outline" size={12} color={theme.subtext} />
                        <Text style={[styles.batchMetaText, { color: theme.subtext }]}>
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            ))}
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
    fontWeight: "800",
    marginVertical: 20,
    letterSpacing: 2,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
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
    paddingTop: 110,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  heroCard: {
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "rgba(150,150,150,0.05)",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  productInfo: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  productName: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "row",
    gap: 15,
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

  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  batchesCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  batchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  batchHeaderText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  batchItem: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  batchLeft: {
    flex: 1,
  },
  batchNumber: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  batchMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  batchMetaText: {
    fontSize: 11,
    fontWeight: "600",
  },
});