import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import { useTheme } from "../../context/ThemeContext";
import { useProducts } from "../../hooks/useProducts";
import { useImageUpload } from "../../hooks/useImageUpload";
import * as ImagePicker from "expo-image-picker";

export default function AddProducts() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const navigation: any = useNavigation();
  const params = useLocalSearchParams();
  const { products } = useProducts();

  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/products`;

  // ⭐ NEW: Use the Cloudinary upload hook
  const { 
    image, 
    setImage,
    isUploading, 
    uploadError, 
    pickImage: pickImageFromHook, 
    uploadImage,
    clearImage 
  } = useImageUpload(process.env.EXPO_PUBLIC_API_URL!);

  const [isPerishable, setIsPerishable] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formModified, setFormModified] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNavAction, setPendingNavAction] = useState<any>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [existingProduct, setExistingProduct] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const generateBarcode = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const newBarcode = `GEN-${timestamp}-${random}`;
  
  setFormData((prev) => ({ ...prev, barcode: newBarcode }));
  setFormModified(true);
  setErrors((prev) => prev.filter((f) => f !== "barcode"));
  
  Toast.show({
    type: "success",
    text1: "Barcode Generated",
    text2: newBarcode,
  });
  };

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

  const existingCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean)),
  ).sort();

  useEffect(() => {
    const loadProductData = async () => {
      if (params.barcode) {
        const barcode = params.barcode as string;
        setFormData((prev) => ({
          ...prev,
          barcode: barcode,
          name: (params.name as string) || "",
          category: (params.category as string) || "",
        }));

        if (params.isPerishable) {
          setIsPerishable(params.isPerishable === "true");
        }

        if (params.imageUrl && params.imageUrl !== "cube") {
          setImage(params.imageUrl as string);
        }

        if (mode === "inventory" && isLocked && params.name) {
          setExistingProduct({
            barcode: barcode,
            name: params.name as string,
            category: params.category as string,
            imageUrl: (params.imageUrl as string) || "",
            isPerishable: params.isPerishable === "true",
            batches: [],
          });
        } else {
          try {
            const response = await axios.get(
              `${API_URL}/registry/lookup/${barcode}`,
            );
            if (response.data.found) {
              const productData = response.data.productData;
              setExistingProduct(productData);
              if (!params.name) {
                setFormData((prev) => ({
                  ...prev,
                  name: productData.name || "",
                  category: productData.category || "",
                }));
              }
              if (!params.imageUrl && productData.imageUrl && productData.imageUrl !== "cube") {
                setImage(productData.imageUrl);
              }
              if (!params.isPerishable) {
                setIsPerishable(productData.isPerishable || false);
              }
            }
          } catch (err) {
            console.log("Lookup failed, using params data");
          }
        }
      }
    };
    loadProductData();
  }, [params.barcode, params.name, params.category, params.imageUrl, params.isPerishable, mode, isLocked]);

  useFocusEffect(
    useCallback(() => {
      if (!params.barcode && !params.mode) {
        resetForm();
      }
      return () => {};
    }, [params.barcode, params.mode]),
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (formModified) {
          setShowExitModal(true);
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [formModified]),
  );

  useEffect(() => {
    try {
      navigation.setOptions && navigation.setOptions({ headerLeft: () => null });
    } catch (e) {}

    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!formModified) return;
      e.preventDefault();
      setPendingNavAction(() => () => navigation.dispatch(e.data.action));
      setShowExitModal(true);
    });

    return unsubscribe;
  }, [navigation, formModified]);

  const resetForm = () => {
    setFormData({ name: "", quantity: "", expiryDate: "", category: "", price: "", barcode: "" });
    clearImage(); // ⭐ USE HOOK'S CLEAR FUNCTION
    setIsPerishable(false);
    setFormModified(false);
    setExistingProduct(null);
    setErrors([]);
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormModified(true);
    setErrors((prev) => prev.filter((f) => f !== field));
  };

  const validateForm = (): { isValid: boolean; error?: string; field?: string } => {
    const cleanBarcode = formData.barcode.trim();
    const cleanName = formData.name.trim();
    const cleanCategory = formData.category.trim();
    const newErrors: string[] = [];

    if (!cleanBarcode) newErrors.push("barcode");
    if (!cleanName) newErrors.push("name");
    if (!cleanCategory) newErrors.push("category");

    const hasExistingBatchesWithImage = existingProduct && existingProduct.imageUrl && existingProduct.batches && existingProduct.batches.length > 0;
    const imageRequired = !hasExistingBatchesWithImage;
    if (imageRequired && !image) newErrors.push("image");

    if (mode === "inventory" || mode === "manual") {
      const qtyNum = Number(formData.quantity);
      if (!formData.quantity || isNaN(qtyNum) || qtyNum <= 0) newErrors.push("quantity");
      
      const priceNum = Number(formData.price);
      if (!formData.price || isNaN(priceNum) || priceNum < 0) newErrors.push("price");

      if (isPerishable) {
        const expiryDate = new Date(formData.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!formData.expiryDate || isNaN(expiryDate.getTime()) || expiryDate < today) {
          newErrors.push("expiryDate");
        }
      }
    }

    setErrors(newErrors);

    if (newErrors.length > 0) {
      return { isValid: false, error: "Please fill all required fields correctly", field: "Validation" };
    }

    if (mode === "inventory" && existingProduct) {
      const registeredCategory = (existingProduct.category || "").trim().toLowerCase();
      if (registeredCategory && cleanCategory.toLowerCase() !== registeredCategory) {
        setErrors(["category"]);
        return { isValid: false, error: `Category mismatch! Must be "${existingProduct.category}"`, field: "Category" };
      }
    }

    return { isValid: true };
  };

  // ⭐ UPDATED: Modified pickImage to work with both camera and gallery
  const pickImageHandler = async (useCamera: boolean) => {
    setShowPicker(false);
    
    if (useCamera) {
      // For camera, we still need to handle separately since the hook only does gallery
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: "error", text1: "Permission Denied", text2: "Camera access required" });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        setFormModified(true);
        setErrors((prev) => prev.filter((f) => f !== "image"));
      }
    } else {
      // Use the hook for gallery
      await pickImageFromHook();
      setFormModified(true);
      setErrors((prev) => prev.filter((f) => f !== "image"));
    }
  };

  // ⭐ UPDATED: New handleSave function using Cloudinary
  const handleSave = async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      return Toast.show({
        type: "error",
        text1: validation.field + " Error",
        text2: validation.error,
      });
    }

    const cleanBarcode = formData.barcode.trim();
    const cleanName = formData.name.trim();
    const cleanCategory = formData.category.trim();
    setIsSubmitting(true);

    try {
      /** 1. Upload Image to Cloudinary First **/
      let finalImageUrl = image;

      // If image is a local URI (starts with file://), upload to Cloudinary
      if (image && image.startsWith("file://")) {
        Toast.show({ 
          type: "info", 
          text1: "Uploading Image...", 
          text2: "Please wait" 
        });

        const cloudinaryUrl = await uploadImage();
        
        if (!cloudinaryUrl) {
          throw new Error(uploadError || "Failed to upload image");
        }

        finalImageUrl = cloudinaryUrl;
        Toast.show({ 
          type: "success", 
          text1: "Image Uploaded", 
          text2: "Saving product..." 
        });
      }

      /** 2. Save to Registry/Inventory with Cloudinary URL **/
      if (mode === "registry") {
        await axios.post(`${API_URL}/registry/add`, {
          barcode: cleanBarcode,
          name: cleanName,
          category: cleanCategory,
          isPerishable: isPerishable,
          imageUrl: finalImageUrl || "",
        });
        
        Toast.show({ type: "success", text1: "Product Registered" });
        resetForm();
        setTimeout(() => router.replace("/(tabs)"), 800);
      } else {
        // Check if product exists in registry
        let productInRegistry = false;
        try {
          const lookupResponse = await axios.get(`${API_URL}/registry/lookup/${cleanBarcode}`);
          productInRegistry = lookupResponse.data.found;
        } catch (err) { 
          productInRegistry = false; 
        }

        // Add to registry if not exists
        if (!productInRegistry) {
          try {
            await axios.post(`${API_URL}/registry/add`, {
              barcode: cleanBarcode,
              name: cleanName,
              category: cleanCategory,
              isPerishable: isPerishable,
              imageUrl: finalImageUrl || "",
            });
          } catch (registryError: any) {
            if (!registryError.response?.data?.message?.includes("already in registry")) {
              throw registryError;
            }
          }
        }

        // Add batch to inventory with Cloudinary URL
        const imageToSave = finalImageUrl || existingProduct?.imageUrl || "";
        
        await axios.post(API_URL, {
          barcode: cleanBarcode,
          name: cleanName,
          category: cleanCategory,
          quantity: Number(formData.quantity),
          expiryDate: formData.expiryDate || undefined,
          price: Number(formData.price) || 0,
          imageUrl: imageToSave,
          hasBarcode: params.hasBarcode !== "false",
          isPerishable: isPerishable,
        });

        Toast.show({ type: "success", text1: "Batch Added Successfully" });
        resetForm();
        setTimeout(() => router.replace("/(tabs)"), 800);
      }
    } catch (err: any) {
      console.error("Save Error:", err);
      Toast.show({ 
        type: "error", 
        text1: "Save Failed", 
        text2: err.message || "Please try again" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScannerPress = () => {
    if (formModified) { 
      setShowExitModal(true); 
    } else { 
      router.push("/(tabs)/scan"); 
    }
  };

  const handleCategorySelect = (category?: string) => {
    // If no category provided (undefined or empty), just close the picker without updating form
    if (!category) {
      setShowCategoryPicker(false);
      return;
    }
    setFormData((prev) => ({ ...prev, category }));
    setFormModified(true);
    setErrors((prev) => prev.filter((f) => f !== "category"));
    setShowCategoryPicker(false);
  };

  return (
    <ImageBackground
      source={isDark ? require("../../assets/images/Background7.png") : require("../../assets/images/Background9.png")}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, paddingHorizontal: 2, paddingVertical: 50 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1, }}>
              <Text style={[styles.subtitle, { color: theme.primary }]}>
                {mode === "registry" ? "GLOBAL_REGISTRY_ENTRY" : "ADD_STOCK_TO_INVENTORY"}
              </Text>
              <Text style={[styles.title, { color: theme.text }]}>
                {mode === "registry" ? "REGISTER_PRODUCT" : "ADD_BATCH"}
              </Text>
            </View>
          </View>

          {existingProduct && mode === "inventory" && (
            <View style={[styles.infoCard, { backgroundColor: theme.primary + "15", borderColor: theme.primary }]}>
              <Ionicons name="information-circle" size={20} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                Adding batch to: <Text style={{ fontWeight: "800" }}>{existingProduct.name}</Text>
              </Text>
            </View>
          )}

          <Pressable style={[styles.scanShortcut, { borderColor: theme.border }]} onPress={handleScannerPress}>
            <Ionicons name="barcode-outline" size={24} color={theme.primary} />
            <Text style={{ color: theme.text, fontWeight: "700", marginLeft: 10 }}>Smart Scanner</Text>
          </Pressable>

          <Text style={[styles.label, { color: theme.subtext }]}>BARCODE / ID</Text>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 1,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: errors.includes("barcode") ? theme.notification : theme.border,
                  color: theme.text,
                },
                isLocked && styles.locked,
              ]}
              value={formData.barcode}
              editable={!isLocked}
              placeholder="Scan or enter barcode"
              placeholderTextColor={theme.subtext}
              onChangeText={(t) => handleFieldChange("barcode", t)}
            />
            {!isLocked && (
              <Pressable
                style={[
                  styles.generateBtn,
                  { backgroundColor: theme.primary }
                ]}
                onPress={generateBarcode}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
              </Pressable>
            )}
          </View>

          {/* ⭐ UPDATED: Image section with upload indicator */}
          <View style={styles.photoRow}>
          <View style={styles.photoBoxContainer}>
            <Pressable
              style={[
                styles.photoBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: errors.includes("image") ? theme.notification : theme.border,
                  borderWidth: 2,
                },
              ]}
              onPress={() => setShowPicker(true)}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.fullImg} />
              ) : (
                <Ionicons name="camera" size={40} color={theme.subtext} />
              )}
            </Pressable>
            
            {/* Remove Image Button */}
            {image && (
              <Pressable
                style={[styles.removePhoto, { backgroundColor: theme.notification }]}
                onPress={() => {
                  setImage(null);
                  setFormModified(true);
                  setErrors((prev) => prev.filter((f) => f !== "image"));
                  Toast.show({
                    type: "info",
                    text1: "Image Removed",
                    text2: "You can select a new image",
                  });
                }}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            )}
          </View>

            {/* Rest of the form fields remain the same... */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.subtext }]}>NAME</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: errors.includes("name") ? theme.notification : theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.name}
                editable={!isLocked}
                placeholder="Product name"
                placeholderTextColor={theme.subtext}
                onChangeText={(t) => handleFieldChange("name", t)}
              />

              <Text style={[styles.label, { color: theme.subtext, marginTop: 10 }]}>CATEGORY</Text>
              <Pressable
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: errors.includes("category") ? theme.notification : theme.border,
                    justifyContent: "center",
                  },
                ]}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={{ color: formData.category ? theme.text : theme.subtext }}>
                  {formData.category || "Select category"}
                </Text>
              </Pressable>
            </View>
          </View>

          {(mode === "inventory" || mode === "manual") && (
            <>
              <Text style={[styles.label, { color: theme.subtext }]}>QUANTITY</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: errors.includes("quantity") ? theme.notification : theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.quantity}
                placeholder="Enter quantity"
                placeholderTextColor={theme.subtext}
                keyboardType="numeric"
                onChangeText={(t) => handleFieldChange("quantity", t)}
              />

              <Text style={[styles.label, { color: theme.subtext }]}>PRICE PER UNIT (₦)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: errors.includes("price") ? theme.notification : theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.price}
                placeholder="Enter price"
                placeholderTextColor={theme.subtext}
                keyboardType="numeric"
                onChangeText={(t) => handleFieldChange("price", t)}
              />

              {isPerishable && (
                <>
                  <Text style={[styles.label, { color: theme.subtext }]}>EXPIRY DATE</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        borderWidth: 1,
                        borderColor: errors.includes("expiryDate") ? theme.notification : theme.border,
                        color: theme.text,
                      },
                    ]}
                    value={formData.expiryDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.subtext}
                    onChangeText={(t) => handleFieldChange("expiryDate", t)}
                  />
                </>
              )}
            </>
          )}

            <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>Perishable Item</Text>
            <Switch
              value={isPerishable}
              onValueChange={(val) => {
                setIsPerishable(val);
                setFormModified(true);
                if (!val) setFormData((prev) => ({ ...prev, expiryDate: "" }));
              }}
              trackColor={{ false: theme.border, true: theme.primary + "80" }}
              thumbColor={isPerishable ? theme.primary : theme.subtext}
            />
          </View>

          {/* ⭐ UPDATED: Save button shows uploading state */}
          <Pressable
            style={[
              styles.saveButton,
              {
                backgroundColor: theme.primary,
                opacity: (isSubmitting || isUploading) ? 0.6 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={isSubmitting || isUploading}
          >
            {(isSubmitting || isUploading) ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {mode === "registry" ? "REGISTER PRODUCT" : "ADD TO INVENTORY"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Picker Modal */}
      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <View style={[styles.pickerModal, { backgroundColor: theme.surface }]}>
            <Pressable
              style={[styles.pickerOption, { borderBottomColor: theme.border }]}
              onPress={() => pickImageHandler(true)}
            >
              <Ionicons name="camera" size={24} color={theme.primary} />
              <Text style={[styles.pickerText, { color: theme.text }]}>Take Photo</Text>
            </Pressable>
            <Pressable
              style={styles.pickerOption}
              onPress={() => pickImageHandler(false)}
            >
              <Ionicons name="images" size={24} color={theme.primary} />
              <Text style={[styles.pickerText, { color: theme.text }]}>Choose from Gallery</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryPicker(false)}>
          <View style={[styles.categoryModal, { backgroundColor: theme.surface }]}>
            <Text style={[styles.categoryTitle, { color: theme.text }]}>Select Category</Text>
            <FlatList
              data={existingCategories}
              keyExtractor={(item, index) => (item ? item : String(index))}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.categoryItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleCategorySelect(item)}
                >
                  <Text style={[styles.categoryText, { color: theme.text }]}>{item}</Text>
                </Pressable>
              )}
            />
            <TextInput
              style={[styles.categoryInput, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Or type new category..."
              placeholderTextColor={theme.subtext}
              onSubmitEditing={(e) => handleCategorySelect(e.nativeEvent.text)}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.exitModalOverlay}>
          <View style={[styles.exitModal, { backgroundColor: theme.surface }]}>
            <Ionicons name="warning" size={48} color={theme.notification} />
            <Text style={[styles.exitTitle, { color: theme.text }]}>Unsaved Changes</Text>
            <Text style={[styles.exitMessage, { color: theme.subtext }]}>
              You have unsaved changes. Are you sure you want to leave?
            </Text>
            <View style={styles.exitButtons}>
              <Pressable
                style={[styles.exitButton, { backgroundColor: theme.border }]}
                onPress={() => setShowExitModal(false)}
              >
                <Text style={[styles.exitButtonText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.exitButton, { backgroundColor: theme.notification }]}
                onPress={() => {
                  resetForm();
                  setShowExitModal(false);
                  if (pendingNavAction) {
                    pendingNavAction();
                    setPendingNavAction(null);
                  } else {
                    router.back();
                  }
                }}
              >
                <Text style={[styles.exitButtonText, { color: "#fff" }]}>Leave</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

// ⭐ NEW: Add uploadingOverlay style
const styles = StyleSheet.create({
  container: { padding: 15, paddingBottom: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  subtitle: { fontSize: 12, fontWeight: "600", letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: "800", marginTop: 4 },
  infoCard: { flexDirection: "row", padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16, alignItems: "center", gap: 8 },
  infoText: { flex: 1, fontSize: 14 },
  scanShortcut: { borderWidth: 2, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 20, borderStyle: "dashed" },
  label: { fontSize: 11, fontWeight: "700", marginBottom: 6, letterSpacing: 0.5 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16 },
  photoRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  locked: { 
    opacity: 0.5 
  },
  photoBoxContainer: { 
    position: "relative" 
  },
  photoBox: {
    width: 90,
    height: 90,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  fullImg: { 
    width: "100%", 
    height: "100%" 
  },
  photoImage: { width: "100%", height: "100%", borderRadius: 16 },
  uploadingOverlay: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    alignItems: "center", 
    justifyContent: "center",
    borderRadius: 16 
  },
  photoLabel: { fontSize: 10, marginTop: 6, fontWeight: "600" },
  removePhoto: {
  position: "absolute",
  top: -8,
  right: -8,
  width: 28,
  height: 28,
  borderRadius: 14,
  justifyContent: "center",
  alignItems: "center",
  elevation: 5,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  generateBtn: {
  width: 50,
  height: 50,
  borderRadius: 15,
  justifyContent: "center",
  alignItems: "center",
  alignSelf: "flex-start",
  },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", },
  switchLabel: { fontSize: 15, fontWeight: "600" },
  saveButton: { borderRadius: 16, padding: 18, alignItems: "center", marginTop: 24 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  pickerModal: { width: "80%", borderRadius: 20, overflow: "hidden", elevation: 8 },
  pickerOption: { flexDirection: "row", alignItems: "center", padding: 20, borderBottomWidth: 1, gap: 12 },
  pickerText: { fontSize: 16, fontWeight: "600" },
  categoryModal: { width: "85%", maxHeight: "70%", borderRadius: 20, padding: 20 },
  categoryTitle: { fontSize: 20, fontWeight: "800", marginBottom: 16 },
  categoryItem: { paddingVertical: 14, borderBottomWidth: 1 },
  categoryText: { fontSize: 15 },
  categoryInput: { marginTop: 12, padding: 14, borderRadius: 12, fontSize: 15 },
  exitModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  exitModal: { width: "85%", borderRadius: 24, padding: 24, alignItems: "center" },
  exitTitle: { fontSize: 20, fontWeight: "800", marginTop: 16 },
  exitMessage: { fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 24 },
  exitButtons: { flexDirection: "row", gap: 12, width: "100%" },
  exitButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  exitButtonText: { fontSize: 15, fontWeight: "700" },
});