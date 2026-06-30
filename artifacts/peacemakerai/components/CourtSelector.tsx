import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { Court } from "@/constants/courts";

interface CourtSelectorProps {
  court: Court;
  onPress: () => void;
}

export function CourtSelector({ court, onPress }: CourtSelectorProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.iconBox, { backgroundColor: court.color + "22" }]}>
        <Feather name={court.icon as any} size={22} color={court.color} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.name, { color: colors.foreground }]}>{court.name}</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>{court.description}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
