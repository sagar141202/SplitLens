import React, { useRef, useEffect } from 'react';
import {
  View, Text, Pressable, Animated,
  StyleSheet, Dimensions, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width: W } = Dimensions.get('window');

// ─── Clean SVG Icons ─────────────────────────────────────
function IconHome({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9 21 9 15 12 15C15 15 15 21 15 21M9 21H15" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function IconScan({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7V5C3 3.89543 3.89543 3 5 3H7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M17 3H19C20.1046 3 21 3.89543 21 5V7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M21 17V19C21 20.1046 20.1046 21 19 21H17" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M7 21H5C3.89543 21 3 20.1046 3 19V17" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M3 12H21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function IconGroups({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="3" stroke={color} strokeWidth="1.8"/>
      <Path d="M3 20C3 17.2386 5.68629 15 9 15C12.3137 15 15 17.2386 15 20" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M16 11C17.6569 11 19 9.65685 19 8C19 6.34315 17.6569 5 16 5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M21 20C21 17.5 19.5 15.4 17 15" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function IconMap({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C8.68629 2 6 4.68629 6 8C6 12.4183 12 20 12 20C12 20 18 12.4183 18 8C18 4.68629 15.3137 2 12 2Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <Circle cx="12" cy="8" r="2" stroke={color} strokeWidth="1.8"/>
    </Svg>
  );
}

function IconSettings({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3" stroke={color} strokeWidth="1.8"/>
      <Path d="M6 20C6 17.2386 8.68629 15 12 15C15.3137 15 18 17.2386 18 20" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

const TABS = [
  { name: 'Home',     label: 'Home',    Icon: IconHome },
  { name: 'Scan',     label: 'Scan',    Icon: IconScan },
  { name: 'Groups',   label: 'Groups',  Icon: IconGroups },
  { name: 'Map',      label: 'Map',     Icon: IconMap },
  { name: 'Settings', label: 'Profile', Icon: IconSettings },
];

// ─── Single Tab Item ──────────────────────────────────────
function TabItem({ route, isFocused, onPress }) {
  const scale     = useRef(new Animated.Value(isFocused ? 1 : 0.9)).current;
  const labelOp   = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const iconOp    = useRef(new Animated.Value(isFocused ? 1 : 0.45)).current;
  const pillScale = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const pillOp    = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(isFocused ? -2 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,      { toValue: isFocused ? 1 : 0.9,  damping: 15, stiffness: 220, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: isFocused ? -3 : 0,   damping: 15, stiffness: 220, useNativeDriver: true }),
      Animated.timing(iconOp,     { toValue: isFocused ? 1 : 0.40, duration: 200, useNativeDriver: true }),
      Animated.spring(pillScale,  { toValue: isFocused ? 1 : 0,    damping: 14, stiffness: 260, useNativeDriver: true }),
      Animated.timing(pillOp,     { toValue: isFocused ? 1 : 0,    duration: 180, useNativeDriver: true }),
      Animated.timing(labelOp,    { toValue: isFocused ? 1 : 0,    duration: 180, useNativeDriver: true }),
    ]).start();
  }, [isFocused]);

  const tab = TABS.find(t => t.name === route.name);
  if (!tab) return null;
  const { Icon } = tab;
  const activeColor   = '#FFFFFF';
  const inactiveColor = 'rgba(255,255,255,0.38)';

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale }, { translateY }] }]}>

        {/* Active gradient pill background */}
        <Animated.View style={[styles.activePill, { opacity: pillOp, transform: [{ scaleX: pillScale }] }]}>
          <LinearGradient
            colors={['#7B61FF', '#4D9FFF']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>

        {/* Icon */}
        <Animated.View style={{ opacity: iconOp }}>
          <Icon color={isFocused ? activeColor : inactiveColor} size={21} />
        </Animated.View>

        {/* Label — only visible when active */}
        <Animated.Text
          style={[styles.tabLabel, { opacity: labelOp, color: activeColor }]}
          numberOfLines={1}
        >
          {tab.label}
        </Animated.Text>

      </Animated.View>
    </Pressable>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────
export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom > 0 ? insets.bottom - 4 : 12 }]}>
      {/* Solid dark base */}
      <View style={styles.solidBase} />

      {/* Blur layer */}
      <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFillObject} />

      {/* Glass gradient overlay */}
      <LinearGradient
        colors={['rgba(30,15,70,0.82)', 'rgba(15,8,40,0.95)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Top border shimmer */}
      <LinearGradient
        colors={['transparent', 'rgba(123,97,255,0.7)', 'rgba(77,159,255,0.5)', 'transparent']}
        style={styles.topBorder}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      {/* Tab row */}
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
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    overflow: 'hidden',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  solidBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0E0730',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  topBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
  },
  tabRow: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 50,
    minWidth: 48,
    gap: 3,
    position: 'relative',
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    overflow: 'hidden',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});