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
import { useTheme } from '../context/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function TestConnectionScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setTesting(true);
    setResults([]);

    try {
      addResult(`Testing connection to: ${API_URL}`);
      addResult('---');

      // Test 1: Basic connectivity
      addResult('Test 1: Basic API connectivity...');
      try {
        const response = await axios.get(`${API_URL}`, { timeout: 5000 });
        addResult(`✅ SUCCESS: ${response.status} ${response.statusText}`);
        addResult(`Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      } catch (error: any) {
        addResult(`❌ FAILED: ${error.message}`);
        if (error.code) addResult(`Error code: ${error.code}`);
        if (error.response) {
          addResult(`Status: ${error.response.status}`);
        }
      }

      addResult('---');

      // Test 2: Auth endpoint
      addResult('Test 2: Auth setup status endpoint...');
      try {
        const response = await axios.get(`${API_URL}/auth/setup/status`, { timeout: 5000 });
        addResult(`✅ SUCCESS: ${response.status}`);
        addResult(`Response: ${JSON.stringify(response.data)}`);
      } catch (error: any) {
        addResult(`❌ FAILED: ${error.message}`);
      }

      addResult('---');

      // Test 3: Create test user
      addResult('Test 3: Create test staff user...');
      try {
        const testData = {
          name: `Test User ${Date.now()}`,
          pin: '9999',
          createdBy: null
        };
        addResult(`Sending: ${JSON.stringify(testData)}`);
        
        const response = await axios.post(`${API_URL}/auth/staff`, testData, { timeout: 10000 });
        addResult(`✅ SUCCESS: ${response.status}`);
        addResult(`Response: ${JSON.stringify(response.data)}`);
      } catch (error: any) {
        addResult(`❌ FAILED: ${error.message}`);
        if (error.response) {
          addResult(`Status: ${error.response.status}`);
          addResult(`Error: ${JSON.stringify(error.response.data)}`);
        }
      }

      addResult('---');
      addResult('Testing complete!');
    } catch (error: any) {
      addResult(`Unexpected error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Connection Test
        </Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="information-circle" size={24} color={theme.primary} />
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>
              API Connection Diagnostic
            </Text>
            <Text style={[styles.infoDesc, { color: theme.subtext }]}>
              This will test if your app can reach the backend server
            </Text>
          </View>
        </View>

        <View style={[styles.urlCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.urlLabel, { color: theme.subtext }]}>API URL:</Text>
          <Text style={[styles.urlValue, { color: theme.text }]}>{API_URL}</Text>
        </View>

        <Pressable
          style={[
            styles.testButton,
            { backgroundColor: theme.primary },
            testing && styles.testButtonDisabled
          ]}
          onPress={testConnection}
          disabled={testing}
        >
          {testing ? (
            <>
              <ActivityIndicator color="#FFF" />
              <Text style={styles.testButtonText}>Testing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="play-circle" size={20} color="#FFF" />
              <Text style={styles.testButtonText}>Run Connection Test</Text>
            </>
          )}
        </Pressable>

        {results.length > 0 && (
          <View style={[styles.resultsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.resultsTitle, { color: theme.text }]}>Test Results:</Text>
            {results.map((result, index) => (
              <Text
                key={index}
                style={[
                  styles.resultText,
                  {
                    color: result.includes('✅')
                      ? '#34C759'
                      : result.includes('❌')
                      ? '#FF3B30'
                      : theme.subtext,
                  },
                ]}
              >
                {result}
              </Text>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  infoText: {
    flex: 1,
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
  urlCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  urlLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  urlValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  resultsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
