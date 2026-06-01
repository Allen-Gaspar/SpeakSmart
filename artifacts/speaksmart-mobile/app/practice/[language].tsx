import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

import { useColors } from "@/hooks/useColors";
import { getLanguageById, Language, Accent } from "@/lib/languages";

const SAMPLE_PHRASES: Record<string, string[]> = {
  english:    ["Hello, how are you today?", "The weather is beautiful.", "Nice to meet you.", "Thank you very much.", "Where is the train station?"],
  spanish:    ["Hola, como estas hoy?", "El tiempo es hermoso.", "Mucho gusto.", "Muchas gracias.", "Donde esta la estacion?"],
  french:     ["Bonjour, comment allez-vous?", "Le temps est magnifique.", "Enchante.", "Merci beaucoup.", "Ou est la gare?"],
  german:     ["Hallo, wie geht es Ihnen?", "Das Wetter ist schon.", "Freut mich.", "Danke sehr.", "Wo ist der Bahnhof?"],
  japanese:   ["Konnichiwa, ogenki desu ka?", "Arigatou gozaimasu.", "Hajimemashite.", "Sumimasen.", "Eki wa doko desu ka?"],
  chinese:    ["Ni hao, ni hao ma?", "Xie xie.", "Hen gaoxing renshi ni.", "Duibuqi.", "Zhan tai zai nar?"],
  korean:     ["Annyeonghaseyo.", "Gamsahamnida.", "Mannaseo bangapseumnida.", "Joesonghamnida.", "Yeok eodi isseoyo?"],
  portuguese: ["Ola, como vai voce?", "O tempo esta lindo.", "Muito prazer.", "Obrigado.", "Onde e a estacao?"],
  italian:    ["Ciao, come stai?", "Il tempo e bellissimo.", "Piacere.", "Grazie mille.", "Dov e la stazione?"],
  arabic:     ["Marhaba, kayfa halak?", "Shukran jazilan.", "Tasharrafna.", "Aasif.", "Ayna al mahatta?"],
  tagalog:    ["Magandang umaga!", "Kumusta ka?", "Salamat!", "Paalam.", "Masarap ang pagkain!", "Saan ka pupunta?", "Magkano ito?"],
};

export default function PracticeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useLocalSearchParams<{ language: string }>();
  const lang = getLanguageById(language || "english");

  const [selectedAccent, setSelectedAccent] = useState<Accent | null>(null);
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const phrases = SAMPLE_PHRASES[language || "english"] || SAMPLE_PHRASES.english;

  useEffect(() => {
    if (lang) setSelectedAccent(lang.accents[0]);
    return () => { Speech.stop(); };
  }, [lang]);

  if (!lang) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Language not found</Text>
      </View>
    );
  }

  const currentPhrase = phrases[currentPhraseIdx];
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const handleListen = async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(currentPhrase, {
      language: selectedAccent?.speechCode || lang.speechCode,
      rate: 0.85,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleScore = (score: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newScores = [...scores, score];
    setScores(newScores);
    if (currentPhraseIdx < phrases.length - 1) {
      setCurrentPhraseIdx(currentPhraseIdx + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleReset = () => {
    setCurrentPhraseIdx(0);
    setScores([]);
    setShowResult(false);
  };

  if (showResult) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.resultContainer, { paddingTop: topPadding + 20 }]}>
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.scoreCircle, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
              <Text style={[styles.scoreNum, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{avgScore}</Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>/ 100</Text>
            </View>
            <Text style={[styles.resultTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {avgScore >= 80 ? "Excellent!" : avgScore >= 60 ? "Good work!" : "Keep practicing!"}
            </Text>
            <Text style={[styles.resultSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              You completed {phrases.length} phrases in {lang.name}
            </Text>
            <View style={styles.resultBtns}>
              <Pressable style={[styles.resultBtn, { backgroundColor: colors.secondary }]} onPress={handleReset}>
                <Feather name="refresh-cw" size={18} color={colors.foreground} />
                <Text style={[styles.resultBtnText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Try Again</Text>
              </Pressable>
              <Pressable style={[styles.resultBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
                <Feather name="check" size={18} color={colors.primaryForeground} />
                <Text style={[styles.resultBtnText, { color: colors.primaryForeground, fontFamily: "Inter_500Medium" }]}>Done</Text>
              </Pressable>
            </View>
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
          <View style={styles.headerCenter}>
            <Text style={styles.flagLarge}>{lang.flag}</Text>
            <Text style={[styles.langLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {lang.name}
            </Text>
          </View>
          <Text style={[styles.progress, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {currentPhraseIdx + 1}/{phrases.length}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressBar, { backgroundColor: colors.secondary }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${((currentPhraseIdx) / phrases.length) * 100}%` as any }]} />
        </View>

        {/* Accent selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accentScroll}>
          {lang.accents.map((accent) => (
            <Pressable
              key={accent.id}
              style={[
                styles.accentChip,
                selectedAccent?.id === accent.id
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 },
              ]}
              onPress={() => setSelectedAccent(accent)}
            >
              <Text style={[styles.accentText, { color: selectedAccent?.id === accent.id ? colors.primaryForeground : colors.foreground, fontFamily: "Inter_500Medium" }]}>
                {accent.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Phrase card */}
        <View style={[styles.phraseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.phraseInstruction, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Listen and repeat:
          </Text>
          <Text style={[styles.phraseText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {currentPhrase}
          </Text>

          <Pressable
            style={[styles.listenBtn, { backgroundColor: isSpeaking ? colors.primary : colors.primary + "20" }]}
            onPress={handleListen}
          >
            <Feather name={isSpeaking ? "pause" : "volume-2"} size={22} color={isSpeaking ? colors.primaryForeground : colors.primary} />
            <Text style={[styles.listenText, { color: isSpeaking ? colors.primaryForeground : colors.primary, fontFamily: "Inter_500Medium" }]}>
              {isSpeaking ? "Stop" : "Listen"}
            </Text>
          </Pressable>
        </View>

        {/* Self-rating */}
        <Text style={[styles.ratingLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          How did it sound?
        </Text>
        <View style={styles.ratingRow}>
          {[
            { label: "Again", icon: "rotate-ccw", score: 25, color: colors.destructive },
            { label: "Hard", icon: "frown", score: 50, color: "#f59e0b" },
            { label: "Good", icon: "smile", score: 75, color: "#60a5fa" },
            { label: "Perfect", icon: "star", score: 100, color: "#22c55e" },
          ].map((opt) => (
            <Pressable
              key={opt.label}
              style={({ pressed }) => [
                styles.ratingBtn,
                { backgroundColor: opt.color + "20", borderColor: opt.color + "40", opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => handleScore(opt.score)}
            >
              <Feather name={opt.icon as any} size={22} color={opt.color} />
              <Text style={[styles.ratingBtnText, { color: opt.color, fontFamily: "Inter_500Medium" }]}>
                {opt.label}
              </Text>
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
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  flagLarge: { fontSize: 24 },
  langLabel: { fontSize: 18 },
  progress: { fontSize: 14 },
  progressBar: { height: 4, borderRadius: 2, marginBottom: 20 },
  progressFill: { height: 4, borderRadius: 2 },
  accentScroll: { marginBottom: 20 },
  accentChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  accentText: { fontSize: 14 },
  phraseCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", marginBottom: 28, gap: 16 },
  phraseInstruction: { fontSize: 13 },
  phraseText: { fontSize: 20, textAlign: "center", lineHeight: 30 },
  listenBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30 },
  listenText: { fontSize: 16 },
  ratingLabel: { fontSize: 14, marginBottom: 14, textAlign: "center" },
  ratingRow: { flexDirection: "row", gap: 10 },
  ratingBtn: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  ratingBtnText: { fontSize: 12 },
  resultContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  resultCard: { borderRadius: 24, borderWidth: 1, padding: 32, alignItems: "center", width: "100%" },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  scoreNum: { fontSize: 48 },
  scoreLabel: { fontSize: 14 },
  resultTitle: { fontSize: 26, marginBottom: 8 },
  resultSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 28 },
  resultBtns: { flexDirection: "row", gap: 12, width: "100%" },
  resultBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  resultBtnText: { fontSize: 16 },
});
