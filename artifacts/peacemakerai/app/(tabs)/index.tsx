import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
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

type Relationship = {
  id: string;
  partnerName: string;
  relationshipType: string;
  status: string;
  healthScore: number;
  healthLabel: string;
  isCoparenting: boolean;
};

type CaseItem = {
  id: string;
  title: string;
  courtType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  summonerId: string;
  respondentId: string | null;
};

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading, token } = useAuth();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading]);

  useEffect(() => {
    if (!token) return;
    const base = process.env.EXPO_PUBLIC_API_URL ?? "";
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    Promise.all([
      fetch(`${base}/api/relationships/me`, { headers }).then((r) => r.json()),
      fetch(`${base}/api/cases`, { headers }).then((r) => r.json()),
      fetch(`${base}/api/notifications/unread-count`, { headers }).then((r) => r.json()),
    ]).then(([rels, cs, notifs]) => {
      if (Array.isArray(rels)) setRelationships(rels);
      if (Array.isArray(cs)) setCases(cs);
      if (notifs?.count !== undefined) setUnreadCount(notifs.count);
    }).finally(() => setLoading(false));
  }, [token]);

  const linkedRels = relationships.filter((r) => r.status === "linked");
  const pendingCases = cases.filter((c) => c.status === "pending_response" && c.respondentId === user?.id);
  const activeCases = cases.filter((c) => c.status === "in_session");
  const resolvedCases = cases.filter((c) => c.status === "resolved");

  const isUnattached = linkedRels.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={cases}
        keyExtractor={(item) => item.id}
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
            {/* Header row */}
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back,</Text>
                <Text style={[styles.name, { color: colors.foreground }]}>{user?.name ?? "Counselor"}</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                style={[styles.bellBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Feather name="bell" size={20} color={colors.foreground} />
                {unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Unattached state */}
            {isUnattached && (
              <View style={[styles.unattachedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="user-x" size={28} color={colors.mutedForeground} />
                <Text style={[styles.unattachedTitle, { color: colors.foreground }]}>
                  Profile Unattached
                </Text>
                <Text style={[styles.unattachedDesc, { color: colors.mutedForeground }]}>
                  Link your partner to access hearings and dispute resolution.
                </Text>
                <TouchableOpacity
                  style={[styles.linkBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/partner/link")}
                  activeOpacity={0.85}
                >
                  <Feather name="link" size={16} color={colors.primaryForeground} />
                  <Text style={[styles.linkBtnText, { color: colors.primaryForeground }]}>Link My Partner</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Relationship health cards */}
            {linkedRels.map((rel) => {
              const info = healthInfo(rel.healthScore);
              return (
                <TouchableOpacity
                  key={rel.id}
                  style={[styles.healthCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/partner/relationship", params: { id: rel.id } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.healthTop}>
                    <View>
                      <Text style={[styles.healthPartner, { color: colors.foreground }]}>{rel.partnerName}</Text>
                      <Text style={[styles.healthType, { color: colors.mutedForeground }]}>
                        {rel.isCoparenting ? "Co-parenting" : rel.relationshipType}
                      </Text>
                    </View>
                    <View style={[styles.healthBadge, { backgroundColor: info.color + "22" }]}>
                      <Text style={[styles.healthBadgeText, { color: info.color }]}>{info.label}</Text>
                    </View>
                  </View>
                  <View style={[styles.healthBarBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.healthBarFill, { width: `${rel.healthScore}%` as any, backgroundColor: info.color }]} />
                  </View>
                  <Text style={[styles.healthScore, { color: colors.mutedForeground }]}>{rel.healthScore}/100</Text>
                </TouchableOpacity>
              );
            })}

            {/* Pending summons (you were summoned) */}
            {pendingCases.length > 0 && (
              <View style={[styles.appointmentCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <Feather name="alert-circle" size={20} color={colors.primary} />
                <View style={styles.appointmentInfo}>
                  <Text style={[styles.appointmentTitle, { color: colors.foreground }]}>
                    You have been summoned
                  </Text>
                  <Text style={[styles.appointmentDesc, { color: colors.mutedForeground }]}>
                    {pendingCases.length} hearing{pendingCases.length > 1 ? "s" : ""} awaiting your response
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.attendBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push({ pathname: "/case/summons", params: { id: pendingCases[0].id } })}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.attendBtnText, { color: colors.primaryForeground }]}>Respond</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Active session */}
            {activeCases.length > 0 && (
              <TouchableOpacity
                style={[styles.appointmentCard, { backgroundColor: colors.card, borderColor: "#22c55e" }]}
                onPress={() => router.push({ pathname: "/case/courtroom", params: { id: activeCases[0].id } })}
                activeOpacity={0.85}
              >
                <Feather name="radio" size={20} color="#22c55e" />
                <View style={styles.appointmentInfo}>
                  <Text style={[styles.appointmentTitle, { color: colors.foreground }]}>Attend My Appointment</Text>
                  <Text style={[styles.appointmentDesc, { color: colors.mutedForeground }]}>Court is in session</Text>
                </View>
                <View style={[styles.liveTag, { backgroundColor: "#22c55e22" }]}>
                  <Text style={[styles.liveTagText, { color: "#22c55e" }]}>LIVE</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* No hearings */}
            {pendingCases.length === 0 && activeCases.length === 0 && !isUnattached && (
              <View style={[styles.quietCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.quietText, { color: "#22c55e" }]}>No hearings scheduled</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.stats}>
              <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: colors.primary }]}>{activeCases.length}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active</Text>
              </View>
              <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: "#22c55e" }]}>{resolvedCases.length}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Resolved</Text>
              </View>
              <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: colors.mutedForeground }]}>{cases.length}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</Text>
              </View>
            </View>

            {cases.length > 0 && (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CASE HISTORY</Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const statusColor =
            item.status === "in_session" ? "#22c55e"
            : item.status === "resolved" ? colors.primary
            : item.status === "declined" ? colors.destructive
            : colors.mutedForeground;
          const statusLabel =
            item.status === "in_session" ? "IN SESSION"
            : item.status === "resolved" ? "RESOLVED"
            : item.status === "pending_response" ? "PENDING"
            : item.status === "declined" ? "DECLINED"
            : item.status === "awaiting_fair_call" ? "FAIR CALL"
            : item.status.toUpperCase();
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (item.status === "in_session" || item.status === "awaiting_fair_call") {
                  router.push({ pathname: "/case/courtroom", params: { id: item.id } });
                } else {
                  router.push({ pathname: "/case/[id]", params: { id: item.id } });
                }
              }}
              activeOpacity={0.75}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.cardType, { color: colors.mutedForeground }]}>{item.courtType}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>
              <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
                {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !isUnattached ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No cases yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Set a hearing to bring a dispute before Judge Dorothy.
              </Text>
            </View>
          ) : null
        }
      />

      {/* FAB — only show if linked */}
      {!isUnattached && (
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: colors.primary,
              bottom: insets.bottom + (Platform.OS === "web" ? 84 + 34 : 84 + 16),
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/case/new");
          }}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={24} color={colors.primaryForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 20, gap: 12 },
  listHeader: { gap: 14, marginBottom: 8 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { fontSize: 26, fontFamily: "Inter_700Bold" },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  unattachedCard: {
    borderRadius: 16, borderWidth: 1, padding: 24,
    alignItems: "center", gap: 10,
  },
  unattachedTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  unattachedDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 4 },
  linkBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  healthCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  healthTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  healthPartner: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  healthType: { fontSize: 12, fontFamily: "Inter_400Regular", textTransform: "capitalize" },
  healthBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  healthBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  healthBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  healthBarFill: { height: 6, borderRadius: 3 },
  healthScore: { fontSize: 11, fontFamily: "Inter_400Regular" },
  appointmentCard: {
    borderRadius: 16, borderWidth: 2, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  appointmentInfo: { flex: 1, gap: 2 },
  appointmentTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  appointmentDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  attendBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  attendBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  liveTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  liveTagText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  quietCard: {
    borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center",
  },
  quietText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  stats: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center", gap: 4 },
  statNum: { fontSize: 28, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5, marginTop: 4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardInfo: { flex: 1, gap: 3, marginRight: 12 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardType: { fontSize: 12, fontFamily: "Inter_400Regular", textTransform: "capitalize" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  cardDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", gap: 12, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  fab: {
    position: "absolute", right: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
});
