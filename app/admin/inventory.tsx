import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ImageBackground,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { useProducts } from "../../hooks/useProducts";
import axios from "axios";
import Toast from "react-native-toast-message";

export default function AdminInventory() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { products, loading, refresh } = useProducts();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"name" | "totalQuantity">("name");
  const [activeTab, setActiveTab] = useState<"registry" | "inventory">("inventory");
  const [globalProducts, setGlobalProducts] = useState<any[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  // Fetch global registry products
  const fetchGlobalProducts = async () => {
    setLoadingGlobal(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/products/registry/all`
      );
      setGlobalProducts(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch global products:", error);
      Toast.show({
        type: "error",
        text1: "Fetch Failed",
        text2: "Could not load global registry",
      });
    } finally {
      setLoadingGlobal(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === "registry") {
      fetchGlobalProducts();
    }
  }, [activeTab]);

  const currentProducts = activeTab === "inventory" ? products : globalProducts;
  const currentLoading = activeTab === "inventory" ? loading : loadingGlobal;

  const filteredProducts = useMemo(() => {
    return currentProducts.filter((p) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(searchLower) ||
        (p.barcode && p.barcode.includes(searchQuery)) ||
        (p.category && p.category.toLowerCase().includes(searchLower))
      );
    });
  }, [currentProducts, searchQuery]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortField === "name") {
        return a.name.localeCompare(b.name);
      } else {
        return (b.totalQuantity || 0) - (a.totalQuantity || 0);
      }
    });
  }, [filteredProducts, sortField]);

  const handleRefresh = () => {
    if (activeTab === "inventory") {
      refresh();
    } else {
      fetchGlobalProducts();
    }
  };

  // FIXED: Handle navigation based on tab
  const handleProductPress = async (item: any) => {
    if (activeTab === "inventory") {
      // Local inventory - navigate directly with product ID
      router.push({
        pathname: "/admin/product/[id]",
        params: { id: item._id },
      });
    } else {
      // Global registry - check if product exists in local inventory first
      try {
        const localProduct = products.find((p) => p.barcode === item.barcode);
        
        if (localProduct) {
          // Product exists in local inventory - navigate to it
          router.push({
            pathname: "/admin/product/[id]",
            params: { id: localProduct._id },
          });
        } else {
          // Product NOT in local inventory - show info and offer to add stock
          Toast.show({
            type: "info",
            text1: "Not In Stock",
            text2: `${item.name} is in registry but has no stock. Scan to add inventory.`,
            visibilityTime: 4000,
          });
          
          // Optional: Navigate to add-products screen pre-filled
          // router.push({
          //   pathname: "/admin/add-products",
          //   params: { 
          //     mode: "inventory",
          //     barcode: item.barcode,
          //     prefilledData: JSON.stringify({
          //       name: item.name,
          //       category: item.category,
          //       isPerishable: item.isPerishable,
          //       imageUrl: item.imageUrl
          //     })
          //   }
          // });
        }
      } catch (error) {
        console.error("Error checking product:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Could not verify product status",
        });
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground
        source={
          isDark
            ? require("../../assets/images/Background7.png")
            : require("../../assets/images/Background9.png")
        }
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.container}>
        <View style={styles.topSection}>
          <Text style={[styles.title, { color: theme.text }]}>
            Admin Inventory
          </Text>

          <View style={styles.searchRow}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Ionicons name="search" size={18} color={theme.subtext} />
              <TextInput
                placeholder="Search products..."
                placeholderTextColor={theme.subtext}
                style={[styles.searchInput, { color: theme.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <Pressable
              style={[
                styles.sortBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() =>
                setSortField(sortField === "name" ? "totalQuantity" : "name")
              }
            >
              <Ionicons name="swap-vertical" size={20} color={theme.primary} />
            </Pressable>
          </View>

          {/* TABS */}
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => setActiveTab("inventory")}
              style={[
                styles.tab,
                activeTab === "inventory" && {
                  borderBottomColor: theme.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "inventory" ? theme.text : theme.subtext,
                  },
                ]}
              >
                Inventory Stock
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("registry")}
              style={[
                styles.tab,
                activeTab === "registry" && {
                  borderBottomColor: theme.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "registry" ? theme.text : theme.subtext,
                  },
                ]}
              >
                Global Registry
              </Text>
            </Pressable>
          </View>

          <View style={styles.countRow}>
            <Text style={{ color: theme.text, fontWeight: "800" }}>
              <Text style={[styles.countText, { color: theme.subtext }]}>
                {sortedProducts.length}
              </Text>{" "}
              Products
            </Text>
            <Text style={[styles.sortLabel, { color: theme.primary }]}>
              Sort: {sortField.toUpperCase()}
            </Text>
          </View>
        </View>

        <FlatList
          data={sortedProducts}
          keyExtractor={(item) => item._id || item.barcode}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl
              refreshing={currentLoading}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item }) => {
            // Check if registry item exists in local inventory
            const inLocalInventory = activeTab === "registry" 
              ? products.some((p) => p.barcode === item.barcode)
              : true;

            return (
              <Pressable
                onPress={() => handleProductPress(item)}
                style={[
                  styles.itemCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.cardMain}>
                  <View style={styles.imageContainer}>
                    {item.imageUrl && item.imageUrl !== "cube" ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.image}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons
                        name="cube-outline"
                        size={30}
                        color={isDark ? "#ffffff20" : "#00000010"}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.name, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.category, { color: theme.subtext }]}>
                      {item.category || "General"}
                    </Text>
                    {activeTab === "registry" && (
                      <View style={styles.statusRow}>
                        {inLocalInventory ? (
                          <View style={[styles.statusBadge, { backgroundColor: theme.primary + "20" }]}>
                            <Ionicons name="checkmark-circle" size={12} color={theme.primary} />
                            <Text style={[styles.statusText, { color: theme.primary }]}>
                              In Stock
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.statusBadge, { backgroundColor: "#FF9500" + "20" }]}>
                            <Ionicons name="alert-circle" size={12} color="#FF9500" />
                            <Text style={[styles.statusText, { color: "#FF9500" }]}>
                              No Stock
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  <View style={styles.qtyBox}>
                    <Text
                      style={[
                        styles.qtyValue,
                        {
                          color:
                            activeTab === "inventory" &&
                            (item.totalQuantity || 0) < 10
                              ? theme.notification
                              : theme.primary,
                        },
                      ]}
                    >
                      {activeTab === "inventory"
                        ? item.totalQuantity || 0
                        : inLocalInventory 
                        ? products.find((p) => p.barcode === item.barcode)?.totalQuantity || 0
                        : "—"}
                    </Text>
                    <Text style={[styles.qtyLabel, { color: theme.subtext }]}>
                      {activeTab === "inventory" ? "QTY" : "REG"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="archive-outline"
                size={48}
                color={theme.subtext}
              />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                No products found
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  topSection: { paddingHorizontal: 20, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: "900", marginBottom: 20 },
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13 },
  sortBtn: {
    width: 45,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
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
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  countText: { fontSize: 13, fontWeight: "600" },
  sortLabel: { fontSize: 11, fontWeight: "800" },
  listPadding: { paddingHorizontal: 20, paddingBottom: 100 },
  itemCard: { borderRadius: 20, borderWidth: 1, marginBottom: 12, padding: 16 },
  cardMain: { flexDirection: "row", alignItems: "center" },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#e6e6e620",
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: "100%", height: "100%", borderRadius: 12 },
  name: { fontSize: 16, fontWeight: "800" },
  category: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  statusRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  qtyBox: { alignItems: "center", minWidth: 40 },
  qtyValue: { fontSize: 20, fontWeight: "900" },
  qtyLabel: { fontSize: 9, fontWeight: "700" },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
});