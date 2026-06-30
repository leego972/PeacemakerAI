import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface UserMessageProps {
  content: string;
  userName?: string;
}

export function UserMessage({ content, userName = "You" }: UserMessageProps) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={[styles.bubble, { backgroundColor: colors.plaintiffLight, borderColor: colors.plaintiff }]}>
        <Text style={[styles.label, { color: colors.plaintiff }]}>
          {userName.toUpperCase()}
        </Text>
        <Text style={[styles.text, { color: colors.foreground }]}>{content}</Text>
      </View>
      <View style={[styles.avatar, { backgroundColor: colors.plaintiffLight, borderColor: colors.plaintiff }]}>
        <Feather name="user" size={14} color={colors.plaintiff} />
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
    paddingLeft: 40,
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
