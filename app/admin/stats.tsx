import React from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export default function AdminFefo() {
  const { theme, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground 
        source={isDark ? require("../../assets/images/Background7.png") : require("../../assets/images/Background9.png")} 
        style={StyleSheet.absoluteFill} 
      />
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>FEFO Monitor</Text>
        <View style={styles.centered}>
           <Ionicons name="analytics-outline" size={60} color={theme.primary + "40"} />
           <Text style={{ color: theme.subtext, marginTop: 20, fontWeight: '600' }}>Detailed Expiry Analytics</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 25 },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 30 },
  centered: { flex: 0.8, justifyContent: 'center', alignItems: 'center' }
});