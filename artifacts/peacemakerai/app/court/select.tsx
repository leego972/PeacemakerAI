import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { COURTS, type CourtId } from "@/constants/courts";
import { CourtSelector } from "@/components/CourtSelector";

const ROMANTIC = COURTS.filter((c) => c.category === "Romantic");
const SCHOOL = COURTS.filter((c) => c.category === "School");

export default function CourtSelectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleSelect = (id: CourtId) => {
    router.push({ pathname: "/case/new", params: { courtId: id } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: colors.foreground }]}>Choose Your Court</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Select the court that fits your situation. Be honest — the judge is fair.
        </Text>

        <Text style={[styles.section, { color: colors.mutedForeground }]}>ROMANTIC</Text>
        <View style={styles.list}>
          {ROMANTIC.map((c) => (
            <CourtSelector key={c.id} court={c} onPress={() => handleSelect(c.id)} />
          ))}
        </View>

        <Text style={[styles.section, { color: colors.mutedForeground }]}>SCHOOL & SOCIAL</Text>
        <View style={styles.list}>
          {SCHOOL.map((c) => (
            <CourtSelector key={c.id} court={c} onPress={() => handleSelect(c.id)} />
          ))}
        </View>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          PeacemakerAI provides neutral AI observations only — not legal, medical, or therapeutic advice. If you are in danger, call 911.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 12 },
  heading: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, marginBottom: 8 },
  section: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 4,
  },
  list: { gap: 10 },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 17,
    marginTop: 12,
  },
});
