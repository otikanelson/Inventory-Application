// Debug component to help diagnose authentication issues
// This component shows authentication status and helps troubleshoot token issues

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface AuthDebugInfo {
  hasToken: boolean;
  token: string | null;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  storeId: string | null;
  storeName: string | null;
  lastLogin: string | null;
  sessionAge: number;
}

export const AuthDebugger: React.FC = () => {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);

  const loadDebugInfo = async () => {
    try {
      const [token, userId, userName, userRole, storeId, storeName, lastLogin] = await AsyncStorage.multiGet([
        'auth_session_token',
        'auth_user_id',
        'auth_user_name',
        'auth_user_role',
        'auth_store_id',
        'auth_store_name',
        'auth_last_login',
      ]);

      const lastLoginTime = lastLogin[1] ? parseInt(lastLogin[1]) : 0;
      const sessionAge = Date.now() - lastLoginTime;

      setDebugInfo({
        hasToken: !!token[1],
        token: token[1] ? `${token[1].substring(0, 20)}...` : null,
        userId: userId[1],
        userName: userName[1],
        userRole: userRole[1],
        storeId: storeId[1],
        storeName: storeName[1],
        lastLogin: lastLogin[1] ? new Date(lastLoginTime).toLocaleString() : null,
        sessionAge: Math.floor(sessionAge / 1000 / 60), // minutes
      });
    } catch (error) {
      console.error('Error loading debug info:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      loadDebugInfo();
    }
  }, [visible]);

  const InfoRow = ({ label, value, status }: { label: string; value: string | null; status?: 'good' | 'warning' | 'error' }) => {
    const getStatusColor = () => {
      if (status === 'good') return '#34C759';
      if (status === 'warning') return '#FF9500';
      if (status === 'error') return '#FF3B30';
      return theme.subtext;
    };

    return (
      <View style={styles.infoRow}>
        <Text style={[styles.label, { color: theme.subtext }]}>{label}:</Text>
        <Text style={[styles.value, { color: getStatusColor() }]}>
          {value || 'Not set'}
        </Text>
      </View>
    );
  };

  return (
    <>
      {/* Debug Button - Only show in development */}
      {__DEV__ && (
        <Pressable
          onPress={() => setVisible(true)}
          style={[styles.debugButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="bug" size={20} color="#FFF" />
        </Pressable>
      )}

      {/* Debug Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>
                Authentication Debug
              </Text>
              <Pressable onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView style={styles.content}>
              {/* Auth Context Status */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Auth Context
                </Text>
                <InfoRow
                  label="Authenticated"
                  value={isAuthenticated ? 'Yes' : 'No'}
                  status={isAuthenticated ? 'good' : 'error'}
                />
                <InfoRow
                  label="User ID"
                  value={user?.id || null}
                  status={user?.id ? 'good' : 'error'}
                />
                <InfoRow
                  label="User Name"
                  value={user?.name || null}
                />
                <InfoRow
                  label="Role"
                  value={user?.role || null}
                  status={user?.role ? 'good' : 'error'}
                />
                <InfoRow
                  label="Store ID"
                  value={user?.storeId || null}
                  status={user?.storeId ? 'good' : 'warning'}
                />
                <InfoRow
                  label="Store Name"
                  value={user?.storeName || null}
                />
              </View>

              {/* AsyncStorage Status */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  AsyncStorage
                </Text>
                <InfoRow
                  label="Has Token"
                  value={debugInfo?.hasToken ? 'Yes' : 'No'}
                  status={debugInfo?.hasToken ? 'good' : 'error'}
                />
                <InfoRow
                  label="Token Preview"
                  value={debugInfo?.token || null}
                />
                <InfoRow
                  label="User ID"
                  value={debugInfo?.userId || null}
                />
                <InfoRow
                  label="User Name"
                  value={debugInfo?.userName || null}
                />
                <InfoRow
                  label="Role"
                  value={debugInfo?.userRole || null}
                />
                <InfoRow
                  label="Store ID"
                  value={debugInfo?.storeId || null}
                />
                <InfoRow
                  label="Store Name"
                  value={debugInfo?.storeName || null}
                />
                <InfoRow
                  label="Last Login"
                  value={debugInfo?.lastLogin || null}
                />
                <InfoRow
                  label="Session Age"
                  value={debugInfo?.sessionAge ? `${debugInfo.sessionAge} minutes` : null}
                  status={
                    debugInfo?.sessionAge && debugInfo.sessionAge < 30
                      ? 'good'
                      : debugInfo?.sessionAge && debugInfo.sessionAge < 60
                      ? 'warning'
                      : 'error'
                  }
                />
              </View>

              {/* Diagnosis */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Diagnosis
                </Text>
                {!debugInfo?.hasToken && (
                  <View style={[styles.alert, { backgroundColor: '#FF3B3020', borderColor: '#FF3B30' }]}>
                    <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                    <Text style={[styles.alertText, { color: '#FF3B30' }]}>
                      No authentication token found. Please log in again.
                    </Text>
                  </View>
                )}
                {debugInfo?.hasToken && !isAuthenticated && (
                  <View style={[styles.alert, { backgroundColor: '#FF950020', borderColor: '#FF9500' }]}>
                    <Ionicons name="warning" size={20} color="#FF9500" />
                    <Text style={[styles.alertText, { color: '#FF9500' }]}>
                      Token exists but user is not authenticated. Session may have expired.
                    </Text>
                  </View>
                )}
                {debugInfo?.hasToken && isAuthenticated && !user?.storeId && (
                  <View style={[styles.alert, { backgroundColor: '#FF950020', borderColor: '#FF9500' }]}>
                    <Ionicons name="warning" size={20} color="#FF9500" />
                    <Text style={[styles.alertText, { color: '#FF9500' }]}>
                      User is authenticated but no store ID found. Multi-tenancy may not work correctly.
                    </Text>
                  </View>
                )}
                {debugInfo?.hasToken && isAuthenticated && user?.storeId && (
                  <View style={[styles.alert, { backgroundColor: '#34C75920', borderColor: '#34C759' }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    <Text style={[styles.alertText, { color: '#34C759' }]}>
                      Authentication is working correctly!
                    </Text>
                  </View>
                )}
              </View>

              {/* Refresh Button */}
              <Pressable
                onPress={loadDebugInfo}
                style={[styles.refreshButton, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.refreshText}>Refresh</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  debugButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.05)',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  refreshText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
