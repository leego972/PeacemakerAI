import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { Case } from "@/lib/storage";

interface VerdictCardProps {
  caseData: Case;
}

export function VerdictCard({ caseData }: VerdictCardProps) {
  const colors = useColors();

  const verdictColor =
    caseData.verdictType === "resolved"
      ? colors.success
      : caseData.verdictType === "partially_resolved"
      ? colors.warning
      : colors.mutedForeground;

  const verdictIcon =
    caseData.verdictType === "resolved"
      ? "check-circle"
      : caseData.verdictType === "partially_resolved"
      ? "alert-circle"
      : "minus-circle";

  const verdictLabel =
    caseData.verdictType === "resolved"
      ? "RESOLVED"
      : caseData.verdictType === "partially_resolved"
      ? "PARTIALLY RESOLVED"
      : "NO RESOLUTION";

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.seal, { borderColor: verdictColor }]}>
        <Feather name={verdictIcon as any} size={28} color={verdictColor} />
      </View>
      <Text style={[styles.sealLabel, { color: verdictColor }]}>{verdictLabel}</Text>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Text style={[styles.caseTitle, { color: colors.mutedForeground }]}>
        {caseData.title}
      </Text>
      <Text style={[styles.verdictText, { color: colors.foreground }]}>
        {caseData.verdict}
      </Text>
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Feather name="award" size={12} color={colors.mutedForeground} />
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          PeacemakerAI · Not legal advice · Court adjourned
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  seal: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  sealLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2.5,
  },
  divider: {
    width: "100%",
    height: 1,
    marginVertical: 4,
  },
  caseTitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  verdictText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 12,
    width: "100%",
    justifyContent: "center",
    marginTop: 4,
  },
  footerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
