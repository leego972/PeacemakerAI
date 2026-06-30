import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Platform, StyleSheet,
  Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

type LogEntry = {
  id: string;
  caseId: string;
  role: "summoner" | "respondent";
  courtType: string;
  title: string;
  outcome: string;
  verdictSummary: string | null;
  healthScoreDelta: number;
  createdAt: string;
};

const OUTCOME_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  fair_call:         { label: "Fair Call", color: "#22c55e", icon: "check-circle" },
  one_sided_verdict: { label: "One-sided Verdict", color: "#f59e0b", icon: "award" },
  declined:          { label: "Declined", color: "#ef4444", icon: "x-circle" },
  expired:           { label: "Expired", color: "#6b7280", icon: "clock" },
  dismissed:         { label: "Dismissed", color: "#6b7280", icon: "slash" },
};

export default function LogbookScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const base = process.env.EXPO_PUBLIC_API_URL ?? "";

  useEffect(() => {
    if (!token) return;
    fetch(`${base}/api/log`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setEntries(d); })
      .finally(() => setLoading(false));
  }, [token]);

  const totalDelta = entries.reduce((sum, e) => sum + (e.healthScoreDelta ?? 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: Platform.OS === "web" ? 67 + 16 : 16,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 + 34 : 84 + 16),
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>Hearing Logbook</Text>
            <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
              A record of every case you have been part of.
            </Text>
            {entries.length > 0 && (
              <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryNum, { color: colors.foreground }]}>{entries.length}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Hearings</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryNum, { color: "#22c55e" }]}>
                      {entries.filter((e) => e.outcome === "fair_call").length}
                    </Text>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Resolved</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryItem}>
                    <Text style={[
                      styles.summaryNum,
                      { color: totalDelta >= 0 ? "#22c55e" : "#ef4444" },
                    ]}>
                      {totalDelta >= 0 ? "+" : ""}{totalDelta}
                    </Text>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Health pts</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Feather name="book-open" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No hearings yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Your hearing history will appear here after cases are resolved.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const meta = OUTCOME_LABEL[item.outcome] ?? { label: item.outcome, color: "#6b7280", icon: "circle" };
          const delta = item.healthScoreDelta ?? 0;
          return (
            <View style={[styles.entry, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.entryTop}>
                <View style={[styles.outcomeIcon, { backgroundColor: meta.color + "22" }]}>
                  <Feather name={meta.icon as any} size={16} color={meta.color} />
                </View>
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>
                    {item.courtType} Court · {item.role === "summoner" ? "You filed" : "You were summoned"}
                  </Text>
                </View>
                <View style={styles.entryRight}>
                  <View style={[styles.outcomeBadge, { backgroundColor: meta.color + "22" }]}>
                    <Text style={[styles.outcomeBadgeText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                  <Text style={[
                    styles.deltaText,
                    { color: delta > 0 ? "#22c55e" : delta < 0 ? "#ef4444" : colors.mutedForeground },
                  ]}>
                    {delta > 0 ? "+" : ""}{delta} pts
                  </Text>
                </View>
              </View>
              {item.verdictSummary && (
                <Text style={[styles.verdictPreview, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {item.verdictSummary}
                </Text>
              )}
              <Text style={[styles.entryDate, { color: colors.mutedForeground }]}>
                {new Date(item.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 20, gap: 12 },
  listHeader: { gap: 12, marginBottom: 8 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  pageSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryDivider: { width: 1, height: 40 },
  summaryNum: { fontSize: 24, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  center: { alignItems: "center", paddingTop: 60 },
  empty: { alignItems: "center", gap: 12, marginTop: 60 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  entry: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  entryTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  outcomeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  entryInfo: { flex: 1, gap: 3 },
  entryTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  entryMeta: { fontSize: 12, fontFamily: "Inter_400Regular", textTransform: "capitalize" },
  entryRight: { alignItems: "flex-end", gap: 4 },
  outcomeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  outcomeBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  deltaText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  verdictPreview: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, fontStyle: "italic" },
  entryDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
