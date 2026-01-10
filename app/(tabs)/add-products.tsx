import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";

export default function AddProducts() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  // Form State
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    expiryDate: "", // Expected format: YYYY-MM-DD
    category: "",
    price: "",
    barcode: "",
  });

  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  // Image Picker Logic
  const pickImage = async (useCamera: boolean) => {
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "We need access to your camera/gallery."
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    };

    const result = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Save to Database
  const handleSave = async () => {
    if (!formData.name || !formData.quantity || !formData.expiryDate) {
      Alert.alert("Error", "Please fill in all required fields (*)");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        price: Number(formData.price) || 0,
        imageUrl: image || "https://via.placeholder.com/150",
      };

      const response = await axios.post(`${API_URL}/products`, payload);

      if (response.status === 201 || response.status === 200) {
        Alert.alert("Success", "Product added successfully!");
        router.replace("/(tabs)"); // Redirect to Dashboard
      }
    } catch (error: any) {
      console.error("Save Error:", error.response?.data || error.message);
      Alert.alert(
        "Failed to save",
        error.response?.data?.error || "Network error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>Add Product</Text>

        <Pressable
          style={[
            styles.scanBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => router.push("/(tabs)/scan")}
        >
          <Ionicons
            name="barcode-outline"
            size={24}
            color={theme.text}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.scanText, { color: theme.text }]}>
            Scan Barcode
          </Text>
        </Pressable>

        <Text style={[styles.or, { color: theme.subtext }]}>
          OR ENTER MANUALLY
        </Text>

        {/* Image Picker Section */}
        <Text style={[styles.label, { color: theme.subtext }]}>
          Product Photo
        </Text>
        <View style={styles.imagePickerSection}>
          <View
            style={[
              styles.imagePreview,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.fullImage} />
            ) : (
              <Ionicons name="image-outline" size={40} color={theme.subtext} />
            )}
          </View>
          <View style={styles.imageActionBtns}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: theme.primary }]}
              onPress={() => pickImage(true)}
            >
              <Ionicons name="camera" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Camera</Text>
            </Pressable>
            <Pressable
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.primary,
                },
              ]}
              onPress={() => pickImage(false)}
            >
              <Ionicons name="images" size={20} color={theme.primary} />
              <Text style={[styles.actionBtnText, { color: theme.primary }]}>
                Gallery
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Input Fields */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.subtext }]}>
            Product Name *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="e.g. Peak Milk Powder"
            placeholderTextColor={theme.subtext}
            onChangeText={(v) => setFormData({ ...formData, name: v })}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.label, { color: theme.subtext, marginTop: 15 }]}
              >
                Quantity *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="10"
                keyboardType="numeric"
                placeholderTextColor={theme.subtext}
                onChangeText={(v) => setFormData({ ...formData, quantity: v })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.label, { color: theme.subtext, marginTop: 15 }]}
              >
                Category
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Dairy"
                placeholderTextColor={theme.subtext}
                onChangeText={(v) => setFormData({ ...formData, category: v })}
              />
            </View>
          </View>

          <Text style={[styles.label, { color: theme.subtext, marginTop: 15 }]}>
            Expiry Date * (YYYY-MM-DD)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="2026-05-24"
            placeholderTextColor={theme.subtext}
            onChangeText={(v) => setFormData({ ...formData, expiryDate: v })}
          />

          <Pressable
            style={[
              styles.saveBtn,
              { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 },
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveText}>Save Product</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 32, fontWeight: "900", marginTop: 40, marginBottom: 20 },
  scanBtn: {
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  scanText: { fontSize: 16, fontWeight: "700" },
  or: {
    textAlign: "center",
    marginVertical: 20,
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 1,
  },
  imagePickerSection: { flexDirection: "row", gap: 15, marginBottom: 20 },
  imagePreview: {
    width: 110,
    height: 110,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  fullImage: { width: "100%", height: "100%" },
  imageActionBtns: { flex: 1, justifyContent: "space-between" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 15,
    gap: 8,
    justifyContent: "center",
  },
  actionBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    opacity: 0.8,
  },
  input: { borderRadius: 18, padding: 16, borderWidth: 1, fontSize: 16 },
  row: { flexDirection: "row", gap: 12 },
  form: { marginTop: 10 },
  saveBtn: {
    padding: 20,
    borderRadius: 22,
    marginTop: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  saveText: { fontWeight: "800", color: "#FFF", fontSize: 18 },
});
