import React, { useState } from "react";
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

type AgeBracket = "under_13" | "teen_13_17" | "adult_18plus";
type RelationshipStatus =
  | "dating" | "engaged" | "married" | "separated" | "divorced"
  | "friend" | "classmates" | "coworkers" | "group";
type Duration = "less_3mo" | "3_12mo" | "1_3yr" | "3yr_plus";

const TOTAL_STEPS = 5;

const ADULT_REL_OPTIONS: { value: RelationshipStatus; label: string }[] = [
  { value: "dating",    label: "Dating" },
  { value: "engaged",   label: "Engaged" },
  { value: "married",   label: "Married" },
  { value: "separated", label: "Separated" },
  { value: "divorced",  label: "Divorced" },
  { value: "friend",    label: "Close Friends" },
  { value: "coworkers", label: "Coworkers" },
  { value: "group",     label: "Group Conflict" },
];

const YOUTH_REL_OPTIONS: { value: RelationshipStatus; label: string }[] = [
  { value: "friend",     label: "Friends" },
  { value: "classmates", label: "Classmates" },
  { value: "dating",     label: "Romantic Interest" },
  { value: "group",      label: "Group / Clique" },
];

const DURATION_OPTIONS: { value: Duration; label: string }[] = [
  { value: "less_3mo", label: "Less than 3 months" },
  { value: "3_12mo",   label: "3-12 months" },
  { value: "1_3yr",    label: "1-3 years" },
  { value: "3yr_plus", label: "More than 3 years" },
];

export default function IntakeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [ageBracket, setAgeBracket] = useState<AgeBracket | "">("");

  // Step 2
  const [otherPartyDescription, setOtherPartyDescription] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus | "">("");
  const [durationKnown, setDurationKnown] = useState<Duration | "">("");
  const [hasChildren, setHasChildren] = useState<boolean | null>(null);
  const [childrenInfo, setChildrenInfo] = useState("");

  // Step 3
  const [background, setBackground] = useState("");

  // Step 4
  const [incident, setIncident] = useState("");
  const [incidentWhen, setIncidentWhen] = useState("");

  // Step 5
  const [desiredOutcome, setDesiredOutcome] = useState("");

  const isYouth = ageBracket === "under_13" || ageBracket === "teen_13_17";
  const showKidsQuestion = ["married", "separated", "divorced"].includes(relationshipStatus);
  const relOptions = isYouth ? YOUTH_REL_OPTIONS : ADULT_REL_OPTIONS;

  function validateStep(): string | null {
    if (step === 1 && !ageBracket) return "Please select your age group to continue.";
    if (step === 2) {
      if (!otherPartyDescription.trim()) return "Please describe the other party.";
      if (!relationshipStatus) return "Please select your relationship type.";
      if (!durationKnown) return "Please select how long you have known each other.";
      if (showKidsQuestion && hasChildren && !childrenInfo.trim()) return "Please provide brief details about the children.";
    }
    if (step === 3 && background.trim().length < 20) return "Please describe the background in at least 20 characters.";
    if (step === 4) {
      if (incident.trim().length < 20) return "Please describe the incident in at least 20 characters.";
      if (!incidentWhen.trim()) return "Please tell us when this happened.";
    }
    if (step === 5 && desiredOutcome.trim().length < 10) return "Please describe your desired outcome.";
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    Haptics.selectionAsync();
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    setError("");
    if (step > 1) setStep(step - 1);
    else router.back();
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    const base = process.env.EXPO_PUBLIC_API_URL ?? "";
    try {
      const res = await fetch(`${base}/api/admissions/screen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageBracket,
          otherPartyDescription: otherPartyDescription.trim(),
          relationshipStatus,
          durationKnown,
          hasChildren: hasChildren ?? false,
          childrenInfo: childrenInfo.trim(),
          background: background.trim(),
          incident: incident.trim(),
          incidentWhen: incidentWhen.trim(),
          desiredOutcome: desiredOutcome.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Screening failed. Please try again."); return; }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: "/case/admissions",
        params: {
          admitted: data.admitted ? "1" : "0",
          ruling: data.ruling,
          courtType: data.courtType,
          ageCategory: data.ageCategory,
          focus: data.focus,
          intake: JSON.stringify({
            ageBracket, otherPartyDescription, relationshipStatus, durationKnown,
            hasChildren: hasChildren ?? false, childrenInfo, background,
            incident, incidentWhen, desiredOutcome,
          }),
        },
      });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const progress = step / TOTAL_STEPS;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Case Intake</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Step {step} of {TOTAL_STEPS}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: colors.primary }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.inner, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && <StepAboutYou ageBracket={ageBracket} onSelect={setAgeBracket} colors={colors} />}
        {step === 2 && (
          <StepRelationship
            isYouth={isYouth}
            relOptions={relOptions}
            otherPartyDescription={otherPartyDescription}
            setOtherPartyDescription={setOtherPartyDescription}
            relationshipStatus={relationshipStatus}
            setRelationshipStatus={setRelationshipStatus}
            durationKnown={durationKnown}
            setDurationKnown={setDurationKnown}
            showKidsQuestion={showKidsQuestion}
            hasChildren={hasChildren}
            setHasChildren={setHasChildren}
            childrenInfo={childrenInfo}
            setChildrenInfo={setChildrenInfo}
            colors={colors}
          />
        )}
        {step === 3 && <StepBackground background={background} setBackground={setBackground} colors={colors} />}
        {step === 4 && (
          <StepIncident
            incident={incident}
            setIncident={setIncident}
            incidentWhen={incidentWhen}
            setIncidentWhen={setIncidentWhen}
            colors={colors}
          />
        )}
        {step === 5 && <StepOutcome desiredOutcome={desiredOutcome} setDesiredOutcome={setDesiredOutcome} colors={colors} />}

        {!!error && (
          <View style={[styles.errorRow, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "40" }]}>
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
          onPress={handleNext}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color={colors.primaryForeground} />
            : <>
                <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
                  {step === TOTAL_STEPS ? "Submit for Screening" : "Continue"}
                </Text>
                <Feather
                  name={step === TOTAL_STEPS ? "send" : "arrow-right"}
                  size={18}
                  color={colors.primaryForeground}
                />
              </>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Step 1: About You ──────────────────────────────────────────────────────────
function StepAboutYou({ ageBracket, onSelect, colors }: any) {
  const options: { value: AgeBracket; label: string; sub: string; icon: string }[] = [
    { value: "under_13", label: "Under 13", sub: "School-age, friend or class disputes", icon: "book" },
    { value: "teen_13_17", label: "13-17 Years Old", sub: "Teens — friends, school, early relationships", icon: "users" },
    { value: "adult_18plus", label: "18 or Over", sub: "Adults — dating, marriage, coworkers, friends", icon: "briefcase" },
  ];
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>Before We Begin</Text>
      <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
        The court adapts its approach and tone based on your age. Please select honestly.
      </Text>
      <View style={styles.optionList}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.value}
            style={[
              styles.optionCard,
              {
                backgroundColor: ageBracket === o.value ? colors.primary + "18" : colors.secondary,
                borderColor: ageBracket === o.value ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onSelect(o.value)}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, { backgroundColor: ageBracket === o.value ? colors.primary : colors.border }]}>
              <Feather name={o.icon as any} size={18} color={ageBracket === o.value ? colors.primaryForeground : colors.mutedForeground} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionLabel, { color: colors.foreground }]}>{o.label}</Text>
              <Text style={[styles.optionSub, { color: colors.mutedForeground }]}>{o.sub}</Text>
            </View>
            {ageBracket === o.value && <Feather name="check-circle" size={20} color={colors.primary} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Step 2: The Relationship ───────────────────────────────────────────────────
function StepRelationship({
  isYouth, relOptions, otherPartyDescription, setOtherPartyDescription,
  relationshipStatus, setRelationshipStatus, durationKnown, setDurationKnown,
  showKidsQuestion, hasChildren, setHasChildren, childrenInfo, setChildrenInfo, colors,
}: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>The Relationship</Text>
      <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
        {isYouth
          ? "Tell the court who this is about and how you know them."
          : "Describe the other party and your relationship."}
      </Text>

      <Label colors={colors}>{isYouth ? "Who is this about?" : "Other Party"}</Label>
      <TextInput
        value={otherPartyDescription}
        onChangeText={setOtherPartyDescription}
        style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
        placeholder={isYouth ? "E.g. my best friend, a classmate..." : "E.g. my boyfriend, my ex-wife, a coworker..."}
        placeholderTextColor={colors.mutedForeground}
        maxLength={100}
      />

      <Label colors={colors}>Relationship Type</Label>
      <View style={styles.chipGrid}>
        {relOptions.map((o: any) => (
          <TouchableOpacity
            key={o.value}
            style={[
              styles.chip,
              {
                backgroundColor: relationshipStatus === o.value ? colors.primary : colors.secondary,
                borderColor: relationshipStatus === o.value ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setRelationshipStatus(o.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, { color: relationshipStatus === o.value ? colors.primaryForeground : colors.foreground }]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Label colors={colors}>How Long Have You Known Each Other?</Label>
      <View style={styles.chipGrid}>
        {DURATION_OPTIONS.map((o) => (
          <TouchableOpacity
            key={o.value}
            style={[
              styles.chip,
              {
                backgroundColor: durationKnown === o.value ? colors.primary : colors.secondary,
                borderColor: durationKnown === o.value ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setDurationKnown(o.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, { color: durationKnown === o.value ? colors.primaryForeground : colors.foreground }]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showKidsQuestion && (
        <>
          <Label colors={colors}>Are Children Directly Affected?</Label>
          <View style={styles.boolRow}>
            {[true, false].map((v) => (
              <TouchableOpacity
                key={String(v)}
                style={[
                  styles.boolBtn,
                  {
                    backgroundColor: hasChildren === v ? colors.primary : colors.secondary,
                    borderColor: hasChildren === v ? colors.primary : colors.border,
                    flex: 1,
                  },
                ]}
                onPress={() => setHasChildren(v)}
                activeOpacity={0.8}
              >
                <Text style={[styles.boolText, { color: hasChildren === v ? colors.primaryForeground : colors.foreground }]}>
                  {v ? "Yes" : "No"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {hasChildren && (
            <>
              <Label colors={colors}>Brief Details (ages, custody arrangement, etc.)</Label>
              <TextInput
                value={childrenInfo}
                onChangeText={setChildrenInfo}
                style={[styles.textarea, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
                placeholder="E.g. 2 children, ages 4 and 7, currently shared custody..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                maxLength={300}
              />
            </>
          )}
        </>
      )}
    </View>
  );
}

// ── Step 3: Background ────────────────────────────────────────────────────────
function StepBackground({ background, setBackground, colors }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>The Background</Text>
      <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
        Help the court understand the full picture. How did things get to this point? Focus on patterns and history, not just the recent event.
      </Text>
      <TextInput
        value={background}
        onChangeText={setBackground}
        style={[styles.textarea, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, minHeight: 180 }]}
        placeholder="Describe the relationship history and the pattern of issues that led to this dispute..."
        placeholderTextColor={colors.mutedForeground}
        multiline
        maxLength={800}
      />
      <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{background.length}/800</Text>
    </View>
  );
}

// ── Step 4: The Incident ──────────────────────────────────────────────────────
function StepIncident({ incident, setIncident, incidentWhen, setIncidentWhen, colors }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>The Incident</Text>
      <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
        Describe the specific event that brought you to court today. Be as precise as possible — what was said, what was done, who was present.
      </Text>
      <TextInput
        value={incident}
        onChangeText={setIncident}
        style={[styles.textarea, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, minHeight: 180 }]}
        placeholder="Describe exactly what happened: what was said, what was done, and how it made you feel..."
        placeholderTextColor={colors.mutedForeground}
        multiline
        maxLength={800}
      />
      <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{incident.length}/800</Text>

      <Label colors={colors}>When Did This Happen?</Label>
      <TextInput
        value={incidentWhen}
        onChangeText={setIncidentWhen}
        style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
        placeholder="E.g. last Tuesday, about two weeks ago, yesterday evening..."
        placeholderTextColor={colors.mutedForeground}
        maxLength={100}
      />
    </View>
  );
}

// ── Step 5: Desired Outcome ───────────────────────────────────────────────────
function StepOutcome({ desiredOutcome, setDesiredOutcome, colors }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>Your Goals</Text>
      <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
        What would a fair resolution look like to you? The court is not here to enforce outcomes — but understanding your goal helps the judge ask the right questions.
      </Text>
      <TextInput
        value={desiredOutcome}
        onChangeText={setDesiredOutcome}
        style={[styles.textarea, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, minHeight: 160 }]}
        placeholder="Describe the outcome you are hoping for. What would make this feel resolved for you?"
        placeholderTextColor={colors.mutedForeground}
        multiline
        maxLength={500}
      />
      <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{desiredOutcome.length}/500</Text>

      <View style={[styles.noticeBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
          After submitting, our AI Admissions Officer will review your case and decide if it is ready for court. This usually takes a few seconds.
        </Text>
      </View>
    </View>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
function Label({ children, colors }: { children: React.ReactNode; colors: any }) {
  return (
    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
    paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  progressTrack: { height: 3 },
  progressFill: { height: 3 },
  inner: { paddingHorizontal: 20, paddingTop: 24, gap: 0 },
  stepContainer: { gap: 16 },
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 28 },
  stepDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  optionList: { gap: 12 },
  optionCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 14, borderWidth: 1, padding: 16,
  },
  optionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  optionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 8 },
  input: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  textarea: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  charCount: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  boolRow: { flexDirection: "row", gap: 12 },
  boolBtn: { borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: "center" },
  boolText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  noticeBox: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    borderRadius: 12, borderWidth: 1, padding: 14,
  },
  noticeText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, flex: 1 },
  errorRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 8,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, flex: 1 },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1,
  },
  nextBtn: {
    borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
