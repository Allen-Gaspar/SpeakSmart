import React, { useState } from "react";
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
import { getAllLessons, getLessonsByLanguage } from "@/lib/lessons";

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f59e0b",
  advanced: "#ef4444",
};

export default function LessonsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedLang, setSelectedLang] = useState("english");
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 80;

  const filteredLessons = getLessonsByLanguage(selectedLang);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Lessons
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Structured practice with guided phrases
          </Text>
        </View>

        {/* Language filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {languages.map((lang) => (
            <Pressable
              key={lang.id}
              style={[
                styles.filterChip,
                selectedLang === lang.id
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedLang(lang.id);
              }}
            >
              <Text style={styles.filterFlag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.filterLabel,
                  {
                    color: selectedLang === lang.id ? colors.primaryForeground : colors.foreground,
                    fontFamily: "Inter_500Medium",
                  },
                ]}
              >
                {lang.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {filteredLessons.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="book-open" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                No lessons yet for this language
              </Text>
            </View>
          ) : (
            filteredLessons.map((lesson) => (
              <Pressable
                key={lesson.id}
                style={({ pressed }) => [
                  styles.lessonCard,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/lesson/${lesson.id}`);
                }}
              >
                <View style={styles.lessonTop}>
                  <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLOR[lesson.difficulty] + "20" }]}>
                    <Text style={[styles.diffText, { color: DIFFICULTY_COLOR[lesson.difficulty], fontFamily: "Inter_500Medium" }]}>
                      {lesson.difficulty}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.lessonTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {lesson.title}
                </Text>
                <Text style={[styles.lessonDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {lesson.description}
                </Text>
                <View style={styles.lessonMeta}>
                  <View style={styles.metaItem}>
                    <Feather name="clock" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {lesson.duration} min
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="zap" size={13} color={colors.primary} />
                    <Text style={[styles.metaText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                      {lesson.xpReward} XP
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="list" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {lesson.phrases.length} phrases
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  filterRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 20 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  filterFlag: { fontSize: 16 },
  filterLabel: { fontSize: 14 },
  lessonCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  lessonTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  diffText: { fontSize: 12 },
  lessonTitle: { fontSize: 17 },
  lessonDesc: { fontSize: 13, lineHeight: 18 },
  lessonMeta: { flexDirection: "row", gap: 14, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13 },
  emptyState: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
