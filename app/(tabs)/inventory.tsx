import { View, Text, FlatList, StyleSheet, ImageBackground, RefreshControl, Image, Pressable } from "react-native";
import { Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useProducts } from "../../hooks/useProducts";

export default function Inventory() {
  const { theme, isDark } = useTheme();
  const { products, loading, refresh } = useProducts();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground 
        source={isDark ? require("../../assets/images/Background7.png") : require("../../assets/images/Background9.png")} 
        style={StyleSheet.absoluteFill} 
      />

      <FlatList
        data={products}
        keyExtractor={(item) => item.id || item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.primary} />}
        ListHeaderComponent={<Text style={[styles.title, { color: theme.text }]}>Inventory</Text>}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable 
            onPress={() => router.push(`/product/${item._id || item.id}` as Href)}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Image 
              source={{ uri: item.imageUrl || 'via.placeholder.com' }} 
              style={styles.cardImg} 
            />

            <View style={styles.cardContent}>
              {/* Top Row: Name and Quantity */}
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>
                    {item.category || 'General'}
                  </Text>
                </View>

                {/* Quantity Unit: Top Right of content row */}
                <View style={[styles.qtyBadge, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 10 }}>
                    {item.quantity} units
                  </Text>
                </View>
              </View>
              
              {/* Bottom Row: Meta Info */}
              <View style={styles.cardMeta}>
                <Text style={{ color: theme.subtext, fontSize: 12 }}>
                  {item.batches?.length || 1} Batches • {item.barcode ? 'Barcode' : 'Manual'}
                </Text>
              </View>
            </View>

            {/* Chevron: Pinned to Bottom Right */}
            <Ionicons 
              name="chevron-forward" 
              size={18} 
              color={theme.border} 
              style={styles.chevronIcon} 
            />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { 
    padding: 20, 
    paddingBottom: 110 
  },
  title: { 
    fontSize: 32, 
    fontWeight: "900", 
    marginTop: 40, 
    marginBottom: 20 
  },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 24, 
    borderWidth: 1, 
    marginBottom: 12,
    position: 'relative',
    minHeight: 100 // Ensures consistent height
  },
  cardImg: { 
    width: 130, 
    height: 100, 
    borderRadius: 16, 
    backgroundColor: '#f0f0f0' 
  },
  cardContent: { 
    flex: 1, 
    marginLeft: 15, 
    height: 80, 
    justifyContent: 'space-between', 
    paddingVertical: 4 
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  name: { 
    fontSize: 14, 
    fontWeight: "800" 
  },
  qtyBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8,
    marginLeft: 10
  },
  cardMeta: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  chevronIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12
  }
});
