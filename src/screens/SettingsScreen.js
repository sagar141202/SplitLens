import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Animated, Pressable, Switch, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MeshBackground from '../components/MeshBackground';
import GlassCard from '../components/GlassCard';
import { COLORS, RADIUS, SPACE } from '../theme';

const PROFILE = {
  name:    'Rahul Sharma',
  upi:     'rahul@ybl',
  avatar:  'R',
  totalSplit: '₹1,24,800',
  groups:  4,
  friends: 12,
};

const SETTINGS_SECTIONS = [
  {
    title: 'Preferences',
    items: [
      { label: 'Default Currency', value: 'INR ₹', icon: '💱' },
      { label: 'Split Method',     value: 'Equal',  icon: '÷' },
      { label: 'Notifications',    value: 'toggle', icon: '🔔' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { label: 'UPI AutoPay',   value: 'Connected',    icon: '⚡', color: COLORS.accent.success },
      { label: 'Google Pay',    value: 'Connect',      icon: '🔗', color: COLORS.accent.primary },
      { label: 'PhonePe',       value: 'Connect',      icon: '🔗', color: COLORS.accent.primary },
    ],
  },
  {
    title: 'Data',
    items: [
      { label: 'Export CSV',      value: '',         icon: '📤' },
      { label: 'Backup to Drive', value: '',         icon: '☁️' },
      { label: 'Clear History',   value: '',         icon: '🗑️', danger: true },
    ],
  },
];

function SettingRow({ item }) {
  const isToggle = item.value === 'toggle';
  const [toggled, setToggled] = React.useState(true);

  return (
    <Pressable
      style={styles.settingRow}
      onPress={() => {
        if (item.danger) Alert.alert('Clear History', 'Are you sure? This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive' },
        ]);
      }}
    >
      <View style={[styles.settingIcon, { backgroundColor: (item.color ?? COLORS.glass.white10) + '22' }]}>
        <Text style={{ fontSize: 16 }}>{item.icon}</Text>
      </View>
      <Text style={[styles.settingLabel, item.danger && { color: COLORS.accent.danger }]}>{item.label}</Text>
      {isToggle ? (
        <Switch
          value={toggled}
          onValueChange={setToggled}
          trackColor={{ false: COLORS.glass.white10, true: COLORS.accent.primary }}
          thumbColor="#fff"
        />
      ) : (
        <Text style={[styles.settingValue, item.color && { color: item.color }]}>
          {item.value} {item.value && !item.danger && '›'}
        </Text>
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return (
    <MeshBackground>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile hero */}
        <Animated.View style={{ opacity: headerFade }}>
          <GlassCard padding={24} borderRadius={RADIUS.xl} glowColor={COLORS.accent.primary} style={{ marginBottom: SPACE.xl }}>
            <LinearGradient colors={['rgba(123,97,255,0.3)', 'transparent']} style={StyleSheet.absoluteFillObject} />

            <View style={styles.profileRow}>
              <LinearGradient colors={['#7B61FF', '#00D4FF']} style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{PROFILE.avatar}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{PROFILE.name}</Text>
                <Text style={styles.profileUpi}>{PROFILE.upi}</Text>
              </View>
              <Pressable>
                <Text style={styles.editBtn}>Edit</Text>
              </Pressable>
            </View>

            {/* Stats */}
            <View style={styles.profileStats}>
              {[
                { val: PROFILE.totalSplit, lbl: 'Total Split' },
                { val: PROFILE.groups,     lbl: 'Groups' },
                { val: PROFILE.friends,    lbl: 'Friends' },
              ].map((s, i) => (
                <View key={i} style={[styles.profileStat, i > 0 && { borderLeftWidth: 0.5, borderLeftColor: COLORS.glass.borderSub }]}>
                  <Text style={styles.profileStatVal}>{s.val}</Text>
                  <Text style={styles.profileStatLbl}>{s.lbl}</Text>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Settings sections */}
          {SETTINGS_SECTIONS.map((section) => (
            <View key={section.title} style={{ marginBottom: SPACE.lg }}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <GlassCard padding={0} borderRadius={RADIUS.lg}>
                {section.items.map((item, i) => (
                  <View key={item.label}>
                    {i > 0 && <View style={styles.divider} />}
                    <SettingRow item={item} />
                  </View>
                ))}
              </GlassCard>
            </View>
          ))}

          {/* Version */}
          <Text style={styles.version}>SplitLens v1.0.0 · Made with 💜</Text>
        </Animated.View>
      </ScrollView>
    </MeshBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: SPACE.lg },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: SPACE.lg },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  profileName: { color: COLORS.text.primary, fontSize: 18, fontWeight: '700' },
  profileUpi:  { color: COLORS.text.tertiary, fontSize: 13, marginTop: 2 },
  editBtn:     { color: COLORS.accent.primary, fontSize: 14, fontWeight: '600' },

  profileStats: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: COLORS.glass.borderSub, paddingTop: SPACE.md },
  profileStat:  { flex: 1, alignItems: 'center', paddingVertical: 4 },
  profileStatVal: { color: COLORS.text.primary, fontSize: 16, fontWeight: '800' },
  profileStatLbl: { color: COLORS.text.tertiary, fontSize: 11, marginTop: 2 },

  sectionTitle: { color: COLORS.text.tertiary, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },

  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.md, paddingVertical: 14, gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, color: COLORS.text.primary, fontSize: 15 },
  settingValue: { color: COLORS.text.tertiary, fontSize: 14 },

  divider: { height: 0.5, backgroundColor: COLORS.glass.borderSub, marginLeft: 60 },
  version: { textAlign: 'center', color: COLORS.text.muted, fontSize: 12, marginTop: SPACE.xl },
});
