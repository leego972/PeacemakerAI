import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface JudgeMessageProps {
  content: string;
}

export function JudgeMessage({ content }: JudgeMessageProps) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: colors.judgeLight, borderColor: colors.judge }]}>
        <Feather name="award" size={14} color={colors.judge} />
      </View>
      <View style={[styles.bubble, { backgroundColor: colors.judgeLight, borderColor: colors.judge }]}>
        <Text style={[styles.label, { color: colors.judge }]}>THE JUDGE</Text>
        <Text style={[styles.text, { color: colors.foreground }]}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
    paddingRight: 40,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  bubble: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  text: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
});
