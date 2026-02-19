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
    View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function DebugAPIScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

  const testConnection = async () => {
    setTesting(true);
    const testResults: any = {
      envVariable: process.env.EXPO_PUBLIC_API_URL || 'NOT SET',
      finalUrl: API_URL,
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Health check
    try {
      const response = await axios.get(`${API_URL}/health`, { timeout: 10000 });
      testResults.tests.push({
        name: 'Health Check',
        status: 'success',
        data: response.data
      });
    } catch (error: any) {
      testResults.tests.push({
        name: 'Health Check',
        status: 'failed',
        error: error.message,
        details: error.response?.data || 'No response'
      });
    }

    // Test 2: Root endpoint
    try {
      const response = await axios.get(API_URL.replace('/api', ''), { timeout: 10000 });
      testResults.tests.push({
        name: 'Root Endpoint',
        status: 'success',
        data: response.data
      });
    } catch (error: any) {
      testResults.tests.push({
        name: 'Root Endpoint',
        status: 'failed',
        error: error.message
      });
    }

    // Test 3: Categories endpoint
    try {
      const response = await axios.get(`${API_URL}/categories`, { timeout: 10000 });
      testResults.tests.push({
        name: 'Categories Endpoint',
        status: 'success',
        data: response.data
      });
    } catch (error: any) {
      testResults.tests.push({
        name: 'Categories Endpoint',
        status: 'failed',
        error: error.message
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>API Debug</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Configuration</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.subtext }]}>ENV Variable:</Text>
            <Text style={[styles.value, { color: theme.text }]} selectable>
              {process.env.EXPO_PUBLIC_API_URL || 'NOT SET'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.subtext }]}>Final URL:</Text>
            <Text style={[styles.value, { color: theme.text }]} selectable>
              {API_URL}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.testBtn, { backgroundColor: theme.primary }]}
          onPress={testConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#FFF" />
              <Text style={styles.testBtnText}>Run Connection Tests</Text>
            </>
          )}
        </Pressable>

        {results && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Test Results</Text>
            <Text style={[styles.timestamp, { color: theme.subtext }]}>
              {new Date(results.timestamp).toLocaleString()}
            </Text>

            {results.tests.map((test: any, index: number) => (
              <View key={index} style={[styles.testResult, { borderColor: theme.border }]}>
                <View style={styles.testHeader}>
                  <Text style={[styles.testName, { color: theme.text }]}>{test.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: test.status === 'success' ? '#34C759' : '#FF3B30' }
                    ]}
                  >
                    <Text style={styles.statusText}>{test.status.toUpperCase()}</Text>
                  </View>
                </View>
                {test.error && (
                  <Text style={[styles.errorText, { color: '#FF3B30' }]} selectable>
                    {test.error}
                  </Text>
                )}
                {test.data && (
                  <Text style={[styles.dataText, { color: theme.subtext }]} selectable>
                    {JSON.stringify(test.data, null, 2)}
                  </Text>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 15,
  },
  infoRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
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
  timestamp: {
    fontSize: 12,
    marginBottom: 15,
  },
  testResult: {
    borderTopWidth: 1,
    paddingTop: 15,
    marginTop: 15,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  testName: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  dataText: {
    fontSize: 11,
    marginTop: 8,
    fontFamily: 'monospace',
  },
});
