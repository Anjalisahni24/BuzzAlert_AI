import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SplashIndexScreen() {
  const { isLoading, isAuthenticated } = useAuth();
  const { colors } = useTheme();

  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.5);
  const ringOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    ringOpacity.value = withDelay(300, withTiming(0.4, { duration: 400 }));
    ringScale.value = withDelay(300, withSpring(1.4, { damping: 8, stiffness: 60 }));
    textOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace("/(tabs)");
      } else {
        router.replace("/auth");
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <View style={styles.center}>
        <Animated.View style={[styles.ringOuter, ringStyle, { borderColor: colors.primary }]} />
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <View style={[styles.iconBg, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="shield-alert" size={52} color={colors.accent} />
          </View>
        </Animated.View>
      </View>

      <Animated.Text style={[styles.title, textStyle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
        BuzzAlert
      </Animated.Text>
      <Animated.Text style={[styles.tagline, taglineStyle, { color: colors.textSecondary, fontFamily: "Inter_400Regular" }]}>
        Stay aware. Stay safe.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    width: 130,
    height: 130,
  },
  ringOuter: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconBg: {
    width: 90,
    height: 90,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 36,
    letterSpacing: -1,
    marginTop: 8,
  },
  tagline: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
