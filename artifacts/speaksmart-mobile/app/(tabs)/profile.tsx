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
import { useAuth } from "@/context/AuthContext";

const ACHIEVEMENTS = [
  { id: "welcome", icon: "star", label: "Welcome" },
  { id: "first-lesson", icon: "book-open", label: "First Lesson" },
  { id: "streak-7", icon: "calendar", label: "7-Day Streak" },
  { id: "xp-100", icon: "zap", label: "100 XP" },
  { id: "polyglot", icon: "globe", label: "Polyglot" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, userData, signOut } = useAuth();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 80;

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.guestContainer, { paddingTop: topPadding + 80 }]}>
          <View style={[styles.guestIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="user" size={48} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Sign in to track progress
          </Text>
          <Text style={[styles.guestSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Create an account to save your XP, streaks, and achievements across devices
          </Text>
          <Pressable
            style={[styles.signInBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth")}
          >
            <Text style={[styles.signInBtnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
              Sign In
            </Text>
          </Pressable>
          <Pressable
            style={[styles.registerBtn, { borderColor: colors.border }]}
            onPress={() => router.push("/auth")}
          >
            <Text style={[styles.registerBtnText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              Create Account
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: bottomPadding, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {(userData?.displayName || user.email || "U")[0].toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.displayName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {userData?.displayName || "Language Learner"}
          </Text>
          <Text style={[styles.email, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {user.email}
          </Text>
          <View style={styles.levelRow}>
            <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.levelText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
                Lv {userData?.level || 1}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { icon: "zap", label: "Total XP", value: String(userData?.xp || 0), color: colors.primary },
            { icon: "calendar", label: "Streak", value: `${userData?.streak || 0}d`, color: "#f59e0b" },
            { icon: "book-open", label: "Lessons", value: String(userData?.totalLessons || 0), color: "#22c55e" },
            { icon: "clock", label: "Minutes", value: String(userData?.totalPracticeMinutes || 0), color: "#60a5fa" },
          ].map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name={stat.icon as any} size={20} color={stat.color} />
              <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Achievements */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          Achievements
        </Text>
        <View style={styles.achievementRow}>
          {ACHIEVEMENTS.map((ach) => {
            const earned = userData?.achievements?.includes(ach.id);
            return (
              <View
                key={ach.id}
                style={[
                  styles.achievement,
                  { backgroundColor: earned ? colors.primary + "20" : colors.card, borderColor: earned ? colors.primary + "40" : colors.border },
                ]}
              >
                <Feather name={ach.icon as any} size={22} color={earned ? colors.primary : colors.mutedForeground} />
                <Text
                  style={[styles.achLabel, { color: earned ? colors.foreground : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}
                  numberOfLines={1}
                >
                  {ach.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Settings / Sign out */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/settings")}
          >
            <Feather name="settings" size={20} color={colors.foreground} />
            <Text style={[styles.actionLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              Settings
            </Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>

          <Pressable
            style={[styles.actionRow, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await signOut();
            }}
          >
            <Feather name="log-out" size={20} color={colors.destructive} />
            <Text style={[styles.actionLabel, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  guestContainer: { flex: 1, alignItems: "center", paddingHorizontal: 32 },
  guestIcon: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  guestTitle: { fontSize: 22, textAlign: "center", marginBottom: 10 },
  guestSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 28 },
  signInBtn: { width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center", marginBottom: 12 },
  signInBtnText: { fontSize: 16 },
  registerBtn: { width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1 },
  registerBtnText: { fontSize: 16 },
  profileHeader: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: "bold" },
  displayName: { fontSize: 22, marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 12 },
  levelRow: { flexDirection: "row", gap: 8 },
  levelBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  levelText: { fontSize: 14 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  statCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 16, alignItems: "center", gap: 6 },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 12 },
  sectionTitle: { fontSize: 18, marginBottom: 14 },
  achievementRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  achievement: { width: "30%", borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center", gap: 6 },
  achLabel: { fontSize: 11, textAlign: "center" },
  actions: { gap: 10 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 16 },
  actionLabel: { flex: 1, fontSize: 16 },
});
