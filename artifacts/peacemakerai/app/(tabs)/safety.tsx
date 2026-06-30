import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { SAFETY_RESOURCES } from "@/constants/resources";
import * as Haptics from "expo-haptics";

export default function SafetyTabScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const call = (number: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const digits = number.replace(/\D/g, "");
    Linking.openURL(`tel:${digits}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 + 34 : 84 + 16),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: colors.foreground }]}>Safety Resources</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Free, confidential support available 24/7
        </Text>

        <View style={[styles.banner, { backgroundColor: "#3B0000", borderColor: colors.destructive }]}>
          <Feather name="alert-triangle" size={18} color={colors.destructive} />
          <Text style={[styles.bannerText, { color: "#FCA5A5" }]}>
            If you or someone is in immediate danger, call 911 now.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          HELPLINES
        </Text>

        {SAFETY_RESOURCES.map((r) => (
          <View
            key={r.name}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.resourceName, { color: colors.foreground }]}>{r.name}</Text>
              <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                  {r.available}
                </Text>
              </View>
            </View>
            <Text style={[styles.resourceDesc, { color: colors.mutedForeground }]}>
              {r.description}
            </Text>
            <TouchableOpacity
              onPress={() => call(r.number)}
              style={[styles.callBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Feather name="phone" size={14} color={colors.primaryForeground} />
              <Text style={[styles.callBtnText, { color: colors.primaryForeground }]}>
                {r.number}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          PeacemakerAI is not a crisis service. These resources are operated by trained professionals.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 14 },
  heading: { fontSize: 26, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
  },
  bannerText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 21 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  resourceName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1, lineHeight: 21 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  resourceDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  callBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  note: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
});
