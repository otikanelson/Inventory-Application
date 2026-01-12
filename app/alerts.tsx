import { View, Text, StyleSheet, ScrollView, ImageBackground, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useProducts } from '../hooks/useProducts';

const getDaysLeft = (date: string) => {
  if (!date || date === 'N/A') return 999;
  const diff = new Date(date).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function Alerts() {
  const { theme, isDark } = useTheme();
  const { products, loading, refresh } = useProducts();

  const backgroundImage = isDark 
    ? require('../assets/images/Background7.png') 
    : require('../assets/images/Background9.png');

  const alerts = products
    .map((p) => ({
      ...p,
      daysLeft: getDaysLeft(p.expiryDate),
    }))
    .filter((p) => p.daysLeft <= 14 && p.daysLeft !== 999)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Expiry Alerts</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>Items requiring attention</Text>
        </View>

        {alerts.length === 0 && !loading && (
          <Text style={{ color: theme.subtext, textAlign: 'center', marginTop: 40 }}>All items are fresh! No alerts.</Text>
        )}

        {alerts.map((item) => {
          const isCritical = item.daysLeft <= 3;
          const isHigh = item.daysLeft <= 7;
          const level = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'WARNING';
          const statusColor = isCritical ? '#ff3b3b' : isHigh ? '#ffb020' : theme.primary;

          return (
            <View 
              key={item.id} 
              style={[styles.alertCard, { backgroundColor: theme.surface, borderColor: isCritical ? statusColor : theme.border, borderWidth: isCritical ? 1.5 : 1 }]}
            >
              <View style={[styles.iconBox, { backgroundColor: `${statusColor}20` }]}>
                <Ionicons name={isCritical ? "alert-circle" : "warning"} size={24} color={statusColor} />
              </View>

              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.meta, { color: theme.subtext }]}>{item.quantity} units • Exp: {new Date(item.expiryDate).toLocaleDateString()}</Text>
              </View>

              <View style={styles.statusSide}>
                <Text style={[styles.daysText, { color: statusColor }]}>{item.daysLeft}d</Text>
                <View style={[styles.pill, { backgroundColor: `${statusColor}20` }]}>
                   <Text style={[styles.pillText, { color: statusColor }]}>{level}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 120, // Space for the floating tab bar
  },
  header: {
    marginBottom: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    opacity: 0.8,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    // Soft shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  statusSide: {
    alignItems: 'flex-end',
  },
  daysText: {
    fontSize: 18,
    fontWeight: '900',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  pillText: {
    fontSize: 9,
    fontWeight: '800',
  },
});