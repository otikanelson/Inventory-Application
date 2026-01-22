import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import { Svg, Path } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

const TabBg = ({ color }: { color: string }) => {
  const d = `
    M0 0 
    H${width / 2 - 50} 
    C${width / 2 - 35} 0 ${width / 2 - 30} 40 ${width / 2} 40 
    S${width / 2 + 35} 0 ${width / 2 + 50} 0 
    H${width} 
    V70 
    H0 
    Z
  `;

  return (
    <View style={styles.svgContainer}>
      <Svg width={width} height={70} viewBox={`0 0 ${width} 70`}>
        <Path d={d} fill={color} />
      </Svg>
    </View>
  );
};

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.subtext,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            height: 70,
            bottom: Platform.OS === "ios" ? 20 : 0,
          },
          tabBarBackground: () => <TabBg color={theme.tabSurface} />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <Ionicons name="grid-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            title: "Inventory",
            tabBarIcon: ({ color }) => (
              <Ionicons name="cube-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            tabBarStyle: { display: "none" },
            title: "",
            tabBarIcon: ({ focused }) => (
              <View style={styles.scanIconWrapper}>
                <Ionicons
                  name="scan-circle-outline"
                  size={32}
                  color={focused ? theme.primary : theme.text}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="add-products"
          options={{
            title: "Add",
            tabBarIcon: ({ color }) => (
              <Ionicons name="add-circle-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="FEFO"
          options={{
            title: "FEFO",
            tabBarIcon: ({ color }) => (
              <Ionicons name="hourglass" size={24} color={color} />
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
  scanIconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: 60,
    marginTop: Platform.OS === "ios" ? 10 : 5,
  },
});