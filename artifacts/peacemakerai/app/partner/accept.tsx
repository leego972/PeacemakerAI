import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

type InviteInfo = {
  senderName: string;
  relationshipType: string;
  expiresAt: string;
};

export default function AcceptInviteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token: inviteToken } = useLocalSearchParams<{ token: string }>();
  const { user, token: authToken, loading: authLoading } = useAuth();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const base = process.env.EXPO_PUBLIC_API_URL ?? "";

  useEffect(() => {
    if (!inviteToken) { setError("Invalid invite link."); setLoading(false); return; }
    fetch(`${base}/api/relationships/invite/${inviteToken}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setInvite(d);
      })
      .catch(() => setError("Failed to load invite."))
      .finally(() => setLoading(false));
  }, [inviteToken]);

  const handleAccept = async () => {
    if (!authToken) {
      router.push({ pathname: "/login", params: { redirectTo: `/partner/accept?token=${inviteToken}` } });
      return;
    }
    setAccepting(true); setError("");
    try {
      const res = await fetch(`${base}/api/relationships/invite/${inviteToken}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to accept invite."); return; }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally { setAccepting(false); }
  };

  if (loading || authLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (done) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 32 }]}>
        <View style={[styles.doneIcon, { backgroundColor: "#22c55e22" }]}>
          <Feather name="check-circle" size={36} color="#22c55e" />
        </View>
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>You are now linked!</Text>
        <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
          Your relationship with {invite?.senderName} is active.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.inner, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 24) }]}>
        <View style={styles.header}>
          <View style={[styles.emblem, { borderColor: colors.primary }]}>
            <Feather name="link" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Partner Invite</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {invite
              ? `${invite.senderName} has invited you to link as ${invite.relationshipType} partners.`
              : "You received a partner invite."}
          </Text>
        </View>

        {invite && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardRow}>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>From</Text>
              <Text style={[styles.cardValue, { color: colors.foreground }]}>{invite.senderName}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.cardRow}>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Relationship</Text>
              <Text style={[styles.cardValue, { color: colors.foreground, textTransform: "capitalize" }]}>{invite.relationshipType}</Text>
            </View>
          </View>
        )}

        {!!error && (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={13} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        )}

        {!error && invite && (
          <View style={styles.actions}>
            {!user && (
              <Text style={[styles.loginNote, { color: colors.mutedForeground }]}>
                You must sign in to accept this invite.
              </Text>
            )}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, opacity: accepting ? 0.7 : 1 }]}
              onPress={handleAccept}
              disabled={accepting}
              activeOpacity={0.85}
            >
              {accepting
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                    {user ? "Accept Invite" : "Sign In to Accept"}
                  </Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  inner: { flex: 1, paddingHorizontal: 24, gap: 24, alignItems: "center", justifyContent: "center" },
  header: { alignItems: "center", gap: 12 },
  emblem: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  card: { width: "100%", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  cardLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  cardValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right", flex: 1, marginLeft: 12 },
  divider: { height: 1 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, textAlign: "center" },
  actions: { width: "100%", gap: 12 },
  loginNote: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  skipBtn: { alignItems: "center", padding: 10 },
  skipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  doneIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  doneSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
});
