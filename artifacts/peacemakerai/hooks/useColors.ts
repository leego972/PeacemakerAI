import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

export function useColors() {
  const scheme = useColorScheme();
  const palette = scheme === "dark" && "dark" in colors
    ? (colors as any).dark as typeof colors.light
    : colors.light;
  return { ...palette, radius: colors.radius };
}
