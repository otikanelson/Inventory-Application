import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    ImageBackground,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { ProductCard, ProductCardSkeleton } from "../../components/ProductCard";
import { useTheme } from "../../context/ThemeContext";
import { useProducts } from "../../hooks/useProducts";

// Recently Sold Card Component
const RecentlySoldCard = ({ item }: { item: any }) => {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Pressable
      onPress={() => router.push(`/product/${item._id}/sales` as Href)}
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.topLabels}>
        <View
          style={[
            styles.pill,
            { backgroundColor: theme.primary + "20" },
          ]}
        >
          <Ionicons name="trending-down" size={10} color={theme.primary} />
          <Text style={[styles.pillText, { color: theme.primary }]}>
            SOLD
          </Text>
        </View>
        <View
          style={[
            styles.pill,
            { backgroundColor: isDark ? "#ffffff10" : "#00000005" },
          ]}
        >
          <Ionicons name="time-outline" size={10} color={theme.subtext} />
          <Text style={[styles.pillText, { color: theme.subtext }]}>
            {formatDate(item.lastSaleDate)}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.imageWrapper,
          { backgroundColor: isDark ? "#00000035" : "#a2a2a22f" },
        ]}
      >
        {!isLoaded && (
          <Ionicons
            name="cube-outline"
            size={40}
            color={isDark ? "#ffffff10" : "#00000010"}
          />
        )}
        {item.imageUrl && item.imageUrl !== "cube" && (
          <Image
            source={{ uri: item.imageUrl }}
            style={[styles.image, { opacity: isLoaded ? 1 : 0 }]}
            onLoad={() => setIsLoaded(true)}
            onError={() => setIsLoaded(false)}
            resizeMode="contain"
          />
        )}
      </View>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.quantityLabel, { color: theme.primary }]}>
            {item.totalSold} Units Sold  •  ₦{item.totalRevenue?.toLocaleString() || 0}
          </Text>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { products, recentlySold, loading, refresh, inventoryStats } = useProducts();

  const [activeTab, setActiveTab] = useState<"stocked" | "sold">("stocked");
  const [displayLimit, setDisplayLimit] = useState(6);

  const backgroundImage = isDark
  ? require("../../assets/images/Background7.png")
  : require("../../assets/images/Background9.png");

  const fefoItems = useMemo(() => {
    return products
      .map((p) => {
        const earliest = p.batches?.reduce((earliest: Date | null, b) => {
          if (!b?.expiryDate || b.expiryDate === "N/A") return earliest;
          const d = new Date(b.expiryDate);
          return !earliest || d < earliest ? d : earliest;
        }, null);
        return { product: p, earliest };
      })
      .filter(({ product, earliest }) => product.isPerishable && earliest)
      .sort((a, b) => a.earliest!.getTime() - b.earliest!.getTime())
      .slice(0, 3)
      .map(({ product }) => product);
  }, [products]);

  const visibleData = useMemo(() => {
    const baseData =
      activeTab === "stocked"
        ? [...products].sort(
            (a, b) =>
              new Date(b.updatedAt || 0).getTime() -
              new Date(a.updatedAt || 0).getTime()
          )
        : recentlySold; // Use recently sold data instead of out of stock

    return baseData.slice(0, displayLimit);
  }, [products, recentlySold, activeTab, displayLimit]);

  const handleLoadMore = () => {
    const maxLength = activeTab === "stocked" ? products.length : recentlySold.length;
    if (displayLimit < maxLength) {
      setDisplayLimit((prev) => prev + 6);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
      />

        <FlatList
        data={loading ? Array(6).fill({}) : visibleData}
        numColumns={2}
        columnWrapperStyle={styles.row}
        keyExtractor={(item, index) =>
          loading ? `skeleton-${index}` : item._id
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.primary}
          />
        }
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* TOP BAR */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.greet, { color: theme.primary }]}>
                  STAFF_FRONTLINE
                </Text>
                <Text style={[styles.title, { color: theme.text }]}>
                  STOCKQ
                </Text>
              </View>
              <View style={styles.headerRight}>
                <Pressable
                  onPress={() => router.push("/alerts")}
                  style={[styles.iconBtn, { backgroundColor: theme.surface }]}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color={theme.text}
                  />
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: theme.notification },
                    ]}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/settings" as any)}
                  style={[
                    styles.iconBtn,
                    { backgroundColor: theme.surface, marginLeft: 10 },
                  ]}
                >
                  <Ionicons
                    name="settings-outline"
                    size={20}
                    color={theme.text}
                  />
                </Pressable>
              </View>
            </View>

            {/* STATS HUD */}
            <View style={styles.statGrid}>
              <View
                style={[styles.mainStat, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.statLabelMain}>TOTAL_RECORDS</Text>
                <Text style={styles.statValueMain}>
                  {inventoryStats.totalUnits}
                </Text>
              </View>
              <View style={styles.smallStatsCol}>
                <View
                  style={[
                    styles.smallStat,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.smallStatVal, { color: theme.text }]}>
                    {inventoryStats.expiringSoonCount}
                  </Text>
                  <Text
                    style={[styles.smallStatLabel, { color: theme.subtext }]}
                  >
                    EXPIRING SOON
                  </Text>
                </View>
                <View
                  style={[
                    styles.smallStat,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.smallStatVal, { color: theme.text }]}>
                    {inventoryStats.lowStockCount}
                  </Text>
                  <Text
                    style={[styles.smallStatLabel, { color: theme.subtext }]}
                  >
                    LOW_STOCK
                  </Text>
                </View>
              </View>
            </View>

            {/* QUICK ACTIONS SECTION */}
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, marginBottom: 15 },
              ]}
            >
              Quick Actions
            </Text>
            <View style={styles.actionGrid}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/scan",
                    params: { initialTab: "registry" },
                  })
                }
                style={[
                  styles.actionCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: "#4C6FFF20" }]}
                >
                  <Ionicons name="scan-outline" size={22} color="#4C6FFF" />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>
                  Scan
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/inventory")}
                style={[
                  styles.actionCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: "#FF950020" }]}
                >
                  <Ionicons name="search-outline" size={22} color="#FF9500" />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>
                  Search
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/add-products")}
                style={[
                  styles.actionCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: "#34C75920" }]}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={22}
                    color="#34C759"
                  />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>
                  Manual
                </Text>
              </Pressable>
            </View>

            {/* FEFO SECTION */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                FEFO Priority
              </Text>
              <Pressable onPress={() => router.push("/FEFO")}>
                <Text
                  style={{
                    color: theme.primary,
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  Show more
                </Text>
              </Pressable>
            </View>

            {fefoItems.length > 0 ? (
              fefoItems.map((item) => (
                <Pressable
                  key={item._id}
                  onPress={() => router.push(`/product/${item._id}` as Href)}
                  style={[
                    styles.fefoItem,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View
                      style={[
                        styles.indicator,
                        { backgroundColor: theme.notification },
                      ]}
                    />
                    <Text style={{ color: theme.text, fontWeight: "700" }}>
                      {item.name}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: theme.notification,
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    Exp:{" "}
                    {new Date(
                      item.batches?.[0]?.expiryDate || ""
                    ).toLocaleDateString()}
                  </Text>
                </Pressable>
              ))
            ) : (
              <View style={[styles.emptyFefo, { borderColor: theme.border }]}>
                <Text style={{ color: theme.subtext }}>No urgent items</Text>
              </View>
            )}

            {/* ACTIVITY TABS */}
            <View style={styles.tabContainer}>
              <Pressable
                onPress={() => {
                  setActiveTab("stocked");
                  setDisplayLimit(6);
                }}
                style={[
                  styles.tab,
                  activeTab === "stocked" && {
                    borderBottomColor: theme.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === "stocked" ? theme.text : theme.subtext,
                    },
                  ]}
                >
                  Recently Stocked
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setActiveTab("sold");
                  setDisplayLimit(6);
                }}
                style={[
                  styles.tab,
                  activeTab === "sold" && { borderBottomColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === "sold" ? theme.text : theme.subtext,
                    },
                  ]}
                >
                  Recently Sold
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) =>
          loading ? (
            <ProductCardSkeleton />
          ) : activeTab === "sold" ? (
            <RecentlySoldCard item={item} />
          ) : (
            <ProductCard item={item} />
          )
        }
        ListFooterComponent={
          (() => {
            const maxLength = activeTab === "stocked" ? products.length : recentlySold.length;
            return displayLimit < maxLength && !loading ? (
              <ActivityIndicator
                style={{ marginVertical: 20 }}
                color={theme.primary}
              />
            ) : null;
          })()
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 25,
  },
  actionCard: {
    flex: 1,
    height: 60,
    minWidth: "48%",
    maxWidth: "48%",
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "800",
  },
  listPadding: { paddingHorizontal: 20, paddingBottom: 120 },
  headerContainer: { paddingTop: 60, marginBottom: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  headerRight: { flexDirection: "row", gap: 10 },
  greet: { fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  title: { fontSize: 30, fontWeight: "900", letterSpacing: -1 },
  iconBtn: {
    height: 44,
    width: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffffff10",
  },
  dot: {
    position: "absolute",
    top: 12,
    right: 14,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statGrid: { flexDirection: "row", gap: 12, marginBottom: 25 },
  mainStat: {
    flex: 1.2,
    borderRadius: 24,
    paddingHorizontal: 20,
    justifyContent: "center",
    minHeight: 110,
  },
  statLabelMain: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "800",
  },
  statValueMain: { color: "#FFF", fontSize: 36, fontWeight: "900" },
  smallStatsCol: { flex: 1, gap: 10 },
  smallStat: {
    flex: 1,
    height: "30%",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    justifyContent: "center",
  },
  smallStatVal: { fontSize: 18, fontWeight: "800" },
  smallStatLabel: { fontSize: 9, fontWeight: "700" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  fefoItem: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
  },
  indicator: { width: 4, height: 16, borderRadius: 2 },
  emptyFefo: {
    padding: 20,
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150,150,150,0.1)",
  },
  tab: {
    paddingVertical: 10,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 14, fontWeight: "800" },
  row: { justifyContent: "space-between" },
  
  // Recently Sold Card Styles (reusing ProductCard styles)
  card: {
    width: (370 / 2) - 27, // Approximate width calculation
    borderRadius: 28,
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
  },
  topLabels: { 
    flexDirection: "row", 
    gap: 6, 
    marginBottom: 12 
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillText: { 
    fontSize: 8, 
    fontWeight: "700", 
    textTransform: "uppercase" 
  },
  imageWrapper: {
    width: "100%",
    height: 140,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  image: { 
    width: "85%", 
    height: "85%" 
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 4,
  },
  quantityLabel: { 
    fontSize: 12, 
    fontWeight: "500", 
    marginBottom: 2 
  },
  name: { 
    fontSize: 15, 
    fontWeight: "800" 
  },
});