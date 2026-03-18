import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable,
  Dimensions, ScrollView, Modal, TouchableWithoutFeedback, Platform,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
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
  Fun: '#A78BFA',  Health: '#00E6A0', Other: '#7B61FF',
};
const EMOJI_CAT = {
  '🍽️':'Food','🍕':'Food','☕':'Food','🍺':'Food','🎂':'Food','🍱':'Food',
  '✈️':'Travel','⛽':'Travel','🚗':'Travel','🛺':'Travel',
  '🛒':'Shopping','🎁':'Shopping',
  '🎬':'Fun','🎮':'Fun','🏖️':'Fun','🎵':'Fun',
  '💊':'Health',
};

function pinOffset(index) {
  const ring  = Math.floor(index / 8);
  const slot  = index % 8;
  const angle = (slot / 8) * 2 * Math.PI + ring * 0.45;
  const r     = 0.007 + ring * 0.008;
  return { lat: Math.sin(angle) * r, lng: Math.cos(angle) * r };
}

function PinMarker({ pin, isSelected, onPress }) {
  const scale  = useRef(new Animated.Value(0)).current;
  const dropY  = useRef(new Animated.Value(-20)).current;
  const glow   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 200, useNativeDriver: true }),
      Animated.spring(dropY, { toValue: 0,  damping: 10, stiffness: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isSelected ? 1.4 : 1,
      damping: 10, stiffness: 260, useNativeDriver: true,
    }).start();
    if (isSelected) {
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.2, duration: 700, useNativeDriver: true }),
      ])).start();
    } else {
      glow.stopAnimation();
      glow.setValue(0);
    }
  }, [isSelected]);

  return (
    <Pressable onPress={onPress} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
      <Animated.View style={{ transform: [{ scale }, { translateY: dropY }], alignItems: 'center' }}>
        {isSelected && (
          <Animated.View style={[pm.glowRing, {
            borderColor: pin.color + '90',
            backgroundColor: pin.color + '20',
            opacity: glow,
          }]} />
        )}
        <View style={[pm.bubble, { borderColor: pin.color + 'CC', shadowColor: pin.color }]}>
          <LinearGradient colors={[pin.color, pin.color + 'BB']} style={pm.bubbleInner}>
            <Text style={pm.emoji}>{pin.emoji}</Text>
          </LinearGradient>
        </View>
        <LinearGradient colors={[pin.color, pin.color + '00']} style={pm.tail} />
        {isSelected && (
          <View style={pm.callout}>
            <View style={pm.calloutBase} />
            <View style={[pm.calloutBorder, { borderColor: pin.color + '60' }]} />
            <LinearGradient colors={[pin.color + '20', 'transparent']} style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Text style={pm.calloutTitle} numberOfLines={1}>{pin.title}</Text>
            <Text style={[pm.calloutAmt, { color: pin.color }]}>₹{pin.amount.toLocaleString('en-IN')}</Text>
            <Text style={pm.calloutCat}>{pin.category}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

function ExpDetailModal({ visible, pin, onClose }) {
  const slideY = useRef(new Animated.Value(120)).current;
  const fade   = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, damping: 14, stiffness: 140, useNativeDriver: true }),
        Animated.timing(fade,   { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else { slideY.setValue(120); fade.setValue(0); }
  }, [visible]);
  if (!pin) return null;
  const per = Math.round(pin.amount / Math.max(pin.members || 2, 1));
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[ed.overlay, { opacity: fade }]} />
      </TouchableWithoutFeedback>
      <Animated.View style={[ed.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={ed.base} />
        <BlurView intensity={65} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 30 }]} />
        <LinearGradient colors={['rgba(20,10,54,0.98)', 'rgba(10,5,32,0.99)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 30 }]} />
        <LinearGradient colors={['transparent', pin.color + '80', pin.color + '40', 'transparent']} style={ed.topBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={ed.handle} />
        <LinearGradient colors={[pin.color, pin.color + 'AA']} style={ed.emojiBox}>
          <Text style={{ fontSize: 38 }}>{pin.emoji}</Text>
        </LinearGradient>
        <Text style={ed.title}>{pin.title}</Text>
        <Text style={ed.sub}>{pin.category}  ·  {pin.paidBy ? 'Paid by ' + pin.paidBy : ''}</Text>
        <View style={[ed.amtRow, { borderColor: pin.color + '35' }]}>
          <LinearGradient colors={[pin.color + '18', 'transparent']} style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]} />
          {[
            { label: 'Total',  val: '₹' + pin.amount.toLocaleString('en-IN'), color: '#FFFFFF' },
            { label: 'People', val: pin.members || 2,                         color: '#A78BFA' },
            { label: 'Each',   val: '₹' + per.toLocaleString('en-IN'),       color: pin.color },
          ].map((row, i) => (
            <View key={i} style={[ed.amtCell, i > 0 && ed.amtCellBorder]}>
              <Text style={[ed.amtVal, { color: row.color }]}>{row.val}</Text>
              <Text style={ed.amtLabel}>{row.label}</Text>
            </View>
          ))}
        </View>
        {pin.note ? <View style={ed.noteBox}><Text style={ed.noteText}>📝  {pin.note}</Text></View> : null}
        <Pressable onPress={onClose} style={ed.doneBtn}>
          <Text style={ed.doneTxt}>Done</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { expenses } = useData();
  const mapRef = useRef(null);
  const [selected,     setSelected]     = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [userLoc,      setUserLoc]      = useState(null);
  const [mapType,      setMapType]      = useState('standard');
  const [sheetBig,     setSheetBig]     = useState(false);
  const [detailPin,    setDetailPin]    = useState(null);
  const [showDetail,   setShowDetail]   = useState(false);
  const sheetAnim     = useRef(new Animated.Value(0)).current;
  const topBarAnim    = useRef(new Animated.Value(0)).current;
  const recenterScale = useRef(new Animated.Value(1)).current;
  const mapTypeBounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLoc(loc.coords);
      }
    })();
    Animated.parallel([
      Animated.spring(sheetAnim,  { toValue: 1, damping: 16, stiffness: 130, delay: 400, useNativeDriver: true }),
      Animated.timing(topBarAnim, { toValue: 1, duration: 500, delay: 200,   useNativeDriver: true }),
    ]).start();
  }, []);

  const BASE_LAT = userLoc?.latitude  ?? 29.3909;
  const BASE_LNG = userLoc?.longitude ?? 76.9635;

  const pins = expenses.map((e, i) => {
    const off = pinOffset(i);
    const cat  = EMOJI_CAT[e.emoji] || 'Other';
    return {
      id: e.id, title: e.title, amount: e.amount,
      members: e.members || 2, paidBy: e.paidBy || 'You',
      note: e.note || '', date: e.date || '',
      emoji: e.emoji || '💸',
      color: (e.color?.[0]) ?? CAT_COLORS[cat],
      category: cat,
      lat: BASE_LAT + off.lat, lng: BASE_LNG + off.lng,
    };
  });

  const filtered = activeFilter === 'All' ? pins : pins.filter(p => p.category === activeFilter);
  const total = filtered.reduce((s, p) => s + p.amount, 0);
  const avg   = filtered.length > 0 ? Math.round(total / filtered.length) : 0;

  const catCounts = {};
  CATEGORIES.forEach(c => { catCounts[c] = c === 'All' ? pins.length : pins.filter(p => p.category === c).length; });
  const visibleCats = CATEGORIES.filter(c => c === 'All' || catCounts[c] > 0);

  const handlePinPress = useCallback((pin) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const deselect = selected === pin.id;
    setSelected(deselect ? null : pin.id);
    if (!deselect) {
      mapRef.current?.animateToRegion({
        latitude: pin.lat - 0.005, longitude: pin.lng,
        latitudeDelta: 0.022, longitudeDelta: 0.022,
      }, 550);
    }
  }, [selected]);

  const openDetail = (pin) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDetailPin(pin); setShowDetail(true);
  };

  const recenter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(recenterScale, { toValue: 0.82, duration: 100, useNativeDriver: true }),
      Animated.spring(recenterScale, { toValue: 1, damping: 8, stiffness: 300, useNativeDriver: true }),
    ]).start();
    if (filtered.length > 0 && mapRef.current) {
      const lats = filtered.map(p => p.lat);
      const lngs = filtered.map(p => p.lng);
      const pad  = 0.018;
      mapRef.current.animateToRegion({
        latitude:      (Math.min(...lats) + Math.max(...lats)) / 2,
        longitude:     (Math.min(...lngs) + Math.max(...lngs)) / 2,
        latitudeDelta:  Math.max(Math.max(...lats) - Math.min(...lats) + pad, 0.03),
        longitudeDelta: Math.max(Math.max(...lngs) - Math.min(...lngs) + pad, 0.03),
      }, 650);
    } else {
      mapRef.current?.animateToRegion({ latitude: BASE_LAT, longitude: BASE_LNG, latitudeDelta: 0.06, longitudeDelta: 0.06 }, 500);
    }
  };

  const cycleMapType = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(mapTypeBounce, { toValue: 0.82, duration: 110, useNativeDriver: true }),
      Animated.spring(mapTypeBounce, { toValue: 1, damping: 8, stiffness: 300, useNativeDriver: true }),
    ]).start();
    setMapType(t => t === 'standard' ? 'satellite' : t === 'satellite' ? 'hybrid' : 'standard');
  };

  const mapTypeIcon  = mapType === 'standard' ? '🛰️' : mapType === 'satellite' ? '🗺️' : '🌍';
  const mapTypeLabel = mapType === 'standard' ? '→ Satellite' : mapType === 'satellite' ? '→ Hybrid' : '→ Standard';

  const sheetTranslate = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] });
  const FAB_BOTTOM     = sheetBig ? H * 0.50 + insets.bottom : 256 + insets.bottom;
  const SHEET_LIST_H   = sheetBig ? H * 0.40 : 184;

  return (
    <View style={{ flex: 1, backgroundColor: '#080616' }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        mapType={mapType}
        initialRegion={{ latitude: BASE_LAT, longitude: BASE_LNG, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onPress={() => setSelected(null)}
      >
        {expenses.length > 0 && (
          <Circle
            center={{ latitude: BASE_LAT, longitude: BASE_LNG }}
            radius={2000}
            fillColor="rgba(123,97,255,0.06)"
            strokeColor="rgba(123,97,255,0.25)"
            strokeWidth={1.5}
          />
        )}
        {filtered.map(pin => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            tracksViewChanges
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => handlePinPress(pin)}
          >
            <PinMarker pin={pin} isSelected={selected === pin.id} onPress={() => handlePinPress(pin)} />
          </Marker>
        ))}
      </MapView>

      {/* TOP BAR */}
      <Animated.View style={[s.topBar, { paddingTop: insets.top + 10, opacity: topBarAnim }]}>
        <View style={s.topBarBase} />
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFillObject} />
        <LinearGradient colors={['rgba(8,5,22,0.94)', 'rgba(8,5,22,0.78)']} style={StyleSheet.absoluteFillObject} />
        <View style={s.topBarBorder} />
        <View style={s.topBarRow}>
          <View>
            <Text style={s.topBarSub}>Expense Map</Text>
            <Text style={s.topBarTitle}>
              {filtered.length} pin{filtered.length !== 1 ? 's' : ''}{activeFilter !== 'All' ? '  ·  ' + activeFilter : ''}
            </Text>
          </View>
          <LinearGradient colors={['#7B61FF', '#00D4FF']} style={s.totalPill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={s.totalPillTxt}>₹{total.toLocaleString('en-IN')} mapped</Text>
          </LinearGradient>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {visibleCats.map(cat => {
            const active = activeFilter === cat;
            const count  = catCounts[cat];
            return (
              <Pressable key={cat} onPress={() => { setActiveFilter(cat); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={{ overflow: 'hidden', borderRadius: 50 }}>
                {active ? (
                  <LinearGradient colors={['#7B61FF', '#00D4FF']} style={s.chipOn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={s.chipOnTxt}>{cat}</Text>
                    {cat !== 'All' && <View style={s.chipBadge}><Text style={s.chipBadgeTxt}>{count}</Text></View>}
                  </LinearGradient>
                ) : (
                  <View style={s.chipOff}>
                    <View style={s.chipOffBase} />
                    <Text style={s.chipOffTxt}>{cat}</Text>
                    {cat !== 'All' && <View style={[s.chipBadge, { backgroundColor: 'rgba(255,255,255,0.14)' }]}><Text style={[s.chipBadgeTxt, { color: 'rgba(255,255,255,0.65)' }]}>{count}</Text></View>}
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* FABS */}
      <Animated.View style={[s.fabCol, { bottom: FAB_BOTTOM }]}>
        <Animated.View style={{ transform: [{ scale: recenterScale }] }}>
          <Pressable onPress={recenter} style={s.fab}>
            <View style={s.fabBase} />
            <BlurView intensity={50} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 23 }]} />
            <LinearGradient colors={['rgba(20,10,52,0.92)', 'rgba(12,6,38,0.92)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 23 }]} />
            <View style={[StyleSheet.absoluteFillObject, { borderRadius: 23, borderWidth: 1, borderColor: 'rgba(123,97,255,0.45)' }]} />
            <Text style={s.fabIcon}>🎯</Text>
          </Pressable>
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: mapTypeBounce }] }}>
          <Pressable onPress={cycleMapType} style={s.fab}>
            <View style={s.fabBase} />
            <BlurView intensity={50} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 23 }]} />
            <LinearGradient colors={['rgba(20,10,52,0.92)', 'rgba(12,6,38,0.92)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 23 }]} />
            <View style={[StyleSheet.absoluteFillObject, { borderRadius: 23, borderWidth: 1, borderColor: 'rgba(0,212,255,0.38)' }]} />
            <Text style={s.fabIcon}>{mapTypeIcon}</Text>
          </Pressable>
        </Animated.View>
        <View style={s.mapLabel}>
          <View style={s.mapLabelBase} />
          <Text style={s.mapLabelTxt}>{mapTypeLabel}</Text>
        </View>
      </Animated.View>

      {/* BOTTOM SHEET */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: sheetTranslate }], paddingBottom: insets.bottom + 90 }]}>
        <View style={s.sheetBase} />
        <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
        <LinearGradient colors={['rgba(18,8,52,0.97)', 'rgba(10,5,34,0.99)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
        <LinearGradient colors={['transparent', '#7B61FF88', '#00D4FF55', 'transparent']} style={s.sheetTopBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSheetBig(b => !b); }} style={s.handleArea}>
          <View style={s.handle} />
        </Pressable>
        <View style={s.sheetHead}>
          <View style={{ flex: 1 }}>
            <Text style={s.sheetTitle}>{selected ? 'Pin Selected' : 'Tagged Expenses'}</Text>
            <Text style={s.sheetSub}>{filtered.length} location{filtered.length !== 1 ? 's' : ''}  ·  tap = fly  ·  hold = details</Text>
          </View>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSheetBig(b => !b); }}
            style={[s.expandBtn, sheetBig && { backgroundColor: 'rgba(123,97,255,0.30)' }]}>
            <Text style={s.expandBtnTxt}>{sheetBig ? '↓' : '↑'}</Text>
          </Pressable>
        </View>
        {filtered.length === 0 ? (
          <View style={s.emptySheet}>
            <Text style={{ fontSize: 34 }}>📍</Text>
            <Text style={s.emptySheetTxt}>
              {expenses.length === 0 ? 'Add expenses on Home to pin them here' : 'No ' + activeFilter + ' expenses yet'}
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SHEET_LIST_H }} contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingBottom: 8 }}>
            {filtered.map(pin => {
              const isActive = selected === pin.id;
              return (
                <Pressable key={pin.id} onPress={() => handlePinPress(pin)} onLongPress={() => openDetail(pin)} delayLongPress={280}
                  style={[s.row, isActive && { backgroundColor: pin.color + '1A' }]}>
                  <View style={[s.rowBorder, { borderColor: isActive ? pin.color + '55' : 'rgba(255,255,255,0.07)' }]} />
                  {isActive && <LinearGradient colors={[pin.color, pin.color + '00']} style={s.rowAccent} />}
                  <LinearGradient colors={[pin.color, pin.color + 'AA']} style={s.rowIcon}>
                    <Text style={{ fontSize: 17 }}>{pin.emoji}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle} numberOfLines={1}>{pin.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <View style={[s.catDot, { backgroundColor: CAT_COLORS[pin.category] || '#7B61FF' }]} />
                      <Text style={s.catTxt}>{pin.category}</Text>
                      <Text style={s.dotSep}>·</Text>
                      <Text style={s.catTxt}>{pin.paidBy}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <View style={[s.amtPill, { backgroundColor: pin.color + '22', borderColor: pin.color + '50' }]}>
                      <Text style={[s.amtTxt, { color: pin.color }]}>₹{pin.amount.toLocaleString('en-IN')}</Text>
                    </View>
                    <Text style={s.perPerson}>₹{Math.round(pin.amount / Math.max(pin.members, 1))}/person</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
        <View style={s.strip}>
          <LinearGradient colors={['rgba(123,97,255,0.14)', 'rgba(0,212,255,0.07)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={s.stripBorder} />
          {[
            { lbl: 'Pins',  val: filtered.length,                      color: '#A78BFA' },
            { lbl: 'Total', val: '₹' + total.toLocaleString('en-IN'), color: '#00D4FF' },
            { lbl: 'Avg',   val: '₹' + avg.toLocaleString('en-IN'),   color: '#00E6A0' },
          ].map((st, i) => (
            <View key={i} style={[s.stripStat, i > 0 && s.stripStatBorder]}>
              <Text style={[s.stripVal, { color: st.color }]}>{st.val}</Text>
              <Text style={s.stripLbl}>{st.lbl}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <ExpDetailModal visible={showDetail} pin={detailPin} onClose={() => { setShowDetail(false); setDetailPin(null); }} />
    </View>
  );
}

const pm = StyleSheet.create({
  glowRing:    { position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 2, top: -12 },
  bubble:      { width: 48, height: 48, borderRadius: 24, borderWidth: 2.5, overflow: 'hidden', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.7, shadowRadius: 10, elevation: 10 },
  bubbleInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji:       { fontSize: 21 },
  tail:        { width: 3, height: 10, borderRadius: 2, marginTop: -1 },
  callout:     { position: 'absolute', bottom: 72, borderRadius: 12, overflow: 'hidden', minWidth: 160, maxWidth: 200, paddingHorizontal: 12, paddingVertical: 9, alignSelf: 'center' },
  calloutBase:   { ...StyleSheet.absoluteFillObject, borderRadius: 12, backgroundColor: 'rgba(14,8,44,0.94)' },
  calloutBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 12, borderWidth: 1 },
  calloutTitle:  { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  calloutAmt:    { fontSize: 15, fontWeight: '800', marginBottom: 1 },
  calloutCat:    { color: 'rgba(255,255,255,0.40)', fontSize: 10, fontWeight: '600' },
});
const s = StyleSheet.create({
  topBar:       { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  topBarBase:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,5,22,0.90)' },
  topBarBorder: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(123,97,255,0.28)' },
  topBarRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
  topBarSub:    { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '500' },
  topBarTitle:  { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginTop: 2 },
  totalPill:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.45, shadowRadius: 8, elevation: 6 },
  totalPillTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  chipRow:      { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chipOn:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipOnTxt:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  chipOff:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', flexDirection: 'row', alignItems: 'center', gap: 5, overflow: 'hidden' },
  chipOffBase:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12,6,38,0.72)', borderRadius: 50 },
  chipOffTxt:   { color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: '600' },
  chipBadge:    { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 50, paddingHorizontal: 5, paddingVertical: 1 },
  chipBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  fabCol:       { position: 'absolute', right: 16, gap: 10, alignItems: 'flex-end' },
  fab:          { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.40, shadowRadius: 10, elevation: 8 },
  fabBase:      { ...StyleSheet.absoluteFillObject, borderRadius: 23, backgroundColor: 'rgba(14,7,42,0.92)' },
  fabIcon:      { fontSize: 19 },
  mapLabel:     { overflow: 'hidden', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 5 },
  mapLabelBase: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,7,42,0.85)', borderRadius: 50, borderWidth: 1, borderColor: 'rgba(0,212,255,0.28)' },
  mapLabelTxt:  { color: 'rgba(255,255,255,0.60)', fontSize: 11, fontWeight: '700' },
  sheet:        { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  sheetBase:    { ...StyleSheet.absoluteFillObject, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#0D0730' },
  sheetTopBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  handleArea:   { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle:       { width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)' },
  sheetHead:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12, gap: 12 },
  sheetTitle:   { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  sheetSub:     { color: 'rgba(255,255,255,0.38)', fontSize: 11, marginTop: 2 },
  expandBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(123,97,255,0.18)', borderWidth: 1, borderColor: 'rgba(123,97,255,0.38)', alignItems: 'center', justifyContent: 'center' },
  expandBtnTxt: { color: '#A78BFA', fontSize: 16, fontWeight: '800' },
  emptySheet:   { alignItems: 'center', paddingVertical: 22, gap: 8 },
  emptySheetTxt:{ color: 'rgba(255,255,255,0.38)', fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 30 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, overflow: 'hidden' },
  rowBorder:    { ...StyleSheet.absoluteFillObject, borderRadius: 14, borderWidth: 1 },
  rowAccent:    { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  rowIcon:      { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowTitle:     { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  catDot:       { width: 5, height: 5, borderRadius: 2.5 },
  catTxt:       { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600' },
  dotSep:       { color: 'rgba(255,255,255,0.22)', fontSize: 11 },
  amtPill:      { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 50, borderWidth: 1 },
  amtTxt:       { fontSize: 12, fontWeight: '800' },
  perPerson:    { color: 'rgba(255,255,255,0.32)', fontSize: 10 },
  strip:        { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  stripBorder:  { ...StyleSheet.absoluteFillObject, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(123,97,255,0.22)' },
  stripStat:    { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 3 },
  stripStatBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.07)' },
  stripVal:     { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  stripLbl:     { color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: '600' },
});
const ed = StyleSheet.create({
  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.58)' },
  sheet:        { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden', paddingBottom: 36 },
  base:         { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A0520', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  topBorder:    { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  handle:       { width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'center', marginTop: 14, marginBottom: 10 },
  emojiBox:     { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 10 },
  title:        { color: '#FFFFFF', fontSize: 21, fontWeight: '800', textAlign: 'center', paddingHorizontal: 28, letterSpacing: -0.3 },
  sub:          { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 14 },
  amtRow:       { flexDirection: 'row', marginHorizontal: 18, borderRadius: 18, overflow: 'hidden', borderWidth: 1, marginBottom: 12 },
  amtCell:      { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  amtCellBorder:{ borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.08)' },
  amtVal:       { fontSize: 18, fontWeight: '800' },
  amtLabel:     { color: 'rgba(255,255,255,0.40)', fontSize: 11, fontWeight: '600' },
  noteBox:      { marginHorizontal: 18, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 8 },
  noteText:     { color: 'rgba(255,255,255,0.70)', fontSize: 13 },
  doneBtn:      { marginHorizontal: 20, marginTop: 10, height: 50, borderRadius: 14, backgroundColor: 'rgba(123,97,255,0.20)', borderWidth: 1, borderColor: 'rgba(123,97,255,0.45)', alignItems: 'center', justifyContent: 'center' },
  doneTxt:      { color: '#A78BFA', fontSize: 15, fontWeight: '800' },
});
