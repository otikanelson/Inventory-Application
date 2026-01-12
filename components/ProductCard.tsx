import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { Product } from '../hooks/useProducts';

const { width } = Dimensions.get('window');

export const ProductCard = ({ item }: { item: Product }) => {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  // Use as Href to bypass TypeScript path validation
  const handlePress = () => {
    const id = item._id || item.id;
    router.push(`/product/${id}` as Href);
  };

  return (
    <Pressable 
      onPress={handlePress}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={styles.topLabels}>
        <View style={[styles.pill, { backgroundColor: theme.background + "80" }]}>
          <Text style={[styles.pillText, { color: theme.text }]}>
            {item.category || 'General'}
          </Text>
        </View>
      </View>

      <View style={[styles.imageWrapper, { backgroundColor: theme.background }]}>
        {!isLoaded && (
          <Ionicons name="cube-outline" size={40} color={isDark ? '#ffffff10' : '#00000010'} />
        )}
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={[styles.image, { opacity: isLoaded ? 1 : 0 }]}
            onLoad={() => setIsLoaded(true)}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.quantity, { color: theme.primary }]}>
            {item.quantity} in stock
          </Text>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View style={[styles.arrowBtn, { backgroundColor: theme.primary }]}>
          <Ionicons name="chevron-forward" size={18} color="#FFF" />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { width: (width / 2) - 27, height: 240, borderRadius: 24, borderWidth: 1, padding: 12, marginBottom: 16 },
  topLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  imageWrapper: { width: '100%', height: 120, borderRadius: 18, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  image: { width: '100%', height: '100%', position: 'absolute' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quantity: { fontSize: 11, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase' },
  name: { fontSize: 16, fontWeight: '800' },
  arrowBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }
});