import axios from 'axios';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TestNetwork() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLocal = async () => {
    setLoading(true);
    try {
      console.log('Testing local backend...');
      const response = await axios.get('http://192.168.92.95:8000/api', { timeout: 5000 });
      setResult(`✅ Local Success: ${JSON.stringify(response.data)}`);
      console.log('Local test success:', response.data);
    } catch (error: any) {
      setResult(`❌ Local Error: ${error.code} - ${error.message}`);
      console.error('Local test error:', error);
    }
    setLoading(false);
  };

  const testRender = async () => {
    setLoading(true);
    try {
      console.log('Testing Render backend...');
      const response = await axios.get('https://inventory-application-xjc5.onrender.com/api', { timeout: 10000 });
      setResult(`✅ Render Success: ${JSON.stringify(response.data)}`);
      console.log('Render test success:', response.data);
    } catch (error: any) {
      setResult(`❌ Render Error: ${error.code} - ${error.message}`);
      console.error('Render test error:', error);
    }
    setLoading(false);
  };

  const testGoogle = async () => {
    setLoading(true);
    try {
      console.log('Testing Google (internet connectivity)...');
      const response = await axios.get('https://www.google.com', { timeout: 5000 });
      setResult(`✅ Google Success - Internet works!`);
      console.log('Google test success');
    } catch (error: any) {
      setResult(`❌ Google Error: ${error.code} - ${error.message}`);
      console.error('Google test error:', error);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={testLocal} disabled={loading}>
        <Text style={styles.buttonText}>Test Local Backend</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testRender} disabled={loading}>
        <Text style={styles.buttonText}>Test Render Backend</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testGoogle} disabled={loading}>
        <Text style={styles.buttonText}>Test Internet (Google)</Text>
      </TouchableOpacity>

      {loading && <Text style={styles.loading}>Testing...</Text>}
      {result && <Text style={styles.result}>{result}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  loading: {
    color: '#FFA500',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  result: {
    color: '#fff',
    fontSize: 14,
    marginTop: 20,
    padding: 15,
    backgroundColor: '#222',
    borderRadius: 8,
  },
});
