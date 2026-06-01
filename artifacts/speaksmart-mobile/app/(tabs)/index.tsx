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
import { useAuth } from "@/context/AuthContext";
import { languages } from "@/lib/languages";

export default function PracticeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, userData } = useAuth();

  const quickLanguages = languages.slice(0, 6);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 80;

  const handleLanguagePress = (langId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/practice/${langId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: bottomPadding, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {user ? `Welcome back,` : "Welcome to"}
            </Text>
            <Text style={[styles.appName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {user && userData?.displayName ? userData.displayName : "SPEAKSMART"}
            </Text>
          </View>
          {user && userData && (
            <View style={[styles.xpBadge, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
              <Feather name="zap" size={14} color={colors.primary} />
              <Text style={[styles.xpText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                {userData.xp} XP
              </Text>
            </View>
          )}
        </View>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="mic" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Start Speaking
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Choose a language and practice your pronunciation with real-time feedback
          </Text>
          {!user && (
            <Pressable
              style={[styles.signInBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/auth")}
            >
              <Text style={[styles.signInBtnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
                Sign In to Track Progress
              </Text>
            </Pressable>
          )}
        </View>

        {/* Stats row (logged in only) */}
        {user && userData && (
          <View style={styles.statsRow}>
            {[
              { icon: "trending-up", label: "Level", value: String(userData.level) },
              { icon: "calendar", label: "Streak", value: `${userData.streak}d` },
              { icon: "book-open", label: "Lessons", value: String(userData.totalLessons) },
            ].map((stat) => (
              <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name={stat.icon as any} size={18} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Practice */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          Quick Practice
        </Text>
        <View style={styles.langGrid}>
          {quickLanguages.map((lang) => (
            <Pressable
              key={lang.id}
              style={({ pressed }) => [
                styles.langCard,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => handleLanguagePress(lang.id)}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[styles.langName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {lang.name}
              </Text>
              <Text style={[styles.langAccents, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {lang.accents.length} accents
              </Text>
            </Pressable>
          ))}
        </View>

        {/* View all languages */}
        <Pressable
          style={({ pressed }) => [styles.viewAllBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/(tabs)/languages")}
        >
          <Text style={[styles.viewAllText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
            View all languages
          </Text>
          <Feather name="arrow-right" size={16} color={colors.primary} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontSize: 14 },
  appName: { fontSize: 24 },
  xpBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  xpText: { fontSize: 14 },
  heroCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", marginBottom: 20 },
  heroIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  heroTitle: { fontSize: 22, marginBottom: 8 },
  heroSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  signInBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  signInBtnText: { fontSize: 15 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 4 },
  statValue: { fontSize: 20 },
  statLabel: { fontSize: 11 },
  sectionTitle: { fontSize: 18, marginBottom: 14 },
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  langCard: { width: "47%", borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  langFlag: { fontSize: 28, marginBottom: 4 },
  langName: { fontSize: 15 },
  langAccents: { fontSize: 12 },
  viewAllBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  viewAllText: { fontSize: 15 },
});
