import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const backgroundImage = isDark
    ? require("../assets/images/Background7.png")
    : require("../assets/images/Background9.png");

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Semicircular Header */}
      <View style={[styles.headerCurve, { backgroundColor: theme.header }]}>
        <Text style={styles.headerTitle}>InventiEase</Text>
      </View>

      {/* Centered Content */}
      <View style={styles.centerContent}>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Smart tracking for products & expiry dates
        </Text>
        <Image
          source={require("../assets/images/Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={styles.primaryText}>View Inventory</Text>
        </Pressable>

        <Pressable
          style={[
            styles.secondaryButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={() => router.push("/(tabs)/add-products")}
        >
          <Text style={[styles.secondaryText, { color: theme.text }]}>
            Add Product
          </Text>
        </Pressable>

        <Pressable
          style={styles.ghostButton}
          onPress={() => router.push("/scan")}
        >
          <View style={styles.ghostBtncontent}>
            <Ionicons name="scan-outline" size={24} color={theme.primary} />
            <Text style={[styles.ghostText, { color: theme.primary }]}>
              Scan Barcode
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCurve: {
    height: 150,
    borderBottomLeftRadius: 1000,
    borderBottomRightRadius: 1000,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
    width: "130%",
    alignSelf: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  logo: { width: 220, height: 220 },
  actions: { padding: 24, gap: 14, marginBottom: 40 },
  primaryButton: {
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  primaryText: { color: "#FFFFFF", fontSize: 17, fontWeight: "500" },
  secondaryButton: {
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1.5,
  },
  secondaryText: { fontSize: 16, fontWeight: "500" },
  ghostButton: { paddingVertical: 10, alignItems: "center" },
  ghostBtncontent: { flexDirection: "row", gap: 10, alignItems: "center" },
  ghostText: { fontSize: 16, fontWeight: "500" },
});
