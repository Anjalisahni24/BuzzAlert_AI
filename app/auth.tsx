import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";

export default function AuthScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    btnScale.value = withSpring(0.95, {}, () => { btnScale.value = withSpring(1); });
    setError("");
    if (!form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        if (!form.name || !form.phone) {
          setError("Please fill in all fields.");
          setLoading(false);
          return;
        }
        await register(form);
      }
      router.replace("/(tabs)");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputBg = { backgroundColor: colors.backgroundSecondary, borderColor: colors.border };

  return (
    <View style={{ flex: 1, backgroundColor: colors.navy }}>
      <LinearGradient
        colors={[colors.navy, colors.navyLight, colors.navy]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={[styles.iconBg, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="shield-alert" size={36} color={colors.accent} />
            </View>
            <Text style={[styles.title, { color: "#FFFFFF", fontFamily: "Inter_700Bold" }]}>BuzzAlert</Text>
            <Text style={[styles.subtitle, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
              {mode === "login" ? "Welcome back, stay safe." : "Create your safety account."}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }]}>
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setMode("login")}
                style={[styles.toggleBtn, mode === "login" && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.toggleText, { color: mode === "login" ? "#fff" : "rgba(255,255,255,0.5)", fontFamily: "Inter_600SemiBold" }]}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode("register")}
                style={[styles.toggleBtn, mode === "register" && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.toggleText, { color: mode === "register" ? "#fff" : "rgba(255,255,255,0.5)", fontFamily: "Inter_600SemiBold" }]}>
                  Register
                </Text>
              </Pressable>
            </View>

            {mode === "register" && (
              <View style={[styles.inputWrap, inputBg]}>
                <Feather name="user" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                  placeholder="Full name"
                  placeholderTextColor={colors.textMuted}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />
              </View>
            )}

            <View style={[styles.inputWrap, inputBg]}>
              <Feather name="mail" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              />
            </View>

            {mode === "register" && (
              <View style={[styles.inputWrap, inputBg]}>
                <Feather name="phone" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                  placeholder="Phone number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                />
              </View>
            )}

            <View style={[styles.inputWrap, inputBg]}>
              <Feather name="lock" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={form.password}
                onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
              />
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: "rgba(230,57,70,0.15)", borderColor: colors.primary }]}>
                <Feather name="alert-circle" size={14} color={colors.primary} />
                <Text style={[styles.errorText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>{error}</Text>
              </View>
            ) : null}

            <Animated.View style={btnStyle}>
              <Pressable
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.submitText, { fontFamily: "Inter_700Bold" }]}>
                    {mode === "login" ? "Sign In" : "Create Account"}
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 32,
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 14,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
  },
});
