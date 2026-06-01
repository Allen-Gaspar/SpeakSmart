import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, signInWithGoogle, googleAvailable } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (mode === "register" && !displayName) {
      setError("Please enter your name");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      const msg = e?.code === "auth/invalid-credential"
        ? "Incorrect email or password."
        : e?.code === "auth/email-already-in-use"
        ? "An account with this email already exists."
        : e?.code === "auth/weak-password"
        ? "Password must be at least 6 characters."
        : e?.message || "Authentication failed";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      setError(e.message || "Google sign-in failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding + 20, paddingBottom: 40, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Close */}
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={24} color={colors.foreground} />
        </Pressable>

        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="mic" size={28} color={colors.primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {mode === "login" ? "Welcome back" : "Create account"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {mode === "login" ? "Sign in to continue your language journey" : "Start your language learning adventure"}
        </Text>

        {/* Google Sign-In — only shown on web */}
        {googleAvailable && (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.googleBtn,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed || googleLoading ? 0.6 : 1 },
              ]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <>
                  <Text style={styles.googleG}>G</Text>
                  <Text style={[styles.googleText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>
          </>
        )}

        {/* Mode toggle */}
        <View style={[styles.toggle, { backgroundColor: colors.secondary }]}>
          {(["login", "register"] as const).map((m) => (
            <Pressable
              key={m}
              style={[
                styles.toggleBtn,
                mode === m && { backgroundColor: colors.primary },
              ]}
              onPress={() => { setMode(m); setError(""); }}
            >
              <Text style={[styles.toggleText, { color: mode === m ? colors.primaryForeground : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                {m === "login" ? "Sign In" : "Register"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Fields */}
        {mode === "register" && (
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="user" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="mail" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder="Email address"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
        </View>

        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="lock" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder="Password"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + "20", borderColor: colors.destructive + "40" }]}>
            <Feather name="alert-circle" size={16} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>
              {error}
            </Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.submitText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { alignSelf: "flex-end", padding: 8, marginBottom: 12 },
  logoRow: { alignItems: "center", marginBottom: 20 },
  logoIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingVertical: 14, marginBottom: 20 },
  googleG: { fontSize: 18, fontWeight: "700", color: "#4285F4" },
  googleText: { fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  toggle: { flexDirection: "row", borderRadius: 14, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  toggleText: { fontSize: 15 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  input: { flex: 1, fontSize: 16 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  errorText: { flex: 1, fontSize: 13 },
  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 4 },
  submitText: { fontSize: 17 },
});
