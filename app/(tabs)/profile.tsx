import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth, type EmergencyContact } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";

function PointsTier({ points }: { points: number }) {
  const { colors } = useTheme();
  const tiers = [
    { label: "Bronze", min: 0, max: 100, color: "#CD7F32" },
    { label: "Silver", min: 100, max: 300, color: "#C0C0C0" },
    { label: "Gold", min: 300, max: 700, color: "#FFD700" },
    { label: "Platinum", min: 700, max: Infinity, color: "#E5E4E2" },
  ];
  const tier = tiers.find((t) => points >= t.min && points < t.max) || tiers[0];

  return (
    <View style={[styles.tierBadge, { backgroundColor: `${tier.color}20`, borderColor: `${tier.color}50` }]}>
      <MaterialCommunityIcons name="medal" size={14} color={tier.color} />
      <Text style={[styles.tierText, { color: tier.color, fontFamily: "Inter_700Bold" }]}>
        {tier.label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const [editingContact, setEditingContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleLogout = () => {
    if (Platform.OS === "web") {
      logout().then(() => router.replace("/auth"));
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout().then(() => router.replace("/auth")) },
    ]);
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) return;
    const updated = [
      ...(user?.emergencyContacts || []),
      {
        id: Date.now().toString(),
        name: newContact.name,
        phone: newContact.phone,
      },
    ];
    updateUser({ emergencyContacts: updated });
    setNewContact({ name: "", phone: "" });
    setEditingContact(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const removeContact = (id: string) => {
    const updated = (user?.emergencyContacts || []).filter((c) => c.id !== id);
    updateUser({ emergencyContacts: updated });
  };

  const points = user?.safetyPoints || 0;
  const nextTierPoints = points < 100 ? 100 : points < 300 ? 300 : points < 700 ? 700 : 1000;
  const progress = Math.min((points / nextTierPoints) * 100, 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? [colors.navy, colors.navyLight] : [colors.navyLight + "30", colors.background]}
        style={[styles.headerBg, { paddingTop: topPad }]}
      >
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <View style={[styles.roleTag, { backgroundColor: colors.navyMid }]}>
            <Text style={[styles.roleText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
              {user?.role?.toUpperCase() || "USER"}
            </Text>
          </View>
        </View>
        <Text style={[styles.name, { color: isDark ? "#fff" : colors.text, fontFamily: "Inter_700Bold" }]}>
          {user?.name || "User"}
        </Text>
        <Text style={[styles.email, { color: isDark ? "rgba(255,255,255,0.6)" : colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
          {user?.email}
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pointsCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <View style={styles.pointsRow}>
            <View>
              <Text style={[styles.pointsLabel, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
                Safety Points
              </Text>
              <Text style={[styles.pointsValue, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
                {points.toLocaleString()}
              </Text>
            </View>
            <PointsTier points={points} />
          </View>
          <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressLabel, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
            {nextTierPoints - points} points to next tier
          </Text>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Reports", value: "3", icon: "flag" },
            { label: "Verified", value: "1", icon: "check-circle" },
            { label: "Helped", value: "12", icon: "users" },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <Feather name={stat.icon as any} size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="phone-alert" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              Emergency Contacts
            </Text>
            <Pressable onPress={() => setEditingContact(!editingContact)} style={styles.addBtn}>
              <Feather name={editingContact ? "x" : "plus"} size={18} color={colors.primary} />
            </Pressable>
          </View>

          {editingContact && (
            <View style={[styles.addForm, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                style={[styles.addInput, { color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="Contact name"
                placeholderTextColor={colors.textMuted}
                value={newContact.name}
                onChangeText={(v) => setNewContact((n) => ({ ...n, name: v }))}
              />
              <TextInput
                style={[styles.addInput, { color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="Phone number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={newContact.phone}
                onChangeText={(v) => setNewContact((n) => ({ ...n, phone: v }))}
              />
              <Pressable
                onPress={addContact}
                style={[styles.addSave, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.addSaveText, { fontFamily: "Inter_600SemiBold" }]}>Add Contact</Text>
              </Pressable>
            </View>
          )}

          {(user?.emergencyContacts || []).length === 0 ? (
            <Text style={[styles.emptyContacts, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
              No emergency contacts added yet.
            </Text>
          ) : (
            (user?.emergencyContacts || []).map((c: EmergencyContact) => (
              <View key={c.id} style={[styles.contactRow, { borderTopColor: colors.border }]}>
                <View style={[styles.contactAvatar, { backgroundColor: `${colors.primary}20` }]}>
                  <Text style={[styles.contactAvatarText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    {c.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactName, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                    {c.name}
                  </Text>
                  <Text style={[styles.contactPhone, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
                    {c.phone}
                  </Text>
                </View>
                <Pressable onPress={() => removeContact(c.id)}>
                  <Feather name="trash-2" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <Pressable
            style={styles.menuRow}
            onPress={() => router.push("/report")}
          >
            <Feather name="file-text" size={18} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
              My Reports
            </Text>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        <Pressable
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}
        >
          <Feather name="log-out" size={18} color={colors.primary} />
          <Text style={[styles.logoutText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBg: { paddingHorizontal: 20, paddingBottom: 24, alignItems: "center", gap: 6 },
  avatarWrap: { alignItems: "center", marginTop: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  avatarText: { color: "#fff", fontSize: 32 },
  roleTag: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginTop: -8 },
  roleText: { fontSize: 10, letterSpacing: 1 },
  name: { fontSize: 22 },
  email: { fontSize: 14 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  pointsCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  pointsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pointsLabel: { fontSize: 12, marginBottom: 4 },
  pointsValue: { fontSize: 32 },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  tierText: { fontSize: 13 },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 11 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 6 },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 11 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 0 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  sectionTitle: { flex: 1, fontSize: 15 },
  addBtn: { padding: 4 },
  addForm: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 8, marginBottom: 12 },
  addInput: { borderRadius: 8, borderWidth: 1, padding: 10, fontSize: 14 },
  addSave: { borderRadius: 8, padding: 12, alignItems: "center" },
  addSaveText: { color: "#fff", fontSize: 14 },
  emptyContacts: { fontSize: 13, textAlign: "center", paddingVertical: 12 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 12, borderTopWidth: 1 },
  contactAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  contactAvatarText: { fontSize: 16 },
  contactName: { fontSize: 14 },
  contactPhone: { fontSize: 12, marginTop: 1 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuText: { flex: 1, fontSize: 15 },
  logoutBtn: { borderRadius: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14 },
  logoutText: { fontSize: 15 },
});
