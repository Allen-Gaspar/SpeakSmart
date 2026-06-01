import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

import { useColors } from "@/hooks/useColors";
import { getLessonById } from "@/lib/lessons";
import { getLanguageById } from "@/lib/languages";

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f59e0b",
  advanced: "#ef4444",
};

export default function LessonScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = getLessonById(id || "");
  const lang = lesson ? getLanguageById(lesson.languageId) : null;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  if (!lesson || !lang) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding + 20, paddingHorizontal: 20 }]}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 20 }}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ color: colors.foreground }}>Lesson not found</Text>
      </View>
    );
  }

  const phrase = lesson.phrases[currentIdx];
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const handleSpeak = () => {
    if (isSpeaking) { Speech.stop(); setIsSpeaking(false); return; }
    setIsSpeaking(true);
    Speech.speak(phrase.text, {
      language: lang.speechCode,
      rate: 0.8,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleRate = (score: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newScores = [...scores, score];
    setScores(newScores);
    if (currentIdx < lesson.phrases.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setIsSpeaking(false);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.doneContainer, { paddingTop: topPadding + 40 }]}>
          <View style={[styles.doneIcon, { backgroundColor: "#22c55e20" }]}>
            <Feather name="check-circle" size={48} color="#22c55e" />
          </View>
          <Text style={[styles.doneTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Lesson Complete!
          </Text>
          <Text style={[styles.doneScore, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            {avgScore}/100
          </Text>
          <View style={[styles.xpEarned, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="zap" size={18} color={colors.primary} />
            <Text style={[styles.xpText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              +{lesson.xpReward} XP earned
            </Text>
          </View>
          <View style={styles.doneBtns}>
            <Pressable
              style={[styles.doneBtn, { backgroundColor: colors.secondary }]}
              onPress={() => { setCurrentIdx(0); setScores([]); setDone(false); }}
            >
              <Text style={[styles.doneBtnText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Try Again</Text>
            </Pressable>
            <Pressable
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.doneBtnText, { color: colors.primaryForeground, fontFamily: "Inter_500Medium" }]}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: 40, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.navRow}>
          <Pressable onPress={() => { Speech.stop(); router.back(); }}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.lessonTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {lesson.title}
            </Text>
            <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLOR[lesson.difficulty] + "20" }]}>
              <Text style={[styles.diffText, { color: DIFFICULTY_COLOR[lesson.difficulty], fontFamily: "Inter_500Medium" }]}>
                {lesson.difficulty}
              </Text>
            </View>
          </View>
          <Text style={[styles.indexText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {currentIdx + 1}/{lesson.phrases.length}
          </Text>
        </View>

        {/* Progress */}
        <View style={[styles.progressBar, { backgroundColor: colors.secondary }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(currentIdx / lesson.phrases.length) * 100}%` as any }]} />
        </View>

        {/* Phrase card */}
        <View style={[styles.phraseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.phraseText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {phrase.text}
          </Text>
          <Text style={[styles.translationText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {phrase.translation}
          </Text>
          {phrase.hint && (
            <View style={[styles.hintBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={[styles.hintText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
                {phrase.hint}
              </Text>
            </View>
          )}
          <Pressable
            style={[styles.listenBtn, { backgroundColor: isSpeaking ? colors.primary : colors.primary + "20" }]}
            onPress={handleSpeak}
          >
            <Feather name={isSpeaking ? "pause" : "volume-2"} size={20} color={isSpeaking ? colors.primaryForeground : colors.primary} />
            <Text style={[styles.listenBtnText, { color: isSpeaking ? colors.primaryForeground : colors.primary, fontFamily: "Inter_500Medium" }]}>
              {isSpeaking ? "Stop" : "Hear it"}
            </Text>
          </Pressable>
        </View>

        {/* Rating */}
        <Text style={[styles.ratingLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Rate your pronunciation:
        </Text>
        <View style={styles.ratingRow}>
          {[
            { label: "Again", score: 25, icon: "rotate-ccw", color: colors.destructive },
            { label: "Hard", score: 50, icon: "frown", color: "#f59e0b" },
            { label: "Good", score: 75, icon: "smile", color: "#60a5fa" },
            { label: "Perfect", score: 100, icon: "star", color: "#22c55e" },
          ].map((r) => (
            <Pressable
              key={r.label}
              style={({ pressed }) => [
                styles.rateBtn,
                { backgroundColor: r.color + "20", borderColor: r.color + "40", opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => handleRate(r.score)}
            >
              <Feather name={r.icon as any} size={20} color={r.color} />
              <Text style={[styles.rateBtnText, { color: r.color, fontFamily: "Inter_500Medium" }]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  lessonTitle: { fontSize: 16 },
  indexText: { fontSize: 14 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  diffText: { fontSize: 11 },
  progressBar: { height: 4, borderRadius: 2, marginBottom: 24 },
  progressFill: { height: 4, borderRadius: 2 },
  phraseCard: { borderRadius: 20, borderWidth: 1, padding: 24, marginBottom: 28, gap: 12 },
  phraseText: { fontSize: 22, lineHeight: 32 },
  translationText: { fontSize: 14, lineHeight: 20 },
  hintBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  hintText: { flex: 1, fontSize: 13, lineHeight: 18 },
  listenBtn: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "center", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30, marginTop: 4 },
  listenBtnText: { fontSize: 15 },
  ratingLabel: { fontSize: 14, textAlign: "center", marginBottom: 14 },
  ratingRow: { flexDirection: "row", gap: 10 },
  rateBtn: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  rateBtnText: { fontSize: 12 },
  doneContainer: { flex: 1, alignItems: "center", paddingHorizontal: 24 },
  doneIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  doneTitle: { fontSize: 28, marginBottom: 8 },
  doneScore: { fontSize: 48, marginBottom: 16 },
  xpEarned: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 32 },
  xpText: { fontSize: 16 },
  doneBtns: { flexDirection: "row", gap: 12, width: "100%" },
  doneBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  doneBtnText: { fontSize: 16 },
});
