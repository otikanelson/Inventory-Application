import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Animated,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { CameraView } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

interface ScannerProps {
  onScan: (data: any) => void;
  onClose: () => void;
  loading: boolean;
  torch: boolean;
  setTorch: (val: boolean) => void;
  tabColor?: string;
  children?: React.ReactNode;
}

export const BarcodeScanner = ({
  onScan,
  onClose,
  loading,
  torch,
  setTorch,
  tabColor = "#00FF00",
  children,
}: ScannerProps) => {
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        enableTorch={torch}
        onBarcodeScanned={loading ? undefined : onScan}
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "upc_a", "code128"] }}
      />

      {/* Dark Overlay with Viewfinder hole */}
      <View style={styles.mainOverlay}>
        {/* Top Section (Where Tabs go) */}
        <View style={styles.topSection}>
          {children && React.Children.toArray(children)[0]}
        </View>

        {/* Middle Section (Viewfinder) */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <Animated.View
              style={[
                styles.scanLine,
                {
                  backgroundColor: tabColor,
                  shadowColor: tabColor,
                  transform: [
                    {
                      translateY: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 250],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            {loading && (
              <View style={styles.loadingInner}>
                <ActivityIndicator size="large" color={tabColor} />
              </View>
            )}
          </View>
        </View>

        {/* Bottom Section (Where Buttons/Hints go) */}
        <View style={styles.bottomSection}>
          {children && React.Children.toArray(children)[1]}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  mainOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "space-between", // Forces top and bottom sections to the edges
  },
  topSection: {
    paddingTop: 60,
    alignItems: "center",
    width: "100%",
  },
  viewfinderContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  viewfinder: {
    width: 280,
    height: 250,
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
  },
  bottomSection: {
    paddingBottom: 60,
    alignItems: "center",
    width: "100%",
  },
  scanLine: {
    height: 3,
    width: "100%",
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#FFF",
    borderWidth: 5,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
});
