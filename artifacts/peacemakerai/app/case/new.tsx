import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import * as Haptics from "expo-haptics";

const COURT_TYPES: { value: string; label: string; icon: string; desc: string }[] = [
  { value: "dating",   label: "Dating Court",    icon: "heart",    desc: "Unresolved issues between dating partners" },
  { value: "engaged",  label: "Engaged Court",   icon: "star",     desc: "Pre-marriage conflicts and boundaries" },
  { value: "married",  label: "Marriage Court",  icon: "home",     desc: "Disputes within a marriage" },
  { value: "divorced", label: "Divorce Court",   icon: "scissors", desc: "Post-separation and co-parenting issues" },
  { value: "school",   label: "School Court",    icon: "book",     desc: "School and teen relationship disputes" },
  { value: "friend",   label: "Friend Court",    icon: "users",    desc: "Friendship conflicts and boundaries" },
  { value: "group",    label: "Group Court",     icon: "grid",     desc: "Group dynamics and collective grievances" },
];

type Relationship = {
  id: string;
  partnerName: string;
  relationshipType: string;
  isCoparenting: boolean;
};

export default function NewCaseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [courtType, setCourtType] = useState("");
  const [openingArgument, setOpeningArgument] = useState("");
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const base = process.env.EXPO_PUBLIC_API_URL ?? "";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch(`${base}/api/relationships/me`, { headers })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          const linked = d.filter((r: any) => r.status === "linked");
          setRelationships(linked);
          if (linked.length === 1) setSelectedRelId(linked[0].id);
        }
      })
      .finally(() => setFetching(false));
  }, [token]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Give this case a title."); return; }
    if (!courtType) { setError("Select a court type."); return; }
    if (!openingArgument.trim() || openingArgument.trim().length < 20) {
      setError("Describe the dispute in at least 20 characters."); return;
    }
    if (relationships.length > 0 && !selectedRelId) {
      setError("Select which relationship this is about."); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${base}/api/cases`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: title.trim(),
          courtType,
          openingArgument: openingArgument.trim(),
          relationshipId: selectedRelId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to file case."); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/case/courtroom", params: { id: data.id } });
    } catch {
      setError("Network error. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.inner,
          { paddingTop: 16, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Relationship selector */}
        {relationships.length > 1 && (
          <View style={styles.field}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>About Which Relationship</Text>
            {relationships.map((rel) => (
              <TouchableOpacity
                key={rel.id}
                style={[
                  styles.relRow,
                  {
                    backgroundColor: selectedRelId === rel.id ? colors.primary + "11" : colors.secondary,
                    borderColor: selectedRelId === rel.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { setSelectedRelId(rel.id); setError(""); }}
                activeOpacity={0.8}
              >
                <Feather name="users" size={16} color={selectedRelId === rel.id ? colors.primary : colors.mutedForeground} />
                <View style={styles.relInfo}>
                  <Text style={[styles.relName, { color: colors.foreground }]}>{rel.partnerName}</Text>
                  <Text style={[styles.relType, { color: colors.mutedForeground }]}>
                    {rel.isCoparenting ? "Co-parenting" : rel.relationshipType}
                  </Text>
                </View>
                {selectedRelId === rel.id && <Feather name="check-circle" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Court Type */}
        <View style={styles.field}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Court Type</Text>
          <View style={styles.courtGrid}>
            {COURT_TYPES.map((ct) => (
              <TouchableOpacity
                key={ct.value}
                style={[
                  styles.courtTile,
                  {
                    backgroundColor: courtType === ct.value ? colors.primary : colors.secondary,
                    borderColor: courtType === ct.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { setCourtType(ct.value); setError(""); }}
                activeOpacity={0.8}
              >
                <Feather name={ct.icon as any} size={18} color={courtType === ct.value ? colors.primaryForeground : colors.foreground} />
                <Text style={[styles.courtLabel, { color: courtType === ct.value ? colors.primaryForeground : colors.foreground }]}>
                  {ct.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {courtType && (
            <Text style={[styles.courtDesc, { color: colors.mutedForeground }]}>
              {COURT_TYPES.find((c) => c.value === courtType)?.desc}
            </Text>
          )}
        </View>

        {/* Case title */}
        <View style={styles.field}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Case Title</Text>
          <TextInput
            value={title}
            onChangeText={(t) => { setTitle(t); setError(""); }}
            style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Brief description of the dispute"
            placeholderTextColor={colors.mutedForeground}
            maxLength={120}
          />
        </View>

        {/* Opening argument */}
        <View style={styles.field}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Opening Argument</Text>
          <Text style={[styles.fieldNote, { color: colors.mutedForeground }]}>
            Describe the situation. The judge will ask follow-up questions.
          </Text>
          <TextInput
            value={openingArgument}
            onChangeText={(t) => { setOpeningArgument(t); setError(""); }}
            style={[styles.textarea, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
            placeholder="What happened? What outcome are you seeking?"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={6}
            maxLength={1000}
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{openingArgument.length}/1000</Text>
        </View>

        {!!error && (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={13} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.primaryForeground} />
            : <>
                <Feather name="award" size={18} color={colors.primaryForeground} />
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Summon Judge Dorothy</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 22 },
  field: { gap: 10 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5, textTransform: "uppercase" },
  fieldNote: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  relRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  relInfo: { flex: 1 },
  relName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  relType: { fontSize: 12, fontFamily: "Inter_400Regular", textTransform: "capitalize" },
  courtGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  courtTile: { borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center", gap: 8, minWidth: "45%", flex: 1 },
  courtLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  courtDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 140 },
  charCount: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right" },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  btn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
