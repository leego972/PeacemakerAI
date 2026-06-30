import React, { useState } from "react";
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/lib/revenuecat";

const FEATURES = [
  { icon: "award", text: "Unlimited hearings with Judge Dorothy" },
  { icon: "users", text: "Link and manage your partner relationship" },
  { icon: "trending-up", text: "Relationship Health Score tracking" },
  { icon: "book-open", text: "Full hearing logbook & history" },
  { icon: "shield", text: "Safety resources & crisis hotlines" },
  { icon: "zap", text: "Fair Call two-party resolution system" },
];

export default function PaywallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { offerings, isSubscribed, purchase, restore, isPurchasing, isRestoring, isLoading } = useSubscription();
  const [error, setError] = useState("");

  const monthlyPackage = offerings?.current?.monthly ?? offerings?.current?.availablePackages?.[0];

  const handlePurchase = async () => {
    if (!monthlyPackage) return;
    setError("");
    try {
      await purchase(monthlyPackage);
      router.back();
    } catch (e: any) {
      if (e?.userCancelled) return;
      setError(e?.message ?? "Purchase failed. Please try again.");
    }
  };

  const handleRestore = async () => {
    setError("");
    try {
      await restore();
      if (isSubscribed) router.back();
    } catch (e: any) {
      setError(e?.message ?? "Restore failed. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.inner,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 24), paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Close */}
        <TouchableOpacity onPress={() => router.back()} style={styles.close} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.emblem, { borderColor: colors.primary }]}>
            <Feather name="award" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>PeacemakerAI Premium</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Real dispute resolution for real relationships.
          </Text>
        </View>

        {/* Price */}
        <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <View>
            <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Monthly Plan</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.priceCurrency, { color: colors.foreground }]}>$</Text>
              <Text style={[styles.priceAmount, { color: colors.primary }]}>6</Text>
              <Text style={[styles.priceCents, { color: colors.primary }]}>.99</Text>
            </View>
          </View>
          <View style={[styles.priceDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.priceNote, { color: colors.mutedForeground }]}>
            Cancel anytime.{"\n"}Billed monthly.
          </Text>
        </View>

        {/* Features */}
        <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FEATURES.map((f) => (
            <View key={f.icon} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + "22" }]}>
                <Feather name={f.icon as any} size={14} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        {!!error && (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={13} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky footer */}
      <View style={[
        styles.footer,
        { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 },
      ]}>
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary, opacity: isPurchasing || isLoading ? 0.7 : 1 }]}
          onPress={handlePurchase}
          disabled={isPurchasing || isLoading || !monthlyPackage}
          activeOpacity={0.85}
        >
          {isPurchasing || isLoading
            ? <ActivityIndicator color={colors.primaryForeground} />
            : <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>Start Premium — $6.99/mo</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleRestore}
          disabled={isRestoring}
          style={styles.restoreBtn}
          activeOpacity={0.75}
        >
          <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
            {isRestoring ? "Restoring..." : "Restore Purchase"}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          Subscription auto-renews monthly. Cancel anytime in App Store or Google Play settings.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 24, gap: 24 },
  close: { alignSelf: "flex-end" },
  hero: { alignItems: "center", gap: 12 },
  emblem: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  priceCard: {
    borderRadius: 16, borderWidth: 2, padding: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  priceLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4 },
  priceRow: { flexDirection: "row", alignItems: "flex-start" },
  priceCurrency: { fontSize: 22, fontFamily: "Inter_700Bold", paddingTop: 6 },
  priceAmount: { fontSize: 52, fontFamily: "Inter_700Bold", lineHeight: 60 },
  priceCents: { fontSize: 24, fontFamily: "Inter_700Bold", paddingTop: 10 },
  priceDivider: { width: 1, height: 60, marginHorizontal: 20 },
  priceNote: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, flex: 1 },
  featuresCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, gap: 10 },
  cta: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  ctaText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  restoreBtn: { alignItems: "center", paddingVertical: 8 },
  restoreText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  legal: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 15 },
});
