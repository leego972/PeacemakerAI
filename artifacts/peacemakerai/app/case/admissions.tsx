import React, { useState } from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import * as Haptics from "expo-haptics";

export default function AdmissionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const params = useLocalSearchParams<{
    admitted: string;
    ruling: string;
    courtType: string;
    ageCategory: string;
    focus: string;
    intake: string;
  }>();

  const [filing, setFiling] = useState(false);
  const [error, setError] = useState("");

  const admitted = params.admitted === "1";
  const ruling = params.ruling ?? "";
  const courtType = params.courtType ?? "friend";
  const ageCategory = params.ageCategory ?? "adult";
  const focus = params.focus ?? "";

  let intakeData: Record<string, any> = {};
  try {
    intakeData = JSON.parse(params.intake ?? "{}");
  } catch {}

  function buildOpeningArgument(): string {
    const parts: string[] = [];
    // Embed age category so the judge calibrates language and focus appropriately
    parts.push(`[Filer Age Category: ${ageCategory}]`);
    if (intakeData.background) parts.push(`Background: ${intakeData.background}`);
    if (intakeData.incident) parts.push(`Incident: ${intakeData.incident}${intakeData.incidentWhen ? ` (${intakeData.incidentWhen})` : ""}`);
    if (intakeData.desiredOutcome) parts.push(`Desired Outcome: ${intakeData.desiredOutcome}`);
    // Only include children info as background context — does NOT automatically make children a dispute factor
    if (intakeData.hasChildren && intakeData.childrenInfo) parts.push(`[Family Context — children exist but may not be relevant to this specific dispute]: ${intakeData.childrenInfo}`);
    return parts.join("\n\n");
  }

  function buildTitle(): string {
    const who = intakeData.otherPartyDescription || "Other Party";
    const rel = intakeData.relationshipStatus || "dispute";
    return `Dispute with ${who} — ${rel}`;
  }

  async function handleProceed() {
    setFiling(true);
    setError("");
    const base = process.env.EXPO_PUBLIC_API_URL ?? "";
    try {
      const res = await fetch(`${base}/api/cases`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: buildTitle(),
          courtType,
          openingArgument: buildOpeningArgument(),
          relationshipId: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to open case. Please try again."); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/case/courtroom", params: { id: data.id } });
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setFiling(false);
    }
  }

  function handleAmend() {
    router.back();
  }

  const ageCategoryLabel: Record<string, string> = {
    child: "Youth Division — Under 13",
    teen: "Youth Division — Teen Court",
    adult: "Adult Civil Division",
  };

  const admittedColor = admitted ? "#16a34a" : "#dc2626";
  const admittedBg = admitted ? "#16a34a18" : "#dc262618";
  const admittedBorder = admitted ? "#16a34a40" : "#dc262640";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Court seal */}
        <View style={[styles.seal, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="shield" size={36} color={colors.primary} />
          <Text style={[styles.sealTitle, { color: colors.foreground }]}>PeacemakerAI</Text>
          <Text style={[styles.sealSub, { color: colors.mutedForeground }]}>Court Admissions Office</Text>
          <View style={[styles.divisionBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
            <Text style={[styles.divisionText, { color: colors.primary }]}>
              {ageCategoryLabel[ageCategory] ?? "Civil Division"}
            </Text>
          </View>
        </View>

        {/* Admissions verdict */}
        <View style={[styles.rulingCard, { backgroundColor: admittedBg, borderColor: admittedBorder }]}>
          <View style={styles.rulingHeader}>
            <Feather
              name={admitted ? "check-circle" : "x-circle"}
              size={22}
              color={admittedColor}
            />
            <Text style={[styles.rulingTitle, { color: admittedColor }]}>
              {admitted ? "Case Admitted" : "Case Not Admitted"}
            </Text>
          </View>
          <Text style={[styles.rulingText, { color: colors.foreground }]}>{ruling}</Text>
        </View>

        {/* Focus area (only when admitted) */}
        {admitted && !!focus && (
          <View style={[styles.focusCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.focusLabel, { color: colors.mutedForeground }]}>JUDGE WILL FOCUS ON</Text>
            <Text style={[styles.focusText, { color: colors.foreground }]}>{focus}</Text>
          </View>
        )}

        {/* Youth values notice */}
        {admitted && (ageCategory === "child" || ageCategory === "teen") && (
          <View style={[styles.valuesCard, { backgroundColor: colors.primary + "0D", borderColor: colors.primary + "30" }]}>
            <Feather name="star" size={16} color={colors.primary} />
            <Text style={[styles.valuesText, { color: colors.foreground }]}>
              {ageCategory === "child"
                ? "The court takes your situation seriously. The judge will focus on friendship, fairness, honesty, and helping you find a respectful resolution."
                : "The court will treat your case with full respect. The judge will address trust, communication, healthy boundaries, and what truly matters for your future."}
            </Text>
          </View>
        )}

        {/* Court type badge */}
        {admitted && (
          <View style={[styles.courtBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="award" size={14} color={colors.mutedForeground} />
            <Text style={[styles.courtBadgeText, { color: colors.mutedForeground }]}>
              Assigned: {courtTypeLabel(courtType)}
            </Text>
          </View>
        )}

        {!!error && (
          <View style={[styles.errorRow, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "40" }]}>
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {admitted ? (
          <>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: filing ? 0.7 : 1 }]}
              onPress={handleProceed}
              disabled={filing}
              activeOpacity={0.85}
            >
              {filing
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <>
                    <Feather name="award" size={18} color={colors.primaryForeground} />
                    <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Proceed to Court</Text>
                  </>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Save for Later</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handleAmend}
              activeOpacity={0.85}
            >
              <Feather name="edit-2" size={18} color={colors.primaryForeground} />
              <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Amend Filing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Back to Dashboard</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function courtTypeLabel(ct: string): string {
  const map: Record<string, string> = {
    dating: "Dating Court",
    engaged: "Engaged Court",
    married: "Marriage Court",
    divorced: "Divorce Court",
    school_relationship: "School Relationship Court",
    school_friend: "School Friend Court",
    school_group: "School Group Court",
    friend: "Friend Court",
    group: "Group Court",
  };
  return map[ct] ?? ct;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 16 },
  seal: {
    alignItems: "center", gap: 6, borderRadius: 16, borderWidth: 1,
    padding: 24, marginBottom: 4,
  },
  sealTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 4 },
  sealSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  divisionBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 4, marginTop: 4 },
  divisionText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  rulingCard: { borderRadius: 14, borderWidth: 1, padding: 18, gap: 12 },
  rulingHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  rulingTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  rulingText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 23 },
  focusCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 6 },
  focusLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  focusText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  valuesCard: { flexDirection: "row", gap: 12, borderRadius: 14, borderWidth: 1, padding: 16, alignItems: "flex-start" },
  valuesText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  courtBadge: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  courtBadgeText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  errorRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, gap: 10,
  },
  primaryBtn: {
    borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  secondaryBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  secondaryBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
