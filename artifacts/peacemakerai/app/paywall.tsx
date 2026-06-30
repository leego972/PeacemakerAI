import React, { useMemo, useState } from "react";
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/lib/revenuecat";

const PRODUCT_IDS = {
  single: "peacemaker_single_hearing_199",
  monthly: "peacemaker_unlimited_monthly_699",
  annual: "peacemaker_unlimited_annual_4999",
} as const;

type PlanId = keyof typeof PRODUCT_IDS;

const FEATURES = [
  { icon: "award", text: "Private AI courtroom with rotating judges" },
  { icon: "send", text: "Summon the other person to respond voluntarily" },
  { icon: "shield", text: "Safety and suitability screening before hearings" },
  { icon: "file-text", text: "Non-binding fairness verdicts, not legal rulings" },
  { icon: "share-2", text: "Redacted verdict cards for safe sharing" },
  { icon: "book-open", text: "Private hearing history and Fair Call resolution log" },
];

function findPackage(packages: any[], productId: string, fallbackTerms: string[] = []) {
  return packages.find((pkg) => {
    const identifier = `${pkg?.identifier ?? ""} ${pkg?.product?.identifier ?? ""}`.toLowerCase();
    return identifier.includes(productId.toLowerCase()) || fallbackTerms.some((term) => identifier.includes(term));
  });
}

export default function PaywallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { offerings, isSubscribed, purchase, restore, isPurchasing, isRestoring, isLoading } = useSubscription();
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("single");

  const availablePackages = offerings?.current?.availablePackages ?? [];

  const plans = useMemo(() => {
    const singlePackage = findPackage(availablePackages, PRODUCT_IDS.single, ["single", "hearing", "one"]);
    const monthlyPackage = offerings?.current?.monthly ?? findPackage(availablePackages, PRODUCT_IDS.monthly, ["monthly", "month"]);
    const annualPackage = offerings?.current?.annual ?? findPackage(availablePackages, PRODUCT_IDS.annual, ["annual", "year"]);

    return {
      single: {
        id: "single" as const,
        label: "Book One Hearing",
        price: "$1.99",
        note: "One complete eligible hearing",
        badge: "Best for trying it",
        pkg: singlePackage,
      },
      monthly: {
        id: "monthly" as const,
        label: "Unlimited Monthly",
        price: "$6.99/mo",
        note: "Unlimited eligible hearings",
        badge: "Most flexible",
        pkg: monthlyPackage,
      },
      annual: {
        id: "annual" as const,
        label: "Unlimited Annual",
        price: "$49.99/yr",
        note: "Best value for repeat use",
        badge: "Best value",
        pkg: annualPackage,
      },
    };
  }, [availablePackages, offerings]);

  const selected = plans[selectedPlan];

  const handlePurchase = async () => {
    if (!selected.pkg) {
      setError("This purchase option is not configured yet. Check RevenueCat product IDs.");
      return;
    }
    setError("");
    try {
      await purchase(selected.pkg);
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
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 24), paddingBottom: insets.bottom + 142 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.close} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={[styles.emblem, { borderColor: colors.primary }]}> 
            <Feather name="award" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Unlock the Hearing</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}> 
            Present both sides, enter the private courtroom, and receive a non-binding fairness verdict.
          </Text>
        </View>

        <View style={styles.planStack}>
          {Object.values(plans).map((plan) => {
            const active = selectedPlan === plan.id;
            const disabled = !plan.pkg && !isLoading;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: disabled ? 0.55 : 1,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => setSelectedPlan(plan.id)}
              >
                <View style={styles.planTopRow}>
                  <View style={styles.planTextBlock}>
                    <Text style={[styles.planLabel, { color: colors.foreground }]}>{plan.label}</Text>
                    <Text style={[styles.planNote, { color: colors.mutedForeground }]}>{plan.note}</Text>
                  </View>
                  <View style={styles.planPriceBlock}>
                    <Text style={[styles.planPrice, { color: colors.primary }]}>{plan.price}</Text>
                    <Text style={[styles.planBadge, { color: colors.mutedForeground }]}>{plan.badge}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

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

        <View style={[styles.scopeCard, { borderColor: colors.border }]}> 
          <Text style={[styles.scopeTitle, { color: colors.foreground }]}>Built for private everyday disputes</Text>
          <Text style={[styles.scopeText, { color: colors.mutedForeground }]}> 
            PeacemakerAI does not handle legal, money, custody, abuse, emergency, or public-figure pile-on cases.
          </Text>
        </View>

        {!!error && (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={13} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[
        styles.footer,
        { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 },
      ]}>
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary, opacity: isPurchasing || isLoading ? 0.7 : 1 }]}
          onPress={handlePurchase}
          disabled={isPurchasing || isLoading}
          activeOpacity={0.85}
        >
          {isPurchasing || isLoading
            ? <ActivityIndicator color={colors.primaryForeground} />
            : <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>{selected.label} — {selected.price}</Text>
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
          Subscriptions auto-renew. Cancel anytime in App Store or Google Play settings. Hearings are non-binding and not legal advice.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 24, gap: 22 },
  close: { alignSelf: "flex-end" },
  hero: { alignItems: "center", gap: 12 },
  emblem: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  planStack: { gap: 12 },
  planCard: { borderRadius: 16, borderWidth: 2, padding: 16 },
  planTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  planTextBlock: { flex: 1, gap: 4 },
  planPriceBlock: { alignItems: "flex-end", gap: 4 },
  planLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  planNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  planPrice: { fontSize: 19, fontFamily: "Inter_700Bold" },
  planBadge: { fontSize: 11, fontFamily: "Inter_500Medium" },
  featuresCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
  scopeCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  scopeTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  scopeText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, gap: 10 },
  cta: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  ctaText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  restoreBtn: { alignItems: "center", paddingVertical: 8 },
  restoreText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  legal: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 15 },
});
