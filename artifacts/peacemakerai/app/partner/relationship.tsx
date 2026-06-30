import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import * as Haptics from "expo-haptics";

const HEALTH_LABELS: { min: number; label: string; color: string }[] = [
  { min: 85, label: "Smooth Sailing", color: "#22c55e" },
  { min: 60, label: "Steady Waters", color: "#3b82f6" },
  { min: 40, label: "Choppy Seas", color: "#f59e0b" },
  { min: 20, label: "Walking on Eggshells", color: "#f97316" },
  { min: 0,  label: "Storm Warning", color: "#ef4444" },
];

function healthInfo(score: number) {
  return HEALTH_LABELS.find((h) => score >= h.min) ?? HEALTH_LABELS[HEALTH_LABELS.length - 1];
}

type RelationshipDetail = {
  id: string;
  partnerName: string;
  partnerEmail: string;
  relationshipType: string;
  isCoparenting: boolean;
  status: string;
  healthScore: number;
  healthLabel: string;
  createdAt: string;
  totalCases: number;
  resolvedCases: number;
};

export default function RelationshipScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [rel, setRel] = useState<RelationshipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState("");

  const base = process.env.EXPO_PUBLIC_API_URL ?? "";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch(`${base}/api/relationships/${id}`, { headers })
      .then((r) => r.json())
      .then((d) => { if (!d.error) setRel(d); else setError(d.error); })
      .catch(() => setError("Failed to load relationship."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRelease = () => {
    Alert.alert(
      "Release Relationship",
      `This will unlink you from ${rel?.partnerName}. Your case history will be preserved. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Release",
          style: "destructive",
          onPress: async () => {
            setReleasing(true);
            try {
              const res = await fetch(`${base}/api/relationships/${id}/release`, { method: "POST", headers });
              if (!res.ok) { setError("Failed to release relationship."); return; }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              router.replace("/(tabs)");
            } catch {
              setError("Network error.");
            } finally { setReleasing(false); }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!rel || error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorMsg, { color: colors.destructive }]}>{error || "Relationship not found."}</Text>
      </View>
    );
  }

  const info = healthInfo(rel.healthScore);
  const sinceDate = new Date(rel.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" });
  const resolutionRate = rel.totalCases > 0 ? Math.round((rel.resolvedCases / rel.totalCases) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.inner,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 24), paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Partner avatar */}
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "33" }]}>
            <Text style={[styles.avatarInitial, { color: colors.primary }]}>
              {rel.partnerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.partnerName, { color: colors.foreground }]}>{rel.partnerName}</Text>
          <Text style={[styles.relType, { color: colors.mutedForeground }]}>
            {rel.isCoparenting ? "Co-parenting" : rel.relationshipType} since {sinceDate}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: rel.status === "linked" ? "#22c55e22" : colors.secondary }]}>
            <Feather name={rel.status === "linked" ? "link" : "link-2"} size={12} color={rel.status === "linked" ? "#22c55e" : colors.mutedForeground} />
            <Text style={[styles.statusText, { color: rel.status === "linked" ? "#22c55e" : colors.mutedForeground }]}>
              {rel.status === "linked" ? "Linked" : rel.status}
            </Text>
          </View>
        </View>

        {/* Health score */}
        <View style={[styles.healthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.healthTop}>
            <Text style={[styles.healthTitle, { color: colors.foreground }]}>Relationship Health</Text>
            <View style={[styles.healthBadge, { backgroundColor: info.color + "22" }]}>
              <Text style={[styles.healthBadgeText, { color: info.color }]}>{info.label}</Text>
            </View>
          </View>
          <View style={[styles.healthBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.healthBarFill, { width: `${rel.healthScore}%` as any, backgroundColor: info.color }]} />
          </View>
          <Text style={[styles.healthScore, { color: colors.mutedForeground }]}>{rel.healthScore}/100</Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{rel.totalCases}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Hearings</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: "#22c55e" }]}>{rel.resolvedCases}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Resolved</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{resolutionRate}%</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Resolution</Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/case/new")}
          activeOpacity={0.85}
        >
          <Feather name="award" size={16} color={colors.primaryForeground} />
          <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Set a New Hearing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => router.push("/(tabs)/logbook")}
          activeOpacity={0.85}
        >
          <Feather name="book-open" size={16} color={colors.foreground} />
          <Text style={[styles.actionBtnText, { color: colors.foreground }]}>View Case Logbook</Text>
        </TouchableOpacity>

        {/* Danger zone */}
        <View style={[styles.dangerZone, { borderColor: colors.destructive + "44" }]}>
          <Text style={[styles.dangerTitle, { color: colors.destructive }]}>Danger Zone</Text>
          <Text style={[styles.dangerDesc, { color: colors.mutedForeground }]}>
            Releasing this relationship will unlink both parties. Your case history will be preserved.
          </Text>
          <TouchableOpacity
            style={[styles.releaseBtn, { borderColor: colors.destructive, opacity: releasing ? 0.7 : 1 }]}
            onPress={handleRelease}
            disabled={releasing}
            activeOpacity={0.8}
          >
            {releasing
              ? <ActivityIndicator color={colors.destructive} size="small" />
              : <>
                  <Feather name="user-x" size={14} color={colors.destructive} />
                  <Text style={[styles.releaseBtnText, { color: colors.destructive }]}>Release Relationship</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  inner: { paddingHorizontal: 20, gap: 20 },
  hero: { alignItems: "center", gap: 8, paddingVertical: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 34, fontFamily: "Inter_700Bold" },
  partnerName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  relType: { fontSize: 14, fontFamily: "Inter_400Regular", textTransform: "capitalize" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  healthCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  healthTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  healthTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  healthBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  healthBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  healthBarBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  healthBarFill: { height: 8, borderRadius: 4 },
  healthScore: { fontSize: 12, fontFamily: "Inter_400Regular" },
  stats: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center", gap: 4 },
  statNum: { fontSize: 26, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actionBtn: { borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  actionBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  dangerZone: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  dangerTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  dangerDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  releaseBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, borderWidth: 1.5, paddingVertical: 12 },
  releaseBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  errorMsg: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
