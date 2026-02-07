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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Href } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { useProducts, Product } from "../../hooks/useProducts";

export default function InventoryScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { products, loading, refresh } = useProducts();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Product>("name");
  const [displayMode, setDisplayMode] = useState<"card" | "list">("card");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(searchLower) ||
        (p.category && p.category.toLowerCase().includes(searchLower)) ||
        (p.barcode && p.barcode.includes(searchQuery))
      );
    });
  }, [products, searchQuery]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const valA = (a[sortField] || "").toString().toLowerCase();
      const valB = (b[sortField] || "").toString().toLowerCase();
      return valA.localeCompare(valB);
    });
  }, [filteredProducts, sortField]);

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
          <Text style={[styles.subtitle, { color: theme.primary }]}>STOCK_MANAGEMENT</Text>
          <Text style={[styles.title, { color: theme.text }]}>INVENTORY</Text>

          <View style={styles.searchRow}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Ionicons name="search" size={18} color={theme.subtext} />
              <TextInput
                placeholder="Search inventory..."
                placeholderTextColor={theme.subtext}
                style={[styles.searchInput, { color: theme.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/scan",
                    params: { initialTab: "lookup" },
                  })
                }
                style={styles.barcodeIcon}
              >
                <Ionicons
                  name="barcode-outline"
                  size={24}
                  color={theme.primary}
                />
              </Pressable>
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

            <Pressable
              style={[
                styles.sortBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() =>
                setDisplayMode(displayMode === "card" ? "list" : "card")
              }
            >
              <Ionicons
                name={displayMode === "card" ? "list" : "grid"}
                size={20}
                color={theme.primary}
              />
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
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item }) => {
            if (displayMode === "list") {
              return (
                <Pressable
                  onPress={() => router.push(`/product/${item._id}` as Href)}
                  style={[styles.listItem, { borderBottomColor: theme.border }]}
                >
                  <View style={{ flex: 2 }}>
                    <Text
                      style={[styles.listName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.listSubtitle, { color: theme.subtext }]}
                    >
                      {item.barcode || "No SKU"}
                    </Text>
                  </View>
                  <View style={styles.listPill}>
                    <Text
                      style={[styles.listCategory, { color: theme.subtext }]}
                    >
                      {item.category || "General"}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text
                      style={[
                        styles.listQty,
                        {
                          color:
                            item.totalQuantity < 10
                              ? theme.notification
                              : theme.text,
                        },
                      ]}
                    >
                      {item.totalQuantity} units
                    </Text>
                  </View>
                </Pressable>
              );
            }
            return (
              <Pressable
                onPress={() => router.push(`/product/${item._id}` as Href)}
                style={[
                  styles.itemCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.cardMain}>
                  <View style={styles.imageContainer}>
                    {item.imageUrl && item.imageUrl !== "cube" ? (
                      <ImageBackground
                        source={{ uri: item.imageUrl }}
                        style={styles.image}
                        imageStyle={{ borderRadius: 12 }}
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
                  </View>
                  <View style={styles.qtyBox}>
                    <Text
                      style={[
                        styles.qtyValue,
                        {
                          color:
                            item.totalQuantity < 10
                              ? theme.notification
                              : theme.primary,
                        },
                      ]}
                    >
                      {item.totalQuantity}
                    </Text>
                    <Text style={[styles.qtyLabel, { color: theme.subtext }]}>
                      QTY
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  topSection: { paddingHorizontal: 20, marginBottom: 10 },
  subtitle: { fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  title: { fontSize: 25, fontWeight: "900", letterSpacing: -1 },
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
  barcodeIcon: {
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(150,150,150,0.2)",
  },
  sortBtn: {
    width: 45,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  image: { width: "100%", height: "100%" },
  name: { fontSize: 16, fontWeight: "800" },
  category: { fontSize: 12, fontWeight: "600" },
  qtyBox: { alignItems: "center", minWidth: 40 },
  qtyValue: { fontSize: 20, fontWeight: "900" },
  qtyLabel: { fontSize: 9, fontWeight: "700" },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  listName: { fontSize: 14, fontWeight: "700" },
  listSubtitle: { fontSize: 11 },
  listPill: {
    backgroundColor: "#f0f0f010",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  listCategory: { fontSize: 10, fontWeight: "700" },
  listQty: { fontSize: 14, fontWeight: "800" },
});