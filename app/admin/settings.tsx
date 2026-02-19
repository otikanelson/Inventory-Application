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
import { margin, touchTarget } from "../../constants/spacing";
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
                "Alerts & Categories: Add categories and Configure expiry alert levels and category alerts",
                "Store: Update business information and details",
                "Data: Manage profile, preferences, and data export"
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
          
          <SettingRow
            icon="person-circle"
            label="Profile"
            description="Personal information and account details"
            onPress={() => router.push('/admin/settings/profile')}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </SettingRow>

          <SettingRow
            icon="shield-checkmark"
            label="Security"
            description="PIN management and access controls"
            onPress={() => router.push('/admin/settings/security')}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </SettingRow>
          
          <SettingRow
            icon="notifications"
            label="Alerts & Categories"
            description="Add categories and Configure expiry alert levels"
            onPress={() => router.push('/admin/settings/alerts')}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </SettingRow>
          
          <SettingRow
            icon="storefront"
            label="Store"
            description="Business information and details"
            onPress={() => router.push('/admin/settings/store')}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </SettingRow>
          
          <SettingRow
            icon="cloud-download"
            label="Data"
            description="Backup and data export"
            onPress={() => router.push('/admin/settings/data')}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </SettingRow>
        </View>

        {/* APPEARANCE SECTION */}
        <View style={styles.section}>
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

        {/* HELP & SUPPORT SECTION */}
        <View style={styles.section}>
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
          
          <SettingRow
            icon="log-out-outline"
            label="Logout from Admin"
            description="Return to staff dashboard"
            onPress={handleLogout}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </SettingRow>
        </View>

        <View style={{ height: 10 }} />

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
    marginBottom: margin.formField,
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
  versionText: {
    textAlign: "center",
    color: "#888",
    fontSize: 10,
    marginBottom: 100,
    letterSpacing: 1,
  },
});
