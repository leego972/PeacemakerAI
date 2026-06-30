import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import * as Haptics from "expo-haptics";

const JUDGE_IMAGE = require("../../assets/images/judge-dorothy.png");

type Message = {
  id: string;
  role: "user" | "judge";
  content: string;
  timestamp: number;
};

type CaseData = {
  id: string;
  title: string;
  courtType: string;
  status: string;
  summonerId: string;
  respondentId: string | null;
  openingArgument: string;
  isOneSided: boolean;
  fairCallSummoner: boolean;
  fairCallRespondent: boolean;
  verdict: string | null;
  messages: Message[];
};

export default function CourtroomScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [safetyStop, setSafetyStop] = useState(false);
  const [fairCallLoading, setFairCallLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<FlatList>(null);

  const base = process.env.EXPO_PUBLIC_API_URL ?? "";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch(`${base}/api/cases/${id}`, { headers })
      .then((r) => r.json())
      .then((d: CaseData) => {
        setCaseData(d);
        setMessages(d.messages ?? []);
        // If judge hasn't spoken yet and case is in_session, send opening
        if (d.status === "in_session" && (d.messages ?? []).length === 0) {
          sendOpening(d);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // SSE for real-time updates
  useEffect(() => {
    if (!token || Platform.OS === "web") return;
    // Poll every 3s as fallback for native (EventSource not available in RN)
    const interval = setInterval(() => {
      fetch(`${base}/api/cases/${id}`, { headers })
        .then((r) => r.json())
        .then((d: CaseData) => {
          setCaseData(d);
          setMessages(d.messages ?? []);
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [token, id]);

  const sendOpening = async (d: CaseData) => {
    setSending(true);
    try {
      const res = await fetch(`${base}/api/judge/${id}/message`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: `[Opening Statement]: ${d.openingArgument}` }),
      });
      const data = await res.json();
      if (data.safetyStop) { setSafetyStop(true); return; }
      if (data.message) setMessages((prev) => [...prev, data.message]);
    } catch {} finally { setSending(false); }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput(""); setSending(true); setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await fetch(`${base}/api/judge/${id}/message`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (data.safetyStop) { setSafetyStop(true); return; }
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        if (data.isVerdict) {
          setCaseData((prev) => prev ? { ...prev, status: "awaiting_fair_call", verdict: data.message.content } : prev);
        }
      }
    } catch {
      setError("Failed to send. Please try again.");
    } finally { setSending(false); }
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const tapFairCall = async () => {
    setFairCallLoading(true);
    try {
      const res = await fetch(`${base}/api/cases/${id}/fair-call`, { method: "POST", headers });
      const data = await res.json();
      if (data.status === "resolved") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } else {
        setCaseData((prev) => prev ? { ...prev, ...data } : prev);
      }
    } catch {
      setError("Failed to register Fair Call.");
    } finally { setFairCallLoading(false); }
  };

  const isSummoner = caseData?.summonerId === user?.id;

  const myFairCall = isSummoner ? caseData?.fairCallSummoner : caseData?.fairCallRespondent;
  const theirFairCall = isSummoner ? caseData?.fairCallRespondent : caseData?.fairCallSummoner;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (safetyStop) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 32 }]}>
        <Feather name="shield" size={48} color={colors.destructive} />
        <Text style={[styles.safetyTitle, { color: colors.destructive }]}>Court Stopped</Text>
        <Text style={[styles.safetyMsg, { color: colors.foreground }]}>
          The judge has identified content that requires immediate attention. Court proceedings have been halted.
        </Text>
        <TouchableOpacity
          style={[styles.safetyBtn, { backgroundColor: colors.destructive }]}
          onPress={() => router.push("/safety/resources")}
        >
          <Text style={styles.safetyBtnText}>View Crisis Resources</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAwaiting = caseData?.status === "awaiting_fair_call";

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Judge header */}
      <View style={[styles.judgeHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Image source={JUDGE_IMAGE} style={styles.judgeAvatar} />
        <View style={styles.judgeInfo}>
          <Text style={[styles.judgeName, { color: colors.foreground }]}>Judge Dorothy</Text>
          <Text style={[styles.judgeTitle, { color: colors.mutedForeground }]}>
            {caseData?.courtType ? `${caseData.courtType} Court` : "Court in Session"}
            {caseData?.isOneSided ? " · One-sided hearing" : ""}
          </Text>
        </View>
        {isAwaiting && (
          <View style={[styles.verdictBadge, { backgroundColor: colors.primary + "22" }]}>
            <Text style={[styles.verdictBadgeText, { color: colors.primary }]}>VERDICT</Text>
          </View>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const isJudge = item.role === "judge";
          const isMe = !isJudge && item.content.includes(`[${isSummoner ? "Claimant" : "Respondent"}`);
          return (
            <View style={[styles.msgRow, isJudge && styles.judgeRow, !isJudge && !isMe && styles.otherRow]}>
              {isJudge && (
                <Image source={JUDGE_IMAGE} style={styles.avatar} />
              )}
              <View
                style={[
                  styles.bubble,
                  isJudge && { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                  isMe && { backgroundColor: colors.primary },
                  !isJudge && !isMe && { backgroundColor: colors.secondary },
                ]}
              >
                <Text style={[
                  styles.bubbleText,
                  { color: isMe ? colors.primaryForeground : colors.foreground },
                ]}>
                  {item.content}
                </Text>
                <Text style={[styles.bubbleTime, { color: isMe ? colors.primaryForeground + "99" : colors.mutedForeground }]}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={sending ? (
          <View style={styles.typing}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.typingText, { color: colors.mutedForeground }]}>Judge Dorothy is considering...</Text>
          </View>
        ) : null}
      />

      {/* Fair Call banner */}
      {isAwaiting && (
        <View style={[styles.fairCallBanner, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.fairCallInfo}>
            <Text style={[styles.fairCallTitle, { color: colors.foreground }]}>Verdict Delivered</Text>
            <Text style={[styles.fairCallDesc, { color: colors.mutedForeground }]}>
              {myFairCall
                ? "Waiting for your partner to tap Fair Call..."
                : theirFairCall
                ? "Your partner has tapped Fair Call. Tap yours to resolve."
                : "Both parties must tap Fair Call to resolve this case."}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.fairCallBtn,
              { backgroundColor: myFairCall ? colors.secondary : "#22c55e", opacity: fairCallLoading ? 0.7 : 1 },
            ]}
            onPress={tapFairCall}
            disabled={!!myFairCall || fairCallLoading}
            activeOpacity={0.85}
          >
            {fairCallLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={[styles.fairCallBtnText, { color: myFairCall ? colors.mutedForeground : "#fff" }]}>
                  {myFairCall ? "Tapped" : "Fair Call"}
                </Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      {!isAwaiting && (
        <View style={[
          styles.inputBar,
          { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + (Platform.OS === "web" ? 16 : 8) },
        ]}>
          {!!error && <Text style={[styles.inputError, { color: colors.destructive }]}>{error}</Text>}
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Speak to the court..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.secondary, opacity: sending ? 0.5 : 1 }]}
              onPress={sendMessage}
              disabled={!input.trim() || sending}
              activeOpacity={0.85}
            >
              <Feather name="send" size={18} color={input.trim() ? colors.primaryForeground : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  judgeHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  judgeAvatar: { width: 40, height: 40, borderRadius: 20 },
  judgeInfo: { flex: 1 },
  judgeName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  judgeTitle: { fontSize: 12, fontFamily: "Inter_400Regular", textTransform: "capitalize" },
  verdictBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  verdictBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  msgList: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  judgeRow: { justifyContent: "flex-start" },
  otherRow: { justifyContent: "flex-start" },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "78%", borderRadius: 16, padding: 12, gap: 4 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  bubbleTime: { fontSize: 10, fontFamily: "Inter_400Regular" },
  typing: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 36, paddingVertical: 8 },
  typingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  fairCallBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderTopWidth: 1,
  },
  fairCallInfo: { flex: 1 },
  fairCallTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  fairCallDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 2 },
  fairCallBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, minWidth: 90, alignItems: "center" },
  fairCallBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  inputBar: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10, gap: 6 },
  inputError: { fontSize: 12, fontFamily: "Inter_400Regular" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  input: {
    flex: 1, borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, fontFamily: "Inter_400Regular", maxHeight: 100,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  safetyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 12 },
  safetyMsg: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  safetyBtn: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  safetyBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});
