import React, { useRef } from 'react';
import { Animated, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOW } from '../theme';

export default function GlassCard({
  children,
  style,
  onPress,
  intensity = 20,
  glowColor,
  gradient,
  borderColor = COLORS.glass.border,
  borderWidth = 1,
  padding = 20,
  borderRadius = RADIUS.lg,
  animated = true,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!animated || !onPress) return;
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      damping: 15,
      stiffness: 250,
    }).start();
  };

  const handlePressOut = () => {
    if (!animated || !onPress) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 200,
    }).start();
  };

  const glowStyle = glowColor ? SHADOW.glow(glowColor) : SHADOW.card;

  const content = (
    <Animated.View
      style={[
        styles.wrapper,
        { borderRadius, transform: [{ scale }] },
        glowStyle,
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[styles.blur, { borderRadius, padding }]}
      >
        {/* Glass gradient layer */}
        <LinearGradient
          colors={gradient ?? COLORS.gradients?.glass ?? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']}
          style={[StyleSheet.absoluteFillObject, { borderRadius }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Border shimmer */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius,
              borderWidth,
              borderColor,
            },
          ]}
          pointerEvents="none"
        />

        {children}
      </BlurView>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ borderRadius }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  blur: {
    overflow: 'hidden',
  },
});
