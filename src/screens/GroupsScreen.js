import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Animated, Pressable, TextInput, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MeshBackground from '../components/MeshBackground';
import { COLORS } from '../theme';

const { width: W } = Dimensions.get('window');

const GROUPS = [
  {
    id: '1', name: 'Goa Trip 2026',
    emoji: '🏖️', members: 6,
    total: 42800, settled: 28000,
    gradient: ['#FF3A8C', '#FF9F1C'],
    avatars: [
      { letter: 'A', color: '#7B61FF' },
      { letter: 'P', color: '#FF3A8C' },
      { letter: 'R', color: '#00D4FF' },
      { letter: 'S', color: '#FF9F1C' },
      { letter: 'D', color: '#00E6A0' },
      { letter: 'M', color: '#FF6FB0' },
    ],
    lastActivity: '2 hours ago',
    myShare: 7130,
    myPaid: 4200,
  },
  {
    id: '2', name: 'Flat — Sector 11',
    emoji: '🏠', members: 3,
    total: 18400, settled: 18400,
    gradient: ['#7B61FF', '#00D4FF'],
    avatars: [
      { letter: 'A', color: '#7B61FF' },
      { letter: 'R', color: '#00D4FF' },
      { letter: 'K', color: '#00E6A0' },
    ],
    lastActivity: 'Yesterday',
    myShare: 6133,
    myPaid: 6133,
  },
  {
    id: '3', name: 'Office Lunch Gang',
    emoji: '🍱', members: 8,
    total: 9600, settled: 4200,
    gradient: ['#00E6A0', '#00D4FF'],
    avatars: [
      { letter: 'P', color: '#FF3A8C' },
      { letter: 'S', color: '#FF9F1C' },
      { letter: 'D', color: '#00E6A0' },
      { letter: 'M', color: '#FF6FB0' },
      { letter: 'A', color: '#7B61FF' },
      { letter: 'K', color: '#00D4FF' },
      { letter: 'J', color: '#FF3A8C' },
      { letter: 'N', color: '#7B61FF' },
    ],
    lastActivity: 'Today',
    myShare: 1200,
    myPaid: 525,
  },
  {
    id: '4', name: 'Weekend Trek',
    emoji: '⛰️', members: 5,
    total: 7200, settled: 0,
    gradient: ['#FF6FB0', '#7B61FF'],
    avatars: [
      { letter: 'A', color: '#7B61FF' },
      { letter: 'P', color: '#FF3A8C' },
      { letter: 'R', color: '#00D4FF' },
      { letter: 'S', color: '#FF9F1C' },
      { letter: 'D', color: '#00E6A0' },
    ],
    lastActivity: '3 days ago',
    myShare: 1440,
    myPaid: 0,
  },
];

// ─── Summary Banner ───────────────────────────────────────
function SummaryBanner() {
  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,   { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const totalGroups  = GROUPS.length;
  const activeGroups = GROUPS.filter(g => g.settled < g.total).length;
  const totalSpend   = GROUPS.reduce((s, g) => s + g.total, 0);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slideY }], marginBottom: 20 }}>
      <LinearGradient colors={['#1E0B5E', '#120840', '#0A0525']} style={styles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* Purple glow */}
        <View style={styles.bannerGlow} />
        <View style={styles.bannerBorder} />

        <View style={styles.bannerRow}>
          {[
            { val: totalGroups,                                    lbl: 'Total Groups', color: '#A78BFA' },
            { val: activeGroups,                                   lbl: 'Active',       color: '#FF9F1C' },
            { val: '₹' + (totalSpend / 1000).toFixed(0) + 'k',   lbl: 'Total Spent',  color: '#00D4FF' },
            { val: GROUPS.filter(g => g.settled >= g.total).length, lbl: 'Settled',    color: '#00E6A0' },
          ].map((s, i) => (
            <View key={i} style={[styles.bannerStat, i > 0 && styles.bannerStatBorder]}>
              <Text style={[styles.bannerVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.bannerLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Search Bar ───────────────────────────────────────────
function SearchBar({ value, onChangeText }) {
  return (
    <View style={styles.searchWrap}>
      <View style={styles.searchBase} />
      <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} />
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)']}
        style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
      />
      <View style={styles.searchBorder} />
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search groups..."
        placeholderTextColor="rgba(255,255,255,0.30)"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

// ─── Group Card ───────────────────────────────────────────
function GroupCard({ group, index }) {
  const slideY = useRef(new Animated.Value(50)).current;
  const fade   = useRef(new Animated.Value(0)).current;
  const progress = group.total > 0 ? group.settled / group.total : 0;
  const isSettled = progress >= 1;
  const pct = Math.round(progress * 100);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, damping: 14, stiffness: 150, delay: index * 80, useNativeDriver: true }),
      Animated.timing(fade,   { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const amountOwed = group.myShare - group.myPaid;

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slideY }], marginBottom: 14 }}>
      <Pressable
        style={styles.card}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        {/* Solid opaque dark base */}
        <View style={styles.cardBase} />
        <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]} />
        <LinearGradient
          colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.02)']}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
        />
        {/* Left color wash from gradient */}
        <LinearGradient
          colors={[group.gradient[0] + '28', 'transparent']}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0 }}
        />
        {/* Border */}
        <View style={[styles.cardBorder, { borderColor: group.gradient[0] + '45' }]} />

        <View style={styles.cardInner}>

          {/* ── Top row: emoji + name + badge ── */}
          <View style={styles.topRow}>
            <LinearGradient colors={group.gradient} style={styles.emojiBox}>
              <Text style={styles.emojiText}>{group.emoji}</Text>
            </LinearGradient>

            <View style={{ flex: 1 }}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMeta}>
                {group.members} members  ·  {group.lastActivity}
              </Text>
            </View>

            {isSettled ? (
              <View style={[styles.badge, { backgroundColor: '#00E6A022', borderColor: '#00E6A055' }]}>
                <Text style={[styles.badgeText, { color: '#00E6A0' }]}>✓ Settled</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: '#FF9F1C22', borderColor: '#FF9F1C55' }]}>
                <Text style={[styles.badgeText, { color: '#FF9F1C' }]}>Active</Text>
              </View>
            )}
          </View>

          {/* ── Divider ── */}
          <View style={styles.divider} />

          {/* ── Middle row: avatars + total ── */}
          <View style={styles.midRow}>
            {/* Overlapping avatars */}
            <View style={styles.avatarStack}>
              {group.avatars.slice(0, 4).map((av, i) => (
                <LinearGradient
                  key={i}
                  colors={[av.color, av.color + 'AA']}
                  style={[styles.avatar, { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }]}
                >
                  <Text style={styles.avatarLetter}>{av.letter}</Text>
                </LinearGradient>
              ))}
              {group.members > 4 && (
                <View style={[styles.avatar, styles.avatarExtra, { marginLeft: -10, zIndex: 0 }]}>
                  <Text style={styles.avatarExtraText}>+{group.members - 4}</Text>
                </View>
              )}
            </View>

            {/* Total amount */}
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalLabel}>Total Spend</Text>
              <Text style={styles.totalValue}>₹{group.total.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* ── Progress bar ── */}
          <View style={styles.progressSection}>
            <View style={styles.progressBg}>
              <LinearGradient
                colors={isSettled ? ['#00E6A0', '#00D4FF'] : group.gradient}
                style={[styles.progressFill, { width: `${pct}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLeft}>
                ₹{group.settled.toLocaleString('en-IN')} settled
              </Text>
              <Text style={[styles.progressRight, { color: isSettled ? '#00E6A0' : group.gradient[0] }]}>
                {pct}%
              </Text>
            </View>
          </View>

          {/* ── My share row ── */}
          {!isSettled && (
            <View style={[styles.myShareRow, { borderColor: group.gradient[0] + '35' }]}>
              <View style={[styles.myShareBg, { backgroundColor: group.gradient[0] + '15' }]} />
              <Text style={styles.myShareLabel}>Your share</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={styles.mySharePaid}>
                  ₹{group.myPaid.toLocaleString('en-IN')} paid
                </Text>
                {amountOwed > 0 && (
                  <LinearGradient colors={group.gradient} style={styles.owedPill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.owedText}>₹{amountOwed.toLocaleString('en-IN')} left</Text>
                  </LinearGradient>
                )}
              </View>
            </View>
          )}

        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────
export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const headerFade = useRef(new Animated.Value(0)).current;
  const [search, setSearch] = useState('');

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const filtered = GROUPS.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MeshBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 20, paddingBottom: 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View>
            <Text style={styles.screenSubtitle}>Manage your</Text>
            <Text style={styles.screenTitle}>Groups</Text>
          </View>
          <Pressable>
            <LinearGradient
              colors={['#7B61FF', '#00D4FF']}
              style={styles.newBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.newBtnText}>+ New</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Summary Banner */}
        <SummaryBanner />

        {/* Search */}
        <SearchBar value={search} onChangeText={setSearch} />

        {/* Section label */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>
            {filtered.length} {filtered.length === 1 ? 'group' : 'groups'}
          </Text>
          <Pressable>
            <Text style={styles.sortBtn}>Sort ↕</Text>
          </Pressable>
        </View>

        {/* Cards */}
        {filtered.map((g, i) => (
          <GroupCard key={g.id} group={g} index={i} />
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No groups found</Text>
          </View>
        )}
      </ScrollView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18 },

  // ── Header ──
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 22,
  },
  screenSubtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '500' },
  screenTitle:    { color: '#FFFFFF', fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  newBtn: {
    paddingHorizontal: 22, paddingVertical: 11,
    borderRadius: 50,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55, shadowRadius: 12, elevation: 8,
  },
  newBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // ── Summary Banner ──
  banner: {
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#5B3FFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  bannerGlow: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: 100, backgroundColor: '#6B4FFF',
    top: -80, left: -40, opacity: 0.4,
  },
  bannerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  bannerRow: { flexDirection: 'row' },
  bannerStat: { flex: 1, alignItems: 'center', paddingVertical: 20, gap: 4 },
  bannerStatBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.10)' },
  bannerVal: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  bannerLbl: { color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },

  // ── Search ──
  searchWrap: {
    height: 52, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, overflow: 'hidden',
    marginBottom: 18,
  },
  searchBase: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16, backgroundColor: 'rgba(18,10,50,0.90)',
  },
  searchBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  searchIcon:  { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '500' },

  // ── Section row ──
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600' },
  sortBtn:      { color: '#7B61FF', fontSize: 13, fontWeight: '700' },

  // ── Group Card ──
  card:     { borderRadius: 24, overflow: 'hidden' },
  cardBase: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24, backgroundColor: 'rgba(16,8,48,0.93)',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24, borderWidth: 1,
  },
  cardInner: { padding: 18 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emojiBox: {
    width: 54, height: 54, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  emojiText: { fontSize: 26 },
  groupName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: -0.2 },
  groupMeta: { color: 'rgba(255,255,255,0.50)', fontSize: 12, fontWeight: '500' },

  badge: {
    borderRadius: 50, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, flexShrink: 0,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 14 },

  midRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(16,8,48,0.9)',
  },
  avatarLetter: { color: '#fff', fontSize: 13, fontWeight: '800' },
  avatarExtra: { backgroundColor: 'rgba(255,255,255,0.12)' },
  avatarExtraText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' },

  totalLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600', textAlign: 'right' },
  totalValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },

  // Progress
  progressSection: { gap: 8 },
  progressBg: {
    height: 7, backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 4, overflow: 'hidden',
  },
  progressFill:   { height: '100%', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLeft:   { color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '500' },
  progressRight:  { fontSize: 12, fontWeight: '800' },

  // My share
  myShareRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, overflow: 'hidden',
  },
  myShareBg: { ...StyleSheet.absoluteFillObject, borderRadius: 12 },
  myShareLabel: { color: 'rgba(255,255,255,0.60)', fontSize: 12, fontWeight: '600' },
  mySharePaid:  { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
  owedPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  owedText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 40 },
  emptyText:  { color: 'rgba(255,255,255,0.40)', fontSize: 16, fontWeight: '600' },
});