import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const JUDGE_IMAGE = require("../assets/images/judge-dorothy.png");

interface JudgeMessageProps {
  content: string;
}

export function JudgeMessage({ content }: JudgeMessageProps) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Image source={JUDGE_IMAGE} style={styles.avatar} />
      <View style={[styles.bubble, { backgroundColor: colors.judgeLight, borderColor: colors.judge }]}>
        <Text style={[styles.label, { color: colors.judge }]}>JUDGE DOROTHY</Text>
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
