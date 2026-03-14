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
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useSafety } from "@/context/SafetyContext";
import { useTheme } from "@/hooks/useTheme";

function CheckInTimer({ onCheckIn, onMissed }: { onCheckIn: () => void; onMissed: () => void }) {
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState(120);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useSharedValue(1);

  useEffect(() => {
    progressAnim.value = withTiming(0, { duration: 120000 });
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          onMissed();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <View style={[styles.timerCard, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}40` }]}>
      <View style={styles.timerRow}>
        <MaterialCommunityIcons name="timer-outline" size={20} color={colors.success} />
        <Text style={[styles.timerTitle, { color: colors.success, fontFamily: "Inter_600SemiBold" }]}>
          Check-in Required
        </Text>
        <Text style={[styles.timerCount, { color: colors.success, fontFamily: "Inter_700Bold" }]}>
          {mins}:{secs.toString().padStart(2, "0")}
        </Text>
      </View>
      <View style={[styles.timerBarBg, { backgroundColor: `${colors.success}20` }]}>
        <Animated.View style={[styles.timerBarFill, progressStyle, { backgroundColor: colors.success }]} />
      </View>
      <Pressable
        onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onCheckIn(); }}
        style={[styles.checkInBtn, { backgroundColor: colors.success }]}
      >
        <Feather name="check" size={18} color="#fff" />
        <Text style={[styles.checkInText, { fontFamily: "Inter_700Bold" }]}>I'm Safe</Text>
      </Pressable>
    </View>
  );
}

export default function EscortScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { startEscort, stopEscort, escortActive } = useSafety();
  const [active, setActive] = useState(false);
  const [checkIns, setCheckIns] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [missed, setMissed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dotPulse = useSharedValue(1);
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: dotPulse.value }] }));

  useEffect(() => {
    if (active) {
      dotPulse.value = withRepeat(
        withSequence(withTiming(1.3, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        true
      );
      elapsedRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      dotPulse.value = withTiming(1);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      setElapsed(0);
    }
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, [active]);

  const handleStart = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startEscort();
    setActive(true);
    setMissed(false);
  };

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    stopEscort();
    setActive(false);
    setCheckIns(0);
    setTimerKey((k) => k + 1);
  };

  const handleCheckIn = () => {
    setCheckIns((c) => c + 1);
    setTimerKey((k) => k + 1);
    setMissed(false);
  };

  const handleMissed = () => {
    setMissed(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const elapsedMins = Math.floor(elapsed / 60);
  const elapsedSecs = elapsed % 60;

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <LinearGradient
        colors={[active ? "#001A0D" : colors.navy, active ? "#0A2A18" : colors.navyLight]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 8) }]}>
        <Pressable onPress={() => { if (!active) router.back(); }} style={[styles.closeBtn, !active && { opacity: 1 }]}>
          {!active && <Feather name="x" size={22} color="rgba(255,255,255,0.8)" />}
        </Pressable>
        <Text style={[styles.topTitle, { fontFamily: "Inter_700Bold" }]}>Virtual Escort</Text>
        {active ? (
          <View style={[styles.liveChip, { backgroundColor: `${colors.success}30`, borderColor: colors.success }]}>
            <Animated.View style={[styles.liveDot, dotStyle, { backgroundColor: colors.success }]} />
            <Text style={[styles.liveText, { color: colors.success, fontFamily: "Inter_700Bold" }]}>LIVE</Text>
          </View>
        ) : (
          <View style={styles.closeBtn} />
        )}
      </View>

      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: active ? `${colors.success}20` : "rgba(255,255,255,0.07)", borderColor: active ? colors.success : "rgba(255,255,255,0.15)" }]}>
          <MaterialCommunityIcons
            name="walk"
            size={60}
            color={active ? colors.success : "rgba(255,255,255,0.5)"}
          />
        </View>

        {active && (
          <Text style={[styles.timerDisplay, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
            {elapsedMins.toString().padStart(2, "0")}:{elapsedSecs.toString().padStart(2, "0")}
          </Text>
        )}

        {active ? (
          <Text style={[styles.statusText, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
            Your contacts are being notified of your safety every 2 minutes.
          </Text>
        ) : (
          <View style={styles.startInfo}>
            <Text style={[styles.statusText, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
              Virtual Escort monitors your location and sends check-in reminders. If you miss a check-in, your emergency contacts are alerted.
            </Text>
          </View>
        )}

        {active && (
          <>
            {missed ? (
              <View style={[styles.alertBox, { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }]}>
                <MaterialCommunityIcons name="alarm-light" size={20} color={colors.primary} />
                <Text style={[styles.alertText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  Check-in missed! Contacting emergency contacts.
                </Text>
              </View>
            ) : (
              <CheckInTimer key={timerKey} onCheckIn={handleCheckIn} onMissed={handleMissed} />
            )}

            {missed && (
              <Pressable onPress={handleCheckIn} style={[styles.imSafeBtn, { backgroundColor: colors.success }]}>
                <Text style={[styles.imSafeText, { fontFamily: "Inter_700Bold" }]}>I'm Safe — Cancel Alert</Text>
              </Pressable>
            )}

            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: "rgba(255,255,255,0.07)" }]}>
                <Text style={[styles.statNum, { color: "#fff", fontFamily: "Inter_700Bold" }]}>{checkIns}</Text>
                <Text style={[styles.statLbl, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>Check-ins</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: "rgba(255,255,255,0.07)" }]}>
                <Text style={[styles.statNum, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                  {user?.emergencyContacts?.length || 0}
                </Text>
                <Text style={[styles.statLbl, { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" }]}>Contacts</Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.actionRow}>
          {active ? (
            <Pressable
              onPress={handleStop}
              style={[styles.mainBtn, { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }]}
            >
              <Feather name="square" size={20} color={colors.primary} />
              <Text style={[styles.mainBtnText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                End Escort
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleStart}
              style={[styles.mainBtn, { backgroundColor: colors.success }]}
            >
              <MaterialCommunityIcons name="walk" size={22} color="#fff" />
              <Text style={[styles.mainBtnText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                Start Escort
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  topTitle: { color: "rgba(255,255,255,0.9)", fontSize: 18 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.1)" },
  liveChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 11, letterSpacing: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 24 },
  iconCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  timerDisplay: { fontSize: 52, letterSpacing: -2 },
  statusText: { fontSize: 15, textAlign: "center", lineHeight: 24, maxWidth: 320 },
  startInfo: { paddingHorizontal: 8 },
  timerCard: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  timerTitle: { flex: 1, fontSize: 14 },
  timerCount: { fontSize: 18 },
  timerBarBg: { height: 4, borderRadius: 2, overflow: "hidden" },
  timerBarFill: { height: 4, borderRadius: 2 },
  checkInBtn: { borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  checkInText: { color: "#fff", fontSize: 15 },
  alertBox: { width: "100%", borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", gap: 12, alignItems: "center" },
  alertText: { flex: 1, fontSize: 14, lineHeight: 20 },
  imSafeBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, alignItems: "center" },
  imSafeText: { color: "#fff", fontSize: 15 },
  statsRow: { flexDirection: "row", gap: 16 },
  statBox: { flex: 1, borderRadius: 14, padding: 16, alignItems: "center", gap: 4 },
  statNum: { fontSize: 28 },
  statLbl: { fontSize: 12 },
  actionRow: { width: "100%", paddingHorizontal: 8 },
  mainBtn: { borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1, borderColor: "transparent" },
  mainBtnText: { fontSize: 17 },
});
