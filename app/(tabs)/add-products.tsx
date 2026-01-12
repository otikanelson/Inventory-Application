import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Image,
  ActivityIndicator,
  Switch,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import Toast from "react-native-toast-message";

export default function AddProducts() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isPerishable, setIsPerishable] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    expiryDate: "",
    category: "",
    price: "",
    barcode: "",
  });

  const mode = (params.mode as "registry" | "inventory" | "manual") || "manual";
  const isLocked = params.locked === "true";

  // Clear form and sync params
  useEffect(() => {
    if (params.barcode) {
      setFormData({
        barcode: params.barcode as string,
        name: (params.name as string) || "",
        category: (params.category as string) || "",
        quantity: "",
        expiryDate: "",
        price: "",
      });
      setImage(null); // Refresh image for new scan
      if (params.isPerishable) setIsPerishable(params.isPerishable === "true");
    }
  }, [params.barcode, params.name]);

  const pickImage = async (useCamera: boolean) => {
    setShowPicker(false);
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    let result = useCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.5,
          allowsEditing: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.5,
          allowsEditing: true,
        });

    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!formData.barcode || !formData.name) {
      return Toast.show({
        type: "error",
        text1: "Missing Info",
        text2: "Barcode and Name are required.",
      });
    }

    try {
      setLoading(true);

      // SCENARIO A: REGISTRY MODE ONLY
      if (mode === "registry") {
        await axios.post(`${API_URL}/products/registry/add`, {
          ...formData,
          isPerishable,
          imageUrl: image || "", // Fix: Sending image to registry
        });
        Toast.show({
          type: "success",
          text1: "Registry Updated",
          text2: `${formData.name} is now a registered product.`,
        });
      }

      // SCENARIO B: INVENTORY MODE ONLY (OR MANUAL)
      else {
        await axios.post(`${API_URL}/products`, {
          ...formData,
          isPerishable,
          imageUrl: image || "",
          hasBarcode: true, // Fix: Explicitly setting the barcode flag
        });
        Toast.show({
          type: "success",
          text1: "Inventory Updated",
          text2: "New batch added successfully.",
        });
      }

      // REFRESH: Clear all states and return to a clean form
      setFormData({
        name: "",
        quantity: "",
        expiryDate: "",
        category: "",
        price: "",
        barcode: "",
      });
      setImage(null);
      setIsPerishable(false);

      // Small delay to let Toast show before redirecting
      setTimeout(() => router.replace("/(tabs)"), 1000);
    } catch (err) {
      console.error(err);
      Toast.show({
        type: "error",
        text1: "Save Failed",
        text2: "Please check your connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={
        isDark
          ? require("../../assets/images/Background7.png")
          : require("../../assets/images/Background9.png")
      }
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          {mode === "registry" ? "Register Item" : "Add Product"}
        </Text>

        <Pressable
          style={styles.scanShortcut}
          onPress={() => router.push("/(tabs)/scan")}
        >
          <Ionicons name="barcode-outline" size={24} color={theme.primary} />
          <Text
            style={{ color: theme.text, fontWeight: "700", marginLeft: 10 }}
          >
            Use Smart Scanner
          </Text>
        </Pressable>

        <Text style={styles.divider}>OR ENTER DETAILS</Text>

        <Text style={styles.label}>BARCODE</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.surface, color: theme.text },
          ]}
          value={formData.barcode}
          onChangeText={(t) => setFormData({ ...formData, barcode: t })}
          placeholder="Barcode..."
        />

        <View style={styles.photoRow}>
          <View style={styles.photoBoxContainer}>
            <Pressable
              style={[styles.photoBox, { backgroundColor: theme.surface }]}
              onPress={() => setShowPicker(true)}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.fullImg} />
              ) : (
                <Ionicons name="camera" size={30} color={theme.subtext} />
              )}
            </Pressable>
            {image && (
              <Pressable
                style={styles.removePhoto}
                onPress={() => setImage(null)}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </Pressable>
            )}
          </View>
          <View>
            <Text style={[styles.label, { marginTop: 0 }]}>PRODUCT PHOTO</Text>
            <Text style={{ color: theme.subtext, fontSize: 12 }}>
              Visual proof for {mode === "registry" ? "Registry" : "Inventory"}
            </Text>
          </View>
        </View>

        <Text style={styles.label}>PRODUCT NAME *</Text>
        <TextInput
          style={[
            styles.input,
            isLocked && styles.locked,
            { backgroundColor: theme.surface, color: theme.text },
          ]}
          value={formData.name}
          editable={!isLocked}
          onChangeText={(t) => setFormData({ ...formData, name: t })}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>CATEGORY</Text>
            <TextInput
              style={[
                styles.input,
                isLocked && styles.locked,
                { backgroundColor: theme.surface, color: theme.text },
              ]}
              value={formData.category}
              editable={!isLocked}
              onChangeText={(t) => setFormData({ ...formData, category: t })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>PRICE</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, color: theme.text },
              ]}
              keyboardType="numeric"
              value={formData.price}
              onChangeText={(t) => setFormData({ ...formData, price: t })}
            />
          </View>
        </View>

        {mode === "registry" && (
          <View style={styles.toggleRow}>
            <Text style={{ color: theme.text, fontWeight: "bold" }}>
              Is this item Perishable?
            </Text>
            <Switch value={isPerishable} onValueChange={setIsPerishable} />
          </View>
        )}

        {/* Quantity is only mandatory for Inventory mode */}
        {mode !== "registry" && (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>QUANTITY *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.surface, color: theme.text },
                ]}
                keyboardType="numeric"
                value={formData.quantity}
                onChangeText={(t) => setFormData({ ...formData, quantity: t })}
              />
            </View>
            {isPerishable && (
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>EXPIRY DATE</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.surface, color: theme.text },
                  ]}
                  value={formData.expiryDate}
                  placeholder="YYYY-MM-DD"
                  onChangeText={(t) =>
                    setFormData({ ...formData, expiryDate: t })
                  }
                />
              </View>
            )}
          </View>
        )}

        <Pressable
          style={[styles.completeBtn, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.completeBtnText}>
              {mode === "registry" ? "Add to Registry" : "Add to Inventory"}
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View
            style={[styles.pickerContent, { backgroundColor: theme.surface }]}
          >
            <Pressable style={styles.pickerOpt} onPress={() => pickImage(true)}>
              <Ionicons name="camera" size={24} color={theme.primary} />
              <Text style={{ color: theme.text, marginLeft: 15 }}>
                Take Photo
              </Text>
            </Pressable>
            <Pressable
              style={styles.pickerOpt}
              onPress={() => pickImage(false)}
            >
              <Ionicons name="images" size={24} color={theme.primary} />
              <Text style={{ color: theme.text, marginLeft: 15 }}>
                Choose from Gallery
              </Text>
            </Pressable>
            <Pressable
              style={[styles.pickerOpt, { borderBottomWidth: 0 }]}
              onPress={() => setShowPicker(false)}
            >
              <Text style={{ color: "#FF4444", fontWeight: "bold" }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 25, paddingTop: 50, paddingBottom: 100 },
  title: { fontSize: 32, fontWeight: "900", marginBottom: 20 },
  scanShortcut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 20,
  },
  divider: {
    textAlign: "center",
    fontSize: 10,
    color: "#666",
    letterSpacing: 2,
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#888",
    marginBottom: 8,
    marginTop: 15,
  },
  input: { padding: 16, borderRadius: 15, fontSize: 16 },
  locked: { opacity: 0.6 },
  row: { flexDirection: "row", gap: 15 },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 10,
  },
  photoBoxContainer: { position: "relative" },
  photoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  fullImg: { width: "100%", height: "100%" },
  removePhoto: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#FFF",
    borderRadius: 12,
    elevation: 5,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  completeBtn: {
    padding: 22,
    borderRadius: 25,
    marginTop: 30,
    alignItems: "center",
  },
  completeBtnText: { color: "#FFF", fontWeight: "900", fontSize: 18 },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  pickerContent: {
    padding: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  pickerOpt: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
});
