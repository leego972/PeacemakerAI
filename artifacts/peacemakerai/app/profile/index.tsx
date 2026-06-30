import React, { useState } from "react";
import {
  ActivityIndicator, Alert, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/lib/revenuecat";
import * as Haptics from "expo-haptics";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, token, signOut, refreshUser } = useAuth();
  const { isSubscribed } = useSubscription();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const base = process.env.EXPO_PUBLIC_API_URL ?? "";

  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === user?.name) return;
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`${base}/api/auth/me`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) { setError("Failed to update name."); return; }
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Network error.");
    } finally { setSaving(false); }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await signOut(); router.replace("/"); } },
    ]);
  };

  const ageTierLabel = user?.ageTier === "teen" ? "Teen (under 18)" : "Adult (18+)";
  const dobFormatted = user?.dob
    ? new Date(user.dob).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.inner,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 24), paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "33" }]}>
            <Text style={[styles.avatarInitial, { color: colors.primary }]}>
              {(user?.name ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name}</Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user?.email}</Text>
          {isSubscribed && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.primary + "22" }]}>
              <Feather name="award" size={12} color={colors.primary} />
              <Text style={[styles.premiumText, { color: colors.primary }]}>Premium</Text>
            </View>
          )}
        </View>

        {/* Edit name */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DISPLAY NAME</Text>
          <View style={styles.nameRow}>
            <TextInput
              value={name}
              onChangeText={(t) => { setName(t); setError(""); setSaved(false); }}
              style={[styles.nameInput, { color: colors.foreground, borderBottomColor: colors.border }]}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            {name.trim() !== user?.name && name.trim().length > 0 && (
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
                onPress={handleSaveName}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={colors.primaryForeground} size="small" />
                  : <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save</Text>
                }
              </TouchableOpacity>
            )}
            {saved && <Feather name="check" size={18} color="#22c55e" />}
          </View>
          {!!error && <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>}
        </View>

        {/* Account info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACCOUNT</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Date of Birth</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{dobFormatted}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Age Tier</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{ageTierLabel}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Status</Text>
            <Text style={[styles.infoValue, { color: colors.foreground, textTransform: "capitalize" }]}>
              {user?.relationshipStatus ?? "—"}
            </Text>
          </View>
        </View>

        {/* Subscription */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SUBSCRIPTION</Text>
          {isSubscribed ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Plan</Text>
              <Text style={[styles.infoValue, { color: "#22c55e" }]}>Premium Active</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.upgradeBtn, { borderColor: colors.primary }]}
              onPress={() => router.push("/paywall")}
              activeOpacity={0.8}
            >
              <Feather name="award" size={16} color={colors.primary} />
              <Text style={[styles.upgradeBtnText, { color: colors.primary }]}>Upgrade to Premium — $6.99/mo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: colors.destructive + "44" }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 20 },
  avatarSection: { alignItems: "center", gap: 8, paddingVertical: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 34, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  userEmail: { fontSize: 14, fontFamily: "Inter_400Regular" },
  premiumBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  premiumText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameInput: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular", paddingVertical: 8, borderBottomWidth: 1 },
  saveBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  saveBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1 },
  upgradeBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 12,
  },
  upgradeBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderRadius: 14, borderWidth: 1, paddingVertical: 14,
  },
  signOutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
