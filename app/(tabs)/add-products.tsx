// Goal: Create an "Add Products" screen in React Native with the following features.
// Features:
// - Dynamic Modes: Handle 'Registry' (master product creation) and 'Inventory' (batch stock addition) based on navigation params.
// - Smart Pre-fill: Automatically populate barcode, name, and category when coming from the Scanner.
// - Locked State: Prevent modification of product identity (name/category) when adding a batch to an existing product.
// - Image Management: Support camera/gallery selection for product photos with a removal option.
// - Perishable Logic: Toggle visibility of the Expiry Date field only if the product is marked as perishable.
// - Centralized Mutations: Utilize useInventoryActions hook for all backend interactions to maintain consistency.
// - Validation: Ensure required fields (name, barcode, quantity for inventory) are filled before submission.
// - Navigation Safety: Clear form state and redirect to dashboard upon successful save with toast feedback.

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
import { useTheme } from "../../context/ThemeContext";
import { useInventoryActions } from "../../hooks/useInventoryActions";
import Toast from "react-native-toast-message";

export default function AddProducts() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addProduct, addBatch, isSubmitting } = useInventoryActions();

  /** State Management **/
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

  /** Sync Scanner Params **/
  useEffect(() => {
    if (params.barcode) {
      setFormData((prev) => ({
        ...prev,
        barcode: params.barcode as string,
        name: (params.name as string) || "",
        category: (params.category as string) || "",
      }));
      if (params.isPerishable) setIsPerishable(params.isPerishable === "true");
    }
  }, [params.barcode, params.name]);

  /** Image Picker Logic **/
  const pickImage = async (useCamera: boolean) => {
    setShowPicker(false);
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) return;

    const options: ImagePicker.ImagePickerOptions = {
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    };

    let result = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) setImage(result.assets[0].uri);
  };

  /** Form Submission Logic **/
  const handleSave = async () => {
    if (!formData.barcode || !formData.name) {
      return Toast.show({ type: "error", text1: "Missing Identity", text2: "Barcode and Name are required." });
    }

    try {
      if (mode === "registry") {
        /** Case 1: Create Master Entry in Global Registry **/
        await addProduct({
          name: formData.name,
          barcode: formData.barcode,
          category: formData.category,
          isPerishable: isPerishable,
          imageUrl: image || "",
          hasBarcode: params.hasBarcode !== "false",
          // Convert strings to numbers here
          quantity: formData.quantity ? Number(formData.quantity) : 0,
          // If your Product type supports price, convert it too
          // price: Number(formData.price) 
        });
        
        Toast.show({ type: "success", text1: "Global Registry Updated", text2: `${formData.name} is now registered.` });
      } else {
        /** Case 2: Add specific stock batch to existing product **/
        if (!formData.quantity) return Toast.show({ type: "error", text1: "Qty Required", text2: "Enter stock amount." });
        
        await addBatch(formData.barcode, {
          batchNumber: `BN-${Date.now().toString().slice(-6)}`,
          quantity: Number(formData.quantity), // Fixed: Convert to number
          expiryDate: formData.expiryDate || "N/A",
        });
        Toast.show({ type: "success", text1: "Stock Added", text2: "New batch pushed to inventory." });
      }

      setTimeout(() => router.replace("/(tabs)"), 1000);
    } catch (err) {
      Toast.show({ type: "error", text1: "Save Failed", text2: "Check backend connection." });
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
          {mode === "registry" ? "Master Entry" : "Restock Item"}
        </Text>

        <Pressable
          style={styles.scanShortcut}
          onPress={() => router.push("/(tabs)/scan")}
        >
          <Ionicons name="barcode-outline" size={24} color={theme.primary} />
          <Text
            style={{ color: theme.text, fontWeight: "700", marginLeft: 10 }}
          >
            Smart Scanner
          </Text>
        </Pressable>

        <Text style={styles.divider}>PRODUCT IDENTITY</Text>

        <Text style={styles.label}>BARCODE / ID</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, color: theme.text },
          ]}
          value={formData.barcode}
          editable={!isLocked}
          placeholder="Identification Code"
          onChangeText={(t) => setFormData({ ...formData, barcode: t })}
        />

        <View style={styles.photoRow}>
          <View style={styles.photoBoxContainer}>
            <Pressable
              style={[styles.photoBox, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
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
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { marginTop: 0 }]}>IMAGE SOURCE</Text>
            <Text style={{ color: theme.subtext, fontSize: 12 }}>
              Visual reference for the master registry entry.
            </Text>
          </View>
        </View>

        <Text style={styles.label}>PRODUCT NAME *</Text>
        <TextInput
          style={[
            styles.input,
            isLocked && styles.locked,
            { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, color: theme.text },
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
                { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1,  color: theme.text },
              ]}
              value={formData.category}
              editable={!isLocked}
              onChangeText={(t) => setFormData({ ...formData, category: t })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>UNIT PRICE</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1,  color: theme.text },
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
              Require Expiry Tracking?
            </Text>
            <Switch
              value={isPerishable}
              onValueChange={setIsPerishable}
              trackColor={{ true: theme.primary }}
            />
          </View>
        )}

        {mode !== "registry" && (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>QUANTITY *</Text>
              <TextInput
                style={[
                  styles.input,
                { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1,  color: theme.text },
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
                { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1,  color: theme.text },
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.completeBtnText}>
              {mode === "registry"
                ? "Complete Registration"
                : "Confirm Batch Stock"}
            </Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Image Choice Modal */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View
            style={[styles.pickerContent, { backgroundColor: theme.surface }]}
          >
            <Pressable style={styles.pickerOpt} onPress={() => pickImage(true)}>
              <Ionicons name="camera" size={24} color={theme.primary} />
              <Text style={{ color: theme.text, marginLeft: 15 }}>
                Take New Photo
              </Text>
            </Pressable>
            <Pressable
              style={styles.pickerOpt}
              onPress={() => pickImage(false)}
            >
              <Ionicons name="images" size={24} color={theme.primary} />
              <Text style={{ color: theme.text, marginLeft: 15 }}>
                Pick from Gallery
              </Text>
            </Pressable>
            <Pressable
              style={[styles.pickerOpt, { borderBottomWidth: 0 }]}
              onPress={() => setShowPicker(false)}
            >
              <Text style={{ color: "#FF4444", fontWeight: "bold" }}>
                Dismiss
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
  locked: { opacity: 0.5 },
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
