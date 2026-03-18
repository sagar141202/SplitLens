import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated,
  Pressable, TextInput, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MeshBackground from '../components/MeshBackground';
import GlassCard from '../components/GlassCard';
import { COLORS, RADIUS, SPACE, SHADOW } from '../theme';

const GROUPS = [
  {
    id: '1', name: 'Goa Trip 2026',
    emoji: '🏖️', members: 6,
    total: 42800, settled: 28000,
    gradient: ['#FF3A8C', '#FF9F1C'],
    memberAvatars: ['A', 'P', 'R', 'S', 'D', 'M'],
    lastActivity: '2 hours ago',
  },
  {
    id: '2', name: 'Flat — Sector 11',
    emoji: '🏠', members: 3,
    total: 18400, settled: 18400,
    gradient: ['#7B61FF', '#00D4FF'],
    memberAvatars: ['A', 'R', 'K'],
    lastActivity: 'Yesterday',
  },
  {
    id: '3', name: 'Office Lunch Gang',
    emoji: '🍱', members: 8,
    total: 9600, settled: 4200,
    gradient: ['#00E6A0', '#00D4FF'],
    memberAvatars: ['P', 'S', 'D', 'M', 'A', 'K', 'J', 'N'],
    lastActivity: 'Today',
  },
  {
    id: '4', name: 'Weekend Trek',
    emoji: '⛰️', members: 5,
    total: 7200, settled: 0,
    gradient: ['#FF6FB0', '#7B61FF'],
    memberAvatars: ['A', 'P', 'R', 'S', 'D'],
    lastActivity: '3 days ago',
  },
];

function GroupCard({ group, index }) {
  const slide = useRef(new Animated.Value(60)).current;
  const fade  = useRef(new Animated.Value(0)).current;
  const progress = group.settled / group.total;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slide, { toValue: 0, damping: 14, stiffness: 160, delay: index * 90, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 400, delay: index * 90, useNativeDriver: true }),
    ]).start();
  }, []);

  const isFullySettled = progress >= 1;

  return (
    <Animated.View style={{ transform: [{ translateY: slide }], opacity: fade }}>
      <GlassCard
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        glowColor={group.gradient[0]}
        padding={20}
        borderRadius={RADIUS.xl}
        style={{ marginBottom: 14 }}
      >
        {/* Header */}
        <View style={styles.groupHeader}>
          <LinearGradient colors={group.gradient} style={styles.groupEmoji}>
            <Text style={{ fontSize: 24 }}>{group.emoji}</Text>
          </LinearGradient>

          <View style={{ flex: 1 }}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupMeta}>{group.members} members · {group.lastActivity}</Text>
          </View>

          {isFullySettled ? (
            <View style={styles.settledBadge}>
              <Text style={styles.settledText}>✓ Done</Text>
            </View>
          ) : (
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
        </View>

        {/* Member avatars */}
        <View style={styles.avatarRow}>
          {group.memberAvatars.slice(0, 5).map((a, i) => (
            <View key={i} style={[styles.avatar, { marginLeft: i > 0 ? -10 : 0, zIndex: 10 - i }]}>
              <Text style={styles.avatarText}>{a}</Text>
            </View>
          ))}
          {group.members > 5 && (
            <View style={[styles.avatar, styles.avatarMore, { marginLeft: -10 }]}>
              <Text style={styles.avatarMoreText}>+{group.members - 5}</Text>
            </View>
          )}
          <Text style={styles.totalAmount}>₹{group.total.toLocaleString('en-IN')} total</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressWrapper}>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={isFullySettled ? ['#00E6A0', '#00D4FF'] : group.gradient}
              style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.progressLabel}>
            ₹{group.settled.toLocaleString('en-IN')} settled ({Math.round(progress * 100)}%)
          </Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

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
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={{ opacity: headerFade }}>
          <View style={styles.header}>
            <Text style={styles.screenTitle}>Groups</Text>
            <Pressable onPress={() => {}}>
              <LinearGradient colors={['#7B61FF', '#00D4FF']} style={styles.createBtn}>
                <Text style={styles.createBtnText}>+ New Group</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Stats pill row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginBottom: SPACE.xl }}>
            {[
              { label: 'Total Groups', value: GROUPS.length, color: COLORS.accent.primary },
              { label: 'Active',       value: GROUPS.filter(g => g.settled < g.total).length, color: COLORS.accent.warning },
              { label: 'Settled',      value: GROUPS.filter(g => g.settled >= g.total).length, color: COLORS.accent.success },
            ].map(stat => (
              <GlassCard key={stat.label} padding={14} borderRadius={RADIUS.md}>
                <Text style={[styles.statVal, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLbl}>{stat.label}</Text>
              </GlassCard>
            ))}
          </ScrollView>

          {/* Search */}
          <BlurView intensity={20} tint="dark" style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search groups..."
              placeholderTextColor={COLORS.text.tertiary}
              value={search}
              onChangeText={setSearch}
            />
          </BlurView>
        </Animated.View>

        {/* Group cards */}
        <View style={{ marginTop: SPACE.md }}>
          {filtered.map((g, i) => <GroupCard key={g.id} group={g} index={i} />)}
        </View>
      </ScrollView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: SPACE.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.xl },
  screenTitle: { color: COLORS.text.primary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  createBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: RADIUS.full },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  statVal: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  statLbl: { color: COLORS.text.tertiary, fontSize: 11, textAlign: 'center', marginTop: 2 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: RADIUS.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.glass.border,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, color: COLORS.text.primary, fontSize: 15 },

  // Group card
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  groupEmoji: { width: 52, height: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  groupName: { color: COLORS.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 3 },
  groupMeta: { color: COLORS.text.tertiary, fontSize: 12 },

  settledBadge: { backgroundColor: COLORS.accent.success + '22', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.accent.success + '44' },
  settledText: { color: COLORS.accent.success, fontSize: 11, fontWeight: '700' },
  activeBadge: { backgroundColor: COLORS.accent.warning + '22', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.accent.warning + '44' },
  activeText: { color: COLORS.accent.warning, fontSize: 11, fontWeight: '700' },

  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.accent.primary + '33',
    borderWidth: 2, borderColor: '#0D0B2B',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.accent.primary, fontSize: 13, fontWeight: '700' },
  avatarMore: { backgroundColor: COLORS.glass.white10 },
  avatarMoreText: { color: COLORS.text.secondary, fontSize: 11, fontWeight: '700' },
  totalAmount: { marginLeft: 'auto', color: COLORS.text.secondary, fontSize: 13, fontWeight: '600' },

  progressWrapper: { gap: 6 },
  progressBg: {
    height: 5, backgroundColor: COLORS.glass.white10,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { color: COLORS.text.tertiary, fontSize: 11 },
});
