import React, { useRef, useEffect } from 'react';
import {
  View, Text, Pressable, Animated, StyleSheet, Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SPACE } from '../theme';

const { width: W } = Dimensions.get('window');

const ICONS = {
  Home:     { active: '⬡', inactive: '⬡',  label: 'Home' },
  Scan:     { active: '⊙', inactive: '○',   label: 'Scan' },
  Groups:   { active: '◈', inactive: '◇',   label: 'Groups' },
  Map:      { active: '◉', inactive: '◎',   label: 'Map' },
  Settings: { active: '✦', inactive: '✧',   label: 'You' },
};

function TabItem({ route, isFocused, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(isFocused ? 1 : 0.5)).current;
  const dotScale = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isFocused ? 1.15 : 1,
        damping: 14, stiffness: 200, useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: isFocused ? -4 : 0,
        damping: 14, stiffness: 200, useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isFocused ? 1 : 0.45,
        duration: 200, useNativeDriver: true,
      }),
      Animated.spring(dotScale, {
        toValue: isFocused ? 1 : 0,
        damping: 14, stiffness: 250, useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const icon = ICONS[route.name];

  return (
    <Pressable onPress={handlePress} style={styles.tabItem}>
      <Animated.View style={{ transform: [{ scale }, { translateY }], opacity }}>
        {/* Icon pill highlight */}
        {isFocused && (
          <LinearGradient
            colors={['#7B61FF', '#00D4FF']}
            style={styles.iconPill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <Text style={[styles.icon, isFocused && styles.iconActive]}>
          {isFocused ? icon.active : icon.inactive}
        </Text>
        <Text style={[styles.label, isFocused && styles.labelActive]}>
          {icon.label}
        </Text>

        {/* Active dot */}
        <Animated.View style={[styles.dot, { transform: [{ scale: dotScale }] }]} />
      </Animated.View>
    </Pressable>
  );
}

export default function TabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      <BlurView intensity={60} tint="dark" style={styles.blur}>
        <LinearGradient
          colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.borderTop} />

        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            return (
              <TabItem
                key={route.key}
                route={route}
                isFocused={isFocused}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
  },
  blur: {
    overflow: 'hidden',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  borderTop: {
    position: 'absolute',
    top: 0, left: 24, right: 24,
    height: 0.5,
    backgroundColor: COLORS.glass.border,
  },
  tabRow: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: SPACE.md,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    position: 'absolute',
    width: 40, height: 40,
    borderRadius: 20,
    alignSelf: 'center',
    top: -8,
    opacity: 0.18,
  },
  icon: {
    fontSize: 22,
    textAlign: 'center',
    color: COLORS.text.tertiary,
  },
  iconActive: {
    color: COLORS.accent.primary,
  },
  label: {
    fontSize: 10,
    marginTop: 3,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  labelActive: {
    color: COLORS.accent.primary,
  },
  dot: {
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent.primary,
    alignSelf: 'center',
    marginTop: 4,
  },
});
