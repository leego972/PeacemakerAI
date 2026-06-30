import React, { useEffect } from "react";
import {
  FlatList,
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
import { useCases } from "@/context/CasesContext";
import { getCourtById } from "@/constants/courts";
import type { Case } from "@/lib/storage";
import * as Haptics from "expo-haptics";

function CaseCard({ item, onPress }: { item: Case; onPress: () => void }) {
  const colors = useColors();
  const court = getCourtById(item.courtId);

  const statusColor =
    item.status === "active" ? colors.judge
    : item.status === "closed" ? colors.success
    : colors.warning;

  const statusLabel =
    item.status === "active" ? "IN PROGRESS"
    : item.status === "closed" ? "CLOSED"
    : "DELIBERATING";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.courtIcon, { backgroundColor: (court?.color ?? colors.primary) + "22" }]}>
          <Feather name={(court?.icon ?? "award") as any} size={16} color={court?.color ?? colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
          <Text style={[styles.courtName, { color: colors.mutedForeground }]}>
            {court?.name ?? "Court"}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.msgCount, { color: colors.mutedForeground }]}>
          {item.messages.length} exchange{item.messages.length !== 1 ? "s" : ""}
        </Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const { cases, loading: casesLoading, refresh } = useCases();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading]);

  useEffect(() => {
    refresh();
  }, []);

  const handleCase = (c: Case) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (c.status === "closed") {
      router.push({ pathname: "/case/verdict", params: { id: c.id } });
    } else {
      router.push({ pathname: "/case/[id]", params: { id: c.id } });
    }
  };

  const activeCases = cases.filter((c) => c.status === "active");
  const closedCases = cases.filter((c) => c.status === "closed");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={cases}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CaseCard item={item} onPress={() => handleCase(item)} />
        )}
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
            <View>
              <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
                Welcome back,
              </Text>
              <Text style={[styles.name, { color: colors.foreground }]}>
                {user?.name ?? "Counselor"}
              </Text>
            </View>
            <View style={styles.stats}>
              <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: colors.judge }]}>{activeCases.length}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active</Text>
              </View>
              <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: colors.success }]}>{closedCases.length}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Resolved</Text>
              </View>
            </View>
            {cases.length > 0 && (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                MY CASES
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { borderColor: colors.border }]}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No cases yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              File your first case to bring it before the AI Judge.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/court/select")}
              activeOpacity={0.85}
            >
              <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
                File a Case
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + (Platform.OS === "web" ? 84 + 34 : 84 + 16) }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/court/select");
        }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 20, gap: 12 },
  listHeader: { gap: 14, marginBottom: 8 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { fontSize: 26, fontFamily: "Inter_700Bold" },
  stats: { flexDirection: "row", gap: 12 },
  stat: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statNum: { fontSize: 28, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5, marginTop: 4 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  courtIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  courtName: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  msgCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  date: { fontSize: 12, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", gap: 14, marginTop: 60 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  emptyBtn: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 8,
  },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
