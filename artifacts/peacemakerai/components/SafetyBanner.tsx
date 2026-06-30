import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";

interface SafetyBannerProps {
  message: string;
}

export function SafetyBanner({ message }: SafetyBannerProps) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: "#3B0000", borderColor: colors.destructive }]}>
      <View style={styles.header}>
        <Feather name="alert-triangle" size={18} color={colors.destructive} />
        <Text style={[styles.title, { color: colors.destructive }]}>COURT STOPPED</Text>
      </View>
      <Text style={[styles.message, { color: "#FCA5A5" }]}>{message}</Text>
      <TouchableOpacity
        onPress={() => router.push("/safety/resources")}
        style={[styles.button, { borderColor: colors.destructive }]}
        activeOpacity={0.8}
      >
        <Feather name="phone" size={14} color={colors.destructive} />
        <Text style={[styles.buttonText, { color: colors.destructive }]}>
          View Safety Resources
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  message: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  buttonText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
