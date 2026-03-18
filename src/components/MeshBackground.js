import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';

const { width: W, height: H } = Dimensions.get('window');

// A single floating ambient orb
function Orb({ color, size, startX, startY, duration, delay }) {
  const x = useRef(new Animated.Value(startX)).current;
  const y = useRef(new Animated.Value(startY)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1200,
      delay,
      useNativeDriver: true,
    }).start();

    // Float around
    const floatX = () =>
      Animated.sequence([
        Animated.timing(x, {
          toValue: startX + (Math.random() - 0.5) * 120,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(x, {
          toValue: startX,
          duration,
          useNativeDriver: true,
        }),
      ]);

    const floatY = () =>
      Animated.sequence([
        Animated.timing(y, {
          toValue: startY + (Math.random() - 0.5) * 100,
          duration: duration * 1.2,
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: startY,
          duration: duration * 1.2,
          useNativeDriver: true,
        }),
      ]);

    Animated.loop(Animated.parallel([floatX(), floatY()])).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ translateX: x }, { translateY: y }],
          left: -size / 2,
          top: -size / 2,
        },
      ]}
    />
  );
}

export default function MeshBackground({ children }) {
  return (
    <View style={styles.container}>
      {/* Base deep gradient */}
      <LinearGradient
        colors={['#0A0A1A', '#0D0B2B', '#0F0E35']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Ambient orbs */}
      <Orb color={COLORS.orbs.violet + '55'} size={360} startX={-60}    startY={80}    duration={6000} delay={0}    />
      <Orb color={COLORS.orbs.cyan   + '44'} size={280} startX={W - 80} startY={200}   duration={7500} delay={300}  />
      <Orb color={COLORS.orbs.rose   + '33'} size={240} startX={W / 2}  startY={H - 200} duration={8000} delay={600}  />
      <Orb color={COLORS.orbs.teal   + '22'} size={200} startX={60}     startY={H - 300} duration={9000} delay={900}  />
      <Orb color={COLORS.orbs.indigo + '33'} size={300} startX={W - 40} startY={60}    duration={7000} delay={200}  />

      {/* Subtle grid noise overlay */}
      <View style={styles.noiseOverlay} />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    // Blur via large border radius + opacity layering (expo-blur handles actual blur on panels)
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});
