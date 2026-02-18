import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TestAPIScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'NOT SET';

  const addResult = (test: string, status: 'success' | 'error' | 'info', message: string, details?: any) => {
    setResults(prev => [...prev, { test, status, message, details, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Check environment variable
    addResult('Environment Variable', 'info', `EXPO_PUBLIC_API_URL = ${API_URL}`);

    // Test 2: Test root endpoint
    try {
      const response = await axios.get(`${API_URL}`, { timeout: 5000 });
      addResult('Root Endpoint', 'success', `GET ${API_URL}`, response.data);
    } catch (error: any) {
      addResult('Root Endpoint', 'error', error.message, {
        code: error.code,
        response: error.response?.data,
      });
    }

    // Test 3: Test /api endpoint
    try {
      const response = await axios.get(`${API_URL}/api`, { timeout: 5000 });
      addResult('/api Endpoint', 'success', `GET ${API_URL}/api`, response.data);
    } catch (error: any) {
      addResult('/api Endpoint', 'error', error.message, {
        code: error.code,
        response: error.response?.data,
      });
    }

    // Test 4: Test /api/health endpoint
    try {
      const response = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
      addResult('/api/health Endpoint', 'success', `GET ${API_URL}/api/health`, response.data);
    } catch (error: any) {
      addResult('/api/health Endpoint', 'error', error.message, {
        code: error.code,
        response: error.response?.data,
      });
    }

    // Test 5: Test auth endpoint with dummy data
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        pin: '0000',
        role: 'admin'
      }, { timeout: 5000 });
      addResult('Auth Endpoint', 'success', `POST ${API_URL}/api/auth/login`, response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        addResult('Auth Endpoint', 'success', 'Endpoint reachable (401 expected)', error.response.data);
      } else {
        addResult('Auth Endpoint', 'error', error.message, {
          code: error.code,
          status: error.response?.status,
          response: error.response?.data,
        });
      }
    }

    setTesting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#00FF00';
      case 'error': return '#FF3B30';
      case 'info': return theme.primary;
      default: return theme.subtext;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'info': return 'information-circle';
      default: return 'help-circle';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>API Diagnostics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="information-circle" size={32} color={theme.primary} />
          <Text style={[styles.infoTitle, { color: theme.text }]}>Network Diagnostics</Text>
          <Text style={[styles.infoText, { color: theme.subtext }]}>
            This tool tests connectivity to your backend API and displays detailed results.
          </Text>
        </View>

        {/* Test Button */}
        <Pressable
          style={[styles.testBtn, { backgroundColor: theme.primary }]}
          onPress={runTests}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="play-circle" size={24} color="#FFF" />
              <Text style={styles.testBtnText}>Run Tests</Text>
            </>
          )}
        </Pressable>

        {/* Results */}
        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.resultsTitle, { color: theme.text }]}>Test Results</Text>
            {results.map((result, index) => (
              <View
                key={index}
                style={[
                  styles.resultCard,
                  { backgroundColor: theme.surface, borderColor: theme.border }
                ]}
              >
                <View style={styles.resultHeader}>
                  <Ionicons
                    name={getStatusIcon(result.status) as any}
                    size={24}
                    color={getStatusColor(result.status)}
                  />
                  <Text style={[styles.resultTest, { color: theme.text }]}>{result.test}</Text>
                </View>
                <Text style={[styles.resultMessage, { color: theme.subtext }]}>
                  {result.message}
                </Text>
                {result.details && (
                  <View style={[styles.resultDetails, { backgroundColor: theme.background }]}>
                    <Text style={[styles.resultDetailsText, { color: theme.subtext }]}>
                      {JSON.stringify(result.details, null, 2)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  testBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  resultsContainer: {
    marginTop: 10,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  resultTest: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  resultMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  resultDetails: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resultDetailsText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
