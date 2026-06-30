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
import { router, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { SAFETY_RESOURCES, getResourcesForCategory, type SafetyResource } from "@/constants/resources";
import * as Haptics from "expo-haptics";

const CATEGORY_LABELS: Record<string, string> = {
  emergency:        "Emergency",
  domestic_violence: "Domestic Violence",
  mens_support:     "Men's Support",
  child_protection: "Child Protection",
  mental_health:    "Mental Health & Crisis",
  sexual_violence:  "Sexual Violence",
  youth:            "Youth & Teens",
  counseling:       "Counseling & Therapy",
  legal:            "Legal Support",
};

export default function SafetyResourcesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category?: string }>();

  // If a safety category was passed (from a safety stop), show relevant resources first.
  // Otherwise show all.
  const highlighted = category ? getResourcesForCategory(category) : [];
  const isFiltered = highlighted.length > 0;
  const displayResources: SafetyResource[] = isFiltered ? highlighted : SAFETY_RESOURCES;

  const openContact = (r: SafetyResource) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (r.isText) {
      // Open SMS or browser
      const digits = r.number.replace(/\D/g, "");
      if (digits.length <= 10) {
        Linking.openURL(`sms:${digits}`).catch(() =>
          Linking.openURL(`https://www.crisistextline.org/`));
      } else {
        Linking.openURL(`https://psychologytoday.com/us/therapists`).catch(() => {});
      }
    } else {
      const digits = r.number.replace(/\D/g, "");
      Linking.openURL(`tel:${digits}`);
    }
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
        {/* Emergency banner — always visible */}
        <View style={[styles.banner, { backgroundColor: "#3B0000", borderColor: colors.destructive }]}>
          <Feather name="alert-triangle" size={20} color={colors.destructive} />
          <Text style={[styles.bannerText, { color: "#FCA5A5" }]}>
            If you or someone else is in immediate danger, call 911 now. Your safety comes first.
          </Text>
        </View>

        {isFiltered && (
          <View style={[styles.relevantBanner, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
            <Feather name="info" size={15} color={colors.primary} />
            <Text style={[styles.relevantText, { color: colors.primary }]}>
              Based on what was shared, these resources are most relevant to your situation.
            </Text>
          </View>
        )}

        {/* Grouped resources */}
        {isFiltered ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              RECOMMENDED FOR YOU
            </Text>
            {displayResources.map((r) => (
              <ResourceCard key={r.name} resource={r} colors={colors} onPress={() => openContact(r)} />
            ))}
            <TouchableOpacity
              onPress={() => router.setParams({ category: "" })}
              style={styles.showAllBtn}
            >
              <Text style={[styles.showAllText, { color: colors.mutedForeground }]}>
                Show all resources
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((cat) => {
              const catResources = SAFETY_RESOURCES.filter((r) => r.category === cat);
              if (catResources.length === 0) return null;
              return (
                <View key={cat} style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                    {CATEGORY_LABELS[cat].toUpperCase()}
                  </Text>
                  {catResources.map((r) => (
                    <ResourceCard key={r.name} resource={r} colors={colors} onPress={() => openContact(r)} />
                  ))}
                </View>
              );
            })}
          </>
        )}

        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          PeacemakerAI is not a crisis service. The resources above are operated by trained professionals. Please reach out to them.
        </Text>
      </ScrollView>
    </View>
  );
}

function ResourceCard({
  resource: r, colors, onPress,
}: {
  resource: SafetyResource;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  onPress: () => void;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <Text style={[styles.resourceName, { color: colors.foreground }]}>{r.name}</Text>
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>{r.available}</Text>
        </View>
      </View>
      <Text style={[styles.resourceDesc, { color: colors.mutedForeground }]}>{r.description}</Text>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.callBtn, { backgroundColor: r.isText ? colors.secondary : colors.primary }]}
        activeOpacity={0.85}
      >
        <Feather
          name={r.isText ? "message-square" : "phone"}
          size={14}
          color={r.isText ? colors.foreground : colors.primaryForeground}
        />
        <Text style={[styles.callBtnText, { color: r.isText ? colors.foreground : colors.primaryForeground }]}>
          {r.number}
        </Text>
      </TouchableOpacity>
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
  relevantBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  relevantText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 19 },
  section: { gap: 10 },
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
  showAllBtn: { alignItems: "center", paddingVertical: 8 },
  showAllText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  note: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },
});
