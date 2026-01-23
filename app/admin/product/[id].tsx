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
  const { getProductById } = useProducts();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit state
  const [editedName, setEditedName] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedImage, setEditedImage] = useState("");

  // Delete modals
  const [showSellModal, setShowSellModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setEditedImage(result.assets[0].uri);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await axios.patch(
        `${process.env.EXPO_PUBLIC_API_URL}/products/${product._id}`,
        {
          name: editedName,
          category: editedCategory,
          imageUrl: editedImage,
        }
      );

      Toast.show({
        type: "success",
        text1: "Product Updated",
        text2: "Changes saved successfully",
      });

      setIsEditing(false);
      loadProduct();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: "Could not save changes",
      });
    }
  };

  const handleDeleteAttempt = () => {
    setShowSellModal(true);
  };

  const handleConfirmSell = () => {
    setShowSellModal(false);
    setShowConfirmModal(true);
  };

  const handleFinalDelete = async () => {
    if (deletePin !== "1234") {
      Toast.show({
        type: "error",
        text1: "Access Denied",
        text2: "Incorrect PIN",
      });
      setDeletePin("");
      return;
    }

    try {
      await axios.delete(
        `${process.env.EXPO_PUBLIC_API_URL}/products/${product._id}`
      );

      Toast.show({
        type: "success",
        text1: "Product Deleted",
        text2: `${product.name} removed from inventory`,
      });

      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Deletion Failed",
        text2: "Could not delete product",
      });
    } finally {
      setShowConfirmModal(false);
      setDeletePin("");
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
        <Ionicons name="alert-circle-outline" size={64} color={theme.subtext} />
        <Text style={[styles.errorTitle, { color: theme.text }]}>
          Product Not Found
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.backBtnText}>GO BACK</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} />

      <View style={styles.headerActionRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.floatingBtn, { backgroundColor: theme.surface }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.headerRight}>
          {!isEditing ? (
            <>
              <Pressable
                onPress={() => setIsEditing(true)}
                style={[
                  styles.floatingBtn,
                  {
                    backgroundColor: theme.primary,
                    marginRight: 10,
                  },
                ]}
              >
                <Ionicons name="pencil" size={20} color="#FFF" />
              </Pressable>
              <Pressable
                onPress={handleDeleteAttempt}
                style={[
                  styles.floatingBtn,
                  { backgroundColor: theme.notification },
                ]}
              >
                <Ionicons name="trash" size={20} color="#FFF" />
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
                style={[
                  styles.floatingBtn,
                  { backgroundColor: theme.background, marginRight: 10 },
                ]}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                style={[
                  styles.floatingBtn,
                  { backgroundColor: "#34C759" },
                ]}
              >
                <Ionicons name="checkmark" size={20} color="#FFF" />
              </Pressable>
            </>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
          <Pressable
            onPress={isEditing ? handleImagePick : undefined}
            style={styles.imageContainer}
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
                  PRODUCT NAME
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
                      {product.category || "General"}
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
                      {product.barcode || "No Barcode"}
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
                        Perishable
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
              Total Units
            </Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Ionicons name="layers-outline" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {product.batches?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>
              Batches
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sell Confirmation Modal */}
      <Modal visible={showSellModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="help-circle" size={48} color={theme.primary} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Delete Product?
            </Text>
            <Text style={[styles.modalText, { color: theme.subtext }]}>
              Did you mean to sell this product instead of deleting it?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background }]}
                onPress={() => setShowSellModal(false)}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.notification }]}
                onPress={handleConfirmSell}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>
                  Yes, Delete
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Final Confirmation with PIN */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="shield-checkmark" size={48} color={theme.notification} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Confirm Deletion
            </Text>
            <Text style={[styles.modalText, { color: theme.subtext }]}>
              This action cannot be undone. Enter admin PIN to confirm.
            </Text>
            <TextInput
              style={[
                styles.pinInput,
                { color: theme.text, borderColor: theme.border },
              ]}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={deletePin}
              onChangeText={setDeletePin}
              placeholder="Enter PIN"
              placeholderTextColor={theme.subtext}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background }]}
                onPress={() => {
                  setShowConfirmModal(false);
                  setDeletePin("");
                }}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.notification }]}
                onPress={handleFinalDelete}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>
                  Delete Product
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
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorTitle: { fontSize: 20, fontWeight: "800", marginVertical: 15 },
  backBtn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
  backBtnText: { color: "#FFF", fontWeight: "bold" },

  headerActionRow: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  floatingBtn: {
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
  headerRight: { flexDirection: "row" },

  heroCard: {
    marginTop: 110,
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(150,150,150,0.05)",
    marginBottom: 20,
    position: "relative",
  },
  productImage: { width: "100%", height: "100%" },
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
  productInfo: { gap: 12 },
  badgeRow: { flexDirection: "row", gap: 8 },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  productName: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  metaRow: { flexDirection: "row", gap: 15 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, fontWeight: "600" },

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
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
  },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 11, fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 25,
    borderRadius: 28,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 15,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  pinInput: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});