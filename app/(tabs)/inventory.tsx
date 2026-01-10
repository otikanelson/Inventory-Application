import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { products } from "../../data/dummyProducts";

export default function Inventory() {
  const { theme, isDark } = useTheme();
  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
      />
      <FlatList
        data={products}
        ListHeaderComponent={
          <Text style={[styles.title, { color: theme.text }]}>Inventory</Text>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.item,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View>
              <Text style={[styles.name, { color: theme.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.meta, { color: theme.subtext }]}>
                Qty: {item.quantity} •{" "}
                {item.hasBarcode ? "Barcode" : "Internal"}
              </Text>
            </View>
            <View style={[styles.badge, { borderColor: theme.primary }]}>
              <Text style={{ color: theme.primary, fontWeight: "800" }}>
                {item.quantity}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 110 },
  title: { fontSize: 32, fontWeight: "900", marginTop: 40, marginBottom: 20 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: "700" },
  meta: { fontSize: 13, marginTop: 4 },
  badge: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 30,
    justifyContent: "center",
  },
});
