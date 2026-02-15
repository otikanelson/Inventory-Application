import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Product } from "../hooks/useProducts";
import { Prediction } from "../types/ai-predictions";

const { width } = Dimensions.get("window");

// --- SKELETON COMPONENT ---
export const ProductCardSkeleton = () => {
  const { theme, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.topLabels}>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: isDark ? "#ffffff10" : "#00000005",
              width: 50,
              height: 18,
            },
          ]}
        />
        <View
          style={[
            styles.pill,
            {
              backgroundColor: isDark ? "#ffffff10" : "#00000005",
              width: 40,
              height: 18,
            },
          ]}
        />
      </View>

      <Animated.View
        style={[
          styles.imageWrapper,
          {
            backgroundColor: isDark ? "#1A1A1A" : "#F5F5F7",
            opacity: pulseAnim,
          },
        ]}
      >
        <Ionicons
          name="cube-outline"
          size={40}
          color={isDark ? "#ffffff10" : "#00000010"}
        />
      </Animated.View>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Animated.View
            style={{
              height: 10,
              width: "40%",
              backgroundColor: theme.subtext + "20",
              marginBottom: 6,
              borderRadius: 4,
              opacity: pulseAnim,
            }}
          />
          <Animated.View
            style={{
              height: 14,
              width: "80%",
              backgroundColor: theme.text + "20",
              borderRadius: 4,
              opacity: pulseAnim,
            }}
          />
        </View>
        <View
          style={[
            styles.arrowCircle,
            { backgroundColor: isDark ? "#ffffff08" : "#00000005" },
          ]}
        />
      </View>
    </View>
  );
};

// --- MAIN PRODUCT CARD ---
interface ProductCardProps {
  item: Product;
  prediction?: Prediction | null;
  sortField?: 'name' | 'totalQuantity' | 'risk' | 'velocity';
}

export const ProductCard = React.memo(({ item, prediction, sortField = 'name' }: ProductCardProps) => {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  // Get risk color based on score
  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 70) return '#FF3B30'; // Red
    if (riskScore >= 50) return '#FF9500'; // Orange
    if (riskScore >= 30) return '#FFCC00'; // Yellow
    return null; // No indicator for low risk
  };

  // Get velocity indicator
  const getVelocityIndicator = (velocity: number) => {
    if (velocity > 5) return { icon: 'flash' as const, color: '#34C759' }; // Fast
    if (velocity < 0.5) return { icon: 'hourglass' as const, color: '#FF9500' }; // Slow
    return null;
  };

  const riskScore = prediction?.metrics?.riskScore || 0;
  const velocity = prediction?.metrics?.velocity || 0;
  const riskColor = getRiskColor(riskScore);
  const velocityIndicator = getVelocityIndicator(velocity);

  return (
    <Pressable
      onPress={() =>
        router.push(`/product/${item._id}` as Href)}
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {/* Risk Indicator Dot - Top Right */}
      {riskColor && riskScore > 0 && (
        <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
      )}

      <View style={styles.topLabels}>
        <View
          style={[
            styles.pill,
            styles.categoryPill,
            { backgroundColor: isDark ? "#ffffff10" : "#00000005" },
          ]}
        >
          <Ionicons name="pricetag-outline" size={10} color={theme.subtext} />
          <Text style={[styles.pillText, { color: theme.subtext }]} numberOfLines={1}>
            {item.category || "General"}
          </Text>
        </View>
        <View
          style={[
            styles.pill,
            { backgroundColor: isDark ? "#ffffff10" : "#00000005" },
          ]}
        >
          <Ionicons name="flash-outline" size={10} color={theme.subtext} />
          <Text style={[styles.pillText, { color: theme.subtext }]}>
            {item.isPerishable ? "FEFO" : "STD"}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.imageWrapper,
          { backgroundColor: isDark ? "#00000035" : "#a2a2a22f" },
        ]}
      >
        {/* Velocity Indicator - Bottom Left of Image */}
        {velocityIndicator && (
          <View style={[styles.velocityIndicator, { backgroundColor: velocityIndicator.color + '20' }]}>
            <Ionicons name={velocityIndicator.icon} size={10} color={velocityIndicator.color} />
          </View>
        )}

        {!isLoaded && (
          <Ionicons
            name="cube-outline"
            size={40}
            color={isDark ? "#ffffff10" : "#00000010"}
          />
        )}
        {item.imageUrl && item.imageUrl !== "cube" && item.imageUrl !== "" && (
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
          {sortField === 'risk' && prediction ? (
            <>
              <Text style={[styles.quantityLabel, { color: riskColor || theme.subtext }]}>
                Risk Score
              </Text>
              <Text style={[styles.name, { color: riskColor || theme.text }]} numberOfLines={1}>
                {Math.round(riskScore)}/100
              </Text>
            </>
          ) : sortField === 'velocity' && prediction ? (
            <>
              <Text style={[styles.quantityLabel, { color: velocityIndicator?.color || theme.subtext }]}>
                Velocity
              </Text>
              <Text style={[styles.name, { color: velocityIndicator?.color || theme.text }]} numberOfLines={1}>
                {velocity.toFixed(1)}/day
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.quantityLabel, { color: theme.subtext }]}>
                {item.totalQuantity} Items
              </Text>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {item.name}
              </Text>
            </>
          )}
        </View>
        <View
          style={[
            styles.arrowCircle,
            { backgroundColor: isDark ? "#ffffff08" : "#00000005" },
          ]}
        >
          <Ionicons
            name="arrow-up-outline"
            size={14}
            color={theme.text}
            style={{ transform: [{ rotate: "45deg" }] }}
          />
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: width / 2 - 27,
    borderRadius: 28,
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
    position: 'relative',
  },
  riskDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  velocityIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  topLabels: { flexDirection: "row", gap: 6, marginBottom: 12 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryPill: {
    flex: 1,
    minWidth: 0, // Important for text truncation to work
  },
  pillText: { fontSize: 8, fontWeight: "700", textTransform: "uppercase" },
  imageWrapper: {
    width: "100%",
    height: 140,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    padding: 5,
  },
  image: { width: "95%", height: "95%", borderRadius: 22 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 4,
  },
  quantityLabel: { fontSize: 12, fontWeight: "500", marginBottom: 2 },
  name: { fontSize: 15, fontWeight: "800" },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});