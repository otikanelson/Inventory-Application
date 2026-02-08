import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
export const ProductCard = ({ item }: { item: Product }) => {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <Pressable
      onPress={() =>
        router.push(`/product/${item._id}` as Href)}
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
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
        {!isLoaded && (
          <Ionicons
            name="cube-outline"
            size={40}
            color={isDark ? "#ffffff10" : "#00000010"}
          />
        )}
        {item.imageUrl && item.imageUrl !== "cube" && (
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
          <Text style={[styles.quantityLabel, { color: theme.subtext }]}>
            {item.totalQuantity} Items
          </Text>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
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
};

const styles = StyleSheet.create({
  card: {
    width: width / 2 - 27,
    borderRadius: 28,
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
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
  },
  image: { width: "85%", height: "85%" },
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