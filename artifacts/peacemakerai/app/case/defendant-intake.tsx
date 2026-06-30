import React, { useState } from "react";
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

const TOTAL_STEPS = 3;

export default function DefendantIntakeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const base = process.env.EXPO_PUBLIC_API_URL ?? "";

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — their account of what happened
  const [perspective, setPerspective] = useState("");
  // Step 2 — background context
  const [context, setContext] = useState("");
  // Step 3 — desired outcome
  const [desiredOutcome, setDesiredOutcome] = useState("");

  const canAdvance = () => {
    if (step === 1) return perspective.trim().length >= 20;
    if (step === 2) return true; // context is optional
    if (step === 3) return desiredOutcome.trim().length >= 10;
    return false;
  };

  const advance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => s + 1);
  };

  const submit = async () => {
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`${base}/api/judge/${id}/respondent-intake`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          perspective: perspective.trim(),
          context: context.trim() || undefined,
          desiredOutcome: desiredOutcome.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit. Please try again."); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/case/courtroom", params: { id } });
    } catch {
      setError("Network error. Please try again.");
    } finally { setSubmitting(false); }
  };

  const progress = step / TOTAL_STEPS;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.headerLabel, { color: colors.mutedForeground }]}>
            Your Perspective
          </Text>
          <Text style={[styles.headerStep, { color: colors.mutedForeground }]}>
            Step {step} of {TOTAL_STEPS}
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.inner,
          { paddingTop: 28, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <StepCard
            colors={colors}
            icon="message-square"
            title="Your Account of Events"
            subtitle="Describe what happened from your point of view. Be specific — focus on the incident you have been summoned about."
          >
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="In your own words, what happened?"
              placeholderTextColor={colors.mutedForeground}
              value={perspective}
              onChangeText={setPerspective}
              multiline
              numberOfLines={6}
              maxLength={800}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
              {perspective.length}/800
            </Text>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard
            colors={colors}
            icon="layers"
            title="Background Context"
            subtitle="Is there anything the court should know about the history or dynamics of this relationship? This is optional."
          >
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Any relevant background... (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={context}
              onChangeText={setContext}
              multiline
              numberOfLines={5}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
              {context.length}/500
            </Text>
          </StepCard>
        )}

        {step === 3 && (
          <StepCard
            colors={colors}
            icon="check-circle"
            title="What You Want"
            subtitle="What does a fair resolution look like to you? What outcome would allow you both to move forward?"
          >
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="I would consider this resolved if..."
              placeholderTextColor={colors.mutedForeground}
              value={desiredOutcome}
              onChangeText={setDesiredOutcome}
              multiline
              numberOfLines={4}
              maxLength={400}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
              {desiredOutcome.length}/400
            </Text>
          </StepCard>
        )}

        {!!error && (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={13} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {step < TOTAL_STEPS ? (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: canAdvance() ? 1 : 0.4 }]}
              onPress={advance}
              disabled={!canAdvance()}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Continue</Text>
              <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: (canAdvance() && !submitting) ? 1 : 0.4 }]}
              onPress={submit}
              disabled={!canAdvance() || submitting}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <>
                    <Feather name="shield" size={18} color={colors.primaryForeground} />
                    <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Enter the Courtroom</Text>
                  </>
              }
            </TouchableOpacity>
          )}

          {step > 1 && (
            <TouchableOpacity
              style={[styles.backBtn, { borderColor: colors.border }]}
              onPress={() => setStep((s) => s - 1)}
              activeOpacity={0.8}
            >
              <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
              <Text style={[styles.backBtnText, { color: colors.mutedForeground }]}>Back</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          Your statement will be shared with the AI judge only. It helps ensure a fair hearing.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StepCard({
  colors, icon, title, subtitle, children,
}: {
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primary + "22" }]}>
        <Feather name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerLeft: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  headerStep: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 3, borderRadius: 2 },
  inner: { paddingHorizontal: 20, gap: 20 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  stepTitle: { fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 27 },
  stepSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  textarea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    minHeight: 120,
  },
  charCount: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right" },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  actions: { gap: 12 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
  },
  backBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  note: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
