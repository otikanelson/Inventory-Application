import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import { Svg, Path } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

const AdminTabBg = ({ color }: { color: string }) => {
  const d = `M0 0 H${width} V70 H0 Z`;
  return (
    <View style={styles.svgContainer}>
      <Svg width={width} height={70} viewBox={`0 0 ${width} 70`}>
        <Path d={d} fill={color} />
      </Svg>
    </View>
  );
};

export default function AdminLayout() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.subtext,
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: { 
            fontSize: 10, 
            fontWeight: "800", 
            marginBottom: Platform.OS === "ios" ? 0 : 10 
          },
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            height: 70,
            bottom: Platform.OS === "ios" ? 20 : 0,
          },
          tabBarBackground: () => <AdminTabBg color={theme.tabSurface} />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "SALES",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "cart" : "cart-outline"} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "STATS",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={24} color={color} />
            ),
          }}
        />
        </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  svgContainer: {
    position: "absolute",
    bottom: 0,
    width: width,
  },
});