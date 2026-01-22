import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  RefreshControl,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function AdminStats() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { dashboardData, salesTrends, loading, refresh } = useAnalytics();
  const [selectedPeriod, setSelectedPeriod] = useState<"7" | "30">("30");

  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  const summary = dashboardData?.summary;
  const topRisk = summary?.topRiskProducts || [];
  const topSelling = summary?.topSellingProducts || [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Predictive Analytics
            </Text>
            <Text style={[styles.headerSub, { color: theme.subtext }]}>
              AI-Driven Insights & Forecasting
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("../(tabs)/")}
            style={[styles.backBtn, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="home-outline" size={22} color={theme.text} />
          </Pressable>
        </View>

        {/* Risk Overview Cards */}
        <View style={styles.riskGrid}>
          <View
            style={[
              styles.riskCard,
              {
                backgroundColor: theme.surface,
                borderColor: "#FF4444",
                borderWidth: 2,
              },
            ]}
          >
            <Ionicons name="alert-circle" size={28} color="#FF4444" />
            <Text style={[styles.riskValue, { color: theme.text }]}>
              {summary?.highRiskProducts || 0}
            </Text>
            <Text style={[styles.riskLabel, { color: theme.subtext }]}>
              High Risk
            </Text>
            <Text style={[styles.riskDesc, { color: theme.subtext }]}>
              Need urgent action
            </Text>
          </View>

          <View
            style={[
              styles.riskCard,
              {
                backgroundColor: theme.surface,
                borderColor: "#FF9500",
                borderWidth: 2,
              },
            ]}
          >
            <Ionicons name="warning" size={28} color="#FF9500" />
            <Text style={[styles.riskValue, { color: theme.text }]}>
              {summary?.mediumRiskProducts || 0}
            </Text>
            <Text style={[styles.riskLabel, { color: theme.subtext }]}>
              Medium Risk
            </Text>
            <Text style={[styles.riskDesc, { color: theme.subtext }]}>
              Monitor closely
            </Text>
          </View>
        </View>

        {/* Sales Summary */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            SALES PERFORMANCE (30 DAYS)
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="cash-outline" size={24} color={theme.primary} />
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                â‚¦{(summary?.totalSales || 0).toLocaleString()}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.subtext }]}>
                Total Revenue
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="cube-outline" size={24} color={theme.primary} />
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {summary?.totalUnitsSold || 0}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.subtext }]}>
                Units Sold
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons
                name="speedometer-outline"
                size={24}
                color={theme.primary}
              />
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {(summary?.averageVelocity || 0).toFixed(1)}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.subtext }]}>
                Avg Velocity (units/day)
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="layers-outline" size={24} color={theme.primary} />
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {summary?.totalProducts || 0}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.subtext }]}>
                Active Products
              </Text>
            </View>
          </View>
        </View>

        {/* High Risk Products */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: theme.text }]}>
              ðŸš¨ High Risk Products
            </Text>
            <Text style={[styles.listCount, { color: theme.subtext }]}>
              {topRisk.length} items
            </Text>
          </View>

          {topRisk.slice(0, 5).map((item: any, index: number) => (
            <Pressable
              key={item.productId}
              style={[
                styles.productRow,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => router.push(`/product/${item.productId}`)}
            >
              <View
                style={[
                  styles.riskIndicator,
                  { backgroundColor: getRiskColor(item.riskScore) },
                ]}
              />
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: theme.text }]}>
                  {item.productName}
                </Text>
                <Text style={[styles.productMeta, { color: theme.subtext }]}>
                  Stock: {item.currentStock} â€¢ Velocity:{" "}
                  {item.velocity.toFixed(1)}/day
                </Text>
              </View>
              <View style={styles.riskBadge}>
                <Text
                  style={[
                    styles.riskScoreText,
                    { color: getRiskColor(item.riskScore) },
                  ]}
                >
                  {item.riskScore}
                </Text>
                <Text style={[styles.riskScoreLabel, { color: theme.subtext }]}>
                  Risk
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Top Selling Products */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: theme.text }]}>
              ðŸ“ˆ Top Selling Products
            </Text>
            <Text style={[styles.listCount, { color: theme.subtext }]}>
              {topSelling.length} items
            </Text>
          </View>

          {topSelling.slice(0, 5).map((item: any, index: number) => (
            <Pressable
              key={item.productId}
              style={[
                styles.productRow,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => router.push(`/product/${item.productId}`)}
            >
              <View
                style={[
                  styles.rankBadge,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <Text style={[styles.rankText, { color: theme.primary }]}>
                  #{index + 1}
                </Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: theme.text }]}>
                  {item.productName}
                </Text>
                <Text style={[styles.productMeta, { color: theme.subtext }]}>
                  {item.velocity.toFixed(1)} units/day â€¢ {item.trend} trend
                </Text>
              </View>
              <Ionicons
                name="trending-up"
                size={20}
                color={theme.primary}
              />
            </Pressable>
          ))}
        </View>

        {/* AI Insights Section */}
        <View
          style={[
            styles.insightsCard,
            {
              backgroundColor: theme.primary + "15",
              borderColor: theme.primary + "40",
            },
          ]}
        >
          <View style={styles.insightsHeader}>
            <Ionicons name="bulb" size={24} color={theme.primary} />
            <Text style={[styles.insightsTitle, { color: theme.primary }]}>
              AI Recommendations
            </Text>
          </View>
          <Text style={[styles.insightsText, { color: theme.text }]}>
            â€¢ Apply 30-50% discount on {summary?.highRiskProducts || 0} high
            risk items
          </Text>
          <Text style={[styles.insightsText, { color: theme.text }]}>
            â€¢ Monitor {summary?.mediumRiskProducts || 0} medium risk items
            closely
          </Text>
          <Text style={[styles.insightsText, { color: theme.text }]}>
            â€¢ Restock top {topSelling.length} fast-moving products within 7
            days
          </Text>
          <Text style={[styles.insightsText, { color: theme.text }]}>
            â€¢ Average demand velocity:{" "}
            {(summary?.averageVelocity || 0).toFixed(1)} units/day
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Helper function to get risk color
const getRiskColor = (score: number) => {
  if (score >= 70) return "#FF4444";
  if (score >= 50) return "#FF9500";
  if (score >= 30) return "#FFCC00";
  return "#34C759";
};

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  headerTitle: { fontSize: 26, fontWeight: "900" },
  headerSub: { fontSize: 13, marginTop: 4 },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  riskGrid: { flexDirection: "row", gap: 12, marginBottom: 20 },
  riskCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
  },
  riskValue: { fontSize: 32, fontWeight: "900", marginTop: 10 },
  riskLabel: { fontSize: 12, fontWeight: "700", marginTop: 4 },
  riskDesc: { fontSize: 10, marginTop: 2 },
  summaryCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 15,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 22, fontWeight: "900", marginTop: 8 },
  summaryLabel: { fontSize: 10, fontWeight: "600", marginTop: 4 },
  listSection: { marginBottom: 25 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listTitle: { fontSize: 18, fontWeight: "800" },
  listCount: { fontSize: 12, fontWeight: "600" },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  riskIndicator: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: "700" },
  productMeta: { fontSize: 12, marginTop: 2 },
  riskBadge: { alignItems: "center" },
  riskScoreText: { fontSize: 20, fontWeight: "900" },
  riskScoreLabel: { fontSize: 9, fontWeight: "700" },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: { fontSize: 14, fontWeight: "900" },
  insightsCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  insightsTitle: { fontSize: 16, fontWeight: "800" },
  insightsText: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
});