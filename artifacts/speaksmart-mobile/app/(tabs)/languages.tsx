import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { languages } from "@/lib/languages";

export default function LanguagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 80;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: bottomPadding, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Languages
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          10 languages · multiple regional accents
        </Text>

        <View style={styles.list}>
          {languages.map((lang) => (
            <Pressable
              key={lang.id}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/practice/${lang.id}`);
              }}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <View style={styles.info}>
                <Text style={[styles.langName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {lang.name}
                </Text>
                <Text style={[styles.nativeName, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {lang.nativeName}
                </Text>
                <View style={styles.accentChips}>
                  {lang.accents.slice(0, 3).map((a) => (
                    <View key={a.id} style={[styles.chip, { backgroundColor: colors.primary + "20" }]}>
                      <Text style={[styles.chipText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                        {a.name}
                      </Text>
                    </View>
                  ))}
                  {lang.accents.length > 3 && (
                    <Text style={[styles.moreText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      +{lang.accents.length - 3}
                    </Text>
                  )}
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  list: { gap: 12 },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  flag: { fontSize: 36 },
  info: { flex: 1, gap: 2 },
  langName: { fontSize: 17 },
  nativeName: { fontSize: 13, marginBottom: 6 },
  accentChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  chipText: { fontSize: 11 },
  moreText: { fontSize: 11, alignSelf: "center" },
});
