import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useCases } from "@/context/CasesContext";
import { getCourtById, type CourtId } from "@/constants/courts";
import { getOpeningStatement } from "@/lib/prompts";
import { callJudge } from "@/lib/groq";
import { checkSafety, getSafetyMessage } from "@/lib/safety";
import { SafetyBanner } from "@/components/SafetyBanner";
import * as Haptics from "expo-haptics";

export default function NewCaseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { courtId } = useLocalSearchParams<{ courtId: CourtId }>();
  const { createCase, addMessage } = useCases();

  const court = courtId ? getCourtById(courtId) : undefined;

  const [title, setTitle] = useState("");
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [safetyTriggered, setSafetyTriggered] = useState(false);
  const [safetyMessage, setSafetyMessage] = useState("");

  if (!court) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>Invalid court selected.</Text>
      </View>
    );
  }

  const handleFile = async () => {
    if (!title.trim()) { setError("Give your case a brief title."); return; }
    if (situation.trim().length < 20) { setError("Please describe the situation in a bit more detail."); return; }

    const safety = checkSafety(situation);
    if (safety.triggered) {
      setSafetyTriggered(true);
      setSafetyMessage(getSafetyMessage(safety.triggerType));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const newCase = await createCase(court.id, title.trim());

      const userMsg = await addMessage(newCase.id, {
        role: "user",
        content: situation.trim(),
        timestamp: Date.now(),
      });

      if (!userMsg) throw new Error("Failed to create case");

      const judgeResult = await callJudge(court.id, userMsg.messages);

      if (!judgeResult.ok) {
        if (judgeResult.error.type === "no_key") {
          await addMessage(newCase.id, {
            role: "judge",
            content:
              "The AI Judge is unavailable — no Groq API key configured. Add EXPO_PUBLIC_GROQ_API_KEY to your environment secrets to activate the judge.",
            timestamp: Date.now(),
          });
        } else {
          await addMessage(newCase.id, {
            role: "judge",
            content: "The court is temporarily unavailable. Please try again shortly.",
            timestamp: Date.now(),
          });
        }
      } else if (judgeResult.isSafetyStop) {
        await addMessage(newCase.id, {
          role: "judge",
          content: "SAFETY_STOP",
          timestamp: Date.now(),
        });
      } else {
        await addMessage(newCase.id, {
          role: "judge",
          content: judgeResult.content,
          timestamp: Date.now(),
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/case/[id]", params: { id: newCase.id } });
    } catch {
      setError("Failed to file case. Please try again.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.courtBadge, { backgroundColor: court.color + "22" }]}>
          <Feather name={court.icon as any} size={16} color={court.color} />
          <Text style={[styles.courtName, { color: court.color }]}>{court.name}</Text>
        </View>

        <Text style={[styles.heading, { color: colors.foreground }]}>File Your Case</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          The judge will hear from you first. Be clear and honest.
        </Text>

        {safetyTriggered && <SafetyBanner message={safetyMessage} />}

        {!safetyTriggered && (
          <>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Case Title</Text>
              <TextInput
                value={title}
                onChangeText={(t) => { setTitle(t); setError(""); }}
                style={[styles.input, { backgroundColor: colors.secondary, borderColor: error && !title.trim() ? colors.destructive : colors.border, color: colors.foreground }]}
                placeholder="e.g. The Birthday Argument"
                placeholderTextColor={colors.mutedForeground}
                maxLength={60}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Describe the Situation</Text>
              <TextInput
                value={situation}
                onChangeText={(t) => { setSituation(t); setError(""); }}
                style={[styles.textarea, { backgroundColor: colors.secondary, borderColor: error && situation.trim().length < 20 ? colors.destructive : colors.border, color: colors.foreground }]}
                placeholder="What happened? Keep it factual and brief."
                placeholderTextColor={colors.mutedForeground}
                multiline
                textAlignVertical="top"
                maxLength={800}
              />
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
                {situation.length}/800
              </Text>
            </View>

            {!!error && (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={13} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            )}

            <View style={[styles.notice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="info" size={14} color={colors.mutedForeground} />
              <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
                Do not include sensitive personal information. The judge provides neutral observations only — not legal advice.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handleFile}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <>
                  <Feather name="send" size={16} color={colors.primaryForeground} />
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                    Bring to Court
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, gap: 16 },
  courtBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  courtName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  heading: { fontSize: 24, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  field: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textarea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 140,
  },
  charCount: { fontSize: 11, fontFamily: "Inter_400Regular", alignSelf: "flex-end" },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
