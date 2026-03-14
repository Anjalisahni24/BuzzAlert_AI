import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useSafety, type Incident } from "@/context/SafetyContext";
import { useTheme } from "@/hooks/useTheme";

type Category = Incident["category"];

const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "theft", label: "Theft", icon: "hand-back-right" },
  { value: "assault", label: "Assault", icon: "alert-octagon" },
  { value: "vandalism", label: "Vandalism", icon: "spray" },
  { value: "fire", label: "Fire", icon: "fire" },
  { value: "flood", label: "Flood", icon: "water" },
  { value: "other", label: "Other", icon: "dots-horizontal-circle" },
];

export default function ReportScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, addSafetyPoints } = useAuth();
  const { reportIncident } = useSafety();
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const pickPhoto = async () => {
    if (Platform.OS === "web") {
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!category || !description.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    let lat = 40.7128 + (Math.random() - 0.5) * 0.02;
    let lng = -74.006 + (Math.random() - 0.5) * 0.02;

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

    await reportIncident({
      latitude: lat,
      longitude: lng,
      description: description.trim(),
      category,
      reporterId: user?.id || "anon",
    });

    await addSafetyPoints(25);
    setSubmitting(false);
    setSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContent}>
          <View style={[styles.successIcon, { backgroundColor: `${colors.success}20` }]}>
            <MaterialCommunityIcons name="check-circle" size={60} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            Report Submitted
          </Text>
          <Text style={[styles.successDesc, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Thank you for keeping your community safe. You earned 25 Safety Points.
          </Text>
          <View style={[styles.pointsEarned, { backgroundColor: `${colors.accent}20`, borderColor: `${colors.accent}50` }]}>
            <MaterialCommunityIcons name="star" size={18} color={colors.accent} />
            <Text style={[styles.pointsText, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
              +25 Safety Points
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.doneBtnText, { fontFamily: "Inter_700Bold" }]}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad, backgroundColor: colors.backgroundCard, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          Report Incident
        </Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: "Inter_500Medium" }]}>
            INCIDENT TYPE
          </Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() => { setCategory(cat.value); Haptics.selectionAsync(); }}
                style={[
                  styles.catCard,
                  {
                    backgroundColor: category === cat.value ? `${colors.primary}20` : colors.backgroundCard,
                    borderColor: category === cat.value ? colors.primary : colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={24}
                  color={category === cat.value ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.catLabel,
                    {
                      color: category === cat.value ? colors.primary : colors.textSecondary,
                      fontFamily: category === cat.value ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: "Inter_500Medium" }]}>
            DESCRIPTION
          </Text>
          <TextInput
            style={[styles.textArea, {
              backgroundColor: colors.backgroundCard,
              borderColor: colors.border,
              color: colors.text,
              fontFamily: "Inter_400Regular",
            }]}
            placeholder="Describe what happened..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: "Inter_500Medium" }]}>
            PHOTO (OPTIONAL)
          </Text>
          {photo ? (
            <View style={styles.photoWrap}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <Pressable
                onPress={() => setPhoto(null)}
                style={[styles.removePhoto, { backgroundColor: colors.primary }]}
              >
                <Feather name="x" size={14} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={pickPhoto}
              style={[styles.photoBtn, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
            >
              <Feather name="camera" size={24} color={colors.textMuted} />
              <Text style={[styles.photoBtnText, { color: colors.textMuted, fontFamily: "Inter_400Regular" }]}>
                {Platform.OS === "web" ? "Photo upload on mobile" : "Tap to add photo"}
              </Text>
            </Pressable>
          )}

          <View style={[styles.locationNote, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}>
            <Feather name="map-pin" size={14} color={colors.primary} />
            <Text style={[styles.locationNoteText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
              Location will be captured automatically
            </Text>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting || !category || !description.trim()}
            style={[
              styles.submitBtn,
              {
                backgroundColor: category && description.trim() ? colors.primary : colors.border,
                opacity: submitting ? 0.7 : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="send" size={18} color="#fff" />
                <Text style={[styles.submitText, { fontFamily: "Inter_700Bold" }]}>Submit Report</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  topTitle: { fontSize: 18 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  sectionLabel: { fontSize: 11, letterSpacing: 1, marginBottom: -4 },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catCard: { width: "30%", flexGrow: 1, borderRadius: 14, borderWidth: 1.5, padding: 14, alignItems: "center", gap: 8 },
  catLabel: { fontSize: 12, textAlign: "center" },
  textArea: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 120, lineHeight: 22 },
  photoBtn: { borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", padding: 28, alignItems: "center", gap: 10 },
  photoBtnText: { fontSize: 14 },
  photoWrap: { position: "relative", borderRadius: 14, overflow: "hidden" },
  photo: { width: "100%", height: 200, borderRadius: 14 },
  removePhoto: { position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  locationNote: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  locationNoteText: { fontSize: 13, flex: 1 },
  submitBtn: { borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  submitText: { color: "#fff", fontSize: 16 },
  successContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 20 },
  successIcon: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26 },
  successDesc: { fontSize: 15, textAlign: "center", lineHeight: 24 },
  pointsEarned: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  pointsText: { fontSize: 16 },
  doneBtn: { borderRadius: 14, paddingVertical: 15, paddingHorizontal: 48, alignItems: "center" },
  doneBtnText: { color: "#fff", fontSize: 16 },
});
