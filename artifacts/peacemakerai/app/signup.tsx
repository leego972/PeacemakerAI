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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import * as Haptics from "expo-haptics";

const RELATIONSHIP_OPTIONS_TEEN = [
  { value: "single", label: "Single" },
  { value: "dating", label: "Dating" },
  { value: "engaged", label: "Engaged" },
];

const RELATIONSHIP_OPTIONS_ADULT = [
  { value: "single", label: "Single" },
  { value: "dating", label: "Dating" },
  { value: "engaged", label: "Engaged" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
];

function getAge(dob: string): number {
  if (!dob) return 0;
  const [y, m, d] = dob.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const birth = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("single");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const age = getAge(dob);
  const isTeen = age > 0 && age < 18;
  const relationshipOptions = isTeen ? RELATIONSHIP_OPTIONS_TEEN : RELATIONSHIP_OPTIONS_ADULT;

  const formatDob = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  };

  const handleSignup = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (dob.length < 10) { setError("Please enter your date of birth (YYYY-MM-DD)."); return; }
    if (age < 10 || age > 120) { setError("Please enter a valid date of birth."); return; }

    setLoading(true);
    setError("");
    const result = await signUp(name.trim(), email.trim().toLowerCase(), password, dob, relationshipStatus);
    setLoading(false);
    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } else {
      setError(result.error ?? "Sign up failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.inner,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 24),
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.back}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.emblem, { borderColor: colors.primary }]}>
            <Feather name="award" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Create account</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Your first hearing is on us
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Full Name</Text>
            <TextInput
              value={name}
              onChangeText={(t) => { setName(t); setError(""); }}
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={(t) => { setEmail(t); setError(""); }}
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={(t) => { setPassword(t); setError(""); }}
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Date of Birth</Text>
            <TextInput
              value={dob}
              onChangeText={(t) => { setDob(formatDob(t)); setError(""); }}
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              autoCorrect={false}
            />
            {age > 0 && (
              <Text style={[styles.ageHint, { color: colors.mutedForeground }]}>
                {isTeen ? `Age ${age} — teen account (friends + relationships)` : `Age ${age} — adult account (partner disputes only)`}
              </Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Current Relationship Status</Text>
            <View style={styles.pillRow}>
              {relationshipOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setRelationshipStatus(opt.value)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: relationshipStatus === opt.value ? colors.primary : colors.secondary,
                      borderColor: relationshipStatus === opt.value ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: relationshipStatus === opt.value ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {!!error && (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={13} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.primaryForeground} />
              : <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Create Account</Text>
            }
          </TouchableOpacity>

          <Text style={[styles.terms, { color: colors.mutedForeground }]}>
            By creating an account you agree to our{" "}
            <Text
              style={[styles.termsLink, { color: colors.primary }]}
              onPress={() => router.push("/legal/terms")}
            >
              Terms of Service
            </Text>
            . PeacemakerAI is not a legal service and no content within constitutes professional legal or therapeutic advice.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={[styles.link, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 28, gap: 28 },
  back: { marginBottom: 4 },
  header: { alignItems: "center", gap: 10 },
  emblem: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular" },
  form: { gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  ageHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  terms: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 17 },
  termsLink: { fontFamily: "Inter_600SemiBold" },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  link: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
