import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable,
  Dimensions, ScrollView, Modal, TouchableWithoutFeedback,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../context/DataContext';

const { width: W, height: H } = Dimensions.get('window');

const CATEGORIES = ['All', 'Food', 'Travel', 'Shopping', 'Fun', 'Health', 'Other'];
const CAT_COLORS = {
  Food: '#FF9F1C', Travel: '#00D4FF', Shopping: '#FF3A8C',
  Fun: '#A78BFA', Health: '#00E6A0', Other: '#7B61FF', All: '#7B61FF',
};

const EMOJI_CAT = {
  '🍽️': 'Food', '🍕': 'Food', '☕': 'Food', '🍺': 'Food', '🎂': 'Food', '🍱': 'Food',
  '✈️': 'Travel', '⛽': 'Travel', '🚗': 'Travel', '🛺': 'Travel',
  '🛒': 'Shopping', '🎁': 'Shopping',
  '🎬': 'Fun', '🎮': 'Fun', '🏖️': 'Fun', '🎵': 'Fun',
  '💊': 'Health',
};

// Deterministic unique offsets — never overlap, scales with index
function pinOffset(index) {
  const ring  = Math.floor(index / 8);
  const slot  = index % 8;
  const angle = (slot / 8) * 2 * Math.PI + ring * 0.4;
  const radius = 0.008 + ring * 0.009;
  return {
    lat: Math.sin(angle) * radius,
    lng: Math.cos(angle) * radius,
  };
}

const DARK_MAP = [
  { elementType: 'geometry',           stylers: [{ color: '#0D0927' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0D0927' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: 'rgba(255,255,255,0.45)' }] },
  { featureType: 'road',         elementType: 'geometry',        stylers: [{ color: '#1C1250' }] },
  { featureType: 'road',         elementType: 'geometry.stroke', stylers: [{ color: '#251870' }] },
  { featureType: 'road.highway', elementType: 'geometry',        stylers: [{ color: '#2A1A80' }] },
  { featureType: 'water',        elementType: 'geometry',        stylers: [{ color: '#050318' }] },
  { featureType: 'poi',          elementType: 'geometry',        stylers: [{ color: '#160E40' }] },
  { featureType: 'landscape',    elementType: 'geometry',        stylers: [{ color: '#110B35' }] },
  { featureType: 'transit',      elementType: 'geometry',        stylers: [{ color: '#160E40' }] },
  { featureType: 'administrative', elementType: 'geometry',      stylers: [{ color: '#2D1B69' }] },
];

const SATELLITE_MAP = [];

// ── Pin Marker ────────────────────────────────────────────
function PinMarker({ pin, isSelected, onPress }) {
  const scale     = useRef(new Animated.Value(0)).current;
  const glow      = useRef(new Animated.Value(0)).current;
  const bounce    = useRef(new Animated.Value(-12)).current;

  // Mount: drop in with bounce
  useEffect(() => {
    Animated.sequence([
      Animated.spring(bounce, { toValue: 0, damping: 10, stiffness: 200, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1, damping: 12, stiffness: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  // Selected: scale + glow pulse
  useEffect(() => {
    Animated.spring(scale, {
      toValue: isSelected ? 1.35 : 1,
      damping: 10, stiffness: 250, useNativeDriver: true,
    }).start();
    if (isSelected) {
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])).start();
    } else {
      glow.stopAnimation();
      glow.setValue(0);
    }
  }, [isSelected]);

  const glowOp = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] });

  return (
    <Pressable onPress={onPress} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <Animated.View style={{ transform: [{ scale }, { translateY: bounce }], alignItems: 'center' }}>
        {/* Selected glow ring */}
        {isSelected && (
          <Animated.View style={[p.glowRing, { backgroundColor: pin.color + '30', opacity: glowOp, borderColor: pin.color + '80' }]} />
        )}
        <View style={[p.outer, { borderColor: pin.color, shadowColor: pin.color }]}>
          <LinearGradient colors={[pin.color, pin.color + 'CC']} style={p.inner}>
            <Text style={p.emoji}>{pin.emoji}</Text>
          </LinearGradient>
        </View>
        <LinearGradient colors={[pin.color, pin.color + '00']} style={p.tail} />
        {/* Selected callout */}
        {isSelected && (
          <Animated.View style={[p.callout, { transform: [{ scale }] }]}>
            <View style={p.calloutBase} />
            <View style={[p.calloutBorder, { borderColor: pin.color + '60' }]} />
            <LinearGradient colors={[pin.color + '20', 'transparent']} style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Text style={p.calloutTitle} numberOfLines={1}>{pin.title}</Text>
            <Text style={[p.calloutAmt, { color: pin.color }]}>{'\u20b9'}{pin.amount.toLocaleString('en-IN')}</Text>
            <Text style={p.calloutCat}>{pin.category}</Text>
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ── Expense Detail Modal ──────────────────────────────────
function ExpenseDetailModal({ visible, pin, onClose }) {
  const slideY = useRef(new Animated.Value(100)).current;
  const fade   = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, damping: 14, stiffness: 150, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      slideY.setValue(100);
      fade.setValue(0);
    }
  }, [visible]);
  if (!pin) return null;
  const perPerson = Math.round(pin.amount / (pin.members || 2));
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[ed.overlay, { opacity: fade }]} />
      </TouchableWithoutFeedback>
      <Animated.View style={[ed.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={ed.base} />
        <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
        <LinearGradient colors={['rgba(22,10,60,0.98)', 'rgba(12,6,36,0.99)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
        <LinearGradient colors={['transparent', pin.color + '80', pin.color + '50', 'transparent']} style={ed.topBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={ed.handle} />
        <LinearGradient colors={[pin.color, pin.color + 'AA']} style={ed.emojiHero}>
          <Text style={{ fontSize: 36 }}>{pin.emoji}</Text>
        </LinearGradient>
        <Text style={ed.title}>{pin.title}</Text>
        <Text style={ed.meta}>{pin.category}  ·  {pin.date || 'Recent'}</Text>
        <View style={[ed.amtRow, { borderColor: pin.color + '30' }]}>
          <LinearGradient colors={[pin.color + '18', 'transparent']} style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} />
          {[
            { label: 'Total', val: '\u20b9' + pin.amount.toLocaleString('en-IN'), color: '#fff' },
            { label: 'People', val: pin.members || 2, color: '#A78BFA' },
            { label: 'Each', val: '\u20b9' + perPerson.toLocaleString('en-IN'), color: pin.color },
          ].map((row, i) => (
            <View key={i} style={[ed.amtItem, i > 0 && { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={[ed.amtVal, { color: row.color }]}>{row.val}</Text>
              <Text style={ed.amtLabel}>{row.label}</Text>
            </View>
          ))}
        </View>
        {pin.paidBy && (
          <View style={ed.infoRow}>
            <Text style={ed.infoLabel}>Paid by</Text>
            <Text style={ed.infoVal}>{pin.paidBy}</Text>
          </View>
        )}
        {pin.note ? (
          <View style={ed.infoRow}>
            <Text style={ed.infoLabel}>Note</Text>
            <Text style={[ed.infoVal, { maxWidth: 200, textAlign: 'right' }]}>{pin.note}</Text>
          </View>
        ) : null}
        <Pressable onPress={onClose} style={ed.doneBtn}>
          <Text style={ed.doneBtnText}>Done</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { expenses } = useData();
  const mapRef = useRef(null);

  const [selected,       setSelected]       = useState(null);
  const [activeFilter,   setActiveFilter]   = useState('All');
  const [userLocation,   setUserLocation]   = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [mapStyle,       setMapStyle]       = useState('dark'); // dark | satellite
  const [showDetail,     setShowDetail]     = useState(false);
  const [detailPin,      setDetailPin]      = useState(null);
  const [sheetExpanded,  setSheetExpanded]  = useState(false);

  // Animations
  const sheetY       = useRef(new Animated.Value(0)).current;
  const topBarOp     = useRef(new Animated.Value(0)).current;
  const recenterAnim = useRef(new Animated.Value(1)).current;
  const styleToggleRot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation(loc.coords);
      } else {
        setLocationDenied(true);
      }
    })();
    Animated.parallel([
      Animated.spring(sheetY, { toValue: 1, damping: 16, stiffness: 130, delay: 300, useNativeDriver: true }),
      Animated.timing(topBarOp, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const BASE_LAT = userLocation?.latitude  ?? 29.3909;
  const BASE_LNG = userLocation?.longitude ?? 76.9635;

  // Build pins — unique spread, never stack
  const pins = expenses.map((e, i) => {
    const off = pinOffset(i);
    return {
      id:       e.id,
      title:    e.title,
      amount:   e.amount,
      members:  e.members || 2,
      paidBy:   e.paidBy,
      note:     e.note,
      date:     e.date,
      emoji:    e.emoji || '💸',
      color:    (e.color?.[0]) ?? CAT_COLORS[EMOJI_CAT[e.emoji] || 'Other'],
      category: EMOJI_CAT[e.emoji] || 'Other',
      lat:      BASE_LAT + off.lat,
      lng:      BASE_LNG + off.lng,
    };
  });

  const filtered = activeFilter === 'All' ? pins : pins.filter(p => p.category === activeFilter);
  const total    = filtered.reduce((s, p) => s + p.amount, 0);
  const avg      = filtered.length > 0 ? Math.round(total / filtered.length) : 0;

  // Category counts for chips
  const catCounts = {};
  CATEGORIES.forEach(cat => {
    catCounts[cat] = cat === 'All' ? pins.length : pins.filter(p => p.category === cat).length;
  });

  const focusPin = useCallback((pin) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isDeselect = selected === pin.id;
    setSelected(isDeselect ? null : pin.id);
    if (!isDeselect) {
      mapRef.current?.animateToRegion({
        latitude:      pin.lat - 0.006,
        longitude:     pin.lng,
        latitudeDelta:  0.025,
        longitudeDelta: 0.025,
      }, 600);
    }
  }, [selected]);

  const openDetail = (pin) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDetailPin(pin);
    setShowDetail(true);
  };

  const recenterMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(recenterAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.spring(recenterAnim, { toValue: 1, damping: 8, stiffness: 300, useNativeDriver: true }),
    ]).start();
    if (filtered.length > 0 && mapRef.current) {
      const lats = filtered.map(p => p.lat);
      const lngs = filtered.map(p => p.lng);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      const padding = 0.015;
      mapRef.current.animateToRegion({
        latitude:      (minLat + maxLat) / 2,
        longitude:     (minLng + maxLng) / 2,
        latitudeDelta:  Math.max(maxLat - minLat + padding, 0.03),
        longitudeDelta: Math.max(maxLng - minLng + padding, 0.03),
      }, 700);
    } else if (userLocation) {
      mapRef.current?.animateToRegion({
        latitude:  BASE_LAT, longitude: BASE_LNG,
        latitudeDelta: 0.06, longitudeDelta: 0.06,
      }, 600);
    }
  };

  const toggleMapStyle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(styleToggleRot, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(styleToggleRot, { toValue: 0, duration: 0,   useNativeDriver: true }),
    ]).start();
    setMapStyle(s => s === 'dark' ? 'satellite' : 'dark');
  };

  const toggleSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSheetExpanded(e => !e);
  };

  const sheetTranslate = sheetY.interpolate({ inputRange: [0, 1], outputRange: [500, 0] });
  const styleRotate    = styleToggleRot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const INITIAL_REGION = {
    latitude: BASE_LAT, longitude: BASE_LNG,
    latitudeDelta: 0.06, longitudeDelta: 0.06,
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080616' }}>
      {/* MAP */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyle === 'dark' ? DARK_MAP : SATELLITE_MAP}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapType={mapStyle === 'satellite' ? 'satellite' : 'standard'}
      >
        {/* Spending radius circle around user */}
        {userLocation && expenses.length > 0 && (
          <Circle
            center={{ latitude: BASE_LAT, longitude: BASE_LNG }}
            radius={2200}
            fillColor="rgba(123,97,255,0.07)"
            strokeColor="rgba(123,97,255,0.25)"
            strokeWidth={1.5}
          />
        )}

        {/* Pins */}
        {filtered.map(pin => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            tracksViewChanges
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => focusPin(pin)}
          >
            <PinMarker
              pin={pin}
              isSelected={selected === pin.id}
              onPress={() => focusPin(pin)}
            />
          </Marker>
        ))}
      </MapView>

      {/* TOP BAR */}
      <Animated.View style={[s.topBar, { paddingTop: insets.top + 10, opacity: topBarOp }]}>
        <View style={s.topBarBase} />
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject} />
        <LinearGradient colors={['rgba(8,6,22,0.93)', 'rgba(8,6,22,0.75)']} style={StyleSheet.absoluteFillObject} />
        <View style={s.topBarBorder} />

        {/* Title row */}
        <View style={s.topBarContent}>
          <View>
            <Text style={s.topBarSub}>Expense Map</Text>
            <Text style={s.topBarTitle}>
              {filtered.length} pin{filtered.length !== 1 ? 's' : ''} · {activeFilter}
            </Text>
          </View>
          <LinearGradient colors={['#7B61FF', '#00D4FF']} style={s.totalPill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={s.totalPillText}>{'\u20b9'}{total.toLocaleString('en-IN')} mapped</Text>
          </LinearGradient>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {CATEGORIES.filter(cat => cat === 'All' || catCounts[cat] > 0).map(cat => {
            const isActive = activeFilter === cat;
            const count    = catCounts[cat];
            return (
              <Pressable
                key={cat}
                onPress={() => { setActiveFilter(cat); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={{ overflow: 'hidden', borderRadius: 50 }}
              >
                {isActive
                  ? <LinearGradient colors={['#7B61FF', '#00D4FF']} style={s.chipActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={s.chipActiveText}>{cat}</Text>
                      {cat !== 'All' && <View style={s.chipCount}><Text style={s.chipCountText}>{count}</Text></View>}
                    </LinearGradient>
                  : <View style={s.chipInactive}>
                      <View style={s.chipBase} />
                      <Text style={s.chipText}>{cat}</Text>
                      {cat !== 'All' && <View style={[s.chipCount, { backgroundColor: 'rgba(255,255,255,0.12)' }]}><Text style={[s.chipCountText, { color: 'rgba(255,255,255,0.60)' }]}>{count}</Text></View>}
                    </View>
                }
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* FLOATING ACTION BUTTONS */}
      <Animated.View style={[s.fabCol, { bottom: sheetExpanded ? H * 0.55 + 16 : 260 + insets.bottom }]}>
        {/* Recenter */}
        <Animated.View style={{ transform: [{ scale: recenterAnim }] }}>
          <Pressable onPress={recenterMap} style={s.fab}>
            <View style={s.fabBase} />
            <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]} />
            <LinearGradient colors={['rgba(22,10,60,0.90)', 'rgba(14,8,44,0.90)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]} />
            <View style={[StyleSheet.absoluteFillObject, { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(123,97,255,0.40)' }]} />
            <Text style={s.fabIcon}>🎯</Text>
          </Pressable>
        </Animated.View>

        {/* Map style toggle */}
        <Animated.View style={{ transform: [{ rotate: styleRotate }] }}>
          <Pressable onPress={toggleMapStyle} style={s.fab}>
            <View style={s.fabBase} />
            <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]} />
            <LinearGradient colors={['rgba(22,10,60,0.90)', 'rgba(14,8,44,0.90)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]} />
            <View style={[StyleSheet.absoluteFillObject, { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,212,255,0.35)' }]} />
            <Text style={s.fabIcon}>{mapStyle === 'dark' ? '��️' : '🌑'}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* BOTTOM SHEET */}
      <Animated.View style={[
        s.sheet,
        { transform: [{ translateY: sheetTranslate }], paddingBottom: insets.bottom + 88 },
        sheetExpanded && s.sheetExpanded,
      ]}>
        <View style={s.sheetBase} />
        <BlurView intensity={55} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
        <LinearGradient colors={['rgba(18,8,52,0.97)', 'rgba(10,5,36,0.99)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
        <LinearGradient colors={['transparent', '#7B61FF88', '#00D4FF55', 'transparent']} style={s.sheetTopBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

        {/* Drag handle — tap to expand */}
        <Pressable onPress={toggleSheet} style={s.handleWrap}>
          <View style={s.sheetHandle} />
        </Pressable>

        {/* Sheet header */}
        <View style={s.sheetHeader}>
          <View>
            <Text style={s.sheetTitle}>
              {selected ? 'Selected Pin' : 'Tagged Expenses'}
            </Text>
            <Text style={s.sheetSub}>
              {filtered.length} location{filtered.length !== 1 ? 's' : ''}  ·  tap to fly · hold to view
            </Text>
          </View>
          <Pressable
            onPress={toggleSheet}
            style={[s.sheetCountBadge, sheetExpanded && { backgroundColor: 'rgba(123,97,255,0.35)' }]}
          >
            <Text style={[s.sheetCountText, { fontSize: sheetExpanded ? 18 : 14 }]}>
              {sheetExpanded ? '↓' : filtered.length}
            </Text>
          </Pressable>
        </View>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
            <Text style={{ fontSize: 36 }}>📍</Text>
            <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
              {expenses.length === 0
                ? 'Add expenses on Home to pin them here'
                : 'No ' + activeFilter + ' expenses yet'}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: sheetExpanded ? H * 0.45 : 190 }}
            contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingBottom: 10 }}
          >
            {filtered.map((pin, i) => {
              const isActive = selected === pin.id;
              return (
                <Animated.View
                  key={pin.id}
                  style={{
                    opacity: 1,
                    transform: [{ translateX: 0 }],
                  }}
                >
                  <Pressable
                    onPress={() => focusPin(pin)}
                    onLongPress={() => openDetail(pin)}
                    delayLongPress={300}
                    style={[s.expRow, isActive && { backgroundColor: pin.color + '18' }]}
                  >
                    {isActive && (
                      <LinearGradient colors={[pin.color + '20', 'transparent']} style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                    )}
                    <View style={[s.expRowBorder, isActive && { borderColor: pin.color + '40' }]} />
                    <LinearGradient colors={[pin.color, pin.color + 'AA']} style={s.expIcon}>
                      <Text style={{ fontSize: 18 }}>{pin.emoji}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={s.expTitle} numberOfLines={1}>{pin.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View style={[s.expCatDot, { backgroundColor: CAT_COLORS[pin.category] || '#7B61FF' }]} />
                        <Text style={s.expCat}>{pin.category}</Text>
                        {pin.paidBy && <Text style={s.expPaidBy}>· {pin.paidBy}</Text>}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 3 }}>
                      <View style={[s.expAmtPill, { backgroundColor: pin.color + '22', borderColor: pin.color + '55' }]}>
                        <Text style={[s.expAmt, { color: pin.color }]}>{'\u20b9'}{pin.amount.toLocaleString('en-IN')}</Text>
                      </View>
                      <Text style={s.expPerPerson}>{'\u20b9'}{Math.round(pin.amount / pin.members)}/person</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        )}

        {/* Summary strip */}
        <View style={s.summaryStrip}>
          <LinearGradient colors={['rgba(123,97,255,0.15)', 'rgba(0,212,255,0.08)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={s.summaryStripBorder} />
          {[
            { lbl: 'Pins',  val: filtered.length,                        color: '#A78BFA' },
            { lbl: 'Total', val: '\u20b9' + total.toLocaleString('en-IN'), color: '#00D4FF' },
            { lbl: 'Avg',   val: '\u20b9' + avg.toLocaleString('en-IN'),   color: '#00E6A0' },
          ].map((stat, i) => (
            <View key={i} style={[s.summaryStat, i > 0 && s.summaryStatBorder]}>
              <Text style={[s.summaryVal, { color: stat.color }]}>{stat.val}</Text>
              <Text style={s.summaryLbl}>{stat.lbl}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* EXPENSE DETAIL MODAL */}
      <ExpenseDetailModal visible={showDetail} pin={detailPin} onClose={() => { setShowDetail(false); setDetailPin(null); }} />
    </View>
  );
}

const s = StyleSheet.create({
  topBar:      { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  topBarBase:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,6,22,0.88)' },
  topBarBorder:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(123,97,255,0.30)' },
  topBarContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
  topBarSub:   { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '500' },
  topBarTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginTop: 2 },
  totalPill:   { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 },
  totalPillText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  filterRow:   { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chipActive:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipActiveText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  chipInactive: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', flexDirection: 'row', alignItems: 'center', gap: 5, overflow: 'hidden' },
  chipBase:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,8,40,0.70)', borderRadius: 50 },
  chipText:    { color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: '600' },
  chipCount:   { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 50, paddingHorizontal: 5, paddingVertical: 1 },
  chipCountText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  fabCol:      { position: 'absolute', right: 16, gap: 10 },
  fab:         { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  fabBase:     { ...StyleSheet.absoluteFillObject, borderRadius: 22, backgroundColor: 'rgba(14,8,44,0.90)' },
  fabIcon:     { fontSize: 18 },
  sheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  sheetExpanded: { borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetBase:   { ...StyleSheet.absoluteFillObject, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#0E0730' },
  sheetTopBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  handleWrap:  { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sheetTitle:  { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  sheetSub:    { color: 'rgba(255,255,255,0.40)', fontSize: 11, marginTop: 2 },
  sheetCountBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(123,97,255,0.22)', borderWidth: 1, borderColor: 'rgba(123,97,255,0.45)', alignItems: 'center', justifyContent: 'center' },
  sheetCountText:  { color: '#A78BFA', fontSize: 14, fontWeight: '800' },
  expRow:      { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, overflow: 'hidden' },
  expRowBorder:{ ...StyleSheet.absoluteFillObject, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  expIcon:     { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  expTitle:    { color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginBottom: 3 },
  expCatDot:   { width: 5, height: 5, borderRadius: 2.5 },
  expCat:      { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600' },
  expPaidBy:   { color: 'rgba(255,255,255,0.30)', fontSize: 11 },
  expAmtPill:  { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 50, borderWidth: 1 },
  expAmt:      { fontSize: 12, fontWeight: '800' },
  expPerPerson:{ color: 'rgba(255,255,255,0.35)', fontSize: 10 },
  summaryStrip:      { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  summaryStripBorder:{ ...StyleSheet.absoluteFillObject, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(123,97,255,0.25)' },
  summaryStat:       { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 3 },
  summaryStatBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.07)' },
  summaryVal:        { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  summaryLbl:        { color: 'rgba(255,255,255,0.40)', fontSize: 10, fontWeight: '600' },
});
const p = StyleSheet.create({
  glowRing: { position: 'absolute', width: 68, height: 68, borderRadius: 34, borderWidth: 2, top: -10 },
  outer:    { width: 46, height: 46, borderRadius: 23, borderWidth: 2.5, overflow: 'hidden', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.7, shadowRadius: 12, elevation: 10 },
  inner:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji:    { fontSize: 20 },
  tail:     { width: 3, height: 10, borderRadius: 2, marginTop: -1 },
  callout:  { position: 'absolute', bottom: 72, borderRadius: 12, overflow: 'hidden', minWidth: 160, maxWidth: 200, paddingHorizontal: 12, paddingVertical: 9, alignSelf: 'center' },
  calloutBase:   { ...StyleSheet.absoluteFillObject, borderRadius: 12, backgroundColor: 'rgba(14,8,44,0.94)' },
  calloutBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 12, borderWidth: 1 },
  calloutTitle:  { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  calloutAmt:    { fontSize: 15, fontWeight: '800', marginBottom: 1 },
  calloutCat:    { color: 'rgba(255,255,255,0.40)', fontSize: 10, fontWeight: '600' },
});
const ed = StyleSheet.create({
  overlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:    { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', paddingBottom: 36 },
  base:     { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A0520', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  topBorder:{ position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'center', marginTop: 14, marginBottom: 10 },
  emojiHero:{ width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 10 },
  title:    { color: '#FFFFFF', fontSize: 20, fontWeight: '800', textAlign: 'center', paddingHorizontal: 24, letterSpacing: -0.3 },
  meta:     { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 14 },
  amtRow:   { flexDirection: 'row', marginHorizontal: 18, borderRadius: 16, overflow: 'hidden', borderWidth: 1, marginBottom: 10 },
  amtItem:  { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  amtVal:   { fontSize: 17, fontWeight: '800' },
  amtLabel: { color: 'rgba(255,255,255,0.40)', fontSize: 11, fontWeight: '600' },
  infoRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 11, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  infoLabel:{ color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  infoVal:  { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  doneBtn:  { marginHorizontal: 22, marginTop: 14, height: 50, borderRadius: 14, backgroundColor: 'rgba(123,97,255,0.20)', borderWidth: 1, borderColor: 'rgba(123,97,255,0.45)', alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { color: '#A78BFA', fontSize: 15, fontWeight: '800' },
});
