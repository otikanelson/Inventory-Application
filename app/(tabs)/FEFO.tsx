import { View, Text, FlatList, StyleSheet, ImageBackground, RefreshControl, Pressable } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useProducts, Product } from "../../hooks/useProducts";
import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function FEFO() {
  const { theme, isDark } = useTheme();
  const { products, loading, refresh } = useProducts();
  const router = useRouter();

  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  // STRICT FEFO: Only perishable products with valid expiry dates
  const sorted = useMemo(() => {
    return products
      .filter((p: Product) => p.isPerishable && p.expiryDate && p.expiryDate !== 'N/A')
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [products]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} />
      
      <FlatList
        data={sorted}
        keyExtractor={(item) => item._id || item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.primary} />}
        ListHeaderComponent={
          <View style={styles.headerArea}>
             <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
             </Pressable>
            <Text style={[styles.title, { color: theme.text }]}>FEFO Priority</Text>
            <Text style={{ color: theme.subtext }}>Strictly tracking {sorted.length} perishable items</Text>
          </View>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <Pressable 
            onPress={() => router.push(`/product/${item._id || item.id}`)}
            style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={styles.leftSide}>
               <Text style={[styles.rank, { color: theme.notification }]}>#{index + 1}</Text>
               <View>
                 <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                 <Text style={{ color: theme.subtext, fontSize: 12 }}>
                   Expires: {new Date(item.expiryDate).toLocaleDateString()}
                 </Text>
               </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </Pressable>
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
               <Ionicons name="leaf-outline" size={60} color={theme.subtext + '40'} />
               <Text style={[styles.emptyText, { color: theme.subtext }]}>No perishable goods found</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 110 },
  headerArea: { marginTop: 50, marginBottom: 20 },
  backButton: { marginBottom: 15 },
  title: { fontSize: 32, fontWeight: "900" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
  },
  leftSide: { flexDirection: "row", alignItems: "center" },
  rank: { fontSize: 20, fontWeight: "900", marginRight: 15 },
  name: { fontSize: 16, fontWeight: "700" },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, fontSize: 16, fontWeight: '600' }
});