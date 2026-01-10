import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

export default function ScanScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setTimeout(() => {
      router.push({
        pathname: "/(tabs)/add-products",
        params: { barcode: data },
      });
    }, 800);
  };

  if (hasPermission === null)
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Scan Product</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Position the barcode inside the frame
        </Text>
      </View>

      <View style={[styles.cameraWrapper, { borderColor: theme.border }]}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "code128", "qr"],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View style={[styles.scanFrame, { borderColor: theme.primary }]} />
      </View>

      <View style={styles.controls}>
        <Pressable
          style={[
            styles.secondaryButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => router.push("/(tabs)/add-products")}
        >
          <Text style={[styles.secondaryText, { color: theme.text }]}>
            Enter Manually
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontSize: 32, fontWeight: "900" },
  subtitle: { fontSize: 14, marginTop: 4 },
  cameraWrapper: {
    flex: 1,
    margin: 20,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
  },
  scanFrame: {
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    height: 200,
    borderRadius: 20,
    borderWidth: 2,
  },
  controls: { padding: 20, paddingBottom: 110 },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryText: { fontSize: 16, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
