import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Animated,
  Pressable, Dimensions, ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');

// ─── Data ─────────────────────────────────────────────────
const EXPENSE_PINS = [
  { id: '1', title: 'Dinner at Spice Route', amount: 1770, emoji: '🍽️', color: '#7B61FF', category: 'Food',      lat: 30.7333, lng: 76.7794 },
  { id: '2', title: 'Auto — Airport',         amount: 320,  emoji: '🛺', color: '#FF3A8C', category: 'Travel',    lat: 30.7212, lng: 76.7832 },
  { id: '3', title: 'Big Bazaar Groceries',   amount: 3200, emoji: '🛒', color: '#00E6A0', category: 'Shopping',  lat: 29.3909, lng: 76.9635 },
  { id: '4', title: 'Petrol — HP Pump',       amount: 1200, emoji: '⛽', color: '#FF9F1C', category: 'Travel',    lat: 29.3868, lng: 76.9718 },
  { id: '5', title: 'Café Coffee Day',        amount: 480,  emoji: '☕', color: '#00D4FF', category: 'Food',      lat: 29.3850, lng: 76.9600 },
  { id: '6', title: 'PVR — Avengers',         amount: 860,  emoji: '🎬', color: '#FF6FB0', category: 'Fun',       lat: 29.3930, lng: 76.9650 },
];

const CATEGORIES = ['All', 'Food', 'Travel', 'Shopping', 'Fun'];

// ─── Dark Map Style ───────────────────────────────────────
const DARK_MAP_STYLE = [
  { elementType: 'geometry',           stylers: [{ color: '#0D0927' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0D0927' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: 'rgba(255,255,255,0.45)' }] },
  { featureType: 'road',          elementType: 'geometry',        stylers: [{ color: '#1C1250' }] },
  { featureType: 'road',          elementType: 'geometry.stroke', stylers: [{ color: '#251870' }] },
  { featureType: 'road.highway',  elementType: 'geometry',        stylers: [{ color: '#2A1A80' }] },
  { featureType: 'water',         elementType: 'geometry',        stylers: [{ color: '#050318' }] },
  { featureType: 'poi',           elementType: 'geometry',        stylers: [{ color: '#160E40' }] },
  { featureType: 'transit',       elementType: 'geometry',        stylers: [{ color: '#160E40' }] },
  { featureType: 'administrative',elementType: 'geometry',        stylers: [{ color: '#2D1B69' }] },
  { featureType: 'landscape',     elementType: 'geometry',        stylers: [{ color: '#110B35' }] },
];

// ─── Map Pin Marker ───────────────────────────────────────
function PinMarker({ pin, isSelected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isSelected ? 1.25 : 1,
      damping: 12, stiffness: 200, useNativeDriver: true,
    }).start();
  }, [isSelected]);

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
        {/* Pin bubble */}
        <View style={[styles.pinOuter, { borderColor: pin.color + '99', shadowColor: pin.color }]}>
          <LinearGradient
            colors={[pin.color, pin.color + 'BB']}
            style={styles.pinInner}
          >
            <Text style={styles.pinEmoji}>{pin.emoji}</Text>
          </LinearGradient>
        </View>
        {/* Pin tail */}
        <View style={[styles.pinTail, { backgroundColor: pin.color }]} />

        {/* Callout bubble */}
        {isSelected && (
          <Animated.View style={styles.calloutWrap}>
            <View style={styles.calloutBase} />
            <BlurView intensity={50} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]} />
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.05)']}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]}
            />
            <View style={[styles.calloutBorder, { borderColor: pin.color + '55' }]} />
            <Text style={styles.calloutTitle} numberOfLines={1}>{pin.title}</Text>
            <Text style={[styles.calloutAmt, { color: pin.color }]}>
              ₹{pin.amount.toLocaleString('en-IN')}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Category Filter Chip ─────────────────────────────────
function FilterChip({ label, isActive, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ overflow: 'hidden', borderRadius: 50 }}>
      {isActive ? (
        <LinearGradient
          colors={['#7B61FF', '#00D4FF']}
          style={styles.filterChipActive}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Text style={styles.filterChipActiveText}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.filterChipInactive}>
          <View style={styles.filterChipBase} />
          <Text style={styles.filterChipText}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Bottom Sheet Expense Row ─────────────────────────────
function ExpenseRow({ pin, isSelected, onPress }) {
  return (
    <Pressable
      onPress={() => onPress(pin)}
      style={[styles.expRow, isSelected && { backgroundColor: pin.color + '18' }]}
    >
      {/* Icon */}
      <LinearGradient colors={[pin.color, pin.color + 'AA']} style={styles.expIcon}>
        <Text style={{ fontSize: 18 }}>{pin.emoji}</Text>
      </LinearGradient>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={styles.expTitle} numberOfLines={1}>{pin.title}</Text>
        <View style={styles.expMeta}>
          <View style={[styles.expCatDot, { backgroundColor: pin.color }]} />
          <Text style={styles.expCat}>{pin.category}</Text>
        </View>
      </View>

      {/* Amount */}
      <View style={[styles.expAmtPill, { backgroundColor: pin.color + '22', borderColor: pin.color + '55' }]}>
        <Text style={[styles.expAmt, { color: pin.color }]}>
          ₹{pin.amount.toLocaleString('en-IN')}
        </Text>
      </View>

      {/* Selected indicator */}
      {isSelected && (
        <View style={[styles.expSelectedDot, { backgroundColor: pin.color }]} />
      )}
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef  = useRef(null);
  const [selected,    setSelected]    = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const sheetY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
    })();
    Animated.spring(sheetY, {
      toValue: 1, damping: 16, stiffness: 140, useNativeDriver: true,
    }).start();
  }, []);

  const focusPin = (pin) => {
    setSelected(prev => prev === pin.id ? null : pin.id);
    mapRef.current?.animateToRegion({
      latitude:      pin.lat - 0.004,
      longitude:     pin.lng,
      latitudeDelta: 0.018,
      longitudeDelta:0.018,
    }, 700);
  };

  const filtered = activeFilter === 'All'
    ? EXPENSE_PINS
    : EXPENSE_PINS.filter(p => p.category === activeFilter);

  const totalMapped = filtered.reduce((s, p) => s + p.amount, 0);
  const sheetTranslate = sheetY.interpolate({ inputRange: [0, 1], outputRange: [420, 0] });

  const INITIAL_REGION = {
    latitude: 29.3909, longitude: 76.9635,
    latitudeDelta: 0.06, longitudeDelta: 0.06,
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080616' }}>

      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {filtered.map(pin => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1 }}
          >
            <PinMarker
              pin={pin}
              isSelected={selected === pin.id}
              onPress={() => focusPin(pin)}
            />
          </Marker>
        ))}
      </MapView>

      {/* ── Top Header Bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topBarBase} />
        <BlurView intensity={50} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 0 }]} />
        <LinearGradient
          colors={['rgba(14,7,48,0.92)', 'rgba(14,7,48,0.75)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.topBarBorder} />

        <View style={styles.topBarContent}>
          <View>
            <Text style={styles.topBarSub}>Tracking</Text>
            <Text style={styles.topBarTitle}>Expense Map</Text>
          </View>
          {/* Total pill */}
          <LinearGradient
            colors={['#7B61FF', '#00D4FF']}
            style={styles.totalPill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.totalPillText}>
              ₹{totalMapped.toLocaleString('en-IN')} mapped
            </Text>
          </LinearGradient>
        </View>

        {/* Category Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CATEGORIES.map(cat => (
            <FilterChip
              key={cat}
              label={cat}
              isActive={activeFilter === cat}
              onPress={() => setActiveFilter(cat)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Bottom Sheet ── */}
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY: sheetTranslate }],
            paddingBottom: insets.bottom + 85,
          },
        ]}
      >
        {/* Sheet base */}
        <View style={styles.sheetBase} />
        <BlurView intensity={55} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
        <LinearGradient
          colors={['rgba(22,10,60,0.96)', 'rgba(12,6,36,0.98)']}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
        />
        {/* Top shimmer border */}
        <LinearGradient
          colors={['transparent', '#7B61FF99', '#00D4FF66', 'transparent']}
          style={styles.sheetTopBorder}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />

        {/* Handle */}
        <View style={styles.sheetHandle} />

        {/* Sheet Header */}
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Tagged Expenses</Text>
            <Text style={styles.sheetSub}>{filtered.length} locations · tap to focus</Text>
          </View>
          <View style={styles.sheetCountBadge}>
            <Text style={styles.sheetCountText}>{filtered.length}</Text>
          </View>
        </View>

        {/* Expense list */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 240 }}
          contentContainerStyle={{ gap: 4, paddingHorizontal: 18, paddingBottom: 8 }}
        >
          {filtered.map(pin => (
            <ExpenseRow
              key={pin.id}
              pin={pin}
              isSelected={selected === pin.id}
              onPress={focusPin}
            />
          ))}
        </ScrollView>

        {/* Bottom summary strip */}
        <View style={styles.summaryStrip}>
          <LinearGradient
            colors={['rgba(123,97,255,0.18)', 'rgba(0,212,255,0.10)']}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <View style={[styles.summaryStripBorder]} />
          {[
            { lbl: 'Expenses', val: filtered.length, color: '#A78BFA' },
            { lbl: 'Total',    val: '₹' + (totalMapped / 1000).toFixed(1) + 'k', color: '#00D4FF' },
            { lbl: 'Avg',      val: '₹' + Math.round(totalMapped / (filtered.length || 1)).toLocaleString('en-IN'), color: '#00E6A0' },
          ].map((s, i) => (
            <View key={i} style={[styles.summaryStat, i > 0 && styles.summaryStatBorder]}>
              <Text style={[styles.summaryVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.summaryLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({

  // ── Top Bar ──
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    overflow: 'hidden',
  },
  topBarBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,6,22,0.88)',
  },
  topBarBorder: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 1, backgroundColor: 'rgba(123,97,255,0.35)',
  },
  topBarContent: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12,
  },
  topBarSub:   { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '500' },
  topBarTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginTop: 2 },
  totalPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50,
    shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
  },
  totalPillText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  filterRow: {
    paddingHorizontal: 16, paddingBottom: 14, gap: 8,
  },
  filterChipActive: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 50,
  },
  filterChipActiveText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  filterChipInactive: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  filterChipBase: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,8,40,0.7)', borderRadius: 50 },
  filterChipText: { color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: '600' },

  // ── Pin Marker ──
  pinOuter: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2.5, overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6, shadowRadius: 10, elevation: 8,
  },
  pinInner: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  pinEmoji: { fontSize: 20 },
  pinTail: {
    width: 4, height: 8, borderRadius: 2, marginTop: -1,
  },
  calloutWrap: {
    position: 'absolute', bottom: 68,
    backgroundColor: 'transparent',
    borderRadius: 12, overflow: 'hidden',
    minWidth: 170, maxWidth: 200,
    paddingHorizontal: 12, paddingVertical: 9,
    alignSelf: 'center',
  },
  calloutBase: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12, backgroundColor: 'rgba(14,8,44,0.92)',
  },
  calloutBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12, borderWidth: 1,
  },
  calloutTitle: {
    color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginBottom: 2,
  },
  calloutAmt: { fontSize: 14, fontWeight: '800' },

  // ── Bottom Sheet ──
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetBase: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    backgroundColor: '#0E0730',
  },
  sheetTopBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, marginBottom: 14,
  },
  sheetTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  sheetSub:   { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 3 },
  sheetCountBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(123,97,255,0.25)',
    borderWidth: 1, borderColor: 'rgba(123,97,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetCountText: { color: '#A78BFA', fontSize: 14, fontWeight: '800' },

  // ── Expense Row ──
  expRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 14,
  },
  expIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  expTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  expMeta:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  expCatDot:{ width: 6, height: 6, borderRadius: 3 },
  expCat:   { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600' },
  expAmtPill: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 50, borderWidth: 1, flexShrink: 0,
  },
  expAmt: { fontSize: 13, fontWeight: '800' },
  expSelectedDot: {
    width: 7, height: 7, borderRadius: 3.5,
    position: 'absolute', left: 6, top: '50%',
  },

  // ── Summary Strip ──
  summaryStrip: {
    flexDirection: 'row', marginHorizontal: 18,
    marginTop: 14, borderRadius: 16,
    overflow: 'hidden', position: 'relative',
  },
  summaryStripBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(123,97,255,0.30)',
  },
  summaryStat: {
    flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3,
  },
  summaryStatBorder: {
    borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.08)',
  },
  summaryVal: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  summaryLbl: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600' },
});