import React, { useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useCases } from "@/context/CasesContext";
import { VerdictCard } from "@/components/VerdictCard";
import * as Haptics from "expo-haptics";

export default function VerdictScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cases } = useCases();

  const caseData = cases.find((c) => c.id === id);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (!caseData) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Case not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            paddingBottom: 16,
          },
        ]}
      >
        <View style={[styles.gavel, { borderColor: colors.primary }]}>
          <Feather name="award" size={26} color={colors.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>VERDICT</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          Court has adjourned
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <VerdictCard caseData={caseData} />

        <View style={[styles.notice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
            This is an AI observation, not legal advice. PeacemakerAI is not a licensed service. For serious matters, consult a professional.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(tabs)/")}
            activeOpacity={0.85}
          >
            <Feather name="home" size={16} color={colors.primaryForeground} />
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
              Back to My Cases
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => router.push("/court/select")}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={16} color={colors.foreground} />
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
              File a New Case
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 15, fontFamily: "Inter_400Regular" },
  header: { alignItems: "center", gap: 8, paddingHorizontal: 20 },
  gavel: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  headerTitle: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  content: { padding: 20, gap: 16 },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  noticeText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  actions: { gap: 12, marginTop: 4 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
