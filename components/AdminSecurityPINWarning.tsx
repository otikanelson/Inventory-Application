import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface AdminSecurityPINWarningProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToSettings: () => void;
}

export default function AdminSecurityPINWarning({
  visible,
  onClose,
  onNavigateToSettings,
}: AdminSecurityPINWarningProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={[styles.modalIconBox, { backgroundColor: '#FF9500' + '15' }]}>
            <Ionicons name="warning" size={32} color="#FF9500" />
          </View>

          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Admin Security PIN Required
          </Text>
          <Text style={[styles.modalDesc, { color: theme.subtext }]}>
            You need to set up your Admin Security PIN before registering new products. This PIN authorizes sensitive operations in the system.
          </Text>

          <View style={styles.modalActions}>
            <Pressable
              style={[
                styles.modalBtn,
                { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }
              ]}
              onPress={onClose}
            >
              <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              onPress={onNavigateToSettings}
            >
              <Text style={{ color: '#FFF', fontWeight: '700' }}>Go to Settings</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: 30,
    borderRadius: 30,
    alignItems: 'center',
  },
  modalIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
