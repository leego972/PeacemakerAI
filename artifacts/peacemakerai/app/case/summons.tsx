import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
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
  summonerId: string;
  summoner?: { name: string };
  expiresAt: string;
};

function formatCourtType(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function SummonsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const base = process.env.EXPO_PUBLIC_API_URL ?? "";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch(`${base}/api/cases/${id}`, { headers })
      .then((r) => r.json())
      .then((d) => setCaseData(d))
      .finally(() => setLoading(false));
  }, [id]);

  const respond = async (accept: boolean) => {
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`${base}/api/cases/${id}/respond`, {
        method: "POST",
        headers,
        body: JSON.stringify({ accept, declineReason: declineReason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to respond."); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (accept) {
        router.replace({ pathname: "/case/courtroom", params: { id } });
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally { setSubmitting(false); }
  };

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
        <Text style={[styles.errorMsg, { color: colors.destructive }]}>Case not found.</Text>
      </View>
    );
  }

  const expiresIn = Math.max(0, Math.floor((new Date(caseData.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)));
  const isExpired = expiresIn <= 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.inner,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 24), paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.close} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.headerBlock}>
          <Text style={[styles.scriptKicker, { color: colors.primary }]}>PeacemakerAI</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Formal Summons</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>Private fairness hearing request</Text>
        </View>

        <View style={[styles.documentShadow, { backgroundColor: colors.primary + "18" }]}> 
          <View style={[styles.document, { backgroundColor: colors.card, borderColor: colors.primary }]}> 
            <View style={[styles.corner, styles.cornerTopLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerTopRight, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBottomRight, { borderColor: colors.primary }]} />

            <View style={[styles.seal, { borderColor: colors.primary, backgroundColor: colors.primary + "14" }]}> 
              <Feather name="shield" size={26} color={colors.primary} />
              <Text style={[styles.sealText, { color: colors.primary }]}>FAIR CALL</Text>
            </View>

            <View style={styles.ornamentRow}>
              <View style={[styles.ornamentLine, { backgroundColor: colors.border }]} />
              <View style={[styles.ornamentDot, { backgroundColor: colors.primary }]} />
              <View style={[styles.ornamentLine, { backgroundColor: colors.border }]} />
            </View>

            <Text style={[styles.documentKicker, { color: colors.mutedForeground }]}>In the matter of</Text>
            <Text style={[styles.caseTitle, { color: colors.foreground }]}>{caseData.title}</Text>

            <Text style={[styles.documentBody, { color: colors.mutedForeground }]}> 
              Someone you know has requested your voluntary response in a private PeacemakerAI hearing. This is not a legal notice, not a court order, and not an accusation of guilt.
            </Text>

            <View style={[styles.detailPanel, { borderColor: colors.border, backgroundColor: colors.background + "88" }]}> 
              <View style={styles.cardRow}>
                <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Hearing Type</Text>
                <Text style={[styles.cardValue, { color: colors.foreground }]}>{formatCourtType(caseData.courtType)}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.cardRow}>
                <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Response Window</Text>
                <Text style={[styles.cardValue, { color: isExpired ? colors.destructive : colors.foreground }]}> 
                  {expiresIn > 0 ? `${expiresIn} hours remaining` : "Expired"}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.cardRow}>
                <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Status</Text>
                <Text style={[styles.cardValue, { color: colors.primary }]}>Voluntary Response Requested</Text>
              </View>
            </View>

            <View style={styles.ornamentRow}>
              <View style={[styles.ornamentLine, { backgroundColor: colors.border }]} />
              <View style={[styles.ornamentDot, { backgroundColor: colors.primary }]} />
              <View style={[styles.ornamentLine, { backgroundColor: colors.border }]} />
            </View>

            <Text style={[styles.finePrint, { color: colors.mutedForeground }]}> 
              You may accept, decline, block, or report. Declining does not mean you agree with the case.
            </Text>
          </View>
        </View>

        <View style={[styles.noticeCard, { borderColor: colors.border, backgroundColor: colors.card }]}> 
          <Feather name="lock" size={15} color={colors.primary} />
          <Text style={[styles.notice, { color: colors.mutedForeground }]}> 
            This is private and non-binding. If you decline, PeacemakerAI will not create a public verdict against you.
          </Text>
        </View>

        {!!error && (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={13} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        )}

        {showDecline ? (
          <View style={styles.declineForm}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Reason for declining (optional)</Text>
            <TextInput
              value={declineReason}
              onChangeText={setDeclineReason}
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="You can leave this blank..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
            />
            <View style={styles.declineBtns}>
              <TouchableOpacity
                style={[styles.btnSecondary, { borderColor: colors.border }]}
                onPress={() => setShowDecline(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.btnSecondaryText, { color: colors.foreground }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnDestructive, { backgroundColor: colors.destructive, flex: 1, opacity: submitting ? 0.7 : 1 }]}
                onPress={() => respond(false)}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnDestructiveText}>Confirm Decline</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.attendBtn, { backgroundColor: colors.primary, opacity: submitting || isExpired ? 0.7 : 1 }]}
              onPress={() => respond(true)}
              disabled={submitting || isExpired}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <>
                    <Feather name="check-circle" size={18} color={colors.primaryForeground} />
                    <Text style={[styles.attendBtnText, { color: colors.primaryForeground }]}>Accept Summons</Text>
                  </>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.declineBtn, { borderColor: colors.border }]}
              onPress={() => setShowDecline(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.declineBtnText, { color: colors.mutedForeground }]}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.textOnlyBtn}
              activeOpacity={0.75}
            >
              <Text style={[styles.textOnly, { color: colors.mutedForeground }]}>Block or Report Concern</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const scriptFont = Platform.select({ ios: "Snell Roundhand", android: "serif", default: "serif" });
const legalSerif = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  inner: { paddingHorizontal: 22, gap: 18, alignItems: "center" },
  close: { alignSelf: "flex-end", padding: 4 },
  headerBlock: { alignItems: "center", gap: 3, marginTop: 2 },
  scriptKicker: { fontSize: 34, fontFamily: scriptFont, lineHeight: 42 },
  title: { fontSize: 29, fontFamily: legalSerif, fontWeight: "700", textAlign: "center", letterSpacing: 0.4 },
  sub: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center", letterSpacing: 1.2, textTransform: "uppercase" },
  documentShadow: { width: "100%", borderRadius: 28, padding: 7 },
  document: { width: "100%", borderRadius: 24, borderWidth: 1.5, padding: 20, alignItems: "center", gap: 14, overflow: "hidden" },
  corner: { position: "absolute", width: 34, height: 34, opacity: 0.7 },
  cornerTopLeft: { top: 10, left: 10, borderTopWidth: 1, borderLeftWidth: 1, borderTopLeftRadius: 12 },
  cornerTopRight: { top: 10, right: 10, borderTopWidth: 1, borderRightWidth: 1, borderTopRightRadius: 12 },
  cornerBottomLeft: { bottom: 10, left: 10, borderBottomWidth: 1, borderLeftWidth: 1, borderBottomLeftRadius: 12 },
  cornerBottomRight: { bottom: 10, right: 10, borderBottomWidth: 1, borderRightWidth: 1, borderBottomRightRadius: 12 },
  seal: { width: 86, height: 86, borderRadius: 43, borderWidth: 1.5, alignItems: "center", justifyContent: "center", gap: 5 },
  sealText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1.1 },
  ornamentRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  ornamentLine: { height: 1, flex: 1, opacity: 0.8 },
  ornamentDot: { width: 6, height: 6, borderRadius: 3 },
  documentKicker: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4, textTransform: "uppercase" },
  caseTitle: { fontSize: 25, fontFamily: legalSerif, fontWeight: "700", textAlign: "center", lineHeight: 31 },
  documentBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  detailPanel: { width: "100%", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  cardLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  cardValue: { fontSize: 13, fontFamily: "Inter_700Bold", flex: 1, textAlign: "right" },
  divider: { height: 1 },
  finePrint: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  noticeCard: { width: "100%", flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 16, borderWidth: 1, padding: 14 },
  notice: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, flex: 1 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  errorMsg: { fontSize: 16, fontFamily: "Inter_500Medium" },
  actions: { width: "100%", gap: 12 },
  attendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, paddingVertical: 17 },
  attendBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  declineBtn: { borderRadius: 16, paddingVertical: 15, alignItems: "center", borderWidth: 1 },
  declineBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  textOnlyBtn: { alignItems: "center", paddingVertical: 5 },
  textOnly: { fontSize: 13, fontFamily: "Inter_500Medium" },
  declineForm: { width: "100%", gap: 12 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 94, textAlignVertical: "top" },
  declineBtns: { flexDirection: "row", gap: 12 },
  btnSecondary: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 14, alignItems: "center" },
  btnSecondaryText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  btnDestructive: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnDestructiveText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});
