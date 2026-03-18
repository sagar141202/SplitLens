import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable,
  Dimensions, ScrollView, Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import { COLORS, RADIUS, SPACE, SHADOW } from '../theme';

const { width: W, height: H } = Dimensions.get('window');

const EXPENSE_PINS = [
  { id: '1', title: 'Dinner at Spice Route', amount: 1770, emoji: '🍽️', color: '#7B61FF', lat: 30.7333, lng: 76.7794 },
  { id: '2', title: 'Auto — Airport',         amount: 320,  emoji: '🛺', color: '#FF3A8C', lat: 30.7212, lng: 76.7832 },
  { id: '3', title: 'Big Bazaar Groceries',   amount: 3200, emoji: '🛒', color: '#00E6A0', lat: 29.3909, lng: 76.9635 },
  { id: '4', title: 'Petrol — HP Pump',       amount: 1200, emoji: '⛽', color: '#FF9F1C', lat: 29.3868, lng: 76.9718 },
  { id: '5', title: 'Café Coffee Day',        amount: 480,  emoji: '☕', color: '#00D4FF', lat: 29.3850, lng: 76.9600 },
];

// Dark map style (matches glassmorphism theme)
const DARK_MAP_STYLE = [
  { elementType: 'geometry',                    stylers: [{ color: '#0D0B2B' }] },
  { elementType: 'labels.text.stroke',          stylers: [{ color: '#0D0B2B' }] },
  { elementType: 'labels.text.fill',            stylers: [{ color: 'rgba(255,255,255,0.4)' }] },
  { featureType: 'road',    elementType: 'geometry',   stylers: [{ color: '#1A1040' }] },
  { featureType: 'road',    elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'water',   elementType: 'geometry',   stylers: [{ color: '#060B2B' }] },
  { featureType: 'poi',     elementType: 'geometry',   stylers: [{ color: '#1A1040' }] },
  { featureType: 'transit', elementType: 'geometry',   stylers: [{ color: '#1A1040' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2D1B69' }] },
];

function PinCallout({ pin }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 200, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity: fade }}>
      <BlurView intensity={60} tint="dark" style={[styles.callout, { borderColor: pin.color + '55' }]}>
        <Text style={{ fontSize: 18, marginRight: 6 }}>{pin.emoji}</Text>
        <View>
          <Text style={styles.calloutTitle} numberOfLines={1}>{pin.title}</Text>
          <Text style={[styles.calloutAmt, { color: pin.color }]}>₹{pin.amount}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

function ExpenseListItem({ pin, onPress }) {
  return (
    <Pressable onPress={() => onPress(pin)} style={styles.listItem}>
      <View style={[styles.listIcon, { backgroundColor: pin.color + '22', borderColor: pin.color + '55' }]}>
        <Text style={{ fontSize: 20 }}>{pin.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle} numberOfLines={1}>{pin.title}</Text>
        <Text style={styles.listLoc}>📍 Tap to view on map</Text>
      </View>
      <View style={[styles.listPill, { backgroundColor: pin.color + '22', borderColor: pin.color + '44' }]}>
        <Text style={[styles.listAmt, { color: pin.color }]}>₹{pin.amount}</Text>
      </View>
    </Pressable>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [location, setLocation] = useState(null);
  const sheetY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();

    // Slide in bottom sheet
    Animated.spring(sheetY, { toValue: 1, damping: 14, stiffness: 160, useNativeDriver: true }).start();
  }, []);

  const focusPin = (pin) => {
    setSelected(pin.id);
    mapRef.current?.animateToRegion({
      latitude: pin.lat - 0.003,
      longitude: pin.lng,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    }, 600);
  };

  const sheetTranslate = sheetY.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });

  const INITIAL_REGION = {
    latitude:      29.3909,
    longitude:     76.9635,
    latitudeDelta: 0.04,
    longitudeDelta:0.04,
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {EXPENSE_PINS.map(pin => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            onPress={() => focusPin(pin)}
          >
            <Pressable onPress={() => focusPin(pin)}>
              <View style={[styles.markerBubble, { backgroundColor: pin.color, borderColor: pin.color + 'AA' }]}>
                <Text style={{ fontSize: 16 }}>{pin.emoji}</Text>
              </View>
              {selected === pin.id && <PinCallout pin={pin} />}
            </Pressable>
          </Marker>
        ))}
      </MapView>

      {/* Top bar */}
      <BlurView intensity={40} tint="dark" style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topTitle}>Expense Map</Text>
        <Text style={styles.topSub}>{EXPENSE_PINS.length} locations tagged</Text>
      </BlurView>

      {/* Total pill */}
      <BlurView intensity={30} tint="dark" style={styles.totalPill}>
        <LinearGradient colors={['#7B61FF', '#00D4FF']} style={styles.totalPillGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.totalPillText}>
            ₹{EXPENSE_PINS.reduce((s, p) => s + p.amount, 0).toLocaleString('en-IN')} mapped
          </Text>
        </LinearGradient>
      </BlurView>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslate }], paddingBottom: insets.bottom + 90 }]}>
        <BlurView intensity={60} tint="dark" style={styles.sheetBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Tagged Expenses</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
            {EXPENSE_PINS.map(pin => (
              <ExpenseListItem key={pin.id} pin={pin} onPress={focusPin} />
            ))}
          </ScrollView>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: SPACE.xl, paddingBottom: SPACE.md,
    alignItems: 'center', overflow: 'hidden',
    borderBottomWidth: 0.5, borderBottomColor: COLORS.glass.border,
  },
  topTitle: { color: COLORS.text.primary, fontSize: 18, fontWeight: '700' },
  topSub:   { color: COLORS.text.tertiary, fontSize: 12, marginTop: 2 },

  totalPill: {
    position: 'absolute', top: 110, alignSelf: 'center',
    borderRadius: RADIUS.full, overflow: 'hidden',
    left: '50%', transform: [{ translateX: -80 }],
    ...SHADOW.glow('#7B61FF', 10),
  },
  totalPillGrad: { paddingHorizontal: 20, paddingVertical: 8 },
  totalPillText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  markerBubble: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    ...SHADOW.glow('#7B61FF', 8),
  },

  callout: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: RADIUS.md, overflow: 'hidden',
    borderWidth: 1, marginBottom: 4,
    minWidth: 160,
  },
  calloutTitle: { color: COLORS.text.primary, fontSize: 12, fontWeight: '600', maxWidth: 130 },
  calloutAmt:   { fontSize: 13, fontWeight: '800' },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  sheetBlur: {
    paddingTop: 12, paddingHorizontal: SPACE.lg,
    overflow: 'hidden',
    borderTopWidth: 0.5, borderTopColor: COLORS.glass.border,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.glass.white20,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { color: COLORS.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12 },

  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.glass.borderSub },
  listIcon: { width: 44, height: 44, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  listTitle: { color: COLORS.text.primary, fontSize: 14, fontWeight: '600' },
  listLoc:   { color: COLORS.text.tertiary, fontSize: 11, marginTop: 2 },
  listPill: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  listAmt:  { fontSize: 13, fontWeight: '700' },
});
