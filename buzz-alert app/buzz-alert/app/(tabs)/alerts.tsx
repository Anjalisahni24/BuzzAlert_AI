import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useSafety, type DisasterAlert } from "@/context/SafetyContext";
import { useTheme } from "@/hooks/useTheme";

const DISASTER_ICONS: Record<string, string> = {
  flood: "water",
  earthquake: "pulse",
  storm: "weather-lightning-rainy",
  fire: "fire",
  tornado: "weather-tornado",
};

const SEVERITY_COLORS: Record<string, string> = {
  watch: "#F4A261",
  warning: "#E63946",
  emergency: "#C1121F",
};

function AlertCard({ alert, index }: { alert: DisasterAlert; index: number }) {
  const { colors } = useTheme();
  const sevColor = SEVERITY_COLORS[alert.severity];
  const iconName = DISASTER_ICONS[alert.type] || "alert";

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <View style={[styles.alertCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
        <LinearGradient
          colors={[`${sevColor}20`, "transparent"]}
          style={styles.alertGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={styles.alertTop}>
          <View style={[styles.alertIconWrap, { backgroundColor: `${sevColor}20` }]}>
            <MaterialCommunityIcons name={iconName as any} size={22} color={sevColor} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.alertTitleRow}>
              <Text style={[styles.alertTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
                {alert.title}
              </Text>
              <View style={[styles.severityBadge, { backgroundColor: `${sevColor}25`, borderColor: `${sevColor}50` }]}>
                <Text style={[styles.severityText, { color: sevColor, fontFamily: "Inter_700Bold" }]}>
                  {alert.severity.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.alertMeta}>
              <Feather name="map-pin" size={11} color={colors.textMuted} />
              <Text style={[styles.alertArea, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
                {alert.area}
              </Text>
            </View>
          </View>
        </View>
        <Text style={[styles.alertDesc, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
          {alert.description}
        </Text>
        <Text style={[styles.alertTime, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
          {formatTime(alert.timestamp)}
        </Text>
      </View>
    </Animated.View>
  );
}

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function AlertsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { disasters } = useSafety();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const activeCount = disasters.filter((d) => d.severity !== "watch").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: isDark ? colors.navy : "#fff" }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            Disaster Alerts
          </Text>
          {activeCount > 0 && (
            <View style={[styles.activeBadge, { backgroundColor: `${colors.riskHigh}20`, borderColor: `${colors.riskHigh}50` }]}>
              <View style={[styles.activeDot, { backgroundColor: colors.riskHigh }]} />
              <Text style={[styles.activeText, { color: colors.riskHigh, fontFamily: "Inter_700Bold" }]}>
                {activeCount} Active
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.headerSub, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
          Real-time alerts for your region
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {disasters.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="shield-check" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              All Clear
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
              No active disaster alerts in your area.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: "Inter_500Medium" }]}>
              {disasters.length} ALERT{disasters.length !== 1 ? "S" : ""} FOUND
            </Text>
            {disasters.map((alert, i) => (
              <AlertCard key={alert.id} alert={alert} index={i} />
            ))}
          </>
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="information-outline" size={20} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Alerts are sourced from official emergency management systems and updated in real-time.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, gap: 6 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  headerTitle: { fontSize: 24 },
  headerSub: { fontSize: 14 },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  activeDot: { width: 7, height: 7, borderRadius: 4 },
  activeText: { fontSize: 12 },
  scroll: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  sectionLabel: { fontSize: 11, letterSpacing: 1 },
  alertCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", padding: 16, gap: 10 },
  alertGrad: { ...StyleSheet.absoluteFillObject },
  alertTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  alertIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  alertTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1 },
  alertTitle: { fontSize: 15, flex: 1 },
  alertMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  alertArea: { fontSize: 12 },
  severityBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  severityText: { fontSize: 10, letterSpacing: 0.5 },
  alertDesc: { fontSize: 13, lineHeight: 20 },
  alertTime: { fontSize: 11 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 22 },
  emptyText: { fontSize: 15, textAlign: "center" },
  infoCard: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
