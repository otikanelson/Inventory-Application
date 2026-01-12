import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import axios from "axios";

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/products/${id}`);
        setProduct(res.data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchDetails();
  }, [id]);

  if (loading) return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Item Details</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Image source={{ uri: product?.imageUrl || 'https://via.placeholder.com/150' }} style={styles.heroImg} resizeMode="contain" />
          <Text style={[styles.name, { color: theme.text }]}>{product?.name}</Text>
          <Text style={[styles.category, { color: theme.primary }]}>{product?.category}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Text style={styles.statLabel}>STOCK</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{product?.quantity}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Text style={styles.statLabel}>BATCHES</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{product?.batches?.length || 1}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Batch Breakdown</Text>
        {product?.batches?.map((batch: any, i: number) => (
          <View key={i} style={[styles.batchCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.batchHeader}>
              <Text style={{ color: theme.subtext, fontWeight: '700' }}>#{batch.batchNumber || 'N/A'}</Text>
              <Text style={{ color: theme.primary, fontWeight: '900' }}>{batch.quantity} Units</Text>
            </View>
            <View style={styles.batchInfo}>
              <Ionicons name="calendar-outline" size={16} color={theme.subtext} />
              <Text style={{ color: theme.text, marginLeft: 8 }}>
                Expires: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'No Date'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center' },
  heroCard: { padding: 30, borderRadius: 32, borderWidth: 1, alignItems: 'center', marginBottom: 20 },
  heroImg: { width: 180, height: 180, marginBottom: 20 },
  name: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  category: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statBox: { flex: 1, padding: 20, borderRadius: 24, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#888', marginBottom: 5 },
  statValue: { fontSize: 20, fontWeight: '900' },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 15 },
  batchCard: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  batchHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  batchInfo: { flexDirection: 'row', alignItems: 'center' }
});