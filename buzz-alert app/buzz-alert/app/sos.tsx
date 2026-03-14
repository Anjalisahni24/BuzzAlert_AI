import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useSafety } from "@/context/SafetyContext";
import { useTheme } from "@/hooks/useTheme";

const COUNTDOWN_SECONDS = 10;

export default function SOSScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { triggerSOS, cancelSOS, sosActive } = useSafety();
  const [phase, setPhase] = useState<"ready" | "countdown" | "active">("ready");
  const [count, setCount] = useState(COUNTDOWN_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);
  const pulse3 = useSharedValue(1);
  const btnScale = useSharedValue(1);
  const progressAnim = useSharedValue(1);

  const ring1Style = useAnimatedStyle(() => ({ transform: [{ scale: pulse1.value }], opacity: 1 - (pulse1.value - 1) / 0.8 }));
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ scale: pulse2.value }], opacity: 1 - (pulse2.value - 1) / 0.8 }));
  const ring3Style = useAnimatedStyle(() => ({ transform: [{ scale: pulse3.value }], opacity: 1 - (pulse3.value - 1) / 0.8 }));
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  useEffect(() => {
    if (phase === "active") {
      pulse1.value = withRepeat(withSequence(withTiming(1, { duration: 0 }), withTiming(1.8, { duration: 1200, easing: Easing.out(Easing.quad) })), -1);
      pulse2.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(1.8, { duration: 1200 })), -1);
      pulse3.value = withRepeat(withSequence(withTiming(1, { duration: 800 }), withTiming(1.8, { duration: 1200 })), -1);
    }
    return () => {
      pulse1.value = withTiming(1);
      pulse2.value = withTiming(1);
      pulse3.value = withTiming(1);
    };
  }, [phase]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const startCountdown = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setPhase("countdown");
    setCount(COUNTDOWN_SECONDS);
    progressAnim.value = withTiming(0, { duration: COUNTDOWN_SECONDS * 1000 });

    intervalRef.current = setInterval(async () => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(intervalRef.current!);
          activateSOS();
          return 0;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return c - 1;
      });
    }, 1000);
  };

  const activateSOS = async () => {
    setPhase("active");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    let lat = 40.7128, lng = -74.006;
    if (Platform.OS !== "web") {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      } catch {}
    }
    await triggerSOS(lat, lng, user?.id || "unknown");
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (intervalRef.current) clearInterval(intervalRef.current);
    cancelSOS();
    setPhase("ready");
    setCount(COUNTDOWN_SECONDS);
    progressAnim.value = withTiming(1);
  };

  const handleClose = () => {
    handleCancel();
    router.back();
  };

  const progressStyle = useAnimatedStyle(() => ({ width: `${progressAnim.value * 100}%` }));

  return (
    <View style={[styles.container, { backgroundColor: phase === "active" ? "#1A0005" : "#0D1B2A" }]}>
      <LinearGradient
        colors={phase === "active" ? ["#3D0010", "#1A0005"] : ["#1B2A3B", "#0D1B2A"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 8) }]}>
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <Feather name="x" size={22} color="rgba(255,255,255,0.8)" />
        </Pressable>
        <Text style={[styles.topTitle, { fontFamily: "Inter_700Bold" }]}>SOS Alert</Text>
        <View style={styles.closeBtn} />
      </View>

      <View style={styles.content}>
        {phase === "active" && (
          <>
            <Animated.View style={[styles.ring, styles.ring3, ring3Style, { borderColor: `${colors.primary}20` }]} />
            <Animated.View style={[styles.ring, styles.ring2, ring2Style, { borderColor: `${colors.primary}40` }]} />
            <Animated.View style={[styles.ring, styles.ring1, ring1Style, { borderColor: `${colors.primary}60` }]} />
          </>
        )}

        <Animated.View style={btnStyle}>
          <Pressable
            onPressIn={() => { btnScale.value = withSpring(0.94); }}
            onPressOut={() => { btnScale.value = withSpring(1); }}
            onPress={phase === "ready" ? startCountdown : undefined}
            style={[
              styles.sosCircle,
              {
                backgroundColor: phase === "active" ? colors.primary : "#C1121F",
                borderColor: phase === "active" ? "#FF6B6B" : colors.primary,
              },
            ]}
            disabled={phase === "countdown"}
          >
            {phase === "countdown" ? (
              <Text style={[styles.countText, { fontFamily: "Inter_700Bold" }]}>{count}</Text>
            ) : (
              <>
                <MaterialCommunityIcons name="alarm-light" size={52} color="#fff" />
                <Text style={[styles.sosBtnText, { fontFamily: "Inter_700Bold" }]}>SOS</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        {phase === "countdown" && (
          <View style={styles.countdownInfo}>
            <View style={[styles.progressBg, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Animated.View style={[styles.progressFill, progressStyle, { backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.countdownText, { fontFamily: "Inter_600SemiBold" }]}>
              Sending SOS in {count} seconds
            </Text>
          </View>
        )}

        {phase === "active" && (
          <View style={styles.activeInfo}>
            <View style={[styles.activeBadge, { backgroundColor: `${colors.primary}30`, borderColor: colors.primary }]}>
              <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.activeLabel, { fontFamily: "Inter_700Bold" }]}>SOS ACTIVE</Text>
            </View>
            <Text style={[styles.activeDesc, { fontFamily: "Inter_400Regular" }]}>
              Emergency contacts notified. Authorities alerted. Stay visible.
            </Text>
            <View style={styles.contactsList}>
              {(user?.emergencyContacts || []).map((c) => (
                <View key={c.id} style={[styles.contactChip, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                  <Feather name="check-circle" size={12} color={colors.success} />
                  <Text style={[styles.contactChipText, { fontFamily: "Inter_500Medium" }]}>{c.name}</Text>
                </View>
              ))}
              {(user?.emergencyContacts?.length || 0) === 0 && (
                <Text style={[styles.noContacts, { fontFamily: "Inter_400Regular" }]}>
                  No emergency contacts configured.
                </Text>
              )}
            </View>
          </View>
        )}

        {phase === "ready" && (
          <Text style={[styles.readyHint, { fontFamily: "Inter_400Regular" }]}>
            Tap to start a 10-second countdown before sending SOS
          </Text>
        )}
      </View>

      {(phase === "countdown" || phase === "active") && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={handleCancel}
            style={[styles.cancelBtn, { backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)" }]}
          >
            <Text style={[styles.cancelText, { fontFamily: "Inter_700Bold" }]}>
              {phase === "countdown" ? "Cancel" : "Stop SOS"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  topTitle: { color: "rgba(255,255,255,0.9)", fontSize: 18 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.1)" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 32 },
  ring: { position: "absolute", borderRadius: 200, borderWidth: 2 },
  ring1: { width: 220, height: 220, borderRadius: 110 },
  ring2: { width: 280, height: 280, borderRadius: 140 },
  ring3: { width: 340, height: 340, borderRadius: 170 },
  sosCircle: { width: 180, height: 180, borderRadius: 90, borderWidth: 3, alignItems: "center", justifyContent: "center", gap: 4 },
  countText: { color: "#fff", fontSize: 64 },
  sosBtnText: { color: "#fff", fontSize: 20, letterSpacing: 3 },
  countdownInfo: { alignItems: "center", gap: 10, width: 260 },
  progressBg: { height: 4, width: "100%", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  countdownText: { color: "rgba(255,255,255,0.8)", fontSize: 15 },
  activeInfo: { alignItems: "center", gap: 12, paddingHorizontal: 32 },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 8 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  activeLabel: { color: "#fff", fontSize: 13, letterSpacing: 2 },
  activeDesc: { color: "rgba(255,255,255,0.7)", fontSize: 14, textAlign: "center", lineHeight: 22 },
  contactsList: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  contactChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  contactChipText: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  noContacts: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  readyHint: { color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", paddingHorizontal: 48, lineHeight: 22 },
  bottomBar: { paddingHorizontal: 32 },
  cancelBtn: { borderRadius: 14, borderWidth: 1, paddingVertical: 16, alignItems: "center" },
  cancelText: { color: "#fff", fontSize: 16 },
});
