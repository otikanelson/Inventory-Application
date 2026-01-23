import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
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

  /** State Management **/
  const [image, setImage] = useState<string | null>(null);
  const [isPerishable, setIsPerishable] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formModified, setFormModified] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNavAction, setPendingNavAction] = useState<any>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [existingProduct, setExistingProduct] = useState<any>(null);

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

  // Get existing categories for suggestions
  const existingCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean)),
  ).sort();

  /** Sync Scanner Params & Check for Existing Product **/
  useEffect(() => {
    const loadProductData = async () => {
      if (params.barcode) {
        const barcode = params.barcode as string;

        // Check if product exists in inventory (has batches)
        try {
          const response = await axios.get(
            `${API_URL}/registry/lookup/${barcode}`,
          );
          if (response.data.found && response.data.inventoryStatus) {
            // Product exists with batches
            setExistingProduct(response.data.productData);
            setImage(response.data.productData.imageUrl || null);
          } else if (response.data.found) {
            // Product registered but no batches
            setExistingProduct(response.data.productData);
            setImage(response.data.productData.imageUrl || null);
          }
        } catch (err) {
          console.log("Lookup failed, treating as new product");
        }

        setFormData((prev) => ({
          ...prev,
          barcode: barcode,
          name: (params.name as string) || "",
          category: (params.category as string) || "",
        }));

        if (params.isPerishable)
          setIsPerishable(params.isPerishable === "true");
        if (params.imageUrl) setImage(params.imageUrl as string);
      }
    };

    loadProductData();
  }, [params.barcode]);

  /** Reset form when screen gains focus (only if not from scanner) **/
  useFocusEffect(
    useCallback(() => {
      // Only reset if not coming from scanner with params
      if (!params.barcode && !params.mode) {
        resetForm();
      }

      return () => {
        // Cleanup
      };
    }, [params.barcode, params.mode]),
  );

  /** Back button handler for navigation guard **/
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (formModified) {
          setShowExitModal(true);
          return true; // Prevent default back
        }
        return false; // Allow default back
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, [formModified]),
  );

  /** Intercept navigation (including tab switches) and prompt if form modified **/
  useEffect(() => {
    // Hide default header back button (not needed for this screen)
    try {
      navigation.setOptions &&
        navigation.setOptions({ headerLeft: () => null });
    } catch (e) {
      // ignore if setOptions is unavailable
    }

    const beforeRemoveListener = (e: any) => {
      if (!formModified) return;
      // Prevent navigation and show confirmation modal
      e.preventDefault();
      setPendingNavAction(e.data?.action ?? null);
      setShowExitModal(true);
    };

    const unsub = navigation.addListener?.(
      "beforeRemove",
      beforeRemoveListener,
    );

    // Also attempt to intercept tab presses from the parent tab navigator
    const parent = navigation.getParent && navigation.getParent();
    let parentUnsub: any = null;
    if (parent && parent.addListener) {
      parentUnsub = parent.addListener("tabPress", (e: any) => {
        try {
          // Only intercept when this screen is focused
          if (navigation.isFocused && !navigation.isFocused()) return;
        } catch (err) {
          // ignore
        }

        if (!formModified) return;
        // Prevent the tab switch and prompt
        e.preventDefault();
        // Store a function to continue the tab navigation if user confirms
        setPendingNavAction(() => {
          return () => {
            try {
              // Try to navigate to the pressed tab target (may be a route name)
              parent.navigate(e.target);
            } catch (err) {
              // Fallback: do nothing
            }
          };
        });
        setShowExitModal(true);
      });
    }

    return () => {
      if (unsub && typeof unsub === "function") unsub();
      if (unsub && unsub.remove) unsub.remove();
      if (parentUnsub && typeof parentUnsub === "function") parentUnsub();
      if (parentUnsub && parentUnsub.remove) parentUnsub.remove();
    };
  }, [navigation, formModified]);

  /** Track form modifications **/
  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormModified(true);
  };

  /** Reset form to initial state **/
  const resetForm = () => {
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
    setFormModified(false);
    setExistingProduct(null);
  };

  /** Comprehensive field validation with specific field-focused toasts **/
  const validateForm = (): {
    isValid: boolean;
    error?: string;
    field?: string;
  } => {
    const cleanBarcode = formData.barcode.trim();
    const cleanName = formData.name.trim();
    const cleanCategory = formData.category.trim();

    // Barcode validation - ALWAYS REQUIRED
    if (!cleanBarcode) {
      return {
        isValid: false,
        error: "Barcode/ID is required",
        field: "Barcode",
      };
    }

    // Name validation - ALWAYS REQUIRED
    if (!cleanName) {
      return {
        isValid: false,
        error: "Product name is required",
        field: "Name",
      };
    }

    // Category validation - ALWAYS REQUIRED
    if (!cleanCategory) {
      return {
        isValid: false,
        error: "Category is required",
        field: "Category",
      };
    }

    // Category comprehensibility check (for batch additions of registered products)
    // Use case-insensitive comparison since categories might have inconsistent casing
    if (mode === "inventory" && existingProduct) {
      const registeredCategory = (existingProduct.category || "")
        .trim()
        .toLowerCase();
      const enteredCategory = cleanCategory.toLowerCase();

      if (registeredCategory && enteredCategory !== registeredCategory) {
        console.log("Category mismatch:", {
          entered: cleanCategory,
          registered: existingProduct.category,
        });
        return {
          isValid: false,
          error: `Category mismatch! This product is registered as "${existingProduct.category}"`,
          field: "Category",
        };
      }
    }

    // Image validation - ALWAYS REQUIRED except when adding batch to product with existing batches AND existing image
    // Required for: new products (registry mode), new products in inventory mode, existing products without image
    // Optional ONLY for: adding batch to existing product that already has batches AND an image
    const hasExistingBatchesWithImage =
      existingProduct &&
      existingProduct.imageUrl &&
      existingProduct.batches &&
      existingProduct.batches.length > 0;
    const imageRequired = !hasExistingBatchesWithImage;

    if (imageRequired && !image) {
      return {
        isValid: false,
        error: "Product image is required",
        field: "Image",
      };
    }

    // Quantity validation - ALWAYS REQUIRED for inventory/manual modes
    if (mode === "inventory" || mode === "manual") {
      if (!formData.quantity || formData.quantity.trim() === "") {
        return {
          isValid: false,
          error: "Quantity is required",
          field: "Quantity",
        };
      }

      const qtyNum = Number(formData.quantity);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        return {
          isValid: false,
          error: "Quantity must be greater than 0",
          field: "Quantity",
        };
      }

      // Price validation - ALWAYS REQUIRED for inventory/manual modes
      if (!formData.price || formData.price.trim() === "") {
        return { isValid: false, error: "Price is required", field: "Price" };
      }

      const priceNum = Number(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        return {
          isValid: false,
          error: "Price must be a valid positive number",
          field: "Price",
        };
      }

      // Expiry date validation - ALWAYS REQUIRED for perishables
      if (isPerishable) {
        if (!formData.expiryDate || formData.expiryDate.trim() === "") {
          return {
            isValid: false,
            error: "Expiry date is required for perishable items",
            field: "Expiry Date",
          };
        }

        const expiryDate = new Date(formData.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(expiryDate.getTime())) {
          return {
            isValid: false,
            error: "Invalid expiry date format",
            field: "Expiry Date",
          };
        }

        if (expiryDate < today) {
          return {
            isValid: false,
            error: "Expiry date cannot be in the past",
            field: "Expiry Date",
          };
        }
      }
    }

    return { isValid: true };
  };

  /** Image Picker Logic **/
  const pickImage = async (useCamera: boolean) => {
    setShowPicker(false);
    const perm =
      useCamera ?
        await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: `${useCamera ? "Camera" : "Gallery"} access is required`,
      });
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    };

    let result =
      useCamera ?
        await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setFormModified(true);
    }
  };

  /** Form Submission Logic **/
  const handleSave = async () => {
    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      return Toast.show({
        type: "error",
        text1:
          validation.field ? `${validation.field} Error` : "Validation Error",
        text2: validation.error,
      });
    }

    const cleanBarcode = formData.barcode.trim();
    const cleanName = formData.name.trim();
    const cleanCategory = formData.category.trim();

    setIsSubmitting(true);

    try {
      if (mode === "registry") {
        /** REGISTRY MODE: Create entry in GlobalProduct database ONLY **/
        await axios.post(`${API_URL}/registry/add`, {
          barcode: cleanBarcode,
          name: cleanName,
          category: cleanCategory,
          isPerishable: isPerishable,
          imageUrl: image || "",
        });

        Toast.show({
          type: "success",
          text1: "Product Registered",
          text2: `${cleanName} added to global registry`,
        });

        // Reset form and navigate
        resetForm();
        setTimeout(() => router.replace("/(tabs)"), 800);
      } else {
        /** INVENTORY/MANUAL MODE: Ensure product exists in registry, then add stock **/

        // Check if product exists in GlobalProduct registry
        let productInRegistry = false;
        try {
          const lookupResponse = await axios.get(
            `${API_URL}/registry/lookup/${cleanBarcode}`,
          );
          productInRegistry = lookupResponse.data.found;
        } catch (err) {
          productInRegistry = false;
        }

        // If not in registry, create it first
        if (!productInRegistry) {
          try {
            await axios.post(`${API_URL}/registry/add`, {
              barcode: cleanBarcode,
              name: cleanName,
              category: cleanCategory,
              isPerishable: isPerishable,
              imageUrl: image || "",
            });
          } catch (registryError: any) {
            if (
              !registryError.response?.data?.message?.includes(
                "already in registry",
              )
            ) {
              throw registryError;
            }
          }
        }

        // Add batch to Product collection
        // If new image provided, use it; otherwise use existing image if available
        const imageToSend = image || existingProduct?.imageUrl || "";

        await axios.post(API_URL, {
          barcode: cleanBarcode,
          name: cleanName,
          category: cleanCategory,
          quantity: Number(formData.quantity),
          expiryDate: formData.expiryDate || undefined,
          price: Number(formData.price) || 0,
          imageUrl: imageToSend,
          hasBarcode: params.hasBarcode !== "false",
          isPerishable: isPerishable,
        });

        Toast.show({
          type: "success",
          text1: "Batch Added",
          text2: `${formData.quantity} units of ${cleanName} added to inventory`,
        });

        // Reset form and navigate
        resetForm();
        setTimeout(() => router.replace("/(tabs)"), 800);
      }
    } catch (err: any) {
      console.error("Save Error:", err);

      const errorMsg =
        err.response?.data?.message || err.message || "Unknown error";
      Toast.show({
        type: "error",
        text1: "Save Failed",
        text2: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Handle scanner button press with exit guard **/
  const handleScannerPress = () => {
    if (formModified) {
      setShowExitModal(true);
    } else {
      router.push("/(tabs)/scan");
    }
  };

  /** Category selection **/
  const handleCategorySelect = (category: string) => {
    setFormData((prev) => ({ ...prev, category }));
    setFormModified(true);
    setShowCategoryPicker(false);
  };

  return (
    <ImageBackground
      source={
        isDark ?
          require("../../assets/images/Background7.png")
        : require("../../assets/images/Background9.png")
      }
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.title, { color: theme.text }]}>
              {mode === "registry" ? "Register Product" : "Add Batch"}
            </Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              {mode === "registry" ?
                "Global registry entry"
              : "Add stock to inventory"}
            </Text>
          </View>
        </View>

        {existingProduct && mode === "inventory" && (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.primary + "15",
                borderColor: theme.primary,
              },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={20}
              color={theme.primary}
            />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Adding batch to existing product:{" "}
              <Text style={{ fontWeight: "800" }}>{existingProduct.name}</Text>
            </Text>
          </View>
        )}

        <Pressable
          style={[styles.scanShortcut, { borderColor: theme.border }]}
          onPress={handleScannerPress}
        >
          <Ionicons name="barcode-outline" size={24} color={theme.primary} />
          <Text
            style={{ color: theme.text, fontWeight: "700", marginLeft: 10 }}
          >
            Smart Scanner
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>PRODUCT IDENTITY</Text>

        {/* BARCODE FIELD */}
        <Text style={[styles.label, { color: theme.subtext }]}>
          BARCODE / ID <Text style={{ color: theme.notification }}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          value={formData.barcode}
          editable={!isLocked}
          placeholder="Scan or enter barcode"
          placeholderTextColor={theme.subtext}
          onChangeText={(t) => handleFieldChange("barcode", t)}
        />

        {/* IMAGE FIELD */}
        <View style={styles.photoRow}>
          <View style={styles.photoBoxContainer}>
            <Pressable
              style={[
                styles.photoBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderWidth: 2,
                },
              ]}
              onPress={() => setShowPicker(true)}
            >
              {image ?
                <Image source={{ uri: image }} style={styles.fullImg} />
              : <Ionicons name="camera" size={30} color={theme.subtext} />}
            </Pressable>
            {image && (
              <Pressable
                style={styles.removePhoto}
                onPress={() => {
                  setImage(null);
                  setFormModified(true);
                }}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </Pressable>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.label, { marginTop: 0, color: theme.subtext }]}
            >
              PRODUCT IMAGE <Text style={{ color: theme.notification }}>*</Text>
            </Text>
            <Text
              style={{ color: theme.subtext, fontSize: 12, lineHeight: 18 }}
            >
              {(
                existingProduct &&
                existingProduct.batches &&
                existingProduct.batches.length > 0 &&
                existingProduct.imageUrl
              ) ?
                "Image optional (will overwrite existing if added)"
              : "Required for product identification"}
            </Text>
          </View>
        </View>

        {/* PRODUCT NAME */}
        <Text style={[styles.label, { color: theme.subtext }]}>
          PRODUCT NAME <Text style={{ color: theme.notification }}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            isLocked && styles.locked,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
              color: theme.text,
            },
          ]}
          value={formData.name}
          editable={!isLocked}
          placeholder="Enter product name"
          placeholderTextColor={theme.subtext}
          onChangeText={(t) => handleFieldChange("name", t)}
        />

        {/* CATEGORY FIELD */}
        <Text style={[styles.label, { color: theme.subtext }]}>
          CATEGORY <Text style={{ color: theme.notification }}>*</Text>
        </Text>
        <Pressable
          onPress={() => setShowCategoryPicker(true)}
          style={[
            styles.input,
            isLocked && styles.locked,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: 1,
              justifyContent: "center",
            },
          ]}
        >
          <Text
            style={{ color: formData.category ? theme.text : theme.subtext }}
          >
            {formData.category || "Select or enter category"}
          </Text>
        </Pressable>

        {/* PERISHABILITY TOGGLE (Registry mode only) */}
        {mode === "registry" && (
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}
              >
                Perishable Item?
              </Text>
              <Text
                style={{ color: theme.subtext, fontSize: 12, marginTop: 2 }}
              >
                Requires expiry date tracking
              </Text>
            </View>
            <Switch
              value={isPerishable}
              onValueChange={(val) => {
                setIsPerishable(val);
                setFormModified(true);
              }}
              trackColor={{ true: theme.primary }}
            />
          </View>
        )}

        {/* INVENTORY FIELDS (Inventory/Manual mode only) */}
        {(mode === "inventory" || mode === "manual") && (
          <>
            <View style={styles.row}>
              {/* UNIT PRICE */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.subtext }]}>
                  UNIT PRICE{" "}
                  <Text style={{ color: theme.notification }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      borderWidth: 1,
                      color: theme.text,
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={theme.subtext}
                  value={formData.price}
                  onChangeText={(t) => handleFieldChange("price", t)}
                />
              </View>

              {/* QUANTITY */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.subtext }]}>
                  QUANTITY <Text style={{ color: theme.notification }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      borderWidth: 1,
                      color: theme.text,
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.subtext}
                  value={formData.quantity}
                  onChangeText={(t) => handleFieldChange("quantity", t)}
                />
              </View>

              {/* EXPIRY DATE (if perishable) */}
              {isPerishable && (
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.subtext }]}>
                    EXPIRY DATE{" "}
                    <Text style={{ color: theme.notification }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        borderWidth: 1,
                        color: theme.text,
                      },
                    ]}
                    value={formData.expiryDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.subtext}
                    onChangeText={(t) => handleFieldChange("expiryDate", t)}
                  />
                </View>
              )}
            </View>
          </>
        )}

        {/* SUBMIT BUTTON */}
        <Pressable
          style={[
            styles.completeBtn,
            { backgroundColor: theme.primary },
            isSubmitting && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ?
            <ActivityIndicator color="#FFF" />
          : <>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.completeBtnText}>
                {mode === "registry" ? "Register Product" : "Add to Inventory"}
              </Text>
            </>
          }
        </Pressable>

        <Text
          style={{
            color: theme.subtext,
            fontSize: 11,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          <Text style={{ color: theme.notification }}>*</Text> Required fields
        </Text>
      </ScrollView>

      {/* IMAGE PICKER MODAL */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View
            style={[styles.pickerContent, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.pickerTitle, { color: theme.text }]}>
              Add Product Image
            </Text>

            <Pressable style={styles.pickerOpt} onPress={() => pickImage(true)}>
              <Ionicons name="camera" size={24} color={theme.primary} />
              <Text style={{ color: theme.text, marginLeft: 15, fontSize: 16 }}>
                Take Photo
              </Text>
            </Pressable>

            <Pressable
              style={styles.pickerOpt}
              onPress={() => pickImage(false)}
            >
              <Ionicons name="images" size={24} color={theme.primary} />
              <Text style={{ color: theme.text, marginLeft: 15, fontSize: 16 }}>
                Choose from Gallery
              </Text>
            </Pressable>

            <Pressable
              style={[styles.pickerOpt, { borderBottomWidth: 0 }]}
              onPress={() => setShowPicker(false)}
            >
              <Text
                style={{ color: "#FF4444", fontWeight: "700", fontSize: 16 }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CATEGORY PICKER MODAL */}
      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View
            style={[styles.categoryModal, { backgroundColor: theme.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.pickerTitle, { color: theme.text }]}>
                Select Category
              </Text>
              <Pressable onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            {/* Custom category input */}
            <View
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              }}
            >
              <Text
                style={[
                  styles.label,
                  { color: theme.subtext, marginBottom: 8 },
                ]}
              >
                OR ENTER CUSTOM
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    borderWidth: 1,
                    color: theme.text,
                  },
                ]}
                placeholder="Type new category..."
                placeholderTextColor={theme.subtext}
                value={formData.category}
                onChangeText={(t) => handleFieldChange("category", t)}
                onSubmitEditing={() => {
                  if (formData.category.trim()) {
                    setShowCategoryPicker(false);
                  }
                }}
              />
            </View>

            {/* Existing categories */}
            <FlatList
              data={existingCategories}
              keyExtractor={(item, index) => item ?? index.toString()}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.categoryItem}
                  onPress={() => item && handleCategorySelect(item)}
                >
                  <Text style={{ color: theme.text, fontSize: 16 }}>
                    {item ?? ""}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.subtext}
                  />
                </Pressable>
              )}
              ListHeaderComponent={
                existingCategories.length > 0 ?
                  <Text
                    style={[
                      styles.label,
                      { color: theme.subtext, padding: 16, paddingBottom: 8 },
                    ]}
                  >
                    EXISTING CATEGORIES
                  </Text>
                : <View style={{ padding: 40, alignItems: "center" }}>
                    <Ionicons
                      name="folder-open-outline"
                      size={48}
                      color={theme.subtext}
                    />
                    <Text style={{ color: theme.subtext, marginTop: 12 }}>
                      No categories yet
                    </Text>
                  </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* EXIT CONFIRMATION MODAL */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Ionicons
              name="warning-outline"
              size={48}
              color={theme.notification}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Discard Changes?
            </Text>
            <Text
              style={{
                color: theme.subtext,
                textAlign: "center",
                marginVertical: 15,
              }}
            >
              You have unsaved changes. Are you sure you want to leave?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background }]}
                onPress={() => setShowExitModal(false)}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>
                  Stay
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalBtn,
                  { backgroundColor: theme.notification },
                ]}
                onPress={() => {
                  setShowExitModal(false);
                  resetForm();
                  // If we have a pending navigation action, dispatch it to continue
                  if (typeof pendingNavAction === "function") {
                    try {
                      // call stored navigation function
                      pendingNavAction();
                    } catch (err) {
                      // ignore
                    }
                    setPendingNavAction(null);
                  } else if (pendingNavAction && navigation.dispatch) {
                    navigation.dispatch(pendingNavAction);
                    setPendingNavAction(null);
                  } else {
                    // Fallback to router navigation
                    router.back();
                  }
                }}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>
                  Discard
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 25, paddingTop: 50, paddingBottom: 100 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "900" },
  subtitle: { fontSize: 13, marginTop: 2 },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  scanShortcut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 25,
  },
  sectionTitle: {
    textAlign: "center",
    fontSize: 10,
    color: "#888",
    letterSpacing: 2,
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
  locked: { opacity: 0.5 },
  row: { flexDirection: "row", gap: 12 },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 10,
  },
  photoBoxContainer: { position: "relative" },
  photoBox: {
    width: 90,
    height: 90,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  fullImg: { width: "100%", height: "100%" },
  removePhoto: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFF",
    borderRadius: 12,
    elevation: 5,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(150,150,150,0.2)",
  },
  completeBtn: {
    flexDirection: "row",
    gap: 10,
    padding: 18,
    borderRadius: 20,
    marginTop: 30,
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
    borderBottomColor: "rgba(150,150,150,0.1)",
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
    borderBottomColor: "rgba(150,150,150,0.1)",
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150,150,150,0.05)",
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
