import React, { useEffect } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/(tabs)/");
    }
  }, [user, loading]);

  if (loading) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <View style={[styles.inner, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) }]}>
        <View style={styles.topSection}>
          <View style={[styles.emblem, { borderColor: colors.primary }]}>
            <Feather name="award" size={48} color={colors.primary} />
          </View>

          <Text style={[styles.brand, { color: colors.primary }]}>
            PeacemakerAI
          </Text>

          <Text style={[styles.tagline, { color: colors.foreground }]}>
            Court is in session.
          </Text>

          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            A neutral AI judge for real disputes.{"\n"}Relationship, school, and beyond.
          </Text>
        </View>

        <View style={styles.features}>
          {[
            { icon: "shield", text: "Neutral, unbiased judgment" },
            { icon: "lock", text: "Private and confidential" },
            { icon: "zap", text: "Instant, concise verdicts" },
          ].map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + "22" }]}>
                <Feather name={f.icon as any} size={14} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/signup")}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => router.push("/login")}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Not a substitute for legal or professional advice.{"\n"}If you are in danger, call 911.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  topSection: { alignItems: "center", gap: 14, marginTop: 20 },
  emblem: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  brand: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  tagline: { fontSize: 22, fontFamily: "Inter_600SemiBold" },
  sub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 23,
  },
  features: { gap: 12, marginVertical: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  actions: { gap: 12 },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 17,
    paddingBottom: 8,
  },
});
