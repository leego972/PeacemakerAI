import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import * as Haptics from "expo-haptics";

type CaseDetail = {
  id: string;
  title: string;
  courtType: string;
  status: string;
  verdict: string | null;
  createdAt: string;
};

export default function VerdictScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    fetch(`${process.env.EXPO_PUBLIC_API_URL ?? ""}/api/cases/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setCaseData(d))
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!caseData) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Case not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) }]}>
        <View style={[styles.gavelCircle, { borderColor: colors.primary }]}>
          <Feather name="award" size={26} color={colors.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>VERDICT</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Court has adjourned</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Case header */}
        <View style={[styles.caseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.caseTitle, { color: colors.foreground }]}>{caseData.title}</Text>
          <Text style={[styles.caseMeta, { color: colors.mutedForeground }]}>
            {caseData.courtType} Court · {new Date(caseData.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Verdict */}
        {caseData.verdict ? (
          <View style={[styles.verdictCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={styles.verdictHeader}>
              <Feather name="award" size={18} color={colors.primary} />
              <Text style={[styles.verdictLabel, { color: colors.primary }]}>Judge Dorothy's Verdict</Text>
            </View>
            <Text style={[styles.verdictText, { color: colors.foreground }]}>{caseData.verdict}</Text>
          </View>
        ) : (
          <View style={[styles.verdictCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.verdictText, { color: colors.mutedForeground }]}>No verdict available.</Text>
          </View>
        )}

        {/* Disclaimer */}
        <View style={[styles.notice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
            This is an AI observation, not legal advice. PeacemakerAI is not a licensed service. For serious matters, consult a professional.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(tabs)")}
            activeOpacity={0.85}
          >
            <Feather name="home" size={16} color={colors.primaryForeground} />
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Back to My Cases</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => router.push("/case/new")}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={16} color={colors.foreground} />
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Set Another Hearing</Text>
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
  header: { alignItems: "center", gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  gavelCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  headerTitle: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  content: { padding: 20, gap: 16 },
  caseCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 4 },
  caseTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  caseMeta: { fontSize: 12, fontFamily: "Inter_400Regular", textTransform: "capitalize" },
  verdictCard: { borderRadius: 14, borderWidth: 1.5, padding: 16, gap: 12 },
  verdictHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  verdictLabel: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  verdictText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  noticeText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  actions: { gap: 12, marginTop: 4 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 16 },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 16, borderWidth: 1 },
  secondaryBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
