import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const MOCK_LEADERS = [
  { rank: 1, name: "Alex Chen", xp: 4820, level: 12, streak: 45, badge: "🥇" },
  { rank: 2, name: "Sofia M.", xp: 3950, level: 10, streak: 30, badge: "🥈" },
  { rank: 3, name: "James K.", xp: 3200, level: 8, streak: 22, badge: "🥉" },
  { rank: 4, name: "Mia Tanaka", xp: 2780, level: 7, streak: 18, badge: "" },
  { rank: 5, name: "Lucas O.", xp: 2450, level: 6, streak: 14, badge: "" },
  { rank: 6, name: "Emma R.", xp: 2100, level: 5, streak: 10, badge: "" },
  { rank: 7, name: "Noah S.", xp: 1850, level: 5, streak: 8, badge: "" },
  { rank: 8, name: "Ava P.", xp: 1600, level: 4, streak: 6, badge: "" },
  { rank: 9, name: "Ethan W.", xp: 1320, level: 4, streak: 5, badge: "" },
  { rank: 10, name: "Isabella G.", xp: 1050, level: 3, streak: 3, badge: "" },
];

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userData } = useAuth();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 80;

  const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: bottomPadding, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Leaderboard
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Top speakers this week
        </Text>

        {/* Top 3 podium */}
        <View style={styles.podium}>
          {/* 2nd */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, { backgroundColor: "#C0C0C020", borderColor: "#C0C0C0" }]}>
              <Text style={styles.podiumAvatarText}>{MOCK_LEADERS[1].name[0]}</Text>
            </View>
            <Text style={[styles.podiumName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
              {MOCK_LEADERS[1].name}
            </Text>
            <Text style={[styles.podiumXP, { color: "#C0C0C0", fontFamily: "Inter_700Bold" }]}>
              {MOCK_LEADERS[1].xp}
            </Text>
            <View style={[styles.podiumBase, { backgroundColor: "#C0C0C0", height: 60 }]}>
              <Text style={styles.podiumRank}>2</Text>
            </View>
          </View>

          {/* 1st */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, { backgroundColor: "#FFD70020", borderColor: "#FFD700", width: 60, height: 60, borderRadius: 30 }]}>
              <Text style={[styles.podiumAvatarText, { fontSize: 22 }]}>{MOCK_LEADERS[0].name[0]}</Text>
            </View>
            <Text style={[styles.podiumName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
              {MOCK_LEADERS[0].name}
            </Text>
            <Text style={[styles.podiumXP, { color: "#FFD700", fontFamily: "Inter_700Bold" }]}>
              {MOCK_LEADERS[0].xp}
            </Text>
            <View style={[styles.podiumBase, { backgroundColor: "#FFD700", height: 80 }]}>
              <Text style={[styles.podiumRank, { fontSize: 24 }]}>1</Text>
            </View>
          </View>

          {/* 3rd */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, { backgroundColor: "#CD7F3220", borderColor: "#CD7F32" }]}>
              <Text style={styles.podiumAvatarText}>{MOCK_LEADERS[2].name[0]}</Text>
            </View>
            <Text style={[styles.podiumName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
              {MOCK_LEADERS[2].name}
            </Text>
            <Text style={[styles.podiumXP, { color: "#CD7F32", fontFamily: "Inter_700Bold" }]}>
              {MOCK_LEADERS[2].xp}
            </Text>
            <View style={[styles.podiumBase, { backgroundColor: "#CD7F32", height: 44 }]}>
              <Text style={styles.podiumRank}>3</Text>
            </View>
          </View>
        </View>

        {/* Rest of list */}
        <View style={styles.list}>
          {MOCK_LEADERS.slice(3).map((leader) => (
            <View
              key={leader.rank}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.rank, { color: colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
                {leader.rank}
              </Text>
              <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.avatarText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {leader.name[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {leader.name}
                </Text>
                <Text style={[styles.levelText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Level {leader.level} · {leader.streak}d streak
                </Text>
              </View>
              <View style={styles.xpContainer}>
                <Feather name="zap" size={13} color={colors.primary} />
                <Text style={[styles.xpText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  {leader.xp}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* My rank */}
        {userData && (
          <View style={[styles.myRank, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
            <Feather name="user" size={16} color={colors.primary} />
            <Text style={[styles.myRankText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
              You · Level {userData.level} · {userData.xp} XP
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  podium: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", gap: 8, marginBottom: 24 },
  podiumItem: { alignItems: "center", width: 100 },
  podiumAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  podiumAvatarText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  podiumName: { fontSize: 12, textAlign: "center", marginBottom: 2 },
  podiumXP: { fontSize: 13, marginBottom: 6 },
  podiumBase: { width: "100%", borderRadius: 8, alignItems: "center", justifyContent: "center" },
  podiumRank: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  list: { gap: 10, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  rank: { width: 24, textAlign: "center", fontSize: 15 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16 },
  name: { fontSize: 15 },
  levelText: { fontSize: 12 },
  xpContainer: { flexDirection: "row", alignItems: "center", gap: 3 },
  xpText: { fontSize: 14 },
  myRank: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  myRankText: { fontSize: 14 },
});
