import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MeshBackground from '../components/MeshBackground';
import { COLORS, RADIUS, SPACE, SHADOW } from '../theme';

const BALANCE_SUMMARY = { totalOwed: 2340.50, totalOwe: 870.00, net: 1470.50 };

const RECENT = [
  { id: '1', title: 'Dinner at Spice Route', amount: 1840,  members: 4, color: ['#7B61FF','#00D4FF'], emoji: '🍽️', date: 'Today',     location: 'Sector 17, Chandigarh' },
  { id: '2', title: 'Goa Trip — Hotel',       amount: 12400, members: 6, color: ['#FF3A8C','#FF9F1C'], emoji: '🏖️', date: 'Yesterday', location: 'Candolim, Goa' },
  { id: '3', title: 'Monthly Groceries',      amount: 3200,  members: 3, color: ['#00E6A0','#00D4FF'], emoji: '🛒', date: 'Mon',       location: 'Big Bazaar, Panipat' },
  { id: '4', title: 'Zomato — Pizza Night',   amount: 640,   members: 2, color: ['#FF6FB0','#7B61FF'], emoji: '🍕', date: 'Sun',       location: 'Home delivery' },
];

const FRIENDS = [
  { name: 'Arjun', amount: 640,  owes: true,  avatar: 'A', color: '#7B61FF' },
  { name: 'Priya', amount: 280,  owes: false, avatar: 'P', color: '#FF3A8C' },
  { name: 'Rohan', amount: 1420, owes: true,  avatar: 'R', color: '#00D4FF' },
  { name: 'Sana',  amount: 380,  owes: false, avatar: 'S', color: '#FF9F1C' },
  { name: 'Dev',   amount: 560,  owes: true,  avatar: 'D', color: '#00E6A0' },
];

function AnimatedNumber({ value, prefix = '₹', style }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 1400, useNativeDriver: false }).start();
    anim.addListener(({ value: v }) => setDisplay(Math.floor(v).toLocaleString('en-IN')));
    return () => anim.removeAllListeners();
  }, [value]);
  return <Text style={style}>{prefix}{display}</Text>;
}

function BalanceCard() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });

  return (
    <View style={styles.heroOuter}>
      <LinearGradient colors={['#2A1570', '#16085E', '#0A0525']} style={styles.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Animated.View style={[styles.heroBlob, { opacity: glowOpacity }]} />
        <LinearGradient colors={['rgba(255,255,255,0.18)', 'transparent']} style={styles.heroTopEdge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={styles.heroBorder} />
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>NET BALANCE</Text>
          <AnimatedNumber value={BALANCE_SUMMARY.net} style={styles.heroAmount} />
          <Text style={styles.heroSub}>You are owed this amount overall</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={[styles.statDot, { backgroundColor: '#00E6A0' }]} />
            <Text style={styles.statLabel}>You're owed</Text>
            <AnimatedNumber value={BALANCE_SUMMARY.totalOwed} style={[styles.statValue, { color: '#00E6A0' }]} />
          </View>
          <View style={styles.statSep} />
          <View style={styles.statBox}>
            <View style={[styles.statDot, { backgroundColor: '#FF4D6D' }]} />
            <Text style={styles.statLabel}>You owe</Text>
            <AnimatedNumber value={BALANCE_SUMMARY.totalOwe} style={[styles.statValue, { color: '#FF4D6D' }]} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function FriendChip({ friend, index }) {
  const fadeY = useRef(new Animated.Value(20)).current;
  const fade  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeY, { toValue: 0, duration: 380, delay: index * 70, useNativeDriver: true }),
      Animated.timing(fade,  { toValue: 1, duration: 380, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: fadeY }] }}>
      <Pressable style={styles.friendChip}>
        {/* Solid opaque base — no more see-through */}
        <View style={[StyleSheet.absoluteFillObject, { borderRadius: 18, backgroundColor: 'rgba(22,12,60,0.92)' }]} />
        <LinearGradient
          colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)']}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]}
        />
        <View style={[styles.friendChipBorder, { borderColor: friend.color + '80' }]} />
        <LinearGradient colors={[friend.color, friend.color + 'AA']} style={styles.friendAvatar}>
          <Text style={styles.friendAvatarText}>{friend.avatar}</Text>
        </LinearGradient>
        <Text style={styles.friendName}>{friend.name}</Text>
        <Text style={[styles.friendAmt, { color: friend.owes ? '#00E6A0' : '#FF4D6D' }]}>
          {friend.owes ? '+' : '-'}₹{friend.amount >= 1000 ? (friend.amount / 1000).toFixed(1) + 'k' : friend.amount}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function SplitCard({ item, index }) {
  const slideY = useRef(new Animated.Value(40)).current;
  const fade   = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 450, delay: index * 90, useNativeDriver: true }),
      Animated.timing(fade,   { toValue: 1, duration: 450, delay: index * 90, useNativeDriver: true }),
    ]).start();
  }, []);

  const perPerson = Math.round(item.amount / item.members);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slideY }] }}>
      <Pressable style={styles.splitCard}>
        {/* Solid dark base */}
        <View style={[StyleSheet.absoluteFillObject, { borderRadius: 20, backgroundColor: 'rgba(18,10,50,0.92)' }]} />
        <LinearGradient
          colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.02)']}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
        />
        {/* Left accent bar */}
        <LinearGradient colors={item.color} style={styles.splitAccentBar} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
        {/* Left color wash */}
        <LinearGradient
          colors={[item.color[0] + '30', 'transparent']}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.6, y: 0.5 }}
        />
        {/* Border */}
        <View style={[styles.splitBorder, { borderColor: item.color[0] + '55' }]} />

        <View style={styles.splitInner}>
          <LinearGradient colors={[item.color[0] + '66', item.color[1] + '33']} style={styles.emojiBox}>
            <Text style={styles.emojiText}>{item.emoji}</Text>
          </LinearGradient>
          <View style={styles.splitInfo}>
            <Text style={styles.splitTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.splitLocation} numberOfLines={1}>📍 {item.location}</Text>
            <Text style={styles.splitMeta}>{item.date}  ·  {item.members} people</Text>
          </View>
          <View style={styles.splitAmountCol}>
            <LinearGradient colors={item.color} style={styles.amountBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.amountText}>
                ₹{item.amount >= 1000 ? (item.amount / 1000).toFixed(1) + 'k' : item.amount}
              </Text>
            </LinearGradient>
            <Text style={styles.perPersonText}>₹{perPerson}/person</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  return (
    <MeshBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View>
            <Text style={styles.greeting}>Good evening 👋</Text>
            <Text style={styles.username}>Rahul Sharma</Text>
          </View>
          <Pressable>
            <LinearGradient colors={['#7B61FF', '#00D4FF']} style={styles.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <BalanceCard />

        <Text style={styles.sectionTitle}>Friends</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsRow}>
          {FRIENDS.map((f, i) => <FriendChip key={f.name} friend={f} index={i} />)}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Splits</Text>
          <Pressable><Text style={styles.seeAll}>See all ›</Text></Pressable>
        </View>

        <View style={styles.splitList}>
          {RECENT.map((item, i) => <SplitCard key={item.id} item={item} index={i} />)}
        </View>
      </ScrollView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { color: 'rgba(255,255,255,0.65)', fontSize: 14, letterSpacing: 0.2 },
  username: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 },
  addBtn: { paddingHorizontal: 22, paddingVertical: 11, borderRadius: 50, shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.3 },

  heroOuter: { marginBottom: 28, borderRadius: 28, shadowColor: '#5B3FFF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 14 },
  heroCard: { borderRadius: 28, overflow: 'hidden' },
  heroBlob: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#6B4FFF', top: -90, left: -70 },
  heroTopEdge: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 },
  heroBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  heroContent: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 22 },
  heroLabel: { color: 'rgba(255,255,255,0.60)', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  heroAmount: { color: '#FFFFFF', fontSize: 48, fontWeight: '800', marginTop: 8, marginBottom: 6, letterSpacing: -1.5 },
  heroSub: { color: 'rgba(255,255,255,0.60)', fontSize: 13 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', marginTop: 4 },
  statBox: { flex: 1, paddingVertical: 18, paddingHorizontal: 24, gap: 5 },
  statSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 14 },
  statDot: { width: 7, height: 7, borderRadius: 3.5, marginBottom: 1 },
  statLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },

  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.2, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 14 },
  seeAll: { color: '#7B61FF', fontSize: 14, fontWeight: '700' },

  friendsRow: { gap: 10, paddingRight: 4 },
  friendChip: { width: 86, paddingVertical: 14, paddingHorizontal: 10, borderRadius: 18, alignItems: 'center', gap: 7, overflow: 'hidden' },
  friendChipBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 18, borderWidth: 1.5 },
  friendAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  friendAvatarText: { color: '#fff', fontSize: 19, fontWeight: '800' },
  friendName: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  friendAmt: { fontSize: 12, fontWeight: '800', textAlign: 'center' },

  splitList: { gap: 12 },
  splitCard: { borderRadius: 20, overflow: 'hidden', minHeight: 82 },
  splitAccentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
  splitBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 20, borderWidth: 1 },
  splitInner: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 16, paddingVertical: 16, gap: 12 },
  emojiBox: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emojiText: { fontSize: 24 },
  splitInfo: { flex: 1, gap: 4 },
  splitTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: -0.1 },
  splitLocation: { color: 'rgba(255,255,255,0.60)', fontSize: 12 },
  splitMeta: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  splitAmountCol: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  amountBadge: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 50 },
  amountText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  perPersonText: { color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '500' },
});
