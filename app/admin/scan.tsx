import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  Animated,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from "expo-audio";
import { useProducts } from "../../hooks/useProducts";
import Toast from "react-native-toast-message";

const { height } = Dimensions.get("window");

export default function AdminScanScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { products } = useProducts();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torch, setTorch] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);

  const scanBeep = useAudioPlayer(require("../../assets/sounds/beep.mp3"));
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
      ])
    ).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setScanned(false);
      setLoading(false);
      setTorch(false);
      setCameraKey((prev) => prev + 1);

      return () => {
        setTorch(false);
      };
    }, [])
  );

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    const foundProduct = products.find((p) => p.barcode === data);

    if (foundProduct) {
      scanBeep.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanned(false);
      setLoading(false);
      router.push(`/(admin)/product/${foundProduct._id}`);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "info",
        text1: "Not Found",
        text2: "Product not in inventory",
      });
      setScanned(false);
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#666" />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <Pressable style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        key={cameraKey}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={loading ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "upc_a", "code128", "qr"],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconCircle}>
            <Ionicons name="close" size={28} color="#FFF" />
          </Pressable>

          <Text style={styles.headerLabel}>ADMIN SCAN</Text>

          <Pressable
            onPress={() => setTorch(!torch)}
            style={styles.iconCircle}
          >
            <Ionicons
              name={torch ? "flash" : "flash-off"}
              size={24}
              color={torch ? "#FFD700" : "#FFF"}
            />
          </Pressable>
        </View>

        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <Animated.View
              style={[
                styles.scanLine,
                {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
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
              <View style={styles.loadingOverlay}>
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomBar}>
          <Text style={styles.hintText}>Scan product barcode</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
    paddingTop: 60,
    marginBottom: 20,
  },
  headerLabel: {
    color: "#FFF",
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 12,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinder: {
    width: 280,
    height: 250,
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
  },
  scanLine: {
    height: 3,
    width: "100%",
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomBar: {
    paddingBottom: 60,
    alignItems: "center",
    width: "100%",
  },
  hintText: {
    color: "#FFF",
    marginBottom: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    color: "#FFF",
    fontSize: 16,
    marginVertical: 20,
    textAlign: "center",
  },
  permissionBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 10,
  },
  permissionBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});