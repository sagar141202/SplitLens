import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated,
  Dimensions, Pressable, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MeshBackground from '../components/MeshBackground';
import GlassCard from '../components/GlassCard';
import { COLORS, RADIUS, SPACE, SHADOW } from '../theme';

const { width: W } = Dimensions.get('window');

// ─── Mock data ───────────────────────────────────────────
const BALANCE_SUMMARY = {
  totalOwed: 2340.50,
  totalOwe:  870.00,
  net:       1470.50,
};

const RECENT = [
  { id: '1', title: 'Dinner at Spice Route',  amount: 1840,  members: 4, color: ['#7B61FF','#00D4FF'], emoji: '🍽️',  date: 'Today', location: 'Sector 17, Chandigarh' },
  { id: '2', title: 'Goa Trip — Hotel',        amount: 12400, members: 6, color: ['#FF3A8C','#FF9F1C'], emoji: '🏖️',  date: 'Yesterday', location: 'Candolim, Goa' },
  { id: '3', title: 'Monthly Groceries',       amount: 3200,  members: 3, color: ['#00E6A0','#00D4FF'], emoji: '🛒',  date: 'Mon', location: 'Big Bazaar, Panipat' },
  { id: '4', title: 'Zomato — Pizza Night',    amount: 640,   members: 2, color: ['#FF6FB0','#7B61FF'], emoji: '🍕',  date: 'Sun', location: 'Home delivery' },
];

const FRIENDS = [
  { name: 'Arjun', amount: 640,   owes: true,  avatar: 'A', color: '#7B61FF' },
  { name: 'Priya', amount: 280,   owes: false, avatar: 'P', color: '#FF3A8C' },
  { name: 'Rohan', amount: 1420,  owes: true,  avatar: 'R', color: '#00D4FF' },
  { name: 'Sana',  amount: 380,   owes: false, avatar: 'S', color: '#FF9F1C' },
  { name: 'Dev',   amount: 560,   owes: true,  avatar: 'D', color: '#00E6A0' },
];

// ─── Animated number component ───────────────────────────
function AnimatedNumber({ value, prefix = '₹', style }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value,
      duration: 1400,
      useNativeDriver: false,
    }).start();
    anim.addListener(({ value: v }) => {
      setDisplay(Math.floor(v).toLocaleString('en-IN'));
    });
    return () => anim.removeAllListeners();
  }, [value]);

  return <Text style={style}>{prefix}{display}</Text>;
}

// ─── Balance Hero Card ───────────────────────────────────
function BalanceCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });

  return (
    <View style={styles.heroWrapper}>
      {/* Main gradient card */}
      <LinearGradient
        colors={['#2D1B69', '#0D0B2B']}
        style={styles.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Shimmer overlay */}
        <Animated.View style={[styles.heroShimmer, { opacity: shimmerOpacity }]} />
        <LinearGradient
          colors={['rgba(123,97,255,0.35)', 'transparent']}
          style={styles.heroGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Glass border */}
        <View style={styles.heroBorder} />

        <Text style={styles.heroLabel}>Net Balance</Text>
        <AnimatedNumber
          value={BALANCE_SUMMARY.net}
          style={styles.heroAmount}
        />
        <Text style={styles.heroSub}>You're owed this much overall</Text>

        {/* Mini stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>You're owed</Text>
            <AnimatedNumber value={BALANCE_SUMMARY.totalOwed} style={[styles.statValue, { color: COLORS.accent.success }]} />
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>You owe</Text>
            <AnimatedNumber value={BALANCE_SUMMARY.totalOwe} style={[styles.statValue, { color: COLORS.accent.danger }]} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Friend Avatar Row ────────────────────────────────────
function FriendChip({ friend, delay }) {
  const slide = useRef(new Animated.Value(30)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(fade,  { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: slide }], opacity: fade }}>
      <GlassCard style={styles.friendChip} padding={12} borderRadius={RADIUS.md} onPress={() => {}}>
        <View style={[styles.friendAvatar, { backgroundColor: friend.color + '33', borderColor: friend.color }]}>
          <Text style={[styles.friendAvatarText, { color: friend.color }]}>{friend.avatar}</Text>
        </View>
        <Text style={styles.friendName}>{friend.name}</Text>
        <Text style={[
          styles.friendAmount,
          { color: friend.owes ? COLORS.accent.success : COLORS.accent.danger }
        ]}>
          {friend.owes ? '+' : '-'}₹{friend.amount}
        </Text>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Recent Split Card ────────────────────────────────────
function SplitCard({ item, index }) {
  const slide = useRef(new Animated.Value(50)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 100;
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(fade,  { toValue: 1, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const perPerson = Math.round(item.amount / item.members);

  return (
    <Animated.View style={{ transform: [{ translateY: slide }], opacity: fade }}>
      <GlassCard
        style={styles.splitCard}
        onPress={() => {}}
        glowColor={item.color[0]}
        padding={16}
        borderRadius={RADIUS.lg}
      >
        {/* Left gradient accent */}
        <LinearGradient
          colors={item.color}
          style={styles.splitAccent}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.splitContent}>
          <View style={styles.splitLeft}>
            <View style={[styles.emojiPill, { backgroundColor: item.color[0] + '22' }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.splitTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.splitMeta}>📍 {item.location}</Text>
              <Text style={styles.splitDate}>{item.date} · {item.members} people</Text>
            </View>
          </View>

          <View style={styles.splitRight}>
            <LinearGradient colors={item.color} style={styles.amountPill}>
              <Text style={styles.amountTotal}>₹{item.amount.toLocaleString('en-IN')}</Text>
            </LinearGradient>
            <Text style={styles.perPerson}>₹{perPerson}/person</Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return (
    <MeshBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View>
            <Text style={styles.greeting}>Good evening 👋</Text>
            <Text style={styles.username}>Rahul Sharma</Text>
          </View>
          <Pressable>
            <LinearGradient colors={['#7B61FF', '#00D4FF']} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Balance Hero */}
        <BalanceCard />

        {/* Friends row */}
        <Text style={styles.sectionTitle}>Friends</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE.lg, gap: 10 }}>
          {FRIENDS.map((f, i) => <FriendChip key={f.name} friend={f} delay={i * 80} />)}
        </ScrollView>

        {/* Recent splits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Splits</Text>
          <Pressable><Text style={styles.seeAll}>See all</Text></Pressable>
        </View>

        <View style={styles.splitList}>
          {RECENT.map((item, i) => <SplitCard key={item.id} item={item} index={i} />)}
        </View>
      </ScrollView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: SPACE.lg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.xl,
  },
  greeting: { color: COLORS.text.tertiary, fontSize: 13, letterSpacing: 0.3 },
  username: { color: COLORS.text.primary, fontSize: 22, fontWeight: '700', marginTop: 2 },

  addBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── Balance card ──
  heroWrapper: { marginBottom: SPACE.xl },
  heroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACE.xl,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  heroShimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(123,97,255,0.12)',
  },
  heroGlow: {
    position: 'absolute', top: 0, left: 0,
    width: 200, height: 200,
    borderRadius: 100,
  },
  heroBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  heroLabel: {
    color: COLORS.text.tertiary, fontSize: 13, letterSpacing: 1,
    textTransform: 'uppercase', fontWeight: '600',
  },
  heroAmount: {
    color: COLORS.text.primary, fontSize: 42, fontWeight: '800',
    marginTop: 6, marginBottom: 4,
    letterSpacing: -1,
  },
  heroSub: { color: COLORS.text.secondary, fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    marginTop: SPACE.lg,
    paddingTop: SPACE.md,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.glass.borderSub,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 0.5, backgroundColor: COLORS.glass.borderSub },
  statLabel: { color: COLORS.text.tertiary, fontSize: 11, letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },

  // ── Friends ──
  sectionTitle: {
    color: COLORS.text.primary, fontSize: 17, fontWeight: '700',
    marginBottom: 12, marginTop: SPACE.lg,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACE.lg, marginBottom: 12 },
  seeAll: { color: COLORS.accent.primary, fontSize: 13, fontWeight: '600' },

  friendChip: { alignItems: 'center', minWidth: 80 },
  friendAvatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  friendAvatarText: { fontSize: 17, fontWeight: '700' },
  friendName: { color: COLORS.text.secondary, fontSize: 11, textAlign: 'center', fontWeight: '500' },
  friendAmount: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 2 },

  // ── Split cards ──
  splitList: { gap: 12 },
  splitCard: { overflow: 'hidden' },
  splitAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
    borderTopLeftRadius: RADIUS.lg, borderBottomLeftRadius: RADIUS.lg,
  },
  splitContent: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 10, gap: 12,
  },
  splitLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiPill: {
    width: 44, height: 44, borderRadius: RADIUS.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  splitTitle: { color: COLORS.text.primary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  splitMeta: { color: COLORS.text.tertiary, fontSize: 11, marginBottom: 1 },
  splitDate: { color: COLORS.text.tertiary, fontSize: 11 },
  splitRight: { alignItems: 'flex-end', gap: 4 },
  amountPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  amountTotal: { color: '#fff', fontSize: 13, fontWeight: '700' },
  perPerson: { color: COLORS.text.tertiary, fontSize: 11 },
});
