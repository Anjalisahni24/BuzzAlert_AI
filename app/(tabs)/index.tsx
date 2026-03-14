import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
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
import type { RiskLevel } from "@/context/SafetyContext";

function RiskBadge({ level, score }: { level: RiskLevel; score: number }) {
  const { colors } = useTheme();
  const pulse = useSharedValue(1);

  const riskColors: Record<RiskLevel, string> = {
    low: colors.riskLow,
    medium: colors.riskMedium,
    high: colors.riskHigh,
  };
  const riskColor = riskColors[level];

  useEffect(() => {
    if (level === "high") {
      pulse.value = withRepeat(
        withSequence(withTiming(1.08, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1);
    }
  }, [level]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[styles.riskBadge, pulseStyle, { backgroundColor: `${riskColor}22`, borderColor: riskColor }]}>
      <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
      <Text style={[styles.riskText, { color: riskColor, fontFamily: "Inter_700Bold" }]}>
        {level.toUpperCase()} RISK
      </Text>
      <Text style={[styles.riskScore, { color: riskColor, fontFamily: "Inter_600SemiBold" }]}>
        {score}
      </Text>
    </Animated.View>
  );
}

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  accent?: string;
  danger?: boolean;
}

function ActionCard({ icon, title, subtitle, onPress, accent, danger }: ActionCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={cardStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        style={[
          styles.actionCard,
          {
            backgroundColor: danger ? `${colors.primary}15` : colors.backgroundCard,
            borderColor: danger ? `${colors.primary}40` : colors.border,
          },
        ]}
      >
        <View style={[styles.actionIcon, { backgroundColor: accent ? `${accent}20` : `${colors.primary}15` }]}>
          {icon}
        </View>
        <View style={styles.actionText}>
          <Text style={[styles.actionTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>{title}</Text>
          <Text style={[styles.actionSub, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>{subtitle}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { currentRisk, currentRiskScore, disasters, incidents, refreshData } = useSafety();
  const [locationName, setLocationName] = useState("Getting location...");
  const [refreshing, setRefreshing] = useState(false);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    if (Platform.OS === "web") {
      setLocationName("New York, NY");
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        const geo = await Location.reverseGeocodeAsync(loc.coords);
        if (geo[0]) {
          setLocationName(`${geo[0].city || geo[0].district || "Unknown"}, ${geo[0].region || ""}`);
        }
      } else {
        setLocationName("Location disabled");
      }
    } catch {
      setLocationName("New York, NY");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshData();
    await getLocation();
    setRefreshing(false);
  };

  const riskBarWidth = `${currentRiskScore}%` as `${number}%`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? [colors.navy, colors.background] : [colors.navyLight + "20", colors.background]}
        style={[styles.headerGrad, { paddingTop: topPad, paddingBottom: 0 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: isDark ? "rgba(255,255,255,0.6)" : colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              Hello, {user?.name?.split(" ")[0] || "User"}
            </Text>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={14} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                {locationName}
              </Text>
            </View>
          </View>
          <View style={[styles.pointsBadge, { backgroundColor: `${colors.accent}20`, borderColor: `${colors.accent}50` }]}>
            <MaterialCommunityIcons name="star" size={16} color={colors.accent} />
            <Text style={[styles.pointsText, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
              {user?.safetyPoints || 0}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.riskCard, { backgroundColor: isDark ? colors.navyLight : colors.backgroundCard, borderColor: colors.border }]}>
          <View style={styles.riskTop}>
            <View>
              <Text style={[styles.riskLabel, { color: colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                Area Safety Score
              </Text>
              <Text style={[styles.riskTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                Safety Rate
              </Text>
            </View>
            <RiskBadge level={currentRisk} score={currentRiskScore} />
          </View>
          <View style={[styles.riskBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.riskBarFill, { width: riskBarWidth, backgroundColor: currentRisk === "low" ? colors.riskLow : currentRisk === "medium" ? colors.riskMedium : colors.riskHigh }]} />
          </View>
          <View style={styles.riskLegend}>
            <Text style={[styles.legendText, { color: colors.riskLow, fontFamily: "Inter_500Medium" }]}>Safe</Text>
            <Text style={[styles.legendText, { color: colors.riskMedium, fontFamily: "Inter_500Medium" }]}>Moderate</Text>
            <Text style={[styles.legendText, { color: colors.riskHigh, fontFamily: "Inter_500Medium" }]}>Danger</Text>
          </View>
        </View>

        <Pressable
          onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); router.push("/sos"); }}
          style={[styles.sosBtn, { backgroundColor: colors.primary }]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.sosBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="alarm-light" size={28} color="#fff" />
            <View>
              <Text style={[styles.sosBtnTitle, { fontFamily: "Inter_700Bold" }]}>SOS ALERT</Text>
              <Text style={[styles.sosBtnSub, { fontFamily: "Inter_400Regular" }]}>Tap to trigger emergency</Text>
            </View>
          </LinearGradient>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          Safety Features
        </Text>

        <ActionCard
          icon={<MaterialCommunityIcons name="walk" size={22} color={colors.success} />}
          title="Virtual Escort"
          subtitle="Live GPS safety monitoring"
          onPress={() => router.push("/escort")}
          accent={colors.success}
        />
        <ActionCard
          icon={<MaterialCommunityIcons name="weather-tornado" size={22} color={colors.warning} />}
          title="Disaster Alerts"
          subtitle={`${disasters.length} active alerts in your area`}
          onPress={() => router.push("/(tabs)/alerts")}
          accent={colors.warning}
        />
        <ActionCard
          icon={<MaterialCommunityIcons name="police-badge" size={22} color={colors.primary} />}
          title="Nearest Police Station"
          subtitle="Find help nearby"
          onPress={() => router.push("/(tabs)/map")}
          accent={colors.primary}
        />
        <ActionCard
          icon={<Feather name="alert-triangle" size={22} color={colors.accent} />}
          title="Report Incident"
          subtitle="Help your community stay safe"
          onPress={() => router.push("/report")}
          accent={colors.accent}
        />

        {incidents.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              Recent Reports
            </Text>
            {incidents.slice(0, 3).map((inc) => (
              <View key={inc.id} style={[styles.incidentRow, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                <View style={[styles.incidentDot, { backgroundColor: inc.status === "verified" ? colors.success : colors.warning }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.incidentDesc, { color: colors.text, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                    {inc.description}
                  </Text>
                  <Text style={[styles.incidentMeta, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
                    {inc.category} · {new Date(inc.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.incidentBadge, { backgroundColor: inc.status === "verified" ? `${colors.success}20` : `${colors.warning}20` }]}>
                  <Text style={[styles.incidentStatus, { color: inc.status === "verified" ? colors.success : colors.warning, fontFamily: "Inter_500Medium" }]}>
                    {inc.status}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  greeting: { fontSize: 14, marginBottom: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 16 },
  pointsBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  pointsText: { fontSize: 15 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  riskCard: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 14 },
  riskTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  riskLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  riskTitle: { fontSize: 22 },
  riskBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 6 },
  riskDot: { width: 7, height: 7, borderRadius: 4 },
  riskText: { fontSize: 11, letterSpacing: 0.5 },
  riskScore: { fontSize: 15, marginLeft: 4 },
  riskBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  riskBarFill: { height: 6, borderRadius: 3 },
  riskLegend: { flexDirection: "row", justifyContent: "space-between" },
  legendText: { fontSize: 11 },
  sosBtn: { borderRadius: 18, overflow: "hidden" },
  sosBtnGrad: { flexDirection: "row", alignItems: "center", paddingHorizontal: 22, paddingVertical: 18, gap: 16 },
  sosBtnTitle: { color: "#fff", fontSize: 20, letterSpacing: 1 },
  sosBtnSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 18, marginTop: 4 },
  actionCard: { borderRadius: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", padding: 14, gap: 14 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 15 },
  actionSub: { fontSize: 12, marginTop: 2 },
  incidentRow: { borderRadius: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  incidentDot: { width: 8, height: 8, borderRadius: 4 },
  incidentDesc: { fontSize: 14 },
  incidentMeta: { fontSize: 12, marginTop: 2, textTransform: "capitalize" },
  incidentBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  incidentStatus: { fontSize: 11, textTransform: "capitalize" },
});
