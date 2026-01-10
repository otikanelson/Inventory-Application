// components/ProductCard.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Product } from '../data/dummyProducts';

const { width } = Dimensions.get('window');

export const ProductCard = ({ item }: { item: Product & { imageUrl?: string } }) => {
  const { theme, isDark } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Top Pill Labels */}
      <View style={styles.topLabels}>
        <View style={[styles.pill, { backgroundColor: isDark ? '#ffffff10' : '#f3f4f6' }]}>
          <Text style={[styles.pillText, { color: theme.text }]}>{item.category || 'Item'}</Text>
        </View>
        <Text style={[styles.locationCode, { color: theme.subtext }]}>C5-R2</Text>
      </View>

      {/* Image Container with Loader Logic */}
      <View style={styles.imageContainer}>
        {/* Placeholder: Shows if no image or until image is loaded */}
        {!isLoaded && (
          <View style={styles.placeholderOverlay}>
            <Ionicons 
              name="cube-outline" 
              size={60} 
              color={isDark ? '#ffffff20' : '#e5e7eb'} 
            />
          </View>
        )}

        {/* Real Image */}
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={[styles.image, { opacity: isLoaded ? 1 : 0 }]}
            onLoad={() => setIsLoaded(true)}
            resizeMode="contain"
          />
        )}
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View>
          <Text style={[styles.quantity, { color: theme.subtext }]}>{item.quantity} Items</Text>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
        <Pressable style={[styles.arrowBtn, { backgroundColor: isDark ? '#ffffff10' : '#1e293b' }]}>
          <Ionicons name="arrow-forward" size={18} color={isDark ? theme.text : '#FFF'} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: (width / 2) - 26,
    height: 280,
    borderRadius: 30,
    borderWidth: 1,
    padding: 15,
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  topLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  locationCode: {
    fontSize: 10,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 30,
  },
  placeholderOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  quantity: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    width: 90,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  }
});