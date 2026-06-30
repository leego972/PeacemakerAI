import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email."); return; }
    setLoading(true);
    setError("");
    try {
      await signUp(name.trim(), email.trim().toLowerCase());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/");
    } catch {
      setError("Sign up failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.inner,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 24),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24),
          },
        ]}
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
            Your first session is free
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Your Name</Text>
            <TextInput
              value={name}
              onChangeText={(t) => { setName(t); setError(""); }}
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: error ? colors.destructive : colors.border, color: colors.foreground }]}
              placeholder="First name"
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
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: error ? colors.destructive : colors.border, color: colors.foreground }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
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
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Create Account</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.terms, { color: colors.mutedForeground }]}>
            By signing up you agree that PeacemakerAI is not a legal service and provides no legal or professional advice.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={[styles.link, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between" },
  back: { marginBottom: 16 },
  header: { alignItems: "center", gap: 10 },
  emblem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular" },
  form: { gap: 16 },
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
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  terms: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 17,
  },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  link: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
