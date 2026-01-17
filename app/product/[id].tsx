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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useProducts, Product } from "../../hooks/useProducts";
import { LinearGradient } from "expo-linear-gradient";
import { format, differenceInDays } from "date-fns";
import { LoadingState } from "../../components/LoadingState";

const { width } = Dimensions.get("window");

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { getProductById } = useProducts();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const data = await getProductById(id as string);
      if (data) setProduct(data);
      setLoading(false);
    };
    loadData();
  }, [id]);

  // FEFO Logic: Sort batches by date and calculate urgency
  const sortedBatches = useMemo(() => {
    if (!product?.batches) return [];
    return [...product.batches].sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );
  }, [product]);

  const getUrgencyColor = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return "#FF4444"; // Expired
    if (days < 14) return "#FF9500"; // Critical
    if (days < 30) return "#FFCC00"; // Warning
    return theme.primary; // Stable
  };

  if (loading) {
    return <LoadingState message="Loading Product Details..." fullScreen />;
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Overlays */}
      <View style={styles.headerActionRow}>
        <Pressable onPress={() => router.back()} style={styles.blurCircle}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.blurCircle}
            onPress={() => {
              /* Edit Logic */
            }}
          >
            <Ionicons name="pencil" size={20} color={theme.text} />
          </Pressable>
          <Pressable style={[styles.blurCircle, { marginLeft: 10 }]}>
            <Ionicons name="trash-outline" size={20} color="#FF4444" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Aesthetic Hero Image Section */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)", theme.background]}
            style={styles.imageOverlay}
          />
          <View style={styles.heroContent}>
            <View
              style={[styles.categoryBadge, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
            <Text style={[styles.productTitle, { color: theme.text }]}>
              {product.name}
            </Text>
            <Text style={[styles.barcodeText, { color: theme.subtext }]}>
              BARCODE: {product.barcode}
            </Text>
          </View>
        </View>

        <View style={styles.contentBody}>
          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Text style={styles.statLabel}>Total Stock</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {product.totalQuantity}
              </Text>
              <Text style={styles.statSub}>Units available</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Text style={styles.statLabel}>Batch Count</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {product.batches?.length || 0}
              </Text>
              <Text style={styles.statSub}>Total entries</Text>
            </View>
          </View>

          {/* Predictive Analytics Teaser */}
          <Pressable
            style={[
              styles.analyticsCard,
              {
                backgroundColor: theme.primary + "15",
                borderColor: theme.primary + "30",
              },
            ]}
          >
            <View style={styles.analyticsHeader}>
              <Ionicons name="sparkles" size={18} color={theme.primary} />
              <Text style={[styles.analyticsTitle, { color: theme.primary }]}>
                Predictive Insight
              </Text>
            </View>
            <Text style={[styles.analyticsText, { color: theme.text }]}>
              Based on recent velocity, this stock is expected to deplete in{" "}
              <Text style={{ fontWeight: "bold" }}>12 days</Text>.
            </Text>
          </Pressable>

          {/* FEFO Batch List */}
          <Text style={[styles.sectionHeading, { color: theme.text }]}>
            Active Batches (FEFO Order)
          </Text>

          {sortedBatches.length > 0 ? (
            sortedBatches.map((batch, index) => {
              // 1. Validate the date exists and is a valid timestamp
              const expiryDateObj = new Date(batch.expiryDate);
              const isValidDate = !isNaN(expiryDateObj.getTime());

              // 2. Calculate urgency only if valid, otherwise default to "Stable"
              const urgencyColor = isValidDate 
                ? getUrgencyColor(batch.expiryDate) 
                : theme.subtext;

              const daysLeft = isValidDate 
                ? differenceInDays(expiryDateObj, new Date()) 
                : null;

              return (
                <View key={index} style={[styles.batchCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.urgencyBar, { backgroundColor: urgencyColor }]} />
                  <View style={styles.batchInfo}>
                    <View style={styles.batchTop}>
                      <Text style={[styles.batchNum, { color: theme.subtext }]}>#{batch.batchNumber?.slice(-6) || "N/A"}</Text>
                      <Text style={[styles.batchDays, { color: urgencyColor }]}>
                        {!isValidDate ? "Invalid Date" : daysLeft! < 0 ? "EXPIRED" : `${daysLeft} days left`}
                      </Text>
                    </View>
                    <View style={styles.batchBottom}>
                      <View style={styles.batchDetail}>
                        <Ionicons name="calendar-outline" size={14} color={theme.subtext} />
                        <Text style={[styles.batchDate, { color: theme.text }]}>
                          {isValidDate ? format(expiryDateObj, "MMM dd, yyyy") : "Date Missing"}
                        </Text>
                      </View>
                      <View style={styles.batchDetail}>
                        <Ionicons name="cube-outline" size={14} color={theme.subtext} />
                        <Text style={[styles.batchQty, { color: theme.text }]}>{batch.quantity} Units</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={{ color: theme.subtext }}>No batch data recorded.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: { marginTop: 10, fontSize: 14, fontWeight: "500" },
  headerActionRow: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  blurCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRight: { flexDirection: "row" },
  heroWrapper: { width: width, height: 380, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  heroContent: { position: "absolute", bottom: 30, left: 20, right: 20 },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  categoryText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  productTitle: { fontSize: 32, fontWeight: "900", letterSpacing: -0.5 },
  barcodeText: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  contentBody: { paddingHorizontal: 20, marginTop: 10 },
  statsGrid: { flexDirection: "row", gap: 15, marginBottom: 20 },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    marginBottom: 5,
  },
  statValue: { fontSize: 28, fontWeight: "900" },
  statSub: { fontSize: 11, color: "#888", marginTop: 2 },
  analyticsCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 30,
  },
  analyticsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  analyticsTitle: { fontSize: 14, fontWeight: "800" },
  analyticsText: { fontSize: 14, lineHeight: 20 },
  sectionHeading: { fontSize: 18, fontWeight: "800", marginBottom: 15 },
  batchCard: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  urgencyBar: { width: 6 },
  batchInfo: { flex: 1, padding: 16 },
  batchTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  batchNum: { fontSize: 12, fontWeight: "700" },
  batchDays: { fontSize: 12, fontWeight: "800" },
  batchBottom: { flexDirection: "row", gap: 20 },
  batchDetail: { flexDirection: "row", alignItems: "center", gap: 6 },
  batchDate: { fontSize: 14, fontWeight: "600" },
  batchQty: { fontSize: 14, fontWeight: "600" },
  emptyState: { padding: 40, alignItems: "center" },
  errorTitle: { fontSize: 20, fontWeight: "800", marginVertical: 15 },
  backBtn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
  backBtnText: { color: "#FFF", fontWeight: "bold" },
});
