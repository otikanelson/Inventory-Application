import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ImageBackground,
  RefreshControl,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { ProductCard } from "../../components/ProductCard";
import { useProducts, Product } from "../../hooks/useProducts";

const SkeletonItem = ({ theme }: { theme: any }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeletonBox,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity },
      ]}
    >
      <View
        style={[styles.skeletonImage, { backgroundColor: theme.background }]}
      >
        <Ionicons name="cube-outline" size={30} color={theme.subtext + "50"} />
      </View>
      <View
        style={[
          styles.skeletonText,
          { backgroundColor: theme.subtext + "20", width: "70%" },
        ]}
      />
      <View
        style={[
          styles.skeletonText,
          { backgroundColor: theme.subtext + "20", width: "40%" },
        ]}
      />
    </Animated.View>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { products, loading, error, refresh } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");

  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [products, searchQuery]);

  const fefoItems = useMemo(() => {
    return products
      .filter((p: Product) => p.isPerishable && p.expiryDate && p.expiryDate !== "N/A")
      .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())
      .slice(0, 2);
  }, [products]);

  const criticalCount = useMemo(() => {
    return products.filter((p: Product) => {
      if (!p.isPerishable || !p.expiryDate || p.expiryDate === "N/A")
        return false;
      const diffDays = Math.ceil(
        (new Date(p.expiryDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return diffDays <= 7 && diffDays >= 0;
    }).length;
  }, [products]);

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greet, { color: theme.subtext }]}>
            Inventory Manager
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Dashboard</Text>
        </View>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: theme.surface }]}
          onPress={() => router.push("/alerts")}
        >
          <Ionicons name="notifications-outline" size={22} color={theme.text} />
          <View style={[styles.dot, { backgroundColor: theme.notification }]} />
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          FEFO Priority
        </Text>
        <Pressable onPress={() => router.push("/FEFO")}>
          <Text style={{ color: theme.primary, fontWeight: "700" }}>
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
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
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
              Exp: {new Date(item.expiryDate).toLocaleDateString()}
            </Text>
          </Pressable>
        ))
      ) : (
        <View style={[styles.emptyFefo, { borderColor: theme.border }]}>
          <Text style={{ color: theme.subtext }}>No urgent items</Text>
        </View>
      )}

      <View style={styles.statRow}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.primary + "10",
              borderColor: theme.primary + "30",
            },
          ]}
        >
          <Text style={[styles.statVal, { color: theme.primary }]}>
            {products.length}
          </Text>
          <Text
            style={{ color: theme.primary, fontSize: 10, fontWeight: "700" }}
          >
            TOTAL ITEMS
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.notification + "10",
              borderColor: theme.notification + "30",
            },
          ]}
        >
          <Text style={[styles.statVal, { color: theme.notification }]}>
            {criticalCount}
          </Text>
          <Text
            style={{
              color: theme.notification,
              fontSize: 10,
              fontWeight: "700",
            }}
          >
            CRITICAL
          </Text>
        </View>
      </View>

      <Text
        style={[styles.sectionTitle, { color: theme.text, marginBottom: 15 }]}
      >
        {searchQuery
          ? `Results (${filteredProducts.length})`
          : "Inventory List"}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
      />

      {/* SEARCH BAR MOVED OUTSIDE FLATLIST HEADER TO PREVENT KEYBOARD DISMISSAL */}
      <View style={styles.topFixedSearch}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.subtext} />
          <TextInput
            placeholder="Search name or category..."
            placeholderTextColor={theme.subtext}
            style={[styles.input, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery !== "" && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={theme.subtext} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={loading ? Array(6).fill({}) : filteredProducts}
        keyExtractor={(item, index) =>
          loading ? `skeleton-${index}` : item._id
        }
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) =>
          loading ? <SkeletonItem theme={theme} /> : <ProductCard item={item} />
        }
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topFixedSearch: { paddingTop: 60, paddingHorizontal: 20, zIndex: 10 },
  listPadding: { paddingHorizontal: 20, paddingBottom: 120 },
  headerContainer: { marginTop: 10, marginBottom: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  greet: { fontSize: 14, fontWeight: "600" },
  title: { fontSize: 32, fontWeight: "900" },
  iconBtn: {
    height: 48,
    width: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffffff10",
  },
  dot: {
    position: "absolute",
    top: 12,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderColor: "#FFF",
    borderWidth: 1.5,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
  },
  input: { marginLeft: 10, flex: 1, fontSize: 16, height: 25, padding: 0 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800" },
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
  },
  statRow: { flexDirection: "row", gap: 12, marginVertical: 20 },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 22,
    alignItems: "center",
    borderWidth: 1,
  },
  statVal: { fontSize: 22, fontWeight: "900" },
  row: { justifyContent: "space-between" },
  skeletonBox: {
    flex: 0.48,
    height: 210,
    borderRadius: 24,
    marginBottom: 15,
    padding: 12,
    borderWidth: 1,
  },
  skeletonImage: {
    width: "100%",
    height: 110,
    borderRadius: 18,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonText: { height: 12, borderRadius: 6, marginBottom: 8 },
});
