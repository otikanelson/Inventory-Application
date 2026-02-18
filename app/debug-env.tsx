import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DebugEnvScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Environment Debug</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>EXPO_PUBLIC_API_URL:</Text>
          <Text style={styles.value}>{API_URL || 'NOT SET'}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>Full URL with /api/auth/login:</Text>
          <Text style={styles.value}>{API_URL}/api/auth/login</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>All process.env keys:</Text>
          <Text style={styles.value}>{JSON.stringify(Object.keys(process.env), null, 2)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#0f0',
    fontFamily: 'monospace',
  },
});
