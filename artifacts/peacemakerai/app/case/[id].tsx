import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useCases } from "@/context/CasesContext";
import { useAuth } from "@/context/AuthContext";
import { callJudge } from "@/lib/groq";
import { checkSafety, getSafetyMessage } from "@/lib/safety";
import { getCourtById } from "@/constants/courts";
import { JudgeMessage } from "@/components/JudgeMessage";
import { UserMessage } from "@/components/UserMessage";
import { SafetyBanner } from "@/components/SafetyBanner";
import type { Case, ChatMessage } from "@/context/CasesContext";
import * as Haptics from "expo-haptics";

const MESSAGES_BEFORE_VERDICT = 8;

export default function CaseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCase, closeCase } = useCases();
  const { user } = useAuth();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [safetyStop, setSafetyStop] = useState(false);
  const [safetyMessage, setSafetyMessage] = useState("");
  const [loadingCase, setLoadingCase] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    getCase(id).then((c) => {
      if (c) {
        setCaseData(c);
        setMessages(c.messages ?? []);
        const lastMsg = c.messages?.[c.messages.length - 1];
        if (lastMsg?.content === "SAFETY_STOP") {
          setSafetyStop(true);
          setSafetyMessage(getSafetyMessage());
        }
      }
      setLoadingCase(false);
    });
  }, [id]);

  const court = caseData ? getCourtById(caseData.courtId) : undefined;
  const isClosed = caseData?.status === "closed";

  const handleSend = useCallback(async () => {
    if (!input.trim() || !caseData || thinking || isClosed) return;

    const text = input.trim();
    const safety = checkSafety(text);
    if (safety.triggered) {
      setSafetyStop(true);
      setSafetyMessage(getSafetyMessage(safety.triggerType));
      setInput("");
      return;
    }

    setInput("");
    setThinking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const totalAfter = messages.length + 1;
    const isTimeForVerdict = totalAfter >= MESSAGES_BEFORE_VERDICT;

    const judgeResult = await callJudge(caseData.courtId, caseData.id, text);
    setThinking(false);

    if (!judgeResult.ok) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_err",
          role: "judge",
          content: "The court is temporarily unavailable. Please try again.",
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    if (judgeResult.isSafetyStop) {
      setSafetyStop(true);
      setSafetyMessage(getSafetyMessage());
      return;
    }

    const judgeContent = judgeResult.content;
    const judgeMsg: ChatMessage = {
      id: Date.now().toString() + "_judge",
      role: "judge",
      content: judgeContent,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, judgeMsg]);

    if (isTimeForVerdict || judgeContent.toLowerCase().includes("court is adjourned")) {
      const verdictType =
        judgeContent.toLowerCase().includes("no resolution") ? "no_resolution"
          : judgeContent.toLowerCase().includes("partial") ? "partially_resolved"
          : "resolved";
      await closeCase(caseData.id, judgeContent, verdictType);
      setCaseData((prev) => prev ? { ...prev, status: "closed", verdict: judgeContent, verdictType } : prev);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({ pathname: "/case/verdict", params: { id: caseData.id } });
    }
  }, [input, caseData, thinking, isClosed, messages.length, closeCase]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.content === "SAFETY_STOP") return null;
    if (item.role === "judge") return <JudgeMessage content={item.content} />;
    return <UserMessage content={item.content} userName={user?.name ?? "You"} />;
  };

  if (loadingCase) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!caseData || !court) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Case not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.messages,
          { paddingTop: 16, paddingBottom: safetyStop ? 16 : 100 },
        ]}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.courtHeader, { borderColor: court.color + "44" }]}>
            <View style={[styles.courtIcon, { backgroundColor: court.color + "22" }]}>
              <Feather name={court.icon as any} size={16} color={court.color} />
            </View>
            <View style={styles.courtInfo}>
              <Text style={[styles.courtName, { color: court.color }]}>{court.name}</Text>
              <Text style={[styles.caseTitle, { color: colors.foreground }]}>{caseData.title}</Text>
            </View>
          </View>
        }
        ListFooterComponent={
          <>
            {thinking && (
              <View style={styles.thinking}>
                <View style={[styles.thinkingBubble, { backgroundColor: colors.judgeLight, borderColor: colors.judge }]}>
                  <ActivityIndicator size="small" color={colors.judge} />
                  <Text style={[styles.thinkingText, { color: colors.judge }]}>Judge deliberating...</Text>
                </View>
              </View>
            )}
            {safetyStop && <SafetyBanner message={safetyMessage} />}
            {isClosed && !safetyStop && (
              <TouchableOpacity
                style={[styles.verdictBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push({ pathname: "/case/verdict", params: { id: caseData.id } })}
                activeOpacity={0.85}
              >
                <Feather name="award" size={16} color={colors.primaryForeground} />
                <Text style={[styles.verdictBtnText, { color: colors.primaryForeground }]}>View Verdict</Text>
              </TouchableOpacity>
            )}
          </>
        }
      />

      {!isClosed && !safetyStop && (
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8),
            },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            style={[styles.textInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Speak to the court..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || thinking}
            style={[
              styles.sendBtn,
              {
                backgroundColor: input.trim() && !thinking ? colors.primary : colors.secondary,
              },
            ]}
            activeOpacity={0.8}
          >
            <Feather
              name="send"
              size={18}
              color={input.trim() && !thinking ? colors.primaryForeground : colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 15, fontFamily: "Inter_400Regular" },
  messages: { paddingHorizontal: 16 },
  courtHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  courtIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  courtInfo: { flex: 1, gap: 2 },
  courtName: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  caseTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  thinking: { paddingRight: 40, marginBottom: 16 },
  thinkingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignSelf: "flex-start",
  },
  thinkingText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  verdictBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  verdictBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
