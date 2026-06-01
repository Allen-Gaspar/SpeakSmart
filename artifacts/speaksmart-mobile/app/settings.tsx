import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { languages } from "@/lib/languages";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userData, updateUserProfile } = useAuth();
  const [sound, setSound] = useState(userData?.soundEnabled !== false);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const sections = [
    {
      title: "Preferences",
      items: [
        {
          icon: "volume-2",
          label: "Sound Effects",
          right: (
            <Switch
              value={sound}
              onValueChange={(v) => {
                setSound(v);
                updateUserProfile({ soundEnabled: v }).catch(() => {});
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.primaryForeground}
            />
          ),
        },
      ],
    },
    {
      title: "Preferred Language",
      items: languages.slice(0, 6).map((lang) => ({
        icon: "globe" as const,
        label: `${lang.flag} ${lang.name}`,
        selected: userData?.preferredLanguage === lang.id,
        onPress: () => updateUserProfile({ preferredLanguage: lang.id }).catch(() => {}),
      })),
    },
    {
      title: "About",
      items: [
        { icon: "info", label: "SPEAKSMART v1.0" },
        { icon: "heart", label: "Built with AI voice recognition" },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: 40, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              {section.title.toUpperCase()}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.items.map((item, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.item,
                    idx < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    (item as any).selected && { backgroundColor: colors.primary + "10" },
                  ]}
                  onPress={(item as any).onPress}
                  disabled={!(item as any).onPress}
                >
                  <Feather name={item.icon as any} size={18} color={(item as any).selected ? colors.primary : colors.foreground} />
                  <Text style={[styles.itemLabel, { color: (item as any).selected ? colors.primary : colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    {item.label}
                  </Text>
                  {(item as any).right && (item as any).right}
                  {(item as any).selected && <Feather name="check" size={16} color={colors.primary} />}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  item: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  itemLabel: { flex: 1, fontSize: 15 },
});
