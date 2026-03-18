import React, { useRef } from 'react';
import { Animated, StyleSheet, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOW } from '../theme';

export default function GlassCard({
  children, style, onPress, intensity = 40,
  glowColor, gradient, borderColor = 'rgba(255,255,255,0.25)',
  borderWidth = 1, padding = 20, borderRadius = RADIUS.lg, animated = true,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!animated || !onPress) return;
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 15, stiffness: 250 }).start();
  };
  const handlePressOut = () => {
    if (!animated || !onPress) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 200 }).start();
  };

  const glowStyle = glowColor ? SHADOW.glow(glowColor) : SHADOW.card;

  const content = (
    <Animated.View style={[{ borderRadius, transform: [{ scale }] }, glowStyle, style]}>
      {/* Solid dark base so content is never invisible */}
      <View style={[StyleSheet.absoluteFillObject, { borderRadius, backgroundColor: 'rgba(15,10,40,0.75)' }]} />
      <BlurView intensity={intensity} tint="dark" style={[styles.blur, { borderRadius, padding }]}>
        <LinearGradient
          colors={gradient ?? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.05)']}
          style={[StyleSheet.absoluteFillObject, { borderRadius }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[StyleSheet.absoluteFillObject, { borderRadius, borderWidth, borderColor }]} pointerEvents="none" />
        {children}
      </BlurView>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={{ borderRadius }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  blur: { overflow: 'hidden' },
});
