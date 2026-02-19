import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import Toast from "react-native-toast-message";
import { useTheme } from "../../../context/ThemeContext";

export default function StoreSettingsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  // Store Information State
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [businessHours, setBusinessHours] = useState("");

  // Load settings on mount
  useEffect(() => {
    loadStoreSettings();
  }, []);

  const loadStoreSettings = async () => {
    try {
      const name = await AsyncStorage.getItem('store_name');
      const address = await AsyncStorage.getItem('store_address');
      const phone = await AsyncStorage.getItem('store_phone');
      const email = await AsyncStorage.getItem('store_email');
      const hours = await AsyncStorage.getItem('store_business_hours');
      
      if (name) setStoreName(name);
      if (address) setStoreAddress(address);
      if (phone) setStorePhone(phone);
      if (email) setStoreEmail(email);
      if (hours) setBusinessHours(hours);
    } catch (error) {
      console.error('Error loading store settings:', error);
    }
  };

  const handleSaveStoreInfo = async () => {
    try {
      await AsyncStorage.multiSet([
        ['store_name', storeName],
        ['store_address', storeAddress],
        ['store_phone', storePhone],
        ['store_email', storeEmail],
        ['store_business_hours', businessHours]
      ]);
      
      Toast.show({
        type: 'success',
        text1: 'Store Information Saved',
        text2: 'Business details updated successfully'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Please try again'
      });
    }
  };

  const backgroundImage = isDark
    ? require("../../../assets/images/Background7.png")
    : require("../../../assets/images/Background9.png");

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <Pressable 
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </Pressable>
          <View>
            <Text style={[styles.headerSub, { color: theme.primary }]}>
              ADMIN_SETTINGS
            </Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              STORE
            </Text>
          </View>
        </View>

        {/* STORE INFORMATION SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primary, marginBottom: 15 }]}>
            BUSINESS DETAILS
          </Text>

          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Store Information
            </Text>
            <Text style={[styles.cardDesc, { color: theme.subtext }]}>
              Manage business details and contact info
            </Text>

            {/* Store Name */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Ionicons name="storefront-outline" size={18} color={theme.primary} />
                <Text style={[styles.labelText, { color: theme.text }]}>
                  Store Name
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }
                ]}
                placeholder="Enter store name"
                placeholderTextColor={theme.subtext}
                value={storeName}
                onChangeText={setStoreName}
              />
            </View>

            {/* Store Address */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Ionicons name="location-outline" size={18} color={theme.primary} />
                <Text style={[styles.labelText, { color: theme.text }]}>
                  Address
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  styles.multilineInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }
                ]}
                placeholder="Enter store address"
                placeholderTextColor={theme.subtext}
                value={storeAddress}
                onChangeText={setStoreAddress}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Store Phone */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Ionicons name="call-outline" size={18} color={theme.primary} />
                <Text style={[styles.labelText, { color: theme.text }]}>
                  Phone Number
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }
                ]}
                placeholder="Enter phone number"
                placeholderTextColor={theme.subtext}
                value={storePhone}
                onChangeText={setStorePhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Store Email */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Ionicons name="mail-outline" size={18} color={theme.primary} />
                <Text style={[styles.labelText, { color: theme.text }]}>
                  Email Address
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }
                ]}
                placeholder="Enter email address"
                placeholderTextColor={theme.subtext}
                value={storeEmail}
                onChangeText={setStoreEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Business Hours */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Ionicons name="time-outline" size={18} color={theme.primary} />
                <Text style={[styles.labelText, { color: theme.text }]}>
                  Business Hours
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  styles.multilineInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }
                ]}
                placeholder="e.g., Mon-Fri: 9AM-6PM, Sat: 10AM-4PM"
                placeholderTextColor={theme.subtext}
                value={businessHours}
                onChangeText={setBusinessHours}
                multiline
                numberOfLines={2}
              />
            </View>

            <Pressable
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={handleSaveStoreInfo}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>SAVE STORE INFORMATION</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { 
    marginTop: 70, 
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSub: { fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  headerTitle: { fontSize: 25, fontWeight: "900", letterSpacing: -1 },
  section: { marginBottom: 50 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  formCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 13,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "700",
  },
  textInput: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "600",
  },
  multilineInput: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    height: 50,
    borderRadius: 15,
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
