import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ImageBackground,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import Toast from "react-native-toast-message";
import { useTheme } from "../context/ThemeContext";
import { Alert, AlertAction, useAlerts } from "../hooks/useAlerts";

export default function Alerts() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { alerts, summary, loading, refresh, acknowledgeAlert } = useAlerts();

  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  const backgroundImage =
    isDark ?
      require("../assets/images/Background7.png")
    : require("../assets/images/Background9.png");

  const filteredAlerts = alerts.filter((alert) => {
    const matchesLevel =
      selectedLevel === "all" || alert.alertLevel === selectedLevel;
    const matchesSearch =
      !searchQuery ||
      alert.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const handleAction = (alert: Alert, action: AlertAction) => {
    setSelectedAlert(alert);
    setActionModalVisible(true);
  };

  const confirmAction = async () => {
    if (!selectedAlert) return;

    const result = await acknowledgeAlert(
      selectedAlert.alertId,
      "Acknowledged",
    );

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Action Recorded",
        text2: `Applied to ${selectedAlert.productName}`,
      });
      setActionModalVisible(false);
      setSelectedAlert(null);
    } else {
      Toast.show({ type: "error", text1: "Action Failed" });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.subtitle, { color: theme.primary }]}>
              NOTIFICATION_CENTER
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              ALERTS
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            style={[styles.settingsBtn, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="settings-outline" size={20} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.summaryGrid}>
          {[
            { label: "Expired", key: "expired", color: "#8B0000" },
            { label: "Critical", key: "critical", color: "#FF4444" },
            { label: "High", key: "high", color: "#FF9500" },
            { label: "Early", key: "early", color: "#FFD60A" },
          ].map((item) => (
            <View
              key={item.key}
              style={[
                styles.summaryCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: item.color,
                  borderWidth: 1.5,
                },
              ]}
            >
              <Text style={[styles.summaryValue, { color: item.color }]}>
                {summary ? (summary as any)[item.key] || 0 : 0}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.subtext }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="search" size={18} color={theme.subtext} />
          <TextInput
            placeholder="Search alerts..."
            placeholderTextColor={theme.subtext}
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {["all", "expired", "critical", "high", "early"].map((level) => (
            <Pressable
              key={level}
              onPress={() => setSelectedLevel(level)}
              style={[
                styles.filterBtn,
                {
                  backgroundColor:
                    selectedLevel === level ? theme.primary : theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: selectedLevel === level ? "#FFF" : theme.text },
                ]}
              >
                {level.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {filteredAlerts.map((alert) => (
          <View
            key={alert.alertId}
            style={[
              styles.alertCard,
              {
                backgroundColor: theme.surface,
                borderColor: alert.color,
                borderLeftWidth: 6,
              },
            ]}
          >
            <Pressable
              onPress={() => router.push(`/product/${alert.productId}`)}>
              <View style={styles.alertHeader}>
                <View style={styles.alertInfo}>
                  <Text style={[styles.alertName, { color: theme.text }]}>
                    {alert.productName}
                  </Text>
                  <Text style={[styles.alertMeta, { color: theme.subtext }]}>
                    Qty: {alert.quantity} • {alert.category}
                  </Text>
                </View>
                <View style={styles.alertStatus}>
                  <Text style={[styles.daysText, { color: alert.color }]}>
                    {alert.daysUntilExpiry !== null ?
                      alert.daysUntilExpiry <= 0 ?
                        "EXP"
                      : `${alert.daysUntilExpiry}d`
                    : "N/A"}
                  </Text>
                  <View
                    style={[
                      styles.levelBadge,
                      { backgroundColor: alert.color + "20" },
                    ]}
                  >
                    <Text style={[styles.levelText, { color: alert.color }]}>
                      {(alert.alertLevel || "N/A").toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>

            <View style={styles.actionsRow}>
              {alert.actions?.slice(0, 2).map((action: any, idx: number) => (
                <Pressable
                  key={idx}
                  onPress={() => handleAction(alert, action)}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor:
                        action.urgent ? alert.color + "15" : theme.background,
                      borderColor: action.urgent ? alert.color : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={14}
                    color={action.urgent ? alert.color : theme.text}
                  />
                  <Text
                    style={[
                      styles.actionText,
                      { color: action.urgent ? alert.color : theme.text },
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={actionModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Resolve Alert
            </Text>
            <Text style={[styles.modalText, { color: theme.subtext }]}>
              Mark {selectedAlert?.productName} as processed?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setActionModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: theme.background }]}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmAction}
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  subtitle: { fontSize: 10, marginTop: 4, fontWeight: "900", letterSpacing: 2 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryGrid: { flexDirection: "row", gap: 8, marginBottom: 20 },
  summaryCard: { flex: 1, padding: 10, borderRadius: 16, alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "900" },
  summaryLabel: { fontSize: 9, fontWeight: "700", marginTop: 4 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 15,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  filterContainer: { marginBottom: 20 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: { fontSize: 11, fontWeight: "800" },
  alertCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  alertInfo: { flex: 1 },
  alertName: { fontSize: 16, fontWeight: "800" },
  alertMeta: { fontSize: 12, marginTop: 4 },
  alertStatus: { alignItems: "flex-end" },
  daysText: { fontSize: 18, fontWeight: "900" },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  levelText: { fontSize: 9, fontWeight: "800" },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: { fontSize: 11, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 25,
    borderRadius: 25,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 10 },
  modalText: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  modalActions: { flexDirection: "row", gap: 10, width: "100%" },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});
