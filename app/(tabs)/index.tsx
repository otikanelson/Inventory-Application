// app/(tabs)/index.tsx
import React from "react";
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
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { ProductCard } from "../../components/ProductCard";
import { useProducts, Product } from "../../hooks/useProducts";

export default function Dashboard() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { products, loading, error, refresh } = useProducts();
  const criticalCount = products.filter((p: Product) => {
  if (!p.expiryDate || p.expiryDate === 'N/A') return false;
  
  const today = new Date();
  const expDate = new Date(p.expiryDate);
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Define "Critical" as 7 days or less
  return diffDays <= 7 && diffDays >= 0; 
}).length;

  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  // Create 6 dummy items for the skeleton effect
  const skeletonData = Array(6).fill({ _id: "skeleton" });

  // Calculate FEFO Priority (Safely handle empty arrays during loading)
  const fefoItems =
    products.length > 0
      ? [...products]
          .sort(
            (a, b) =>
              new Date(a.expiryDate).getTime() -
              new Date(b.expiryDate).getTime()
          )
          .slice(0, 2)
      : [];

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
          style={[
            styles.iconBtn,
            { backgroundColor: isDark ? "#ffffff15" : "#00000033" },
          ]}
          onPress={() => router.push("../alerts")}
        >
          <Ionicons name="notifications-outline" size={22} color={theme.text} />
          <View style={[styles.dot, { backgroundColor: theme.notification }]} />
        </Pressable>
      </View>

      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
          },
        ]}
      >
        <Ionicons name="search" size={20} color={theme.subtext} />
        <TextInput
          placeholder="Search Something..."
          placeholderTextColor={theme.subtext}
          style={[styles.input, { color: theme.text }]}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          FEFO Priority
        </Text>
        <Pressable onPress={() => router.push("../FEFO")}>
          <Text style={{ color: theme.primary, fontWeight: "700" }}>
            Show more
          </Text>
        </Pressable>
      </View>

      {/* Show actual FEFO items or a placeholder during loading */}
      {loading && products.length === 0 ? (
        <View
          style={[
            styles.fefoPlaceholder,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        />
      ) : (
        fefoItems.map((item: Product) => (
          <View
            key={item._id}
            style={[
              styles.fefoItem,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={{ color: theme.text, fontWeight: "600" }}>
              {item.name}
            </Text>
            <Text
              style={{
                color: theme.notification,
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              Exp: {new Date(item.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}

      <View style={styles.statRow}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.statVal, { color: theme.text }]}>
            {loading ? "--" : products.length}
          </Text>
          <Text style={{ color: theme.subtext, fontSize: 12 }}>
            Total Items
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.notification + "15",
              borderColor: theme.notification + "30",
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.statVal, { color: theme.notification }]}>
            {loading ? "--" : criticalCount}
          </Text>
          <Text style={{ color: theme.notification, fontSize: 12 }}>
            Critical
          </Text>
        </View>
      </View>

      <Text
        style={[styles.sectionTitle, { color: theme.text, marginBottom: 15 }]}
      >
        All Items
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <FlatList
        data={loading && products.length === 0 ? skeletonData : products}
        keyExtractor={(item, index) =>
          item._id === "skeleton" ? `skeleton-${index}` : item._id
        }
        renderItem={({ item }) =>
          item._id === "skeleton" ? (
            <View
              style={[
                styles.skeletonBox,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            />
          ) : (
            <ProductCard item={item} />
          )
        }
        ListHeaderComponent={ListHeader}
        numColumns={2}
        columnWrapperStyle={styles.row}
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
  listPadding: { padding: 20, paddingBottom: 120 },
  headerContainer: { marginBottom: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 50,
    marginBottom: 25,
  },
  greet: { fontSize: 14, fontWeight: "600" },
  title: { fontSize: 32, fontWeight: "900" },
  iconBtn: {
    height: 45,
    width: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderColor: "#FFF",
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    marginBottom: 20,
  },
  input: { marginLeft: 10, flex: 1, fontSize: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800" },
  fefoItem: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fefoPlaceholder: {
    height: 60,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    opacity: 0.5,
  },
  statRow: { flexDirection: "row", gap: 15, marginVertical: 25 },
  statCard: { flex: 1, padding: 15, borderRadius: 22, alignItems: "center" },
  statVal: { fontSize: 22, fontWeight: "900" },
  row: { justifyContent: "space-between", gap: 12 },
  skeletonBox: {
    flex: 1,
    height: 180, // Matches your ProductCard height roughly
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    opacity: 0.4,
  },
  errorText: {
    color: "#ff3b3b",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "600",
  },
});
