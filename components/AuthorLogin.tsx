import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

interface AuthorLoginProps {
  visible: boolean;
  onClose: () => void;
}

export function AuthorLogin({ visible, onClose }: AuthorLoginProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!secretKey.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Secret Key Required',
        text2: 'Please enter the author secret key',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/author/login`, {
        secretKey: secretKey.trim(),
      });

      if (response.data.success) {
        const { user, sessionToken } = response.data.data;

        // Store author session
        await AsyncStorage.multiSet([
          ['auth_session_token', sessionToken],
          ['auth_user_role', 'author'],
          ['auth_user_id', 'author'],
          ['auth_user_name', 'Author'],
          ['auth_last_login', Date.now().toString()],
          ['auth_is_author', 'true'],
        ]);

        Toast.show({
          type: 'success',
          text1: 'Author Access Granted',
          text2: 'Welcome to the Author Dashboard',
        });

        setSecretKey('');
        
        // Close modal immediately to prevent state updates after navigation
        onClose();
        
        // Navigate after closing modal
        setTimeout(() => {
          router.replace('/author/dashboard' as any);
        }, 50);
      }
    } catch (error: any) {
      console.error('Author login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Access Denied',
        text2: error.response?.data?.error || 'Invalid secret key',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSecretKey('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="shield-checkmark" size={40} color={theme.primary} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>Author Access</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            Enter the secret key to access the author dashboard
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder="Secret Key"
              placeholderTextColor={theme.subtext}
              secureTextEntry={!showPassword}
              value={secretKey}
              onChangeText={setSecretKey}
              autoFocus
              editable={!isLoading}
            />
            <Pressable
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={theme.subtext}
              />
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[
                styles.button,
                styles.cancelButton,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.loginButton, { backgroundColor: theme.primary }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFF' }]}>Login</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    padding: 30,
    borderRadius: 30,
    alignItems: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 55,
    borderWidth: 2,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingRight: 50,
    fontSize: 16,
    fontWeight: '600',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 16,
    padding: 5,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 2,
  },
  loginButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
