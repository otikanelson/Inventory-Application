import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { products } from "../../data/dummyProducts";

export default function FEFO() {
  const { theme, isDark } = useTheme();
  const backgroundImage = isDark
    ? require("../../assets/images/Background7.png")
    : require("../../assets/images/Background9.png");
  const sorted = [...products].sort(
    (a, b) =>
      new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ImageBackground
        source={backgroundImage}
        style={StyleSheet.absoluteFill}
      />
      <FlatList
        data={sorted}
        ListHeaderComponent={
          <View style={{ marginTop: 40, marginBottom: 20 }}>
            <Text style={[styles.title, { color: theme.text }]}>
              FEFO Priority
            </Text>
            <Text style={{ color: theme.subtext }}>
              Sell these products first
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.row,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.rank, { color: theme.notification }]}>
              #{index + 1}
            </Text>
            <View>
              <Text style={[styles.name, { color: theme.text }]}>
                {item.name}
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 12 }}>
                Exp: {item.expiryDate}
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
  title: { fontSize: 32, fontWeight: "900" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
  },
  rank: { fontSize: 20, fontWeight: "900", marginRight: 15 },
  name: { fontSize: 16, fontWeight: "700" },
});
