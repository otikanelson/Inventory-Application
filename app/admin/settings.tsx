import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import Toast from "react-native-toast-message";
import { HelpTooltip } from "../../components/HelpTooltip";
import { lineHeight, margin, padding, touchTarget } from "../../constants/spacing";
import { useAdminTour } from "../../context/AdminTourContext";
import { useTheme } from "../../context/ThemeContext";

export default function AdminSettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const { resetTour, startTour } = useAdminTour();

  const handleLogout = async () => {
    try {
      // Clear only admin session data, preserve staff authentication
      await AsyncStorage.multiRemove([
        'admin_session',
        'admin_session_time',
        'admin_last_auth',
      ]);
      
      // Navigate to staff dashboard (staff member is still logged in)
      router.replace('/' as any);
      
      // Show toast after navigation
      setTimeout(() => {
        Toast.show({
          type: 'success',
          text1: 'Logged Out',
          text2: 'Admin session ended'
        });
      }, 100);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: 'Could not end session'
      });
    }
  };

  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  // Category Card Component
  const CategoryCard = ({ icon, title, description, route, iconColor }: any) => (
    <Pressable
      style={[styles.categoryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => router.push(route)}
      android_ripple={{ color: theme.primary + "25" }}
    >
      <View style={[styles.categoryIconBox, { backgroundColor: iconColor + "15" }]}>
        <Ionicons name={icon} size={32} color={iconColor} />
      </View>
      <Text style={[styles.categoryTitle, { color: theme.text }]}>
        {title}
      </Text>
      <Text style={[styles.categoryDescription, { color: theme.subtext }]}>
        {description}
      </Text>
      <View style={styles.categoryArrow}>
        <Ionicons name="chevron-forward" size={24} color={theme.primary} />
      </View>
    </Pressable>
  );

  const SettingRow = ({ icon, label, description, onPress, children }: any) => {
    const row = (
      <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
        <View style={styles.settingMain}>
          <View style={[styles.iconBox, { backgroundColor: theme.primary + "15" }]}>
            <Ionicons name={icon} size={20} color={theme.primary} />
          </View>
          <View style={styles.textStack}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              {label}
            </Text>
            {description && (
              <Text style={[styles.settingDesc, { color: theme.subtext }]}>
                {description}
              </Text>
            )}
          </View>
        </View>
        {children}
      </View>
    );

    if (onPress) {
      return (
        <Pressable onPress={onPress} android_ripple={{ color: theme.primary + "25" }}>
          {row}
        </Pressable>
      );
    }

    return row;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View>
              <Text style={[styles.headerSub, { color: theme.primary }]}>
                ADMIN_PANEL
              </Text>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                SETTINGS
              </Text>
            </View>
            <HelpTooltip
              style={{marginTop: 20}}
              title="Admin Settings"
              content={[
                "Manage all admin settings from one place. Select a category to configure specific settings.",
                "Security: Manage PINs, auto-logout, and access controls",
                "Alerts: Configure expiry alert levels and category alerts",
                "Store: Update business information and details",
                "Account: Manage profile, preferences, and data export"
              ]}
              icon="help-circle"
              iconSize={18}
              iconColor={theme.primary}
            />
          </View>
        </View>

        {/* SETTINGS CATEGORIES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            SETTINGS CATEGORIES
          </Text>
          
          <View style={styles.categoryGrid}>
            <CategoryCard
              icon="shield-checkmark"
              title="Security"
              description="PIN management and access controls"
              route="/admin/settings/security"
              iconColor="#FF3B30"
            />
            
            <CategoryCard
              icon="notifications"
              title="Alerts"
              description="Configure expiry alert levels"
              route="/admin/settings/alerts"
              iconColor="#FF9500"
            />
            
            <CategoryCard
              icon="storefront"
              title="Store"
              description="Business information and details"
              route="/admin/settings/store"
              iconColor="#34C759"
            />
            
            <CategoryCard
              icon="person-circle"
              title="Account"
              description="Profile and data export"
              route="/admin/settings/account"
              iconColor="#007AFF"
            />
          </View>
        </View>

        {/* HELP & SUPPORT SECTION */}
        <View style={[styles.section, {marginBottom: 20}]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            HELP & SUPPORT
          </Text>
          <SettingRow
            icon="help-circle-outline"
            label="Restart Admin Tour"
            description="View admin onboarding tour again"
            onPress={async () => {
              try {
                await resetTour();
                Toast.show({
                  type: 'success',
                  text1: 'Tour Reset',
                  text2: 'Go to Admin Dashboard to see the tour again'
                });
                // Navigate to admin dashboard and start tour
                router.push('../admin');
                setTimeout(() => {
                  startTour();
                }, 500);
              } catch (error) {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: 'Could not reset tour'
                });
              }
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </SettingRow>
        </View>

        {/* APPEARANCE SECTION */}
        <View style={[styles.section, {marginBottom: 20}]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            APPEARANCE
          </Text>
          
          <SettingRow
            icon="moon-outline"
            label="Dark Mode"
            description="Toggle light/dark theme"
          >
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ true: theme.primary }}
            />
          </SettingRow>
        </View>

        {/* LOGOUT */}
        <Pressable
          style={[styles.logoutBtn, { borderColor: '#FF4444' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#FF4444" />
          <Text style={styles.logoutText}>Logout from Admin</Text>
        </Pressable>

        <Text style={styles.versionText}>
          Build v2.0.5 - Production Environment
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 70, marginBottom: margin.section },
  headerSub: { fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  headerTitle: { fontSize: 25, fontWeight: "900", letterSpacing: -1 },
  section: { marginBottom: margin.section },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: margin.divider,
  },
  categoryGrid: {
    gap: margin.divider,
  },
  categoryCard: {
    padding: padding.card,
    borderRadius: 20,
    borderWidth: 2,
    minHeight: 140,
    position: 'relative',
  },
  categoryIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: lineHeight.description * 14,
    marginBottom: 8,
  },
  categoryArrow: {
    position: 'absolute',
    top: 24,
    right: 24,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingMain: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconBox: {
    width: touchTarget.minWidth,
    height: touchTarget.minHeight,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textStack: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: "600" },
  settingDesc: { fontSize: 12, marginTop: 2 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: padding.button,
    borderRadius: 20,
    borderWidth: 2,
    marginTop: 20,
    marginBottom: 10,
  },
  logoutText: { color: "#FF4444", fontWeight: "900", fontSize: 14 },
  versionText: {
    textAlign: "center",
    color: "#888",
    fontSize: 10,
    marginBottom: 100,
    letterSpacing: 1,
  },
});
