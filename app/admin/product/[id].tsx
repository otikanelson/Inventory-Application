import React, { useEffect, useState } from "react";
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
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useProducts } from "../../../hooks/useProducts";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import axios from "axios";

export default function AdminProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { getProductById, refresh } = useProducts();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit state
  const [editedName, setEditedName] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedImage, setEditedImage] = useState("");

  // Delete state
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"batch" | "global" | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
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
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setEditedImage(result.assets[0].uri);
    }
  };

  const handleSaveEdit = async () => {
    if (!editedName.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Product name is required",
      });
      return;
    }

    if (!editedCategory.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Category is required",
      });
      return;
    }

    setIsSaving(true);
    try {
      await axios.patch(
        `${process.env.EXPO_PUBLIC_API_URL}/products/${product._id}`,
        {
          name: editedName.trim(),
          category: editedCategory.trim(),
          imageUrl: editedImage,
        }
      );

      Toast.show({
        type: "success",
        text1: "Product Updated",
        text2: "Changes saved successfully",
      });

      setIsEditing(false);
      await loadProduct();
      refresh();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: "Could not save changes",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName(product.name);
    setEditedCategory(product.category || "");
    setEditedImage(product.imageUrl || "");
  };

  const handleDeleteBatch = (batch: any) => {
    setSelectedBatch(batch);
    setDeleteMode("batch");
    setShowDeleteMenu(false);
    setShowPinModal(true);
  };

  const handleDeleteGlobal = () => {
    setDeleteMode("global");
    setShowDeleteMenu(false);
    setShowPinModal(true);
  };

  const handleFinalDelete = async () => {
    if (deletePin !== "1234") {
      Toast.show({
        type: "error",
        text1: "Access Denied",
        text2: "Incorrect admin PIN",
      });
      setDeletePin("");
      return;
    }

    try {
      if (deleteMode === "batch" && selectedBatch) {
        // Delete specific batch
        await axios.delete(
          `${process.env.EXPO_PUBLIC_API_URL}/products/${product._id}/batches/${selectedBatch.batchNumber}`
        );

        Toast.show({
          type: "success",
          text1: "Batch Deleted",
          text2: `Batch #${selectedBatch.batchNumber.slice(-6)} removed`,
        });

        await loadProduct();
        refresh();
      } else if (deleteMode === "global") {
        // Delete entire product
        await axios.delete(
          `${process.env.EXPO_PUBLIC_API_URL}/products/${product._id}`
        );

        Toast.show({
          type: "success",
          text1: "Product Deleted",
          text2: `${product.name} removed from system`,
        });

        refresh();
        router.back();
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Deletion Failed",
        text2: "Could not complete operation",
      });
    } finally {
      setShowPinModal(false);
      setDeletePin("");
      setDeleteMode(null);
      setSelectedBatch(null);
    }
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
        <Ionicons name="alert-circle-outline" size={80} color={theme.subtext} />
        <Text style={[styles.errorText, { color: theme.text }]}>
          PRODUCT_NOT_FOUND
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.button, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.buttonText}>GO_BACK</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} />

      {/* Header Actions */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: theme.surface }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.headerRight}>
          {!isEditing ? (
            <>
              <Pressable
                onPress={() => setIsEditing(true)}
                style={[
                  styles.headerBtn,
                  { backgroundColor: theme.primary, marginRight: 10 },
                ]}
              >
                <Ionicons name="create-outline" size={22} color="#FFF" />
              </Pressable>
              <Pressable
                onPress={() => setShowDeleteMenu(true)}
                style={[styles.headerBtn, { backgroundColor: "#FF3B30" }]}
              >
                <Ionicons name="trash-outline" size={22} color="#FFF" />
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={handleCancelEdit}
                style={[
                  styles.headerBtn,
                  { backgroundColor: theme.surface, marginRight: 10 },
                ]}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                style={[
                  styles.headerBtn,
                  { backgroundColor: "#34C759", opacity: isSaving ? 0.6 : 1 },
                ]}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="checkmark" size={24} color="#FFF" />
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Card - Technical Style */}
        <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
          <Pressable
            onPress={isEditing ? handleImagePick : undefined}
            style={styles.imageContainer}
            disabled={!isEditing}
          >
            {editedImage ? (
              <Image
                source={{ uri: editedImage }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="cube-outline" size={80} color={theme.subtext} />
              </View>
            )}
            {isEditing && (
              <View style={styles.editImageOverlay}>
                <Ionicons name="camera" size={32} color="#FFF" />
              </View>
            )}
          </Pressable>

          <View style={styles.productInfo}>
            {isEditing ? (
              <>
                <Text style={[styles.fieldLabel, { color: theme.subtext }]}>
                  PRODUCT_NAME
                </Text>
                <TextInput
                  style={[
                    styles.editField,
                    { color: theme.text, borderColor: theme.border },
                  ]}
                  value={editedName}
                  onChangeText={setEditedName}
                />

                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.subtext, marginTop: 15 },
                  ]}
                >
                  CATEGORY
                </Text>
                <TextInput
                  style={[
                    styles.editField,
                    { color: theme.text, borderColor: theme.border },
                  ]}
                  value={editedCategory}
                  onChangeText={setEditedCategory}
                />
              </>
            ) : (
              <>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: theme.primary + "20" },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: theme.primary }]}>
                      {product.category || "GENERAL"}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.productName, { color: theme.text }]}>
                  {product.name}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="barcode-outline"
                      size={14}
                      color={theme.subtext}
                    />
                    <Text style={[styles.metaText, { color: theme.subtext }]}>
                      {product.barcode || "NO_BARCODE"}
                    </Text>
                  </View>
                  {product.isPerishable && (
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="warning-outline"
                        size={14}
                        color="#FF9500"
                      />
                      <Text style={[styles.metaText, { color: theme.subtext }]}>
                        PERISHABLE
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Ionicons name="cube-outline" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {product.totalQuantity || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>
              TOTAL_UNITS
            </Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Ionicons name="layers-outline" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {product.batches?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>
              BATCHES
            </Text>
          </View>
        </View>

        {/* Batches List with Delete */}
        {product.batches && product.batches.length > 0 && (
          <View style={[styles.batchesCard, { backgroundColor: theme.surface }]}>
            <View style={styles.batchHeader}>
              <Ionicons name="layers-outline" size={20} color={theme.primary} />
              <Text style={[styles.batchHeaderText, { color: theme.primary }]}>
                BATCH_REGISTRY
              </Text>
            </View>

            {product.batches.map((batch: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.batchItem,
                  { backgroundColor: theme.background + "80", borderColor: theme.border },
                ]}
              >
                <View style={styles.batchLeft}>
                  <Text style={[styles.batchNumber, { color: theme.text }]}>
                    BATCH_#{batch.batchNumber?.slice(-6) || "MANUAL"}
                  </Text>
                  <View style={styles.batchMeta}>
                    <Ionicons name="cube-outline" size={12} color={theme.subtext} />
                    <Text style={[styles.batchMetaText, { color: theme.subtext }]}>
                      {batch.quantity} units
                    </Text>
                    {batch.expiryDate && batch.expiryDate !== "N/A" && (
                      <>
                        <Text style={[styles.batchMetaText, { color: theme.subtext }]}>
                          •
                        </Text>
                        <Ionicons name="calendar-outline" size={12} color={theme.subtext} />
                        <Text style={[styles.batchMetaText, { color: theme.subtext }]}>
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                <Pressable
                  onPress={() => handleDeleteBatch(batch)}
                  style={[styles.batchDeleteBtn, { backgroundColor: theme.notification + "20" }]}
                >
                  <Ionicons name="trash-outline" size={16} color={theme.notification} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Delete Menu Modal */}
      <Modal visible={showDeleteMenu} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.menuContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>
              DELETE_OPTIONS
            </Text>
            <Text style={[styles.menuSubtitle, { color: theme.subtext }]}>
              Select deletion scope
            </Text>

            <Pressable
              style={[styles.menuOption, { borderColor: theme.border }]}
              onPress={handleDeleteGlobal}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: "#FF3B30" + "20" }]}>
                <Ionicons name="nuclear-outline" size={24} color="#FF3B30" />
              </View>
              <View style={styles.menuOptionText}>
                <Text style={[styles.menuOptionTitle, { color: theme.text }]}>
                  Delete Global Product
                </Text>
                <Text style={[styles.menuOptionDesc, { color: theme.subtext }]}>
                  Remove entire product from registry
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
            </Pressable>

            <Pressable
              style={[styles.menuOption, { borderColor: theme.border }]}
              onPress={() => {
                setShowDeleteMenu(false);
                Toast.show({
                  type: "info",
                  text1: "Select Batch",
                  text2: "Tap the delete icon next to a batch",
                });
              }}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: "#FF9500" + "20" }]}>
                <Ionicons name="layers-outline" size={24} color="#FF9500" />
              </View>
              <View style={styles.menuOptionText}>
                <Text style={[styles.menuOptionTitle, { color: theme.text }]}>
                  Delete Specific Batch
                </Text>
                <Text style={[styles.menuOptionDesc, { color: theme.subtext }]}>
                  Remove individual batch from product
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
            </Pressable>

            <Pressable
              style={[styles.cancelBtn, { backgroundColor: theme.background }]}
              onPress={() => setShowDeleteMenu(false)}
            >
              <Text style={[styles.cancelBtnText, { color: theme.text }]}>
                CANCEL
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* PIN Confirmation Modal */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Ionicons 
              name="shield-checkmark-outline" 
              size={60} 
              color={deleteMode === "global" ? "#FF3B30" : "#FF9500"} 
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              CONFIRM_DELETION
            </Text>
            <Text style={[styles.modalText, { color: theme.subtext }]}>
              {deleteMode === "global"
                ? `This will permanently remove "${product?.name}" and all its batches from the system.`
                : `This will remove batch #${selectedBatch?.batchNumber?.slice(-6)} (${selectedBatch?.quantity} units).`}
            </Text>
            <Text style={[styles.modalWarning, { color: theme.notification }]}>
              THIS_ACTION_CANNOT_BE_UNDONE
            </Text>
            <TextInput
              style={[
                styles.pinInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={deletePin}
              onChangeText={setDeletePin}
              placeholder="ENTER_ADMIN_PIN"
              placeholderTextColor={theme.subtext}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background }]}
                onPress={() => {
                  setShowPinModal(false);
                  setDeletePin("");
                  setDeleteMode(null);
                  setSelectedBatch(null);
                }}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>
                  CANCEL
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalBtn, 
                  { backgroundColor: deleteMode === "global" ? "#FF3B30" : "#FF9500" }
                ]}
                onPress={handleFinalDelete}
              >
                <Text style={[styles.modalBtnText, { color: "#FFF" }]}>
                  DELETE
                </Text>
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
    fontWeight: "800",
    marginVertical: 20,
    letterSpacing: 2,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },

  header: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  headerRight: {
    flexDirection: "row",
  },

  scrollContent: {
    paddingTop: 110,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  heroCard: {
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "rgba(150,150,150,0.05)",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  editImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  productInfo: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  productName: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "row",
    gap: 15,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "600",
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  editField: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontWeight: "600",
  },

  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  batchesCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  batchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  batchHeaderText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  batchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  batchLeft: {
    flex: 1,
  },
  batchNumber: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  batchMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  batchMetaText: {
    fontSize: 11,
    fontWeight: "600",
  },
  batchDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    width: "85%",
    padding: 24,
    borderRadius: 24,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
  },
  menuSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 20,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuOptionText: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  menuOptionDesc: {
    fontSize: 12,
    fontWeight: "600",
  },
  cancelBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },

  modalContent: {
    width: "85%",
    padding: 30,
    borderRadius: 28,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 15,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  modalWarning: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 20,
  },
  pinInput: {
    width: "100%",
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
});