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
      >
        {/* Gavel icon */}
        <View style={styles.gavelWrap}>
          <View style={[styles.gavelCircle, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="alert-circle" size={36} color={colors.primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>You Have Been Summoned</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Your presence is required before Judge Dorothy.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Case</Text>
            <Text style={[styles.cardValue, { color: colors.foreground }]}>{caseData.title}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Court</Text>
            <Text style={[styles.cardValue, { color: colors.foreground, textTransform: "capitalize" }]}>{caseData.courtType}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Expires</Text>
            <Text style={[styles.cardValue, { color: expiresIn < 6 ? colors.destructive : colors.foreground }]}>
              {expiresIn > 0 ? `${expiresIn} hours remaining` : "Expired"}
            </Text>
          </View>
        </View>

        <Text style={[styles.notice, { color: colors.mutedForeground }]}>
          If you decline, the judge will hear this case without you and deliver a one-sided verdict.
        </Text>

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
              style={[styles.attendBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
              onPress={() => respond(true)}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <>
                    <Feather name="check-circle" size={18} color={colors.primaryForeground} />
                    <Text style={[styles.attendBtnText, { color: colors.primaryForeground }]}>Attend Appointment</Text>
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
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  inner: { paddingHorizontal: 24, gap: 20, alignItems: "center" },
  gavelWrap: { marginTop: 16 },
  gavelCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  card: { width: "100%", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  cardLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  cardValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "right", marginLeft: 12 },
  divider: { height: 1 },
  notice: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, paddingHorizontal: 8 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  errorMsg: { fontSize: 16, fontFamily: "Inter_500Medium" },
  actions: { width: "100%", gap: 12 },
  attendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 16 },
  attendBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  declineBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  declineBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  declineForm: { width: "100%", gap: 12 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  declineBtns: { flexDirection: "row", gap: 12 },
  btnSecondary: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 14, alignItems: "center" },
  btnSecondaryText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  btnDestructive: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnDestructiveText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});
