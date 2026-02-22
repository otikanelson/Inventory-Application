import { Ionicons } from "@expo/vector-icons";
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
import { AIStatusIndicator } from "../components/AIStatusIndicator";
import { margin, touchTarget } from "../constants/spacing";
import { useTheme } from "../context/ThemeContext";
import { useTour } from "../context/TourContext";

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const backgroundImage = isDark
    ? require("../assets/images/Background7.png")
    : require("../assets/images/Background9.png");
  const router = useRouter();
  const { resetTour, startTour } = useTour();

  const SettingRow = ({ icon, label, children, description, onPress, style }: any) => {
    const row = (
      <View style={[styles.settingRow, { borderBottomColor: theme.border }, style]}>
        <View style={styles.settingMain}>
          <View
            style={[styles.iconBox, { backgroundColor: theme.primary + "15" }]}
          >
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
    <ImageBackground source={backgroundImage} style={{ flex: 1 }} resizeMode="cover">
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
      

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerSub, { color: theme.primary }]}>
            SYSTEM_CONFIGURATION
          </Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            SETTINGS
          </Text>
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

      {/* ADMINISTRATION SECTION */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          ADMINISTRATION
        </Text>
        <SettingRow
          icon="person-circle-outline"
          label="My Profile"
          description="View account details"
          onPress={() => router.push('/profile' as any)}
          style={{ marginBottom: 16 }}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
        </SettingRow>
      </View>

      {/* HELP & SUPPORT SECTION */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          HELP & SUPPORT
        </Text>
        
        {/* AI Status Indicator */}
        <AIStatusIndicator onPress={() => router.push("/ai-info" as any)} />
        

        
        <SettingRow
          icon="help-circle-outline"
          label="Restart App Tour"
          description="View onboarding tour again"
          onPress={async () => {
            try {
              resetTour();
              Toast.show({
                type: 'success',
                text1: 'Tour Reset',
                text2: 'Go to Dashboard to see the tour again'
              });
              // Navigate to dashboard and start tour
              router.push('/');
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

      <View style={{ height: 10 }} />

        <Text style={styles.versionText}>
          Build v2.0.5 - Production Environment
        </Text>
      </ScrollView>
    </View>
    </ImageBackground>
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  adminBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  versionText: {
    textAlign: "center",
    color: "#888",
    fontSize: 10,
    marginBottom: 100,
    letterSpacing: 1,
  },
});
