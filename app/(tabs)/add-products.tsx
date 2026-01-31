import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
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

export default function AddProducts() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const navigation: any = useNavigation();
  const params = useLocalSearchParams();
  const { products } = useProducts();

  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/products`;

  const [image, setImage] = useState<string | null>(null);
  const [isPerishable, setIsPerishable] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formModified, setFormModified] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNavAction, setPendingNavAction] = useState<any>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [existingProduct, setExistingProduct] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);

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
    setImage(null);
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

  const pickImageHandler = async (useCamera: boolean) => {
    setShowPicker(false);
    
    if (useCamera) {
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
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: "error", text1: "Permission Denied", text2: "Gallery access required" });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        setFormModified(true);
        setErrors((prev) => prev.filter((f) => f !== "image"));
      }
    }
  };

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
      let finalImageUrl = image;

      // If image is a local URI, upload to Cloudinary
      if (image && image.startsWith("file://")) {
        setIsUploadingImage(true);
        Toast.show({ 
          type: "info", 
          text1: "Uploading Image...", 
          text2: "Please wait" 
        });

        try {
          // Convert to base64 using legacy API
          const base64 = await FileSystem.readAsStringAsync(image, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Upload to backend
          const uploadResponse = await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/upload/image`,
            {
              image: `data:image/jpeg;base64,${base64}`,
              folder: 'inventiease',
            }
          );

          if (uploadResponse.data.success) {
            finalImageUrl = uploadResponse.data.imageUrl;
            Toast.show({ 
              type: "success", 
              text1: "Image Uploaded", 
              text2: "Saving product..." 
            });
          } else {
            throw new Error("Upload failed");
          }
        } catch (uploadError: any) {
          console.error("Image upload error:", uploadError);
          Toast.show({
            type: "error",
            text1: "Upload Failed",
            text2: "Could not upload image",
          });
          setIsUploadingImage(false);
          setIsSubmitting(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Save product with Cloudinary URL
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
        let productInRegistry = false;
        try {
          const lookupResponse = await axios.get(`${API_URL}/registry/lookup/${cleanBarcode}`);
          productInRegistry = lookupResponse.data.found;
        } catch (err) { 
          productInRegistry = false; 
        }

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

  const handleCategorySelect = (category: string) => {
    if (!category || !category.trim()) {
      setShowCategoryPicker(false);
      return;
    }
    setFormData((prev) => ({ ...prev, category: category.trim() }));
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
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={[styles.headerCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.subtitle, { color: theme.primary }]}>
              {mode === "registry" ? "GLOBAL REGISTRY" : mode === "inventory" ? "INVENTORY BATCH" : "MANUAL ENTRY"}
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              {mode === "registry" ? "Register Product" : "Add to Stock"}
            </Text>
            
            {existingProduct && mode === "inventory" && (
              <View style={[styles.infoBox, { backgroundColor: theme.background, borderColor: theme.primary }]}>
                <Ionicons name="information-circle" size={20} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.text }]}>
                  Adding batch to: <Text style={{ fontWeight: "800" }}>{existingProduct.name}</Text>
                </Text>
              </View>
            )}
          </View>

          {/* Scanner Shortcut */}
          <Pressable 
            style={[styles.scannerLink, { borderColor: theme.border }]} 
            onPress={handleScannerPress}
          >
            <Ionicons name="barcode-outline" size={24} color={theme.primary} />
            <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}>
              Smart Scanner
            </Text>
          </Pressable>

          {/* Product Identity Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.subtext }]}>PRODUCT IDENTITY</Text>

            {/* Barcode with Generate Button */}
            <Text style={[styles.label, { color: theme.subtext }]}>BARCODE / ID</Text>
            <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
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
                  style={[styles.generateBtn, { backgroundColor: theme.primary }]}
                  onPress={generateBarcode}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                </Pressable>
              )}
            </View>

            {/* Photo and Basic Info Row */}
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
                  disabled={isUploadingImage}
                >
                  {image ? (
                    <Image source={{ uri: image }} style={styles.fullImg} />
                  ) : (
                    <Ionicons name="camera" size={40} color={theme.subtext} />
                  )}
                  {isUploadingImage && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                  )}
                </Pressable>
                
                {/* Remove Image X Button */}
                {image && !isUploadingImage && (
                  <Pressable
                    style={[styles.removePhoto, { backgroundColor: theme.notification }]}
                    onPress={() => {
                      setImage(null);
                      setFormModified(true);
                      setErrors((prev) => prev.filter((f) => f !== "image"));
                      Toast.show({
                        type: "info",
                        text1: "Image Removed",
                      });
                    }}
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                  </Pressable>
                )}
              </View>

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
                    isLocked && styles.locked,
                  ]}
                  value={formData.name}
                  editable={!isLocked}
                  placeholder="Product name"
                  placeholderTextColor={theme.subtext}
                  onChangeText={(t) => handleFieldChange("name", t)}
                />

                <Text style={[styles.label, { color: theme.subtext }]}>CATEGORY</Text>
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

            {/* Perishable Toggle */}
            <View style={[styles.toggleRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Text style={{ color: theme.text, fontWeight: "600", fontSize: 15 }}>
                Perishable Item
              </Text>
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
          </View>

          {/* Batch Details Section */}
          {(mode === "inventory" || mode === "manual") && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.subtext }]}>BATCH DETAILS</Text>

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
            </View>
          )}

          {/* Submit Button */}
          <Pressable
            style={[
              styles.completeBtn,
              {
                backgroundColor: theme.primary,
                opacity: (isSubmitting || isUploadingImage) ? 0.6 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={isSubmitting || isUploadingImage}
          >
            {(isSubmitting || isUploadingImage) ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.completeBtnText}>
                  {mode === "registry" ? "REGISTER PRODUCT" : "ADD TO INVENTORY"}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Picker Modal */}
      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable style={styles.pickerOverlay} onPress={() => setShowPicker(false)}>
          <View style={[styles.pickerContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>Add Photo</Text>
            <Pressable
              style={[styles.pickerOpt, { borderBottomColor: theme.border }]}
              onPress={() => pickImageHandler(true)}
            >
              <Ionicons name="camera" size={24} color={theme.primary} style={{ marginRight: 15 }} />
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>Take Photo</Text>
            </Pressable>
            <Pressable
              style={styles.pickerOpt}
              onPress={() => pickImageHandler(false)}
            >
              <Ionicons name="images" size={24} color={theme.primary} style={{ marginRight: 15 }} />
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>Choose from Gallery</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={[styles.categoryModal, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.pickerTitle, { color: theme.text, marginBottom: 0 }]}>
                Select Category
              </Text>
              <Pressable onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>
            <FlatList
              data={existingCategories}
              keyExtractor={(item, index) => (item ?? index.toString())}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.categoryItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleCategorySelect(item as string)}
                >
                  <Text style={{ color: theme.text, fontSize: 16 }}>{item}</Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
                </Pressable>
              )}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  borderWidth: 1,
                  color: theme.text,
                  marginHorizontal: 20,
                  marginTop: 10,
                },
              ]}
              placeholder="Or type new category..."
              placeholderTextColor={theme.subtext}
              onSubmitEditing={(e) => {
                if (e.nativeEvent.text.trim()) {
                  handleCategorySelect(e.nativeEvent.text.trim());
                }
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Ionicons name="warning" size={48} color={theme.notification} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Unsaved Changes</Text>
            <Text style={{ color: theme.subtext, textAlign: "center", marginBottom: 20 }}>
              You have unsaved changes. Are you sure you want to leave?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.border }]}
                onPress={() => setShowExitModal(false)}
              >
                <Text style={{ color: theme.text, fontWeight: "700" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.notification }]}
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
                <Text style={{ color: "#fff", fontWeight: "700" }}>Leave</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  headerCard: {
    padding: 25,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1.5,
    marginTop: 15,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  scannerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    marginHorizontal: 20,
    marginBottom: 15,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 15,
    opacity: 0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    opacity: 0.7,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    padding: 16,
    borderRadius: 15,
    fontSize: 16,
    fontWeight: "500",
  },
  locked: { 
    opacity: 0.5 
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 10,
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
  uploadingOverlay: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    alignItems: "center", 
    justifyContent: "center",
    borderRadius: 20,
  },
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
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
  },
  completeBtn: {
    flexDirection: "row",
    gap: 10,
    padding: 18,
    borderRadius: 20,
    marginTop: 30,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  completeBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  pickerContent: {
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  pickerOpt: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  categoryModal: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 25,
    borderRadius: 30,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 15,
    marginBottom: 5,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
  },
});