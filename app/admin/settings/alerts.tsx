import { Ionicons } from "@expo/vector-icons";
import axios from 'axios';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from "react-native";
import Toast from "react-native-toast-message";
import { HelpTooltip } from "../../../components/HelpTooltip";
import { useTheme } from "../../../context/ThemeContext";
import { useAlerts } from "../../../hooks/useAlerts";

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function AlertSettingsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { settings: alertSettings, updateSettings } = useAlerts();

  // Alert Threshold State
  const [thresholds, setThresholds] = useState({
    critical: 7,
    highUrgency: 14,
    earlyWarning: 30
  });

  // Category Management State
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryThresholdsEnabled, setCategoryThresholdsEnabled] = useState(false);
  const [categoryThresholds, setCategoryThresholds] = useState({
    critical: 7,
    highUrgency: 14,
    earlyWarning: 30
  });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadAlertSettings();
    loadCategories();
  }, []);

  const loadAlertSettings = async () => {
    try {
      if (alertSettings?.thresholds) {
        setThresholds({
          critical: alertSettings.thresholds.critical || 7,
          highUrgency: alertSettings.thresholds.highUrgency || 14,
          earlyWarning: alertSettings.thresholds.earlyWarning || 30
        });
      }
    } catch (error) {
      console.error('Error loading alert settings:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Update loadAlertSettings when alertSettings changes
  useEffect(() => {
    loadAlertSettings();
  }, [alertSettings]);

  // Alert Threshold Handlers
  const handleSaveThresholds = async () => {
    // Validate threshold ordering
    if (thresholds.critical >= thresholds.highUrgency) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Configuration',
        text2: 'Critical must be less than High Urgency'
      });
      return;
    }

    if (thresholds.highUrgency >= thresholds.earlyWarning) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Configuration',
        text2: 'High Urgency must be less than Early Warning'
      });
      return;
    }

    const result = await updateSettings({ thresholds });

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Settings Saved',
        text2: 'Global alert levels updated'
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Please try again'
      });
    }
  };

  // Category Management Handlers
  const openCreateCategoryModal = () => {
    setIsCreatingCategory(true);
    setSelectedCategory(null);
    setCategoryName("");
    setCategoryThresholdsEnabled(false);
    setCategoryThresholds({
      critical: thresholds.critical,
      highUrgency: thresholds.highUrgency,
      earlyWarning: thresholds.earlyWarning
    });
    setCategoryModalVisible(true);
  };

  const openEditCategoryModal = (category: any) => {
    setIsCreatingCategory(false);
    setSelectedCategory(category);
    setCategoryName(category.name);
    setCategoryThresholdsEnabled(category.customAlertThresholds?.enabled || false);
    setCategoryThresholds({
      critical: category.customAlertThresholds?.critical || thresholds.critical,
      highUrgency: category.customAlertThresholds?.highUrgency || thresholds.highUrgency,
      earlyWarning: category.customAlertThresholds?.earlyWarning || thresholds.earlyWarning
    });
    setCategoryModalVisible(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Name',
        text2: 'Category name cannot be empty'
      });
      return;
    }

    // Validate thresholds if enabled
    if (categoryThresholdsEnabled) {
      if (categoryThresholds.critical >= categoryThresholds.highUrgency) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Alert Levels',
          text2: 'Critical must be less than High Urgency'
        });
        return;
      }

      if (categoryThresholds.highUrgency >= categoryThresholds.earlyWarning) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Alert Levels',
          text2: 'High Urgency must be less than Early Warning'
        });
        return;
      }
    }

    try {
      const payload = {
        name: categoryName.trim(),
        customAlertThresholds: categoryThresholdsEnabled ? {
          enabled: true,
          ...categoryThresholds
        } : { enabled: false }
      };

      if (isCreatingCategory) {
        // Create new category
        const response = await axios.post(`${API_URL}/categories`, payload);
        if (response.data.success) {
          Toast.show({
            type: 'success',
            text1: 'Category Created',
            text2: `${categoryName} has been added`
          });
          await loadCategories();
          setCategoryModalVisible(false);
        }
      } else {
        // Update existing category
        const response = await axios.put(`${API_URL}/categories/${selectedCategory._id}`, payload);
        if (response.data.success) {
          Toast.show({
            type: 'success',
            text1: 'Category Updated',
            text2: `${categoryName} has been updated`
          });
          await loadCategories();
          setCategoryModalVisible(false);
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: isCreatingCategory ? 'Creation Failed' : 'Update Failed',
        text2: 'Please try again'
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      const response = await axios.delete(`${API_URL}/categories/${selectedCategory._id}`);
      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Category Deleted',
          text2: `${selectedCategory.name} has been removed`
        });
        await loadCategories();
        setCategoryModalVisible(false);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Deletion Failed',
        text2: 'Please try again'
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <Pressable 
            onPress={() => router.push('/admin/settings')}
            style={[styles.backButton, { backgroundColor: theme.surface }]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </Pressable>
          <View>
            <Text style={[styles.headerSub, { color: theme.primary }]}>
              ADMIN_SETTINGS
            </Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              ALERTS
            </Text>
          </View>
        </View>

        {/* ALERT LEVELS SECTION */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 }}>
            <Text style={[styles.sectionTitle, { color: theme.primary, marginBottom: 0 }]}>
              ALERT LEVELS
            </Text>
            <HelpTooltip
              title="Alert Levels"
              content={[
                "Configure when you receive alerts based on days until product expiry.",
                "Critical Alert: Immediate action needed (default 7 days). Products at this stage should be discounted or removed.",
                "High Urgency: Prioritize for sale (default 14 days). Start promoting these products.",
                "Early Warning: Plan ahead (default 30 days). Monitor stock levels and adjust orders.",
                "Alert levels must be in ascending order: Critical < High < Early.",
                "These are global defaults. You can set category-specific alert levels below."
              ]}
              icon="help-circle-outline"
              iconSize={14}
              iconColor={theme.primary}
            />
          </View>

          <View
            style={[
              styles.configCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Global Expiry Alert Levels
            </Text>
            <Text style={[styles.cardDesc, { color: theme.subtext }]}>
              Default alert levels for all products
            </Text>

            {/* Critical Alert */}
            <View style={styles.thresholdRow}>
              <View style={styles.thresholdInfo}>
                <View style={[styles.thresholdDot, { backgroundColor: "#FF3B30" }]} />
                <View style={styles.thresholdTextContainer}>
                  <Text style={[styles.thresholdLabel, { color: theme.text }]}>
                    Critical Alert
                  </Text>
                  <Text style={[styles.thresholdDesc, { color: theme.subtext }]}>
                    Immediate action required
                  </Text>
                </View>
              </View>
              <View style={styles.thresholdInput}>
                <TextInput
                  style={[
                    styles.numberInput,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                  keyboardType="numeric"
                  value={thresholds.critical.toString()}
                  onChangeText={(val) =>
                    setThresholds({ ...thresholds, critical: parseInt(val) || 0 })
                  }
                />
                <Text style={[styles.thresholdUnit, { color: theme.subtext }]}>
                  days
                </Text>
              </View>
            </View>

            {/* High Urgency Alert */}
            <View style={styles.thresholdRow}>
              <View style={styles.thresholdInfo}>
                <View style={[styles.thresholdDot, { backgroundColor: "#FF9500" }]} />
                <View style={styles.thresholdTextContainer}>
                  <Text style={[styles.thresholdLabel, { color: theme.text }]}>
                    High Urgency
                  </Text>
                  <Text style={[styles.thresholdDesc, { color: theme.subtext }]}>
                    Prioritize for sale
                  </Text>
                </View>
              </View>
              <View style={styles.thresholdInput}>
                <TextInput
                  style={[
                    styles.numberInput,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                  keyboardType="numeric"
                  value={thresholds.highUrgency.toString()}
                  onChangeText={(val) =>
                    setThresholds({ ...thresholds, highUrgency: parseInt(val) || 0 })
                  }
                />
                <Text style={[styles.thresholdUnit, { color: theme.subtext }]}>
                  days
                </Text>
              </View>
            </View>

            {/* Early Warning Alert */}
            <View style={[styles.thresholdRow, { borderBottomWidth: 0 }]}>
              <View style={styles.thresholdInfo}>
                <View style={[styles.thresholdDot, { backgroundColor: "#FFD60A" }]} />
                <View style={styles.thresholdTextContainer}>
                  <Text style={[styles.thresholdLabel, { color: theme.text }]}>
                    Early Warning
                  </Text>
                  <Text style={[styles.thresholdDesc, { color: theme.subtext }]}>
                    Plan ahead
                  </Text>
                </View>
              </View>
              <View style={styles.thresholdInput}>
                <TextInput
                  style={[
                    styles.numberInput,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                  keyboardType="numeric"
                  value={thresholds.earlyWarning.toString()}
                  onChangeText={(val) =>
                    setThresholds({ ...thresholds, earlyWarning: parseInt(val) || 0 })
                  }
                />
                <Text style={[styles.thresholdUnit, { color: theme.subtext }]}>
                  days
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={handleSaveThresholds}
            >
              <Text style={styles.saveBtnText}>SAVE GLOBAL ALERT LEVELS</Text>
            </Pressable>
          </View>
        </View>

        {/* CATEGORY MANAGEMENT SECTION */}
        <View style={styles.section}>
          <Pressable 
            onPress={() => setCategoriesExpanded(!categoriesExpanded)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.sectionTitle, { color: theme.primary, marginBottom: 0 }]}>
                CATEGORY MANAGEMENT
              </Text>
              <HelpTooltip
                title="Category Management"
                content={[
                  "Create and manage product categories for your inventory.",
                  "Categories help organize products and can have custom alert levels.",
                  "Example: Set shorter alert levels for Dairy (5/10/20 days) vs Canned Goods (14/30/60 days).",
                  "Products can only be assigned to categories you create here.",
                  "Cannot delete categories that have products assigned to them."
                ]}
                icon="help-circle-outline"
                iconSize={14}
                iconColor={theme.primary}
              />
              <Ionicons 
                name={categoriesExpanded ? "chevron-down" : "chevron-forward"} 
                size={18} 
                color={theme.primary} 
              />
            </View>
            <Pressable
              style={[styles.addCategoryBtn, { backgroundColor: theme.primary }]}
              onPress={openCreateCategoryModal}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addCategoryText}>NEW</Text>
            </Pressable>
          </Pressable>

          {categoriesExpanded && (
            <>
              {categories.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="pricetags-outline" size={48} color={theme.subtext} />
                  <Text style={[styles.emptyStateText, { color: theme.text }]}>
                    No Categories Yet
                  </Text>
                  <Text style={[styles.emptyStateDesc, { color: theme.subtext }]}>
                    Create categories to organize products
                  </Text>
                </View>
              ) : (
                <View style={styles.categoryGrid}>
                  {categories.map((category) => (
                    <Pressable
                      key={category._id}
                      style={[
                        styles.categoryCard,
                        { 
                          backgroundColor: theme.surface,
                          borderColor: category.customAlertThresholds?.enabled ? theme.primary : theme.border
                        }
                      ]}
                      onPress={() => openEditCategoryModal(category)}
                    >
                      <View style={styles.categoryCardHeader}>
                        <Text style={[styles.categoryCardName, { color: theme.text }]}>
                          {category.name}
                        </Text>
                        {category.customAlertThresholds?.enabled && (
                          <View style={[styles.customBadge, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="settings" size={12} color={theme.primary} />
                          </View>
                        )}
                      </View>
                      {category.customAlertThresholds?.enabled && (
                        <Text style={[styles.categoryCardThresholds, { color: theme.subtext }]}>
                          {category.customAlertThresholds.critical}/{category.customAlertThresholds.highUrgency}/{category.customAlertThresholds.earlyWarning} days
                        </Text>
                      )}
                      <Text style={[styles.categoryCardCount, { color: theme.subtext }]}>
                        {category.productCount || 0} products
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CATEGORY MODAL */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconBox, { backgroundColor: theme.primary + "15" }]}>
              <Ionicons name="pricetags" size={32} color={theme.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isCreatingCategory ? "Create Category" : "Edit Category"}
            </Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>
              {isCreatingCategory 
                ? "Create a new category for your products"
                : selectedCategory?.productCount > 0
                  ? `This category has ${selectedCategory.productCount} product(s)`
                  : "Update category name and alert levels"
              }
            </Text>

            <TextInput
              style={[styles.categoryInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Category Name"
              placeholderTextColor={theme.subtext}
              value={categoryName}
              onChangeText={setCategoryName}
            />

            {/* Custom Alert Levels Toggle */}
            <View style={[styles.thresholdToggle, { borderColor: theme.border }]}>
              <Text style={[styles.thresholdToggleLabel, { color: theme.text }]}>
                Custom Alert Levels
              </Text>
              <Switch
                value={categoryThresholdsEnabled}
                onValueChange={setCategoryThresholdsEnabled}
                trackColor={{ true: theme.primary }}
              />
            </View>

            {/* Custom Alert Levels Inputs */}
            {categoryThresholdsEnabled && (
              <View style={[styles.thresholdsContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={styles.thresholdInputRow}>
                  <Text style={[styles.thresholdInputLabel, { color: theme.text }]}>Critical</Text>
                  <View style={styles.thresholdInputGroup}>
                    <TextInput
                      style={[
                        styles.smallNumberInput,
                        { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
                      ]}
                      keyboardType="numeric"
                      value={categoryThresholds.critical.toString()}
                      onChangeText={(val) =>
                        setCategoryThresholds({ ...categoryThresholds, critical: parseInt(val) || 0 })
                      }
                    />
                    <Text style={[styles.thresholdUnit, { color: theme.subtext }]}>days</Text>
                  </View>
                </View>

                <View style={styles.thresholdInputRow}>
                  <Text style={[styles.thresholdInputLabel, { color: theme.text }]}>High Urgency</Text>
                  <View style={styles.thresholdInputGroup}>
                    <TextInput
                      style={[
                        styles.smallNumberInput,
                        { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
                      ]}
                      keyboardType="numeric"
                      value={categoryThresholds.highUrgency.toString()}
                      onChangeText={(val) =>
                        setCategoryThresholds({ ...categoryThresholds, highUrgency: parseInt(val) || 0 })
                      }
                    />
                    <Text style={[styles.thresholdUnit, { color: theme.subtext }]}>days</Text>
                  </View>
                </View>

                <View style={styles.thresholdInputRow}>
                  <Text style={[styles.thresholdInputLabel, { color: theme.text }]}>Early Warning</Text>
                  <View style={styles.thresholdInputGroup}>
                    <TextInput
                      style={[
                        styles.smallNumberInput,
                        { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
                      ]}
                      keyboardType="numeric"
                      value={categoryThresholds.earlyWarning.toString()}
                      onChangeText={(val) =>
                        setCategoryThresholds({ ...categoryThresholds, earlyWarning: parseInt(val) || 0 })
                      }
                    />
                    <Text style={[styles.thresholdUnit, { color: theme.subtext }]}>days</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => setCategoryModalVisible(false)}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveCategory}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>
                  {isCreatingCategory ? "CREATE CATEGORY" : "SAVE CHANGES"}
                </Text>
              </Pressable>
            </View>

            {!isCreatingCategory && selectedCategory?.productCount === 0 && (
              <Pressable
                style={[styles.deleteBtn, { backgroundColor: '#FF4444' + '15', borderColor: '#FF4444' }]}
                onPress={handleDeleteCategory}
              >
                <Ionicons name="trash-outline" size={18} color="#FF4444" />
                <Text style={[styles.deleteBtnText, { color: '#FF4444' }]}>Delete Category</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
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
  configCard: {
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
  thresholdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  thresholdInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  thresholdDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  thresholdTextContainer: {
    flex: 1,
  },
  thresholdLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  thresholdDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  thresholdInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  numberInput: {
    width: 70,
    height: 45,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  thresholdUnit: {
    fontSize: 13,
    fontWeight: "600",
  },
  saveBtn: {
    marginTop: 20,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  addCategoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addCategoryText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emptyState: {
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 15,
  },
  emptyStateDesc: {
    fontSize: 13,
    marginTop: 5,
    textAlign: "center",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  categoryCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryCardName: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  customBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryCardThresholds: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  categoryCardCount: {
    fontSize: 11,
    fontWeight: "600",
  },
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
  modalTitle: { fontSize: 22, fontWeight: "900", marginBottom: 10, textAlign: "center" },
  modalDesc: { fontSize: 14, textAlign: "center", marginBottom: 25, lineHeight: 20 },
  categoryInput: {
    width: "100%",
    height: 55,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    fontWeight: "600",
  },
  thresholdToggle: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 15,
  },
  thresholdToggleLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  thresholdsContainer: {
    width: "100%",
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 15,
    gap: 12,
  },
  thresholdInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  thresholdInputLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  thresholdInputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallNumberInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 10, width: "100%" },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
