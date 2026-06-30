import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Platform, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  caseId: string | null;
  relationshipId: string | null;
  createdAt: string;
  data?: string;
};

const TYPE_ICON: Record<string, string> = {
  summons: "alert-circle",
  summons_accepted: "check-circle",
  summons_declined: "x-circle",
  verdict: "award",
  fair_call: "thumbs-up",
  relationship_invite: "link",
  case_expired: "clock",
  session_start: "radio",
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const base = process.env.EXPO_PUBLIC_API_URL ?? "";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch(`${base}/api/notifications`, { headers })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setNotifications(d); })
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (notif: NotificationItem) => {
    if (!notif.read) {
      await fetch(`${base}/api/notifications/${notif.id}/read`, { method: "PATCH", headers });
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
    }
    // Navigate based on type
    if (notif.caseId) {
      if (notif.type === "summons") {
        router.push({ pathname: "/case/summons", params: { id: notif.caseId } });
      } else if (["summons_accepted", "verdict", "fair_call", "session_start"].includes(notif.type)) {
        router.push({ pathname: "/case/courtroom", params: { id: notif.caseId } });
      }
    } else if (notif.relationshipId && notif.type === "relationship_invite") {
      const data = notif.data ? JSON.parse(notif.data) : {};
      if (data.inviteToken) {
        router.push({ pathname: "/partner/accept", params: { token: data.inviteToken } });
      }
    }
  };

  const markAllRead = async () => {
    await fetch(`${base}/api/notifications/read-all`, { method: "PATCH", headers });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Inbox</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
          renderItem={({ item }) => {
            const icon = TYPE_ICON[item.type] ?? "bell";
            const timeAgo = getTimeAgo(item.createdAt);
            return (
              <TouchableOpacity
                style={[
                  styles.notifRow,
                  { backgroundColor: item.read ? colors.background : colors.card, borderBottomColor: colors.border },
                ]}
                onPress={() => markRead(item)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + "22" }]}>
                  <Feather name={icon as any} size={18} color={colors.primary} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.notifBody, { color: colors.mutedForeground }]} numberOfLines={2}>{item.body}</Text>
                  <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>{timeAgo}</Text>
                </View>
                {!item.read && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="bell-off" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  markAllText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { gap: 0 },
  notifRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginTop: 2 },
  notifContent: { flex: 1, gap: 3 },
  notifTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  notifBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  empty: { alignItems: "center", gap: 12, marginTop: 80 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
