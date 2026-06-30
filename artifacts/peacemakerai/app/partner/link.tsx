import React, { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Share, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import * as Haptics from "expo-haptics";

const TEEN_TYPES = [
  { value: "friend", label: "Friend" },
  { value: "school", label: "School" },
  { value: "group", label: "Group" },
  { value: "dating", label: "Dating" },
  { value: "engaged", label: "Engaged" },
];

const ADULT_TYPES = [
  { value: "dating", label: "Dating" },
  { value: "engaged", label: "Engaged" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced / Ex" },
  { value: "coparenting", label: "Co-parenting" },
];

export default function LinkPartnerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const [partnerEmail, setPartnerEmail] = useState("");
  const [relType, setRelType] = useState("");
  const [isCoparenting, setIsCoparenting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteResult, setInviteResult] = useState<{ deepLink: string; message: string } | null>(null);

  const isTeen = (user as any)?.ageTier === "teen";
  const relTypes = isTeen ? TEEN_TYPES : ADULT_TYPES;

  const handleInvite = async () => {
    if (!partnerEmail.trim() || !partnerEmail.includes("@")) {
      setError("Please enter a valid email address."); return;
    }
    if (!relType) { setError("Please select a relationship type."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? ""}/api/relationships/invite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ partnerEmail: partnerEmail.trim().toLowerCase(), relationshipType: relType, isCoparenting }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send invite."); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setInviteResult({ deepLink: data.deepLink, message: data.message });
    } catch {
      setError("Network error. Please try again.");
    } finally { setLoading(false); }
  };

  const handleShare = async () => {
    if (!inviteResult) return;
    await Share.share({
      message: `You've been invited to PeacemakerAI. Tap to link your account: ${inviteResult.deepLink}`,
      title: "PeacemakerAI Partner Invite",
    });
  };

  if (inviteResult) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.successIcon, { backgroundColor: "#22c55e22" }]}>
            <Feather name="check-circle" size={36} color="#22c55e" />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Invite Ready</Text>
          <Text style={[styles.successMsg, { color: colors.mutedForeground }]}>{inviteResult.message}</Text>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Feather name="share-2" size={16} color={colors.primaryForeground} />
            <Text style={[styles.shareBtnText, { color: colors.primaryForeground }]}>Share Invite Link</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={styles.doneBtn}>
            <Text style={[styles.doneBtnText, { color: colors.mutedForeground }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <TouchableOpacity onPress={() => router.back()} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.emblem, { borderColor: colors.primary }]}>
            <Feather name="link" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Link My Partner</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Enter their email and share an invite link. They tap it to connect.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Partner's Email</Text>
            <TextInput
              value={partnerEmail}
              onChangeText={(t) => { setPartnerEmail(t); setError(""); }}
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="their@email.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Relationship Type</Text>
            <View style={styles.pillRow}>
              {relTypes.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => { setRelType(t.value); setIsCoparenting(t.value === "coparenting"); setError(""); }}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: relType === t.value ? colors.primary : colors.secondary,
                      borderColor: relType === t.value ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: relType === t.value ? colors.primaryForeground : colors.foreground }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {(relType === "divorced" || relType === "coparenting") && (
            <TouchableOpacity
              style={[styles.coparentRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={() => setIsCoparenting(!isCoparenting)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: isCoparenting ? colors.primary : "transparent" }]}>
                {isCoparenting && <Feather name="check" size={12} color={colors.primaryForeground} />}
              </View>
              <Text style={[styles.coparentLabel, { color: colors.foreground }]}>We share custody of children</Text>
            </TouchableOpacity>
          )}

          {!!error && (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={13} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleInvite}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.primaryForeground} />
              : <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Generate Invite Link</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 24, gap: 28 },
  back: { marginBottom: 4 },
  header: { alignItems: "center", gap: 10 },
  emblem: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  form: { gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  coparentRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  coparentLabel: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  successCard: { flex: 1, alignItems: "center", justifyContent: "center", margin: 24, borderRadius: 20, borderWidth: 1, padding: 32, gap: 16 },
  successIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  successMsg: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  shareBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  doneBtn: { padding: 8 },
  doneBtnText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
