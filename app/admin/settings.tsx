import { AIStatusIndicator } from "@/components/AIStatusIndicator";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from "expo-router";
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ImageBackground,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from "react-native";
import Toast from "react-native-toast-message";
import { HelpTooltip } from "../../components/HelpTooltip";
import { useAdminTour } from "../../context/AdminTourContext";
import { useTheme } from "../../context/ThemeContext";
import { useAlerts } from "../../hooks/useAlerts";

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function AdminSettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const { settings: alertSettings, updateSettings } = useAlerts();
  const { resetTour, startTour } = useAdminTour();

  // PIN Update State
  const [showPinModal, setShowPinModal] = useState(false);
  const [showRemovePinModal, setShowRemovePinModal] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [removePinConfirm, setRemovePinConfirm] = useState("");

  // System Settings State
  const [autoLogout, setAutoLogout] = useState(true);
  const [autoLogoutTime, setAutoLogoutTime] = useState(30); // minutes
  const [requirePinForDelete, setRequirePinForDelete] = useState(true);
  const [enableBackup, setEnableBackup] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  // AI Settings State
  const [aiEnabled, setAiEnabled] = useState(true);
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [confidenceFilter, setConfidenceFilter] = useState(60);

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

  // Staff Management State
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [staffExpanded, setStaffExpanded] = useState(true);
  const [deleteStaffModal, setDeleteStaffModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadAlertSettings();
    loadCategories();
    loadStaffMembers();
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

  const loadStaffMembers = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('auth_session_token');
      const response = await axios.get(`${API_URL}/auth/staff`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`
        }
      });
      if (response.data.success) {
        setStaffMembers(response.data.data);
      }
    } catch (error) {
      console.error('Error loading staff members:', error);
    }
  };

  // Update loadAlertSettings when alertSettings changes
  useEffect(() => {
    loadAlertSettings();
  }, [alertSettings]);

  const loadSettings = async () => {
    try {
      const pin = await AsyncStorage.getItem('admin_pin');
      const pinRequired = await AsyncStorage.getItem('admin_require_pin_delete');
      const logoutEnabled = await AsyncStorage.getItem('admin_auto_logout');
      const logoutTime = await AsyncStorage.getItem('admin_auto_logout_time');
      const backupEnabled = await AsyncStorage.getItem('admin_auto_backup');
      const lastBackup = await AsyncStorage.getItem('last_backup_date');
      
      // Load AI settings
      const aiEnabledSetting = await AsyncStorage.getItem('ai_enabled');
      const riskThresholdSetting = await AsyncStorage.getItem('ai_risk_threshold');
      const notifEnabledSetting = await AsyncStorage.getItem('ai_notifications_enabled');
      const confidenceFilterSetting = await AsyncStorage.getItem('ai_confidence_filter');
      
      setHasPin(!!pin);
      if (pinRequired !== null) setRequirePinForDelete(pinRequired === 'true');
      if (logoutEnabled !== null) setAutoLogout(logoutEnabled === 'true');
      if (logoutTime !== null) setAutoLogoutTime(parseInt(logoutTime));
      if (backupEnabled !== null) setEnableBackup(backupEnabled === 'true');
      if (lastBackup) setLastBackupDate(lastBackup);
      
      // Set AI settings
      if (aiEnabledSetting !== null) setAiEnabled(aiEnabledSetting === 'true');
      if (riskThresholdSetting !== null) setRiskThreshold(parseInt(riskThresholdSetting));
      if (notifEnabledSetting !== null) setNotificationsEnabled(notifEnabledSetting === 'true');
      if (confidenceFilterSetting !== null) setConfidenceFilter(parseInt(confidenceFilterSetting));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleRequirePinToggle = async (value: boolean) => {
    setRequirePinForDelete(value);
    try {
      await AsyncStorage.setItem('admin_require_pin_delete', value.toString());
      Toast.show({
        type: 'success',
        text1: 'Setting Updated',
        text2: `PIN ${value ? 'required' : 'not required'} for deletions`
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not save setting'
      });
    }
  };

  const handleAutoLogoutToggle = async (value: boolean) => {
    setAutoLogout(value);
    try {
      await AsyncStorage.setItem('admin_auto_logout', value.toString());
      Toast.show({
        type: 'success',
        text1: 'Setting Updated',
        text2: `Auto-logout ${value ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not save setting'
      });
    }
  };

  const handleAutoLogoutTimeChange = async (minutes: number) => {
    setAutoLogoutTime(minutes);
    try {
      await AsyncStorage.setItem('admin_auto_logout_time', minutes.toString());
      Toast.show({
        type: 'success',
        text1: 'Timeout Updated',
        text2: `Auto-logout set to ${minutes} minutes`
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not save setting'
      });
    }
  };

  const handleFirstTimeSetup = async () => {
    try {
      // Validate PIN format
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        Toast.show({
          type: 'error',
          text1: 'Invalid PIN',
          text2: 'PIN must be exactly 4 digits'
        });
        return;
      }

      // Validate confirmation
      if (newPin !== confirmPin) {
        Toast.show({
          type: 'error',
          text1: 'PIN Mismatch',
          text2: 'PINs do not match'
        });
        return;
      }

      // Get admin name from AsyncStorage or use default
      const adminName = await AsyncStorage.getItem('auth_user_name') || 'Admin';

      // Create admin user in database
      try {
        const response = await axios.post(`${API_URL}/auth/setup`, {
          name: adminName,
          pin: newPin
        });

        if (response.data.success) {
          const adminId = response.data.data.user.id;
          
          // Store admin data locally
          await AsyncStorage.multiSet([
            ['admin_pin', newPin],
            ['admin_first_setup', 'completed'],
            ['auth_user_id', adminId],
            ['auth_user_name', adminName],
            ['auth_user_role', 'admin']
          ]);
          
          setHasPin(true);
          
          Toast.show({
            type: 'success',
            text1: 'PIN Created',
            text2: 'Admin PIN has been set successfully'
          });

          setShowPinModal(false);
          setOldPin("");
          setNewPin("");
          setConfirmPin("");
        }
      } catch (apiError: any) {
        console.log('API setup failed, using local storage only:', apiError.message);
        
        // Fallback to local storage only if API fails
        await AsyncStorage.setItem('admin_pin', newPin);
        await AsyncStorage.setItem('admin_first_setup', 'completed');
        
        setHasPin(true);
        
        Toast.show({
          type: 'success',
          text1: 'PIN Created',
          text2: 'Admin PIN has been set successfully (local only)'
        });

        setShowPinModal(false);
        setOldPin("");
        setNewPin("");
        setConfirmPin("");
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Setup Failed',
        text2: 'Could not save PIN'
      });
    }
  };

  const handleRemovePin = async () => {
    try {
      const storedPin = await AsyncStorage.getItem('admin_pin');
      
      if (!storedPin) {
        Toast.show({
          type: 'error',
          text1: 'No PIN Set',
          text2: 'There is no PIN to remove'
        });
        setShowRemovePinModal(false);
        return;
      }

      if (removePinConfirm !== storedPin) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Failed',
          text2: 'Incorrect PIN'
        });
        return;
      }

      // Remove PIN from storage
      await AsyncStorage.removeItem('admin_pin');
      await AsyncStorage.removeItem('admin_first_setup');
      
      setHasPin(false);
      
      Toast.show({
        type: 'success',
        text1: 'PIN Removed',
        text2: 'Admin access is now unrestricted'
      });

      setShowRemovePinModal(false);
      setRemovePinConfirm("");
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Removal Failed',
        text2: 'Could not remove PIN'
      });
    }
  };

  const handlePinUpdate = async () => {
    try {
      // Get stored PIN - NO DEFAULT VALUE
      const storedPin = await AsyncStorage.getItem('admin_pin');
      
      if (!storedPin) {
        Toast.show({
          type: 'error',
          text1: 'No PIN Set',
          text2: 'Please set up your admin PIN first'
        });
        return;
      }
      
      // Validate old PIN
      if (oldPin !== storedPin) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Failed',
          text2: 'Current PIN is incorrect'
        });
        return;
      }

      // Validate new PIN format
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        Toast.show({
          type: 'error',
          text1: 'Invalid PIN',
          text2: 'PIN must be exactly 4 digits'
        });
        return;
      }

      // Validate confirmation
      if (newPin !== confirmPin) {
        Toast.show({
          type: 'error',
          text1: 'PIN Mismatch',
          text2: 'New PIN and confirmation do not match'
        });
        return;
      }

      // Try to update in database first
      try {
        const response = await axios.put(`${API_URL}/auth/admin/pin`, {
          oldPin: oldPin,
          newPin: newPin
        });

        if (response.data.success) {
          // Update local storage
          await AsyncStorage.setItem('admin_pin', newPin);
          
          Toast.show({
            type: 'success',
            text1: 'PIN Updated',
            text2: 'Admin PIN has been changed successfully'
          });

          setShowPinModal(false);
          setOldPin("");
          setNewPin("");
          setConfirmPin("");
        }
      } catch (apiError: any) {
        console.log('API update failed, using local storage only:', apiError.message);
        
        // Fallback to local storage only
        await AsyncStorage.setItem('admin_pin', newPin);
        
        Toast.show({
          type: 'success',
          text1: 'PIN Updated',
          text2: 'Admin PIN has been changed successfully (local only)'
        });

        setShowPinModal(false);
        setOldPin("");
        setNewPin("");
        setConfirmPin("");
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not update PIN'
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Clear admin session
      await AsyncStorage.removeItem('admin_session');
      await AsyncStorage.removeItem('admin_session_time');
      
      // Clear auth session
      await AsyncStorage.multiRemove([
        'auth_session_token',
        'auth_last_login',
        'auth_user_role',
        'auth_user_id',
        'auth_user_name',
      ]);
      
      // Navigate immediately to prevent API calls
      router.replace('/auth/login' as any);
      
      // Show toast after navigation
      setTimeout(() => {
        Toast.show({
          type: 'success',
          text1: 'Logged Out',
          text2: 'Admin session ended'
        });
      }, 100);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: 'Could not end session'
      });
    }
  };

  const handleAutoBackupToggle = async (value: boolean) => {
    setEnableBackup(value);
    try {
      await AsyncStorage.setItem('admin_auto_backup', value.toString());
      
      if (value) {
        // Schedule next backup for 7 days from now
        const nextBackupDate = new Date();
        nextBackupDate.setDate(nextBackupDate.getDate() + 7);
        await AsyncStorage.setItem('next_backup_date', nextBackupDate.toISOString());
        
        // Perform initial backup when enabled
        await performBackup();
      } else {
        // Clear scheduled backup
        await AsyncStorage.removeItem('next_backup_date');
      }
      
      Toast.show({
        type: 'success',
        text1: 'Setting Updated',
        text2: `Auto-backup ${value ? 'enabled - backs up every 7 days' : 'disabled'}`
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not save setting'
      });
    }
  };

  const performBackup = async () => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      
      // Fetch all data
      const [productsRes, salesRes, predictionsRes] = await Promise.all([
        axios.get(`${API_URL}/products`),
        axios.get(`${API_URL}/analytics/sales-trends?days=365`),
        axios.get(`${API_URL}/analytics/dashboard`)
      ]);
      
      if (productsRes.data.success) {
        const products = productsRes.data.data;
        const salesData = salesRes.data.success ? salesRes.data.data : null;
        const analyticsData = predictionsRes.data.success ? predictionsRes.data.data : null;
        
        // Create comprehensive backup object
        const backup = {
          timestamp: new Date().toISOString(),
          version: '2.0',
          type: 'full_backup',
          data: {
            products: products,
            productCount: products.length,
            salesHistory: salesData,
            aiInsights: analyticsData,
            inventorySnapshot: {
              totalProducts: products.length,
              totalQuantity: products.reduce((sum: number, p: any) => sum + (p.totalQuantity || 0), 0),
              perishableCount: products.filter((p: any) => p.isPerishable).length,
              categories: [...new Set(products.map((p: any) => p.category))].length
            }
          }
        };
        
        const backupJson = JSON.stringify(backup, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `inventease_backup_${timestamp}.json`;
        
        if (Platform.OS === 'web') {
          // Web: Download backup
          const blob = new Blob([backupJson], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
          
          Toast.show({
            type: 'success',
            text1: 'Backup Complete',
            text2: `${products.length} products backed up`
          });
        } else {
          // Mobile: Save backup to device
          // @ts-ignore - expo-file-system types issue
          const fileUri = FileSystem.documentDirectory + filename;
          // @ts-ignore
          await FileSystem.writeAsStringAsync(fileUri, backupJson);
          
          // Store backup metadata
          const backupDate = new Date().toISOString();
          await AsyncStorage.setItem('last_backup_date', backupDate);
          await AsyncStorage.setItem('last_backup_file', fileUri);
          setLastBackupDate(backupDate);
          
          // Share the backup file
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/json',
              dialogTitle: 'Backup Complete - Save or Share',
              UTI: 'public.json'
            });
          }
          
          Toast.show({
            type: 'success',
            text1: 'Backup Complete',
            text2: `${products.length} products + sales + AI insights backed up`
          });
        }
        
        // Schedule next backup if auto-backup is enabled
        if (enableBackup) {
          const nextBackupDate = new Date();
          nextBackupDate.setDate(nextBackupDate.getDate() + 7);
          await AsyncStorage.setItem('next_backup_date', nextBackupDate.toISOString());
        }
      }
    } catch (error) {
      console.error('Backup error:', error);
      Toast.show({
        type: 'error',
        text1: 'Backup Failed',
        text2: 'Could not create backup'
      });
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get(`${API_URL}/products`);
      
      if (response.data.success) {
        const products = response.data.data;
        
        // Convert to CSV format
        const headers = ['Name', 'Category', 'Barcode', 'Total Quantity', 'Is Perishable', 'Batch Number', 'Batch Quantity', 'Expiry Date', 'Price'];
        const rows: string[][] = [];
        
        products.forEach((product: any) => {
          if (product.batches && product.batches.length > 0) {
            product.batches.forEach((batch: any) => {
              rows.push([
                product.name || '',
                product.category || '',
                product.barcode || '',
                String(product.totalQuantity || 0),
                product.isPerishable ? 'Yes' : 'No',
                batch.batchNumber || '',
                String(batch.quantity || 0),
                batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : '',
                batch.price ? String(batch.price) : ''
              ]);
            });
          } else {
            rows.push([
              product.name || '',
              product.category || '',
              product.barcode || '',
              String(product.totalQuantity || 0),
              product.isPerishable ? 'Yes' : 'No',
              '',
              '',
              '',
              ''
            ]);
          }
        });
        
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Save to device storage
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `inventory_export_${timestamp}.csv`;
        
        if (Platform.OS === 'web') {
          // Web: Download file
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
          
          Toast.show({
            type: 'success',
            text1: 'Export Complete',
            text2: `${products.length} products exported`
          });
        } else {
          // Mobile: Save and share file
          // @ts-ignore - expo-file-system types issue
          const fileUri = FileSystem.documentDirectory + filename;
          // @ts-ignore
          await FileSystem.writeAsStringAsync(fileUri, csvContent);
          
          // Check if sharing is available
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'text/csv',
              dialogTitle: 'Export Inventory Data',
              UTI: 'public.comma-separated-values-text'
            });
            
            Toast.show({
              type: 'success',
              text1: 'Export Complete',
              text2: `${products.length} products exported`
            });
          } else {
            Toast.show({
              type: 'success',
              text1: 'Export Saved',
              text2: `File saved to ${fileUri}`
            });
          }
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'Could not export inventory data'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // AI Settings Handlers
  const handleAiToggle = async (value: boolean) => {
    setAiEnabled(value);
    try {
      await AsyncStorage.setItem('ai_enabled', value.toString());
      Toast.show({
        type: 'success',
        text1: 'AI Features',
        text2: `AI predictions ${value ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not save setting'
      });
    }
  };

  const handleRiskThresholdChange = async (value: number) => {
    setRiskThreshold(value);
    try {
      await AsyncStorage.setItem('ai_risk_threshold', value.toString());
      Toast.show({
        type: 'success',
        text1: 'Risk Threshold Updated',
        text2: `Critical risk set to ${value}+`
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not save setting'
      });
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem('ai_notifications_enabled', value.toString());
      Toast.show({
        type: 'success',
        text1: 'Notifications',
        text2: `AI notifications ${value ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not save setting'
      });
    }
  };

  const handleConfidenceFilterChange = async (value: number) => {
    setConfidenceFilter(value);
    try {
      await AsyncStorage.setItem('ai_confidence_filter', value.toString());
      Toast.show({
        type: 'success',
        text1: 'Confidence Filter Updated',
        text2: `Minimum confidence set to ${value}%`
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not save setting'
      });
    }
  };

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
        text2: 'Global alert thresholds updated'
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Could not update settings'
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
          text1: 'Invalid Thresholds',
          text2: 'Critical must be less than High Urgency'
        });
        return;
      }

      if (categoryThresholds.highUrgency >= categoryThresholds.earlyWarning) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Thresholds',
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
        text1: isCreatingCategory ? 'Create Failed' : 'Update Failed',
        text2: error.response?.data?.error || 'Could not save category'
      });
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;

    try {
      const sessionToken = await AsyncStorage.getItem('auth_session_token');
      const response = await axios.delete(`${API_URL}/auth/staff/${staffToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`
        }
      });
      
      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Staff Deleted',
          text2: `${staffToDelete.name} has been removed`
        });
        await loadStaffMembers();
        setDeleteStaffModal(false);
        setStaffToDelete(null);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: error.response?.data?.error || 'Could not delete staff member'
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
        text1: 'Delete Failed',
        text2: error.response?.data?.error || 'Could not delete category'
      });
    }
  };

  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  const SettingRow = ({ icon, label, description, onPress, children }: any) => {
    const row = (
      <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
        <View style={styles.settingMain}>
          <View style={[styles.iconBox, { backgroundColor: theme.primary + "15" }]}>
            <Ionicons name={icon} size={20} color={theme.primary} />
          </View>
          <View style={styles.textStack}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              {label}
            </Text>
            {description && (
              <Text style={[styles.settingDesc, { color: theme.subtext }]}>
                {description}
              </Text>
            )}
          </View>
        </View>
        {children}
      </View>
    );

    if (onPress) {
      return (
        <Pressable onPress={onPress} android_ripple={{ color: theme.primary + "25" }}>
          {row}
        </Pressable>
      );
    }

    return row;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View>
              <Text style={[styles.headerSub, { color: theme.primary }]}>
                ADMIN_PANEL
              </Text>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                SETTINGS
              </Text>
            </View>
            <HelpTooltip
              style={{marginTop: 20}}
              title="Admin Settings"
              content={[
                "Security PIN: 4-digit code to protect admin features. Set this up first to secure your inventory system. Without a PIN, anyone can access admin functions.",
                "Auto-Logout: Automatically logs you out after 30/45/60 minutes of no activity. Prevents unauthorized access if you forget to log out.",
                "Staff Management: Add staff members who can manage inventory without accessing admin settings. Each staff member gets their own 4-digit PIN for secure login.",
                "Alert Thresholds: Configure when products trigger alerts based on days until expiry. Set global defaults that apply to all products unless overridden by category-specific thresholds.",
                "Category Management: Create and organize product categories. Each category can have custom alert thresholds. Categories with products cannot be deleted but can be renamed (updates all products automatically).",
                "Risk Threshold: The score (0-100) at which products are flagged as critical. Default is 70+. Lower numbers = more products flagged as risky.",
                "Confidence Filter: Minimum confidence level (0-100%) for AI predictions to show. 60% means only show predictions the AI is at least 60% sure about. Higher = fewer but more reliable predictions.",
                "Auto-Backup: System automatically saves all inventory, sales, and AI data every 7 days. You can download this backup file to restore data if needed.",
                "Export CSV: Download current inventory as a spreadsheet file to open in Excel or Google Sheets for analysis or record-keeping."
              ]}
              icon="help-circle"
              iconSize={18}
              iconColor={theme.primary}
            />
          </View>
        </View>

        {/* SECURITY SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              SECURITY
            </Text>
            {!hasPin && (
              <View style={[styles.statusBadge, { backgroundColor: '#FF9500' + '15', borderColor: '#FF9500' }]}>
                <Ionicons name="alert-circle" size={14} color="#FF9500" />
                <Text style={[styles.statusBadgeText, { color: '#FF9500' }]}>
                  NO PIN SET
                </Text>
              </View>
            )}
            {hasPin && (
              <View style={[styles.statusBadge, { backgroundColor: '#34C759' + '15', borderColor: '#34C759' }]}>
                <Ionicons name="shield-checkmark" size={14} color="#34C759" />
                <Text style={[styles.statusBadgeText, { color: '#34C759' }]}>
                  PROTECTED
                </Text>
              </View>
            )}
          </View>

          <SettingRow
            icon="key-outline"
            label={hasPin ? "Update Admin PIN" : "Set Admin PIN"}
            description={hasPin ? "Change your admin access code" : "Create your admin PIN to secure the app"}
            onPress={() => setShowPinModal(true)}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </SettingRow>

          {hasPin && (
            <SettingRow
              icon="lock-closed"
              label="Remove PIN"
              description="Disable PIN protection (not recommended)"
              onPress={() => setShowRemovePinModal(true)}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
            </SettingRow>
          )}

          <SettingRow
            icon="shield-checkmark-outline"
            label="Require PIN for Delete"
            description="Additional security for product deletion"
          >
            <Switch
              value={requirePinForDelete}
              onValueChange={handleRequirePinToggle}
              trackColor={{ true: theme.primary }}
              disabled={!hasPin}
            />
          </SettingRow>

          <SettingRow
            icon="time-outline"
            label="Auto-Logout"
            description={`End session after ${autoLogoutTime} minutes of inactivity`}
          >
            <Switch
              value={autoLogout}
              onValueChange={handleAutoLogoutToggle}
              trackColor={{ true: theme.primary }}
            />
          </SettingRow>

          {autoLogout && (
            <View style={[styles.timeoutSelector, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.timeoutLabel, { color: theme.text }]}>Session Timeout</Text>
              <View style={styles.timeoutButtons}>
                <Pressable
                  style={[
                    styles.timeoutBtn,
                    { backgroundColor: autoLogoutTime === 30 ? theme.primary : theme.surface, borderColor: theme.border }
                  ]}
                  onPress={() => handleAutoLogoutTimeChange(30)}
                >
                  <Text style={[styles.timeoutBtnText, { color: autoLogoutTime === 30 ? '#FFF' : theme.text }]}>
                    30 min
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.timeoutBtn,
                    { backgroundColor: autoLogoutTime === 45 ? theme.primary : theme.surface, borderColor: theme.border }
                  ]}
                  onPress={() => handleAutoLogoutTimeChange(45)}
                >
                  <Text style={[styles.timeoutBtnText, { color: autoLogoutTime === 45 ? '#FFF' : theme.text }]}>
                    45 min
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.timeoutBtn,
                    { backgroundColor: autoLogoutTime === 60 ? theme.primary : theme.surface, borderColor: theme.border }
                  ]}
                  onPress={() => handleAutoLogoutTimeChange(60)}
                >
                  <Text style={[styles.timeoutBtnText, { color: autoLogoutTime === 60 ? '#FFF' : theme.text }]}>
                    60 min
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {!hasPin && (
            <View style={[styles.warningBanner, { backgroundColor: '#FF9500' + '15', borderColor: '#FF9500' }]}>
              <Ionicons name="warning-outline" size={20} color="#FF9500" />
              <Text style={[styles.warningText, { color: '#FF9500' }]}>
                No PIN is set. Admin features are unrestricted. Consider setting a PIN for security.
              </Text>
            </View>
          )}
        </View>

        {/* STAFF MANAGEMENT SECTION */}
        <View style={styles.section}>
          <Pressable 
            onPress={() => setStaffExpanded(!staffExpanded)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.sectionTitle, { color: theme.primary, marginBottom: 0 }]}>
                STAFF MANAGEMENT
              </Text>
              <HelpTooltip
                title="Staff Management"
                content={[
                  "Add staff members who can access the app with limited permissions.",
                  "Staff can view inventory, add products, process sales, and scan barcodes.",
                  "Staff cannot access admin settings, delete products, or manage other staff.",
                  "Each staff member gets their own 4-digit PIN for secure login.",
                  "You can add multiple staff members from this section."
                ]}
                icon="help-circle-outline"
                iconSize={14}
                iconColor={theme.primary}
              />
              <Ionicons 
                name={staffExpanded ? "chevron-down" : "chevron-forward"} 
                size={18} 
                color={theme.primary} 
              />
            </View>
            <Pressable
              style={[styles.addCategoryBtn, { backgroundColor: theme.primary }]}
              onPress={() => router.replace('/auth/staff-register' as any)}
            >
              <Ionicons name="person-add" size={20} color="#FFF" />
              <Text style={styles.addCategoryText}>ADD STAFF</Text>
            </Pressable>
          </Pressable>

          {staffExpanded && (
            <>
              <View style={[styles.infoCard, { marginBottom: 10, backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.infoRow}>
                  <View style={[styles.featureIcon, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="people" size={24} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoTitle, { color: theme.text }]}>
                      Staff Access Control
                    </Text>
                    <Text style={[styles.infoDesc, { color: theme.subtext }]}>
                      Staff members can manage daily operations without accessing sensitive admin features
                    </Text>
                  </View>
                </View>

                <View style={styles.permissionsList}>
                  <Text style={[styles.permissionsLabel, { color: theme.text }]}>
                    Staff Permissions:
                  </Text>
                  <View style={styles.permissionItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={[styles.permissionText, { color: theme.text }]}>
                      View & manage inventory
                    </Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={[styles.permissionText, { color: theme.text }]}>
                      Add & edit products
                    </Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={[styles.permissionText, { color: theme.text }]}>
                      Process sales
                    </Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <Ionicons name="close-circle" size={16} color="#FF3B30" />
                    <Text style={[styles.permissionText, { color: theme.subtext }]}>
                      Access admin settings
                    </Text>
                  </View>
                </View>
              </View>

              {/* Staff List */}
              {staffMembers.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="people-outline" size={48} color={theme.subtext} />
                  <Text style={[styles.emptyStateText, { color: theme.text }]}>
                    No Staff Members Yet
                  </Text>
                  <Text style={[styles.emptyStateDesc, { color: theme.subtext }]}>
                    Add staff members to help manage your inventory
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12, marginTop: 12 }}>
                  {staffMembers.map((staff) => (
                    <View
                      key={staff._id}
                      style={[
                        styles.staffCard,
                        { 
                          backgroundColor: theme.surface,
                          borderColor: staff.isActive ? theme.border : '#FF3B30'
                        }
                      ]}
                    >
                      <View style={[styles.staffAvatar, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name="person" size={24} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.staffName, { color: theme.text }]}>
                          {staff.name}
                        </Text>
                        <Text style={[styles.staffRole, { color: theme.subtext }]}>
                          Staff Member
                        </Text>
                        {staff.lastLogin && (
                          <Text style={[styles.staffLastLogin, { color: theme.subtext }]}>
                            Last login: {new Date(staff.lastLogin).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={[
                          styles.staffStatusBadge, 
                          { backgroundColor: staff.isActive ? '#34C759' + '20' : '#FF3B30' + '20' }
                        ]}>
                          <Text style={[
                            styles.staffStatusText, 
                            { color: staff.isActive ? '#34C759' : '#FF3B30' }
                          ]}>
                            {staff.isActive ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                        <Pressable
                          style={[styles.deleteStaffBtn, { backgroundColor: '#FF3B30' + '15' }]}
                          onPress={() => {
                            setStaffToDelete(staff);
                            setDeleteStaffModal(true);
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* AI SETTINGS SECTION */}
        <View style={styles.section}>
                        
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              AI PREDICTIONS
            </Text>

            <View style={[styles.statusBadge, { backgroundColor: aiEnabled ? '#34C759' + '15' : theme.border, borderColor: aiEnabled ? '#34C759' : theme.border }]}>
              <Ionicons name={aiEnabled ? "checkmark-circle" : "close-circle"} size={14} color={aiEnabled ? '#34C759' : theme.subtext} />
              <Text style={[styles.statusBadgeText, { color: aiEnabled ? '#34C759' : theme.subtext }]}>
                {aiEnabled ? 'ACTIVE' : 'DISABLED'}
              </Text>
            </View>
          </View>

          {/* AI Status Indicator */}
          <AIStatusIndicator onPress={() => router.push("/ai-info" as any)} />

          <SettingRow
            icon="analytics-outline"
            label="Enable AI Features"
            description="Turn on AI-powered predictions and insights"
          >
            <Switch
              value={aiEnabled}
              onValueChange={handleAiToggle}
              trackColor={{ true: theme.primary }}
            />
          </SettingRow>

          {aiEnabled && (
            <>
              <SettingRow
                icon="notifications-outline"
                label="AI Notifications"
                description="Get alerts for critical predictions"
              >
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationsToggle}
                  trackColor={{ true: theme.primary }}
                />
              </SettingRow>

              <View style={[styles.sliderSection, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={styles.sliderHeader}>
                  <Text style={[styles.sliderLabel, { color: theme.text }]}>Risk Threshold</Text>
                  <Text style={[styles.sliderValue, { color: theme.primary }]}>{riskThreshold}</Text>
                </View>
                <Text style={[styles.sliderDesc, { color: theme.subtext }]}>
                  Products with risk score above this value are marked as critical
                </Text>
                <View style={styles.sliderButtons}>
                  <Pressable
                    style={[styles.sliderBtn, { backgroundColor: riskThreshold === 60 ? theme.primary : theme.surface, borderColor: theme.border }]}
                    onPress={() => handleRiskThresholdChange(60)}
                  >
                    <Text style={[styles.sliderBtnText, { color: riskThreshold === 60 ? '#FFF' : theme.text }]}>60</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.sliderBtn, { backgroundColor: riskThreshold === 70 ? theme.primary : theme.surface, borderColor: theme.border }]}
                    onPress={() => handleRiskThresholdChange(70)}
                  >
                    <Text style={[styles.sliderBtnText, { color: riskThreshold === 70 ? '#FFF' : theme.text }]}>70</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.sliderBtn, { backgroundColor: riskThreshold === 80 ? theme.primary : theme.surface, borderColor: theme.border }]}
                    onPress={() => handleRiskThresholdChange(80)}
                  >
                    <Text style={[styles.sliderBtnText, { color: riskThreshold === 80 ? '#FFF' : theme.text }]}>80</Text>
                  </Pressable>
                </View>
              </View>

              <View style={[styles.sliderSection, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={styles.sliderHeader}>
                  <Text style={[styles.sliderLabel, { color: theme.text }]}>Confidence Filter</Text>
                  <Text style={[styles.sliderValue, { color: theme.primary }]}>{confidenceFilter}%</Text>
                </View>
                <Text style={[styles.sliderDesc, { color: theme.subtext }]}>
                  Only show predictions with confidence above this percentage
                </Text>
                <View style={styles.sliderButtons}>
                  <Pressable
                    style={[styles.sliderBtn, { backgroundColor: confidenceFilter === 50 ? theme.primary : theme.surface, borderColor: theme.border }]}
                    onPress={() => handleConfidenceFilterChange(50)}
                  >
                    <Text style={[styles.sliderBtnText, { color: confidenceFilter === 50 ? '#FFF' : theme.text }]}>50%</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.sliderBtn, { backgroundColor: confidenceFilter === 60 ? theme.primary : theme.surface, borderColor: theme.border }]}
                    onPress={() => handleConfidenceFilterChange(60)}
                  >
                    <Text style={[styles.sliderBtnText, { color: confidenceFilter === 60 ? '#FFF' : theme.text }]}>60%</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.sliderBtn, { backgroundColor: confidenceFilter === 70 ? theme.primary : theme.surface, borderColor: theme.border }]}
                    onPress={() => handleConfidenceFilterChange(70)}
                  >
                    <Text style={[styles.sliderBtnText, { color: confidenceFilter === 70 ? '#FFF' : theme.text }]}>70%</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </View>


        {/* ALERT THRESHOLDS SECTION */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 }}>
            <Text style={[styles.sectionTitle, { color: theme.primary, marginBottom: 0 }]}>
              ALERT THRESHOLDS
            </Text>
            <HelpTooltip
              title="Alert Thresholds"
              content={[
                "Configure when you receive alerts based on days until product expiry.",
                "Critical Alert: Immediate action needed (default 7 days). Products at this stage should be discounted or removed.",
                "High Urgency: Prioritize for sale (default 14 days). Start promoting these products.",
                "Early Warning: Plan ahead (default 30 days). Monitor stock levels and adjust orders.",
                "Thresholds must be in ascending order: Critical < High < Early.",
                "These are global defaults. You can set category-specific thresholds below."
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
              Global Expiry Thresholds
            </Text>
            <Text style={[styles.cardDesc, { color: theme.subtext }]}>
              Default thresholds for all products (can be overridden per category)
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
              <Text style={styles.saveBtnText}>SAVE GLOBAL THRESHOLDS</Text>
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
                  "Categories help organize products and can have custom alert thresholds.",
                  "Example: Set shorter thresholds for Dairy (5/10/20 days) vs Canned Goods (14/30/60 days).",
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
                    Create categories to organize your products
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

        {/* HELP & SUPPORT SECTION */}
        <View style={[styles.section, {marginBottom: 20}]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            HELP & SUPPORT
          </Text>
          <SettingRow
            icon="help-circle-outline"
            label="Restart Admin Tour"
            description="See the admin onboarding tour again to learn about all features"
            onPress={async () => {
              try {
                await resetTour();
                Toast.show({
                  type: 'success',
                  text1: 'Tour Reset',
                  text2: 'Go to Admin Dashboard to see the tour again'
                });
                // Navigate to admin dashboard and start tour
                router.push('../admin');
                setTimeout(() => {
                  startTour();
                }, 500);
              } catch (error) {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: 'Could not reset tour'
                });
              }
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </SettingRow>
        </View>

        {/* APPEARANCE SECTION */}
        <View style={[styles.section, {marginBottom: 20}]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            APPEARANCE
          </Text>
          
          <SettingRow
            icon="moon-outline"
            label="Dark Mode"
            description="Switch between light and dark themes"
          >
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ true: theme.primary }}
            />
          </SettingRow>
        </View>

        {/* DATA MANAGEMENT */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            DATA MANAGEMENT
          </Text>

          <SettingRow
            icon="cloud-upload-outline"
            label="Auto Backup"
            description={
              enableBackup 
                ? (lastBackupDate 
                    ? `Last: ${new Date(lastBackupDate).toLocaleDateString()} - Next in 7 days` 
                    : "Backs up every 7 days automatically")
                : "Enable automatic backups every 7 days"
            }
          >
            <Switch
              value={enableBackup}
              onValueChange={handleAutoBackupToggle}
              trackColor={{ true: theme.primary }}
            />
          </SettingRow>

          {!enableBackup && (
            <SettingRow
              icon="save-outline"
              label="Backup Now"
              description="Create manual backup of all data"
              onPress={performBackup}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
            </SettingRow>
          )}

          <SettingRow
            icon="download-outline"
            label="Export Inventory CSV"
            description="Download inventory data as CSV"
            onPress={handleExportData}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
            )}
          </SettingRow>
        </View>

        {/* LOGOUT */}
        <Pressable
          style={[styles.logoutBtn, { borderColor: '#FF4444' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#FF4444" />
          <Text style={styles.logoutText}>Logout from Admin</Text>
        </Pressable>

        <Text style={styles.versionText}>
          Build v2.0.5 - Production Environment
        </Text>

      </ScrollView>

      {/* PIN UPDATE MODAL */}
      <Modal visible={showPinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconBox, { backgroundColor: theme.primary + "15" }]}>
              <Ionicons name="key" size={32} color={theme.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {hasPin ? "Update Admin PIN" : "Set Admin PIN"}
            </Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>
              {hasPin 
                ? "Enter your current PIN and choose a new 4-digit code"
                : "Create a 4-digit PIN to secure admin access"
              }
            </Text>

            {hasPin && (
              <TextInput
                style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Current PIN"
                placeholderTextColor={theme.subtext}
                secureTextEntry
                keyboardType="numeric"
                maxLength={4}
                value={oldPin}
                onChangeText={setOldPin}
              />
            )}

            <TextInput
              style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder={hasPin ? "New PIN" : "Enter PIN"}
              placeholderTextColor={theme.subtext}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={newPin}
              onChangeText={setNewPin}
            />

            <TextInput
              style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Confirm PIN"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={confirmPin}
              onChangeText={setConfirmPin}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => {
                  setShowPinModal(false);
                  setOldPin("");
                  setNewPin("");
                  setConfirmPin("");
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={hasPin ? handlePinUpdate : handleFirstTimeSetup}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>
                  {hasPin ? "Update PIN" : "Create PIN"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* REMOVE PIN MODAL */}
      <Modal visible={showRemovePinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconBox, { backgroundColor: '#FF4444' + "15" }]}>
              <Ionicons name="warning" size={32} color="#FF4444" />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Remove Admin PIN
            </Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>
              Warning: Removing PIN protection will allow unrestricted access to admin features. This is not recommended.
            </Text>

            <TextInput
              style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Enter Current PIN to Confirm"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={removePinConfirm}
              onChangeText={setRemovePinConfirm}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => {
                  setShowRemovePinModal(false);
                  setRemovePinConfirm("");
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: '#FF4444' }]}
                onPress={handleRemovePin}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Remove PIN</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE STAFF MODAL */}
      <Modal visible={deleteStaffModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconBox, { backgroundColor: '#FF3B30' + "15" }]}>
              <Ionicons name="warning" size={32} color="#FF3B30" />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Delete Staff Member
            </Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>
              Are you sure you want to remove {staffToDelete?.name}? This action cannot be undone.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
                onPress={() => {
                  setDeleteStaffModal(false);
                  setStaffToDelete(null);
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: '#FF3B30' }]}
                onPress={handleDeleteStaff}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CATEGORY MODAL */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={() => setCategoryModalVisible(false)} 
          />
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '90%' }]}
          >
            <View style={[styles.modalIconBox, { backgroundColor: theme.primary + "15" }]}>
              <Ionicons name="pricetags" size={32} color={theme.primary} />
            </View>
            
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isCreatingCategory ? "Create Category" : "Edit Category"}
            </Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>
              {isCreatingCategory 
                ? "Add a new product category with optional custom thresholds"
                : selectedCategory?.productCount > 0
                  ? `This category has ${selectedCategory.productCount} product(s). Editing will update all products.`
                  : "Update category name and alert thresholds"
              }
            </Text>

            <ScrollView 
              style={{ width: '100%' }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <TextInput
                style={[
                  styles.pinInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, textAlign: 'left' },
                ]}
                placeholder="Category Name"
                placeholderTextColor={theme.subtext}
                value={categoryName}
                onChangeText={setCategoryName}
                autoFocus={isCreatingCategory}
              />

              <View style={{ width: '100%', marginTop: 10 }}>
                <View style={[styles.thresholdToggle, { borderColor: theme.border }]}>
                  <Text style={[styles.thresholdToggleLabel, { color: theme.text }]}>
                    Custom Alert Thresholds
                  </Text>
                  <Switch
                    value={categoryThresholdsEnabled}
                    onValueChange={setCategoryThresholdsEnabled}
                    trackColor={{ true: theme.primary }}
                  />
                </View>

                {categoryThresholdsEnabled && (
                  <>
                    <Text style={[styles.thresholdSectionDesc, { color: theme.subtext }]}>
                      Override global thresholds for this category
                    </Text>

                    {/* Critical Alert */}
                    <View style={styles.thresholdRow}>
                      <View style={styles.thresholdInfo}>
                        <View style={[styles.thresholdDot, { backgroundColor: "#FF3B30" }]} />
                        <View style={styles.thresholdTextContainer}>
                          <Text style={[styles.thresholdLabel, { color: theme.text }]}>
                            Critical
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
                          value={categoryThresholds.critical.toString()}
                          onChangeText={(val) =>
                            setCategoryThresholds({ ...categoryThresholds, critical: parseInt(val) || 0 })
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
                        </View>
                      </View>
                      <View style={styles.thresholdInput}>
                        <TextInput
                          style={[
                            styles.numberInput,
                            { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                          ]}
                          keyboardType="numeric"
                          value={categoryThresholds.highUrgency.toString()}
                          onChangeText={(val) =>
                            setCategoryThresholds({ ...categoryThresholds, highUrgency: parseInt(val) || 0 })
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
                        </View>
                      </View>
                      <View style={styles.thresholdInput}>
                        <TextInput
                          style={[
                            styles.numberInput,
                            { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                          ]}
                          keyboardType="numeric"
                          value={categoryThresholds.earlyWarning.toString()}
                          onChangeText={(val) =>
                            setCategoryThresholds({ ...categoryThresholds, earlyWarning: parseInt(val) || 0 })
                          }
                        />
                        <Text style={[styles.thresholdUnit, { color: theme.subtext }]}>
                          days
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={[
                  styles.modalBtn,
                  { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
                ]}
                onPress={() => setCategoryModalVisible(false)}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              
              {!isCreatingCategory && selectedCategory?.productCount === 0 && (
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: '#FF3B30' }]}
                  onPress={handleDeleteCategory}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>
                    DELETE
                  </Text>
                </Pressable>
              )}
              
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveCategory}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>
                  {isCreatingCategory ? "CREATE" : "SAVE"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 70, marginBottom: 30 },
  headerSub: { fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  headerTitle: { fontSize: 25, fontWeight: "900", letterSpacing: -1 },
  section: { marginBottom: 50 },
  sectionDivider: {
    height: 2,
    marginVertical: 25,
    opacity: 0.3,
    backgroundColor: '#af22e7ff',
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingMain: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textStack: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: "600" },
  settingDesc: { fontSize: 12, marginTop: 2 },
  configCard: { 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1,
    marginBottom: 15 
  },
  cardTitle: { fontSize: 17, fontWeight: "800", marginBottom: 8 },
  cardDesc: { fontSize: 13, marginBottom: 20, lineHeight: 19 },
  thresholdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150,150,150,0.1)",
  },
  thresholdInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  thresholdDot: { width: 12, height: 12, borderRadius: 6 },
  thresholdTextContainer: { flex: 1 },
  thresholdLabel: { fontSize: 14, fontWeight: "700" },
  thresholdDesc: { fontSize: 11, marginTop: 2 },
  thresholdInput: { flexDirection: "row", alignItems: "center", gap: 8 },
  numberInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  thresholdUnit: { fontSize: 12, fontWeight: "600" },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#FFF", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    marginTop: 20,
    marginBottom: 10,
  },
  logoutText: { color: "#FF4444", fontWeight: "900", fontSize: 14 },
  versionText: {
    textAlign: "center",
    color: "#888",
    fontSize: 10,
    marginBottom: 100,
    letterSpacing: 1,
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
  modalActions: { flexDirection: "row", gap: 12, marginTop: 10, width: "100%" },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  timeoutSelector: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  timeoutLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  timeoutButtons: {
    flexDirection: "row",
    gap: 10,
  },
  timeoutBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  timeoutBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  sliderSection: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  sliderDesc: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  sliderButtons: {
    flexDirection: "row",
    gap: 10,
  },
  sliderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  sliderBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addCategoryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyState: {
    padding: 50,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 16,
  },
  emptyStateDesc: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  categoryCard: {
    flex: 1,
    minWidth: '45%',
    padding: 18,
    borderRadius: 18,
    borderWidth: 2,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryCardName: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  customBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCardThresholds: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  categoryCardCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  thresholdToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  thresholdToggleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  thresholdSectionDesc: {
    fontSize: 12,
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  permissionsLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  permissionsList: {
    gap: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  permissionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
  },
  staffAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  staffRole: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  staffLastLogin: {
    fontSize: 11,
    fontWeight: '500',
  },
  staffStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  staffStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  deleteStaffBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});