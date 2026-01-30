import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Modal,
  ImageBackground,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useProducts } from "../../../hooks/useProducts";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useImageUpload } from "../../../hooks/useImageUpload";
import axios from "axios";

const { width } = Dimensions.get("window");

interface Batch {
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  receivedDate?: string;
  price?: number;
}

interface PredictionData {
  nextWeekDemand?: number;
  stockoutRisk?: number;
  optimalOrderQty?: number;
  trend?: string;
  demandVelocity?: number;
  averageSalesPerDay?: number;
  daysUntilStockout?: number;
  reorderPoint?: number;
  turnoverRate?: number;
}

export default function AdminProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { getProductById, refresh } = useProducts();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);

  // Edit state
  const [editedName, setEditedName] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedImage, setEditedImage] = useState("");
  const [editedGenericPrice, setEditedGenericPrice] = useState("");
  // Initialize Cloudinary upload hook
  const { 
    uploadImage, 
    isUploading: isUploadingImage 
  } = useImageUpload(process.env.EXPO_PUBLIC_API_URL!);

  // Price edit modal
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [tempPrice, setTempPrice] = useState("");

  // Delete modals
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [deletePin, setDeletePin] = useState("");

  const backgroundImage = isDark
    ? require("../../../assets/images/Background7.png")
    : require("../../../assets/images/Background9.png");

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    const data = await getProductById(id as string);
    if (data) {
      setProduct(data);
      setEditedName(data.name);
      setEditedCategory(data.category || "");
      setEditedImage(data.imageUrl || "");
      setEditedGenericPrice(data.genericPrice?.toString() || "");

      // Fetch AI predictions
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/analytics/predictions/${id}`
        );
        if (response.data && response.data.success) {
          setPrediction(response.data.data);
        }
      } catch (err) {
        console.log("Predictions not available");
      }
    }
    setLoading(false);
  };

  const handleImagePick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: "Gallery access required",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setEditedImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!editedName.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Product name is required",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      let finalImageUrl = editedImage;

      // If image is a local file (user changed it), upload to Cloudinary
      if (editedImage && editedImage.startsWith("file://")) {
        Toast.show({
          type: "info",
          text1: "Uploading Image...",
          text2: "Please wait",
        });

        // Temporarily set the image for upload
        const tempImageState = editedImage;
        
        // Create a temporary FileSystem read to pass to the hook
        // Since the hook needs the image in its state, we'll do a direct upload here
        try {
          const FileSystem = require('expo-file-system');
          const base64 = await FileSystem.readAsStringAsync(editedImage, {
            encoding: FileSystem.EncodingType.Base64,
          });

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
              text2: "Saving product...",
            });
          } else {
            throw new Error("Upload failed");
          }
        } catch (uploadError: any) {
          console.error("Image upload error:", uploadError);
          Toast.show({
            type: "error",
            text1: "Upload Failed",
            text2: "Could not upload image. Product not saved.",
          });
          setIsSaving(false);
          return;
        }
      }

      // Save product with final image URL (either Cloudinary or existing URL)
      await axios.patch(
        `${process.env.EXPO_PUBLIC_API_URL}/products/${id}`,
        {
          name: editedName.trim(),
          category: editedCategory.trim(),
          imageUrl: finalImageUrl,
        }
      );

      Toast.show({
        type: "success",
        text1: "Product Updated",
        text2: "Changes saved successfully",
      });

      setIsEditing(false);
      await refresh();
      await loadProduct();
    } catch (error) {
      console.error("Save error:", error);
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: "Could not save changes",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePriceUpdate = async () => {
    const priceValue = parseFloat(tempPrice);

    if (isNaN(priceValue) || priceValue < 0) {
      Toast.show({
        type: "error",
        text1: "Invalid Price",
        text2: "Please enter a valid number",
      });
      return;
    }

    try {
      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/products/${id}/generic-price`,
        { genericPrice: priceValue }
      );

      setEditedGenericPrice(priceValue.toString());
      setShowPriceModal(false);
      setTempPrice("");

      Toast.show({
        type: "success",
        text1: "Price Updated",
        text2: `Generic price set to ₦${priceValue.toFixed(2)}`,
      });

      await loadProduct();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: "Could not update price",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const requirePin = await AsyncStorage.getItem('admin_require_pin_delete');
      
      if (requirePin === 'true') {
        setShowDeleteWarning(false);
        setShowPinModal(true);
      } else {
        await performDelete();
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not check security settings",
      });
    }
  };

  const performDelete = async () => {
    try {
      await axios.delete(
        `${process.env.EXPO_PUBLIC_API_URL}/products/${id}`
      );

      Toast.show({
        type: "success",
        text1: "Product Deleted",
        text2: "Product removed from inventory",
      });

      await refresh();
      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Delete Failed",
        text2: "Could not delete product",
      });
    }
  };

  const handlePinSubmit = async () => {
    try {
      const storedPin = await AsyncStorage.getItem('admin_pin');
      
      if (deletePin === storedPin) {
        setShowPinModal(false);
        setDeletePin("");
        await performDelete();
      } else {
        Toast.show({
          type: "error",
          text1: "Access Denied",
          text2: "Incorrect PIN",
        });
        setDeletePin("");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Authentication Error",
      });
    }
  };

  // Price analytics
  const priceAnalytics = useMemo(() => {
    if (!product) return null;

    const genericPrice = product.genericPrice || null;
    const batches = product.batches || [];
    
    const batchesWithPrice = batches.filter((b: Batch) => b.price && b.price > 0);
    
    if (batchesWithPrice.length === 0) {
      return {
        genericPrice,
        hasBatchPrices: false,
        avgBatchPrice: null,
        minBatchPrice: null,
        maxBatchPrice: null,
      };
    }

    const prices: number[] = batchesWithPrice.map((b: Batch) => b.price!);
    const avgBatchPrice = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length;
    const minBatchPrice = Math.min(...prices);
    const maxBatchPrice = Math.max(...prices);

    return {
      genericPrice,
      hasBatchPrices: true,
      avgBatchPrice,
      minBatchPrice,
      maxBatchPrice,
      priceVariance: maxBatchPrice - minBatchPrice,
    };
  }, [product]);

  const getRiskLevel = () => {
    const stockoutRisk = prediction?.stockoutRisk || 0;
    if (stockoutRisk > 0.7) return { label: "CRITICAL", color: "#FF3B30", icon: "alert-circle" };
    if (stockoutRisk > 0.4) return { label: "HIGH", color: "#FF9500", icon: "warning" };
    if (stockoutRisk > 0.2) return { label: "MODERATE", color: "#FFD60A", icon: "alert" };
    return { label: "LOW", color: "#34C759", icon: "checkmark-circle" };
  };

  const getDemandVelocityLabel = () => {
    const velocity = prediction?.demandVelocity || 0;
    if (velocity > 10) return { label: "Very High", color: "#FF3B30" };
    if (velocity > 5) return { label: "High", color: "#FF9500" };
    if (velocity > 2) return { label: "Moderate", color: "#FFD60A" };
    if (velocity > 0.5) return { label: "Low", color: "#34C759" };
    return { label: "Very Low", color: theme.subtext };
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="cube-outline" size={80} color={theme.subtext} />
        <Text style={[styles.errorText, { color: theme.text }]}>
          Product Not Found
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.button, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const riskLevel = getRiskLevel();
  const velocityInfo = getDemandVelocityLabel();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.push("../inventory")}
            style={[styles.headerBtn, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>

          <View style={styles.headerActions}>
            {!isEditing ? (
              <>
                <Pressable
                  onPress={() => setIsEditing(true)}
                  style={[styles.headerBtn, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="create-outline" size={20} color="#FFF" />
                </Pressable>
                <Pressable
                  onPress={() => setShowDeleteWarning(true)}
                  style={[styles.headerBtn, { backgroundColor: "#FF3B30" }]}
                >
                  <Ionicons name="trash-outline" size={20} color="#FFF" />
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => {
                    setIsEditing(false);
                    setEditedName(product.name);
                    setEditedCategory(product.category || "");
                    setEditedImage(product.imageUrl || "");
                  }}
                  style={[styles.headerBtn, { backgroundColor: theme.surface }]}
                >
                  <Ionicons name="close" size={20} color={theme.text} />
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={isSaving || isUploadingImage}
                  style={[styles.headerBtn, { backgroundColor: theme.primary }]}
                >
                  {isSaving || isUploadingImage ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Save Changes</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Product Header Section */}
        <View style={[styles.productHeader, { backgroundColor: theme.surface }]}>
          {/* Compact Image Container */}
          <Pressable
            disabled={!isEditing}
            onPress={handleImagePick}
            style={[styles.imageContainer, { backgroundColor: theme.background }]}
          >
            {editedImage && editedImage !== "cube" ? (
              <Image
                source={{ uri: editedImage }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="cube-outline" size={60} color={theme.subtext} />
            )}
            {isEditing && (
              <View style={styles.imageEditBadge}>
                <Ionicons name="camera" size={14} color="#FFF" />
              </View>
            )}
          </Pressable>

          {/* Product Info */}
          <View style={styles.productInfo}>
            {isEditing ? (
              <>
                <TextInput
                  style={[
                    styles.editInput,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Product Name"
                  placeholderTextColor={theme.subtext}
                />
                <TextInput
                  style={[
                    styles.editInputSmall,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                  value={editedCategory}
                  onChangeText={setEditedCategory}
                  placeholder="Category"
                  placeholderTextColor={theme.subtext}
                />
              </>
            ) : (
              <>
                <Text style={[styles.productName, { color: theme.text }]}>
                  {product.name}
                </Text>
                <View style={styles.metaRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: theme.primary + "15" }]}>
                    <Text style={[styles.categoryText, { color: theme.primary }]}>
                      {product.category || "Uncategorized"}
                    </Text>
                  </View>
                  {product.isPerishable && (
                    <View style={[styles.perishableBadge, { backgroundColor: "#FF9500" + "15" }]}>
                      <Ionicons name="timer-outline" size={10} color="#FF9500" />
                      <Text style={[styles.perishableText, { color: "#FF9500" }]}>
                        Perishable
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.barcodeRow}>
                  <Ionicons name="barcode-outline" size={14} color={theme.subtext} />
                  <Text style={[styles.barcodeText, { color: theme.subtext }]}>
                    {product.barcode}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {product.totalQuantity}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>
              Total Units
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {product.batches?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>
              Batches
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Pressable
              onPress={() => {
                setTempPrice(editedGenericPrice);
                setShowPriceModal(true);
              }}
              style={styles.statPressable}
            >
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {priceAnalytics?.genericPrice ? `₦${priceAnalytics.genericPrice.toFixed(0)}` : "N/A"}
              </Text>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>
                Generic Price
              </Text>
              <Ionicons name="create-outline" size={12} color={theme.primary} style={styles.editIcon} />
            </Pressable>
          </View>
        </View>

        {/* Status Banner */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor:
                product.totalQuantity === 0 ? "#FF3B30" + "15"
                : product.totalQuantity < 10 ? "#FF9500" + "15"
                : "#34C759" + "15",
              borderColor:
                product.totalQuantity === 0 ? "#FF3B30"
                : product.totalQuantity < 10 ? "#FF9500"
                : "#34C759",
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  product.totalQuantity === 0 ? "#FF3B30"
                  : product.totalQuantity < 10 ? "#FF9500"
                  : "#34C759",
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color:
                  product.totalQuantity === 0 ? "#FF3B30"
                  : product.totalQuantity < 10 ? "#FF9500"
                  : "#34C759",
              },
            ]}
          >
            {product.totalQuantity === 0 ? "OUT OF STOCK"
              : product.totalQuantity < 10 ? "LOW STOCK"
              : "IN STOCK"}
          </Text>
        </View>

        {/* AI Analytics Section */}
        {prediction && (
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics-outline" size={18} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                AI Analytics
              </Text>
            </View>

            {/* Risk & Velocity Row */}
            <View style={styles.analyticsRow}>
              <View style={[styles.analyticsCard, { backgroundColor: theme.background, borderColor: riskLevel.color }]}>
                <Ionicons name={riskLevel.icon as any} size={20} color={riskLevel.color} />
                <Text style={[styles.analyticsLabel, { color: theme.subtext }]}>
                  Stockout Risk
                </Text>
                <Text style={[styles.analyticsValue, { color: riskLevel.color }]}>
                  {riskLevel.label}
                </Text>
                <Text style={[styles.analyticsSubtext, { color: theme.subtext }]}>
                  {prediction.stockoutRisk ? `${(prediction.stockoutRisk * 100).toFixed(0)}%` : "N/A"}
                </Text>
              </View>

              <View style={[styles.analyticsCard, { backgroundColor: theme.background, borderColor: velocityInfo.color }]}>
                <Ionicons name="speedometer-outline" size={20} color={velocityInfo.color} />
                <Text style={[styles.analyticsLabel, { color: theme.subtext }]}>
                  Demand Velocity
                </Text>
                <Text style={[styles.analyticsValue, { color: velocityInfo.color }]}>
                  {velocityInfo.label}
                </Text>
                <Text style={[styles.analyticsSubtext, { color: theme.subtext }]}>
                  {prediction.demandVelocity?.toFixed(1) || "0.0"} units/day
                </Text>
              </View>
            </View>

            {/* Predictions Grid */}
            <View style={styles.predictionsGrid}>
              <View style={styles.predictionItem}>
                <Text style={[styles.predictionValue, { color: theme.primary }]}>
                  {prediction.nextWeekDemand || 0}
                </Text>
                <Text style={[styles.predictionLabel, { color: theme.subtext }]}>
                  7-Day Forecast
                </Text>
              </View>

              <View style={styles.predictionItem}>
                <Text style={[styles.predictionValue, { color: theme.primary }]}>
                  {prediction.optimalOrderQty || 0}
                </Text>
                <Text style={[styles.predictionLabel, { color: theme.subtext }]}>
                  Optimal Order
                </Text>
              </View>

              {prediction.reorderPoint !== undefined && (
                <View style={styles.predictionItem}>
                  <Text style={[styles.predictionValue, { color: "#FF9500" }]}>
                    {prediction.reorderPoint}
                  </Text>
                  <Text style={[styles.predictionLabel, { color: theme.subtext }]}>
                    Reorder Point
                  </Text>
                </View>
              )}
            </View>

            {/* Days Until Stockout */}
            {prediction.daysUntilStockout !== undefined && prediction.daysUntilStockout > 0 && (
              <View
                style={[
                  styles.alertBanner,
                  {
                    backgroundColor:
                      prediction.daysUntilStockout < 7 ? "#FF3B30" + "10"
                      : prediction.daysUntilStockout < 14 ? "#FF9500" + "10"
                      : "#34C759" + "10",
                    borderColor:
                      prediction.daysUntilStockout < 7 ? "#FF3B30"
                      : prediction.daysUntilStockout < 14 ? "#FF9500"
                      : "#34C759",
                  },
                ]}
              >
                <Ionicons
                  name="timer-outline"
                  size={16}
                  color={
                    prediction.daysUntilStockout < 7 ? "#FF3B30"
                    : prediction.daysUntilStockout < 14 ? "#FF9500"
                    : "#34C759"
                  }
                />
                <Text
                  style={[
                    styles.alertText,
                    {
                      color:
                        prediction.daysUntilStockout < 7 ? "#FF3B30"
                        : prediction.daysUntilStockout < 14 ? "#FF9500"
                        : "#34C759",
                    },
                  ]}
                >
                  Stockout in ~{Math.ceil(prediction.daysUntilStockout)} days
                </Text>
              </View>
            )}

            {/* Turnover Rate */}
            {prediction.turnoverRate !== undefined && (
              <View style={[styles.turnoverRow, { backgroundColor: theme.background }]}>
                <View style={styles.turnoverInfo}>
                  <Ionicons name="repeat-outline" size={16} color={theme.primary} />
                  <Text style={[styles.turnoverLabel, { color: theme.subtext }]}>
                    Turnover Rate
                  </Text>
                </View>
                <Text style={[styles.turnoverValue, { color: theme.primary }]}>
                  {prediction.turnoverRate.toFixed(2)}x
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Batch Timeline */}
        {product.batches && product.batches.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="layers-outline" size={18} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Batch Timeline ({product.batches.length})
              </Text>
            </View>

            <View style={styles.timeline}>
              {product.batches.map((batch: Batch, index: number) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: theme.primary }]} />
                  {index < product.batches.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                  )}
                  
                  <View style={[styles.batchCard, { backgroundColor: theme.background }]}>
                    <View style={styles.batchHeader}>
                      <Text style={[styles.batchTitle, { color: theme.text }]}>
                        #{batch.batchNumber?.slice(-6) || "N/A"}
                      </Text>
                      <View style={[styles.qtyBadge, { backgroundColor: theme.primary + "15" }]}>
                        <Text style={[styles.qtyText, { color: theme.primary }]}>
                          {batch.quantity} units
                        </Text>
                      </View>
                    </View>

                    <View style={styles.batchDetails}>
                      {batch.expiryDate && batch.expiryDate !== "N/A" && (
                        <View style={styles.detailRow}>
                          <Ionicons name="calendar-outline" size={12} color={theme.subtext} />
                          <Text style={[styles.detailText, { color: theme.subtext }]}>
                            Expires: {new Date(batch.expiryDate).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                      {batch.price && batch.price > 0 && (
                        <View style={styles.detailRow}>
                          <Ionicons name="pricetag-outline" size={12} color={theme.subtext} />
                          <Text style={[styles.detailText, { color: theme.primary }]}>
                            ₦{batch.price.toFixed(2)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Price Analytics Section */}
        {priceAnalytics && priceAnalytics.hasBatchPrices && (
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pricetag-outline" size={18} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Price Analytics
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.subtext }]}>
                Average Batch Price
              </Text>
              <Text style={[styles.priceValue, { color: theme.text }]}>
                ₦{priceAnalytics.avgBatchPrice!.toFixed(2)}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.subtext }]}>
                Price Range
              </Text>
              <Text style={[styles.priceValue, { color: theme.text }]}>
                ₦{priceAnalytics.minBatchPrice!.toFixed(2)} - ₦{priceAnalytics.maxBatchPrice!.toFixed(2)}
              </Text>
            </View>

            {priceAnalytics.priceVariance! > 0 && (
              <View style={[styles.alertBanner, { backgroundColor: "#FFD60A" + "10", borderColor: "#FFD60A" }]}>
                <Ionicons name="trending-up" size={14} color="#FFD60A" />
                <Text style={[styles.alertText, { color: "#FFD60A" }]}>
                  Variance: ₦{priceAnalytics.priceVariance!.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Price Edit Modal */}
      <Modal visible={showPriceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconBox, { backgroundColor: theme.primary + "15" }]}>
              <Ionicons name="pricetag" size={32} color={theme.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Set Generic Price
            </Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>
              This price applies to the product across all batches
            </Text>

            <View style={styles.priceInputContainer}>
              <Text style={[styles.currencySymbol, { color: theme.text }]}>₦</Text>
              <TextInput
                style={[styles.priceInput, { color: theme.text, borderColor: theme.border }]}
                value={tempPrice}
                onChangeText={setTempPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.subtext}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => {
                  setShowPriceModal(false);
                  setTempPrice("");
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={handlePriceUpdate}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Update Price</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Warning Modal */}
      <Modal visible={showDeleteWarning} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Ionicons name="warning-outline" size={48} color="#FF3B30" />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Delete Product?
            </Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>
              This will permanently remove the product and all its batches. This action cannot be undone.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => setShowDeleteWarning(false)}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#FF3B30" }]}
                onPress={handleDelete}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* PIN Modal */}
      <Modal visible={showPinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconBox, { backgroundColor: theme.primary + "15" }]}>
              <Ionicons name="shield-checkmark" size={32} color={theme.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Confirm Deletion
            </Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>
              Enter admin PIN to authorize deletion
            </Text>

            <TextInput
              style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={deletePin}
              onChangeText={setDeletePin}
              placeholder="Enter PIN"
              placeholderTextColor={theme.subtext}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => {
                  setShowPinModal(false);
                  setDeletePin("");
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#FF3B30" }]}
                onPress={handlePinSubmit}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: "700",
    marginVertical: 20,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },

  productHeader: {
    flexDirection: "row",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  imageEditBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  perishableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  perishableText: {
    fontSize: 10,
    fontWeight: "700",
  },
  barcodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  barcodeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  editInput: {
    fontSize: 16,
    fontWeight: "700",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  editInputSmall: {
    fontSize: 13,
    fontWeight: "600",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },

  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statPressable: {
    alignItems: "center",
    position: "relative",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  editIcon: {
    position: "absolute",
    top: -4,
    right: -4,
  },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  section: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
  },

  analyticsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  analyticsCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  analyticsLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 2,
  },
  analyticsSubtext: {
    fontSize: 9,
    fontWeight: "600",
  },

  predictionsGrid: {
    flexDirection: "row",
    marginBottom: 12,
  },
  predictionItem: {
    flex: 1,
    alignItems: "center",
  },
  predictionValue: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
  },
  predictionLabel: {
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },

  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  alertText: {
    fontSize: 11,
    fontWeight: "700",
  },

  turnoverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  turnoverInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  turnoverLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  turnoverValue: {
    fontSize: 16,
    fontWeight: "900",
  },

  timeline: {
    position: "relative",
  },
  timelineItem: {
    flexDirection: "row",
    paddingBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  timelineLine: {
    position: "absolute",
    left: 5.5,
    top: 16,
    width: 1,
    bottom: 0,
  },
  batchCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
  },
  batchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  batchTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  qtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qtyText: {
    fontSize: 10,
    fontWeight: "800",
  },
  batchDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 11,
    fontWeight: "600",
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "900",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    padding: 30,
    borderRadius: 30,
    alignItems: "center",
  },
  modalIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "900",
    marginRight: 10,
  },
  priceInput: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 20,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
  },
  pinInput: {
    width: "100%",
    height: 55,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
});