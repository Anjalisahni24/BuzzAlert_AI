import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSafety } from "@/context/SafetyContext";
import { useTheme } from "@/hooks/useTheme";
import type { RiskLevel } from "@/context/SafetyContext";

const { width } = Dimensions.get("window");

const POLICE_STATIONS = [
  { id: "p1", name: "1st Precinct", latitude: 40.7148, longitude: -74.009, distance: "0.4 mi" },
  { id: "p2", name: "5th Precinct", latitude: 40.7162, longitude: -73.999, distance: "0.7 mi" },
  { id: "p3", name: "7th Precinct", latitude: 40.7118, longitude: -73.985, distance: "1.2 mi" },
];

let MapView: any = null;
let Circle: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;

if (Platform.OS !== "web") {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Circle = maps.Circle;
  Marker = maps.Marker;
  PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
}

export default function MapScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { safetyZones, incidents } = useSafety();
  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showPolice, setShowPolice] = useState(false);
  const [filter, setFilter] = useState<"all" | "risk" | "incidents">("all");

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  useEffect(() => {
    if (Platform.OS !== "web") {
      Location.requestForegroundPermissionsAsync().then(({ status }) => {
        if (status === "granted") {
          Location.getCurrentPositionAsync({}).then((loc) => {
            setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          });
        }
      });
    } else {
      setUserLocation({ latitude: 40.7128, longitude: -74.006 });
    }
  }, []);

  const riskColors: Record<RiskLevel, string> = {
    low: colors.riskLow,
    medium: colors.riskMedium,
    high: colors.riskHigh,
  };

  const defaultRegion = {
    latitude: userLocation?.latitude ?? 40.7128,
    longitude: userLocation?.longitude ?? -74.006,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad, backgroundColor: isDark ? colors.navy : "#fff" }]}>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>Risk Map</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Open on mobile for the interactive map view
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.webScroll}>
          <View style={[styles.webMapPlaceholder, { backgroundColor: isDark ? colors.navyLight : colors.backgroundCard, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="map-search" size={56} color={colors.textMuted} />
            <Text style={[styles.webMapTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              Interactive Map
            </Text>
            <Text style={[styles.webMapSub, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
              The live risk map with GPS overlay is available on iOS and Android.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            Risk Zones
          </Text>
          {safetyZones.map((zone) => (
            <View key={zone.id} style={[styles.zoneRow, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <View style={[styles.riskDot, { backgroundColor: riskColors[zone.riskLevel] }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.zoneCoords, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                </Text>
                <Text style={[styles.zoneRisk, { color: riskColors[zone.riskLevel], fontFamily: "Inter_500Medium" }]}>
                  {zone.riskLevel.toUpperCase()} RISK — Score {zone.riskScore}
                </Text>
              </View>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            Nearby Police Stations
          </Text>
          {POLICE_STATIONS.map((ps) => (
            <View key={ps.id} style={[styles.zoneRow, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <View style={[styles.policeIcon, { backgroundColor: `${colors.primary}20` }]}>
                <MaterialCommunityIcons name="police-badge" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.zoneCoords, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  {ps.name}
                </Text>
                <Text style={[styles.zoneRisk, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
                  {ps.distance} away
                </Text>
              </View>
              <Feather name="navigation" size={16} color={colors.primary} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: isDark ? colors.navy : "#fff" }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>Risk Map</Text>
        <View style={styles.filterRow}>
          {(["all", "risk", "incidents"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => { setFilter(f); Haptics.selectionAsync(); }}
              style={[styles.filterBtn, filter === f && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.filterText, { color: filter === f ? "#fff" : colors.textSecondary, fontFamily: "Inter_500Medium" }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={defaultRegion}
        showsUserLocation
        userInterfaceStyle={isDark ? "dark" : "light"}
      >
        {(filter === "all" || filter === "risk") && safetyZones.map((zone) => (
          <Circle
            key={zone.id}
            center={{ latitude: zone.latitude, longitude: zone.longitude }}
            radius={zone.radius}
            fillColor={`${riskColors[zone.riskLevel]}30`}
            strokeColor={`${riskColors[zone.riskLevel]}80`}
            strokeWidth={2}
          />
        ))}
        {(filter === "all" || filter === "incidents") && incidents.map((inc) => (
          <Marker
            key={inc.id}
            coordinate={{ latitude: inc.latitude, longitude: inc.longitude }}
            title={inc.description}
            description={inc.category}
          >
            <View style={[styles.markerWrap, { backgroundColor: colors.warning }]}>
              <Feather name="alert-triangle" size={12} color="#fff" />
            </View>
          </Marker>
        ))}
        {showPolice && POLICE_STATIONS.map((ps) => (
          <Marker
            key={ps.id}
            coordinate={{ latitude: ps.latitude, longitude: ps.longitude }}
            title={ps.name}
          >
            <View style={[styles.markerWrap, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="police-badge" size={12} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>

      <Pressable
        onPress={() => { setShowPolice(!showPolice); Haptics.selectionAsync(); }}
        style={[styles.policeToggle, { backgroundColor: showPolice ? colors.primary : colors.backgroundCard, borderColor: colors.border }]}
      >
        <MaterialCommunityIcons name="police-badge" size={20} color={showPolice ? "#fff" : colors.textSecondary} />
        <Text style={[styles.policeToggleText, { color: showPolice ? "#fff" : colors.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
          Police Stations
        </Text>
      </Pressable>

      {showPolice && (
        <View style={[styles.policeList, { backgroundColor: isDark ? colors.navyLight : "#fff", borderColor: colors.border }]}>
          <Text style={[styles.policeListTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            Nearby Stations
          </Text>
          {POLICE_STATIONS.map((ps) => (
            <View key={ps.id} style={[styles.policeItem, { borderTopColor: colors.border }]}>
              <View style={[styles.policeIcon, { backgroundColor: `${colors.primary}20` }]}>
                <MaterialCommunityIcons name="police-badge" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.policeName, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>{ps.name}</Text>
                <Text style={[styles.policeDist, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>{ps.distance} away</Text>
              </View>
              <Feather name="navigation" size={16} color={colors.primary} />
            </View>
          ))}
        </View>
      )}

      <View style={styles.legend}>
        {(["low", "medium", "high"] as const).map((level) => (
          <View key={level} style={[styles.legendItem, { backgroundColor: `${riskColors[level]}20`, borderColor: `${riskColors[level]}50` }]}>
            <View style={[styles.legendDot, { backgroundColor: riskColors[level] }]} />
            <Text style={[styles.legendLabel, { color: riskColors[level], fontFamily: "Inter_500Medium" }]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  headerTitle: { fontSize: 24, marginTop: 8 },
  headerSub: { fontSize: 14 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  filterText: { fontSize: 13 },
  map: { flex: 1 },
  markerWrap: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  policeToggle: { position: "absolute", bottom: 160, left: 16, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, borderWidth: 1 },
  policeToggleText: { fontSize: 13 },
  policeList: { position: "absolute", bottom: 90, left: 16, right: 16, borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  policeListTitle: { fontSize: 15, marginBottom: 8 },
  policeItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 10, borderTopWidth: 1 },
  policeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  policeName: { fontSize: 14 },
  policeDist: { fontSize: 12, marginTop: 1 },
  legend: { position: "absolute", top: 130, right: 12, gap: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { fontSize: 11 },
  webScroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 12 },
  webMapPlaceholder: { borderRadius: 20, borderWidth: 1, padding: 48, alignItems: "center", gap: 16 },
  webMapTitle: { fontSize: 22 },
  webMapSub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  sectionTitle: { fontSize: 18, marginTop: 8 },
  zoneRow: { borderRadius: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  riskDot: { width: 10, height: 10, borderRadius: 5 },
  zoneCoords: { fontSize: 14 },
  zoneRisk: { fontSize: 12, marginTop: 2 },
});
