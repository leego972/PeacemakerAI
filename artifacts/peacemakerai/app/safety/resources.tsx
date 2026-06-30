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
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { SAFETY_RESOURCES } from "@/constants/resources";
import * as Haptics from "expo-haptics";

export default function SafetyResourcesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const call = (number: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const digits = number.replace(/\D/g, "");
    Linking.openURL(`tel:${digits}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Safety Resources</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.banner, { backgroundColor: "#3B0000", borderColor: colors.destructive }]}>
          <Feather name="alert-triangle" size={20} color={colors.destructive} />
          <Text style={[styles.bannerText, { color: "#FCA5A5" }]}>
            If you or someone else is in immediate danger, call 911 now.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          FREE CONFIDENTIAL SUPPORT
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
          PeacemakerAI is not a crisis service. The resources above are operated by trained professionals. Please use them.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  content: { padding: 20, gap: 14 },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  bannerText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 21 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
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
    marginTop: 8,
  },
});
