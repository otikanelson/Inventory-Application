import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
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

  // Reset scanner state when screen comes into focus
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

    // Find product in inventory
    const foundProduct = products.find((p) => p.barcode === data);

    if (foundProduct) {
      if (foundProduct.totalQuantity === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: "Out of Stock",
          text2: `${foundProduct.name} has no available units`,
          position: "bottom",
        });
        
        setTimeout(() => {
          setScanned(false);
          setLoading(false);
        }, 2000);
        return;
      }

      scanBeep.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate back to sales page with product data
      router.push({
        pathname: "./sales",
        params: {
          scannedProduct: JSON.stringify({
            _id: foundProduct._id,
            name: foundProduct.name,
            barcode: foundProduct.barcode,
            quantityInStock: foundProduct.totalQuantity,
            imageUrl: foundProduct.imageUrl,
          })
        }
      });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Product Not Found",
        text2: "This product is not in your inventory",
        position: "bottom",
      });
      
      setTimeout(() => {
        setScanned(false);
        setLoading(false);
      }, 2000);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.permissionText, { color: theme.text }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color={theme.subtext} />
          <Text style={[styles.permissionTitle, { color: theme.text }]}>
            Camera Access Required
          </Text>
          <Text style={[styles.permissionText, { color: theme.subtext }]}>
            Allow camera access to scan product barcodes for sales
          </Text>
          <Pressable
            onPress={requestPermission}
            style={[styles.permissionBtn, { backgroundColor: theme.primary }]}
          >
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
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: [
            "ean13",
            "ean8",
            "upc_a",
            "upc_e",
            "code128",
            "code39",
            "qr",
          ],
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: "rgba(0,0,0,0.6)" }]}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </Pressable>

        <Pressable
          onPress={() => setTorch(!torch)}
          style={[
            styles.headerBtn,
            {
              backgroundColor: torch ? theme.primary : "rgba(0,0,0,0.6)",
            },
          ]}
        >
          <Ionicons
            name={torch ? "flash" : "flash-outline"}
            size={24}
            color="#FFF"
          />
        </Pressable>
      </View>

      {/* Scanning Frame - Technical Style */}
      <View style={styles.scanningArea}>
        <View style={styles.frameContainer}>
          {/* Corner Brackets */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Animated Scan Line */}
          {!scanned && (
            <Animated.View
              style={[
                styles.scanLine,
                {
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
          )}
        </View>

        {/* Technical Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionCard}>
            <Text style={styles.systemLabel}>
              {scanned ? "PROCESSING..." : "SCANNER_ACTIVE"}
            </Text>
            <Text style={styles.instructionText}>
              {scanned
                ? "VERIFYING_INVENTORY_STATUS"
                : "ALIGN_BARCODE_WITHIN_FRAME"}
            </Text>
          </View>
        </View>

        {/* Status Indicator */}
        {scanned && (
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: loading ? theme.primary : "#34C759" },
              ]}
            >
              <Ionicons
                name={loading ? "hourglass-outline" : "checkmark-circle"}
                size={20}
                color="#FFF"
              />
              <Text style={styles.statusText}>
                {loading ? "VERIFYING" : "SCANNED"}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Footer Info - Technical Style */}
      <View style={styles.footer}>
        <View style={styles.footerCard}>
          <Ionicons name="cart-outline" size={20} color={theme.primary} />
          <Text style={[styles.footerText, { color: theme.text }]}>
            SCAN_TO_ADD_TO_SALES_LEDGER
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  scanningArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  frameContainer: {
    width: 280,
    height: 280,
    position: "relative",
  },

  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#00FF00",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },

  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#00FF00",
    shadowColor: "#00FF00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },

  instructionsContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  instructionCard: {
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(0,255,0,0.3)",
    alignItems: "center",
  },
  systemLabel: {
    color: "#00FF00",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  instructionText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: "monospace",
  },

  statusContainer: {
    position: "absolute",
    bottom: 100,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 2,
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    fontFamily: "monospace",
  },

  footer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
  },
  footerCard: {
    backgroundColor: "rgba(0,0,0,0.8)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(150,150,150,0.3)",
  },
  footerText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    fontFamily: "monospace",
    flex: 1,
  },

  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
  },
  permissionBtn: {
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});