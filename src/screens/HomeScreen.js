import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, Pressable,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, RefreshControl, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import MeshBackground from '../components/MeshBackground';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const { width: W } = Dimensions.get('window');

const EMOJI_OPTIONS = ['🍽️','🛒','🏖️','🎬','⛽','☕','🍕','🎮','✈️','🏠','💊','🎁','🍺','🎂','🧾','🚗'];
const COLOR_OPTIONS = [
  ['#7B61FF','#00D4FF'],['#FF3A8C','#FF9F1C'],['#00E6A0','#00D4FF'],
  ['#FF6FB0','#7B61FF'],['#FF9F1C','#FF3A8C'],['#00D4FF','#7B61FF'],
];
const CATEGORY_FILTERS = ['All','Food','Travel','Shopping','Fun','Health','Other'];
const EMOJI_CATEGORY = {
  '🍽️':'Food','🍕':'Food','☕':'Food','🍺':'Food','🎂':'Food',
  '✈️':'Travel','⛽':'Travel','🚗':'Travel',
  '🛒':'Shopping','🎁':'Shopping',
  '🎬':'Fun','🎮':'Fun','🏖️':'Fun',
  '💊':'Health','🏠':'Other','🧾':'Other',
};

function formatDate(isoOrLabel) {
  if (!isoOrLabel || isoOrLabel === 'Just now') return 'Just now';
  try {
    const d = new Date(isoOrLabel);
    if (isNaN(d)) return isoOrLabel;
    const diff = Math.floor((new Date() - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' });
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch { return isoOrLabel; }
}

function groupByDate(expenses) {
  const groups = {};
  expenses.forEach(e => {
    const label = formatDate(e.createdAt || e.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(e);
  });
  return groups;
}

function AnimatedNumber({ value, prefix = '₹', style, duration = 1200 }) {
  const anim = useRef(new Animated.Value(0)).current;
  const prev = useRef(0);
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    anim.setValue(prev.current);
    Animated.timing(anim, { toValue: value, duration, useNativeDriver: false }).start();
    prev.current = value;
    anim.addListener(({ value: v }) => setDisplay(Math.floor(v).toLocaleString('en-IN')));
    return () => anim.removeAllListeners();
  }, [value]);
  return <Text style={style}>{prefix}{display}</Text>;
}

function QuickStats({ expenses }) {
  const slideUp = useRef(new Animated.Value(20)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 500, delay: 300, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 500, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);
  if (expenses.length === 0) return null;
  const today = expenses.filter(e => formatDate(e.createdAt || e.date) === 'Today');
  const thisWeek = expenses.filter(e => {
    try { return (new Date() - new Date(e.createdAt || e.date)) / 86400000 < 7; } catch { return false; }
  });
  const todayAmt = today.reduce((s, e) => s + e.amount, 0);
  const weekAmt = thisWeek.reduce((s, e) => s + e.amount, 0);
  const avgSplit = Math.round(expenses.reduce((s, e) => s + (e.amount / e.members), 0) / expenses.length);
  const stats = [
    { label: 'Today', value: '₹' + todayAmt.toLocaleString('en-IN'), color: '#00D4FF', emoji: '📅' },
    { label: 'This week', value: '₹' + weekAmt.toLocaleString('en-IN'), color: '#A78BFA', emoji: '📊' },
    { label: 'Avg split', value: '₹' + avgSplit.toLocaleString('en-IN'), color: '#00E6A0', emoji: '➗' },
    { label: 'Splits', value: expenses.length, color: '#FF9F1C', emoji: '🧾' },
  ];
  return (
    <Animated.View style={[qs.row, { opacity: fade, transform: [{ translateY: slideUp }] }]}>
      {stats.map((st, i) => (
        <View key={i} style={qs.card}>
          <View style={qs.cardBase} />
          <View style={[qs.cardBorder, { borderColor: st.color + '30' }]} />
          <Text style={qs.cardEmoji}>{st.emoji}</Text>
          <Text style={[qs.cardVal, { color: st.color }]}>{st.value}</Text>
          <Text style={qs.cardLabel}>{st.label}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

function InsightBanner({ expenses }) {
  const slideX = useRef(new Animated.Value(-30)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideX, { toValue: 0, damping: 14, stiffness: 120, delay: 500, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 500, delay: 500, useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.02, duration: 1800, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
    ])).start();
  }, []);
  if (expenses.length < 2) return null;
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const maxExp = expenses.reduce((a, b) => a.amount > b.amount ? a : b);
  const cats = {};
  expenses.forEach(e => { const c = EMOJI_CATEGORY[e.emoji] || 'Other'; cats[c] = (cats[c] || 0) + e.amount; });
  const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
  const avg = Math.round(total / expenses.length);
  const splitTip = avg > 500 ? 'Consider splitting more often' : 'Great job splitting!';
  const insights = [
    { text: 'Your biggest expense is "' + maxExp.title + '" at \u20b9' + maxExp.amount.toLocaleString('en-IN'), icon: '💡', color: '#FFB800' },
    { text: (topCat ? topCat[0] : 'Food') + ' is your top spending category (\u20b9' + ((topCat ? topCat[1] : 0)).toLocaleString('en-IN') + ')', icon: '📊', color: '#A78BFA' },
    { text: 'Average expense: \u20b9' + avg.toLocaleString('en-IN') + ' \u2014 ' + splitTip, icon: '✨', color: '#00D4FF' },
  ];
  const insight = insights[Math.floor(Date.now() / 10000) % insights.length];
  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateX: slideX }, { scale: pulse }], marginBottom: 20 }}>
      <View style={ins.card}>
        <LinearGradient colors={[insight.color + '22', 'rgba(10,5,36,0.6)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={[StyleSheet.absoluteFillObject, { borderRadius: 16, borderWidth: 1, borderColor: insight.color + '40' }]} />
        <Text style={ins.icon}>{insight.icon}</Text>
        <Text style={ins.text}>{insight.text}</Text>
      </View>
    </Animated.View>
  );
}

function BalanceCard({ total, yourShare, totalOwed, expenseCount }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const flip = useRef(new Animated.Value(0)).current;
  const [face, setFace] = useState(0);
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2500, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 2500, useNativeDriver: true }),
    ])).start();
  }, []);
  const glowOp = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = face === 0 ? 1 : 0;
    Animated.sequence([
      Animated.timing(flip, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(flip, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => setFace(next));
  };
  const cardScale = flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.96, 1] });
  return (
    <Pressable onPress={handleFlip} style={s.heroOuter}>
      <Animated.View style={{ transform: [{ scale: cardScale }] }}>
        <LinearGradient colors={['#2A1570', '#16085E', '#0A0525']} style={s.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Animated.View style={[s.heroBlob, { opacity: glowOp }]} />
          <LinearGradient colors={['rgba(255,255,255,0.18)', 'transparent']} style={s.heroTopEdge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={s.heroBorder} />
          {face === 0 ? (
            <View style={s.heroContent}>
              <Text style={s.heroLabel}>TOTAL EXPENSES</Text>
              <AnimatedNumber value={total} style={s.heroAmount} />
              <Text style={s.heroSub}>{total === 0 ? 'Tap "+ Add" to start tracking' : expenseCount + ' expense' + (expenseCount > 1 ? 's' : '') + ' tracked \u00b7 tap to flip'}</Text>
            </View>
          ) : (
            <View style={s.heroContent}>
              <Text style={s.heroLabel}>BREAKDOWN \u00b7 tap to flip back</Text>
              <View style={{ gap: 8, marginTop: 8 }}>
                {[
                  { label: 'Total spent', val: total, color: '#FFFFFF' },
                  { label: 'Your share', val: yourShare, color: '#FF4D6D' },
                  { label: "You're owed", val: totalOwed, color: '#00E6A0' },
                  { label: 'Net position', val: Math.abs(totalOwed - yourShare), color: totalOwed > yourShare ? '#00E6A0' : '#FF4D6D' },
                ].map((row, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{row.label}</Text>
                    <AnimatedNumber value={row.val} style={{ color: row.color, fontSize: 15, fontWeight: '800' }} duration={400} />
                  </View>
                ))}
              </View>
            </View>
          )}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <View style={[s.statDot, { backgroundColor: '#00E6A0' }]} />
              <Text style={s.statLabel}>You're owed</Text>
              <AnimatedNumber value={totalOwed} style={[s.statValue, { color: '#00E6A0' }]} />
            </View>
            <View style={s.statSep} />
            <View style={s.statBox}>
              <View style={[s.statDot, { backgroundColor: '#FF4D6D' }]} />
              <Text style={s.statLabel}>Your share</Text>
              <AnimatedNumber value={yourShare} style={[s.statValue, { color: '#FF4D6D' }]} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function CategoryFilter({ active, onChange, counts }) {
  const slideUp = useRef(new Animated.Value(16)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 400, delay: 200, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slideUp }], marginBottom: 16 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
        {CATEGORY_FILTERS.map(cat => {
          const isActive = active === cat;
          const count = counts[cat] || 0;
          return (
            <Pressable key={cat} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(cat); }} style={{ overflow: 'hidden', borderRadius: 50 }}>
              {isActive
                ? <LinearGradient colors={['#7B61FF', '#00D4FF']} style={cf.chip} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={cf.chipActiveText}>{cat}</Text>
                    {count > 0 && cat !== 'All' && <View style={cf.countBadge}><Text style={cf.countText}>{count}</Text></View>}
                  </LinearGradient>
                : <View style={cf.chipInactive}>
                    <View style={cf.chipBase} />
                    <Text style={cf.chipText}>{cat}</Text>
                    {count > 0 && cat !== 'All' && <View style={[cf.countBadge, { backgroundColor: 'rgba(255,255,255,0.12)' }]}><Text style={[cf.countText, { color: 'rgba(255,255,255,0.6)' }]}>{count}</Text></View>}
                  </View>
              }
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

function ExpenseDetailModal({ visible, expense, onClose, onDelete }) {
  const slideY = useRef(new Animated.Value(80)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, damping: 14, stiffness: 150, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      slideY.setValue(80);
      fade.setValue(0);
    }
  }, [visible]);
  if (!expense) return null;
  const perPerson = Math.round(expense.amount / expense.members);
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[d.overlay, { opacity: fade }]} />
      </TouchableWithoutFeedback>
      <Animated.View style={[d.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={d.base} />
        <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
        <LinearGradient colors={['rgba(22,10,60,0.98)', 'rgba(12,6,36,0.99)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
        <LinearGradient colors={['transparent', (expense.color || ['#7B61FF', '#00D4FF'])[0] + '80', (expense.color || ['#7B61FF', '#00D4FF'])[1] + '60', 'transparent']} style={d.topBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={d.handle} />
        <LinearGradient colors={expense.color || ['#7B61FF', '#00D4FF']} style={d.emojiHero}>
          <Text style={{ fontSize: 40 }}>{expense.emoji}</Text>
        </LinearGradient>
        <Text style={d.expTitle}>{expense.title}</Text>
        <Text style={d.expDate}>📍 {expense.location}  ·  {formatDate(expense.createdAt || expense.date)}</Text>
        <View style={d.amountCard}>
          <LinearGradient colors={expense.color || ['#7B61FF', '#00D4FF']} style={[StyleSheet.absoluteFillObject, { borderRadius: 18, opacity: 0.12 }]} />
          <View style={[StyleSheet.absoluteFillObject, { borderRadius: 18, borderWidth: 1, borderColor: (expense.color || ['#7B61FF'])[0] + '40' }]} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16 }}>
            {[
              { label: 'Total', val: '\u20b9' + (expense.amount || 0).toLocaleString('en-IN'), color: '#FFFFFF' },
              { label: 'People', val: expense.members, color: '#A78BFA' },
              { label: 'Each', val: '\u20b9' + perPerson.toLocaleString('en-IN'), color: (expense.color || ['#00D4FF'])[1] },
            ].map((row, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ color: row.color, fontSize: 20, fontWeight: '800' }}>{row.val}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600' }}>{row.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={d.row}>
          <Text style={d.rowLabel}>Category</Text>
          <View style={d.categoryPill}><Text style={d.categoryText}>{EMOJI_CATEGORY[expense.emoji] || 'Other'}</Text></View>
        </View>
        <View style={d.divider} />
        <View style={d.row}>
          <Text style={d.rowLabel}>Paid by</Text>
          <Text style={d.rowVal}>{expense.paidBy || 'You'}</Text>
        </View>
        {expense.note ? (
          <>
            <View style={d.divider} />
            <View style={d.row}>
              <Text style={d.rowLabel}>Note</Text>
              <Text style={[d.rowVal, { maxWidth: 200, textAlign: 'right' }]}>{expense.note}</Text>
            </View>
          </>
        ) : null}
        <View style={d.actions}>
          <Pressable onPress={onClose} style={d.closeBtn}><Text style={d.closeBtnText}>Done</Text></Pressable>
          <Pressable onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert('Delete', 'Remove "' + expense.title + '"?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => { onDelete(expense.id); onClose(); } },
            ]);
          }} style={d.deleteBtn}>
            <Text style={d.deleteBtnText}>Delete</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

function AddExpenseModal({ visible, onClose, onAdd, lastExpense }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [members, setMembers] = useState('2');
  const [paidBy, setPaidBy] = useState('You');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [emoji, setEmoji] = useState('🍽️');
  const [colorIdx, setColorIdx] = useState(0);
  const reset = () => { setTitle(''); setAmount(''); setMembers('2'); setPaidBy('You'); setLocation(''); setNote(''); setEmoji('🍽️'); setColorIdx(0); };
  const handleRepeatLast = () => {
    if (!lastExpense) return;
    setTitle(lastExpense.title);
    setAmount(String(lastExpense.amount));
    setMembers(String(lastExpense.members));
    setEmoji(lastExpense.emoji || '🍽️');
    const idx = COLOR_OPTIONS.findIndex(c => c[0] === (lastExpense.color || [])[0]);
    setColorIdx(idx >= 0 ? idx : 0);
    setLocation(lastExpense.location || '');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const handleAdd = () => {
    if (!title.trim()) { Alert.alert('Missing', 'Enter a title.'); return; }
    if (!amount || isNaN(amount) || +amount <= 0) { Alert.alert('Missing', 'Enter a valid amount.'); return; }
    if (!members || isNaN(members) || +members < 2) { Alert.alert('Invalid', 'Minimum 2 people.'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({
      id: Date.now().toString(),
      title: title.trim(),
      amount: parseFloat(amount),
      members: parseInt(members),
      paidBy: paidBy.trim() || 'You',
      location: location.trim() || 'No location',
      note: note.trim(),
      emoji,
      color: COLOR_OPTIONS[colorIdx],
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      createdAt: new Date().toISOString(),
    });
    reset(); onClose();
  };
  const perPerson = amount && members && !isNaN(amount) && !isNaN(members) && +members > 0
    ? Math.round(parseFloat(amount) / parseInt(members)) : 0;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={onClose}><View style={m.overlay} /></TouchableWithoutFeedback>
        <View style={m.sheet}>
          <View style={m.base} />
          <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
          <LinearGradient colors={['rgba(22,10,60,0.97)', 'rgba(12,6,36,0.99)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
          <LinearGradient colors={['transparent', 'rgba(123,97,255,0.7)', 'rgba(0,212,255,0.5)', 'transparent']} style={m.topBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={m.handle} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={m.title}>Add Expense</Text>
            {lastExpense && (
              <Pressable onPress={handleRepeatLast} style={m.repeatBtn}>
                <Text style={m.repeatBtnText}>↩ Repeat last</Text>
              </Pressable>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
            <Text style={m.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {EMOJI_OPTIONS.map((e, idx) => (
                <Pressable key={idx} onPress={() => { setEmoji(e); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[m.emojiBtn, emoji === e && m.emojiBtnActive]}>
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={m.label}>Color Theme</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {COLOR_OPTIONS.map((c, i) => (
                <Pressable key={i} onPress={() => { setColorIdx(i); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                  <LinearGradient colors={c} style={[m.colorDot, colorIdx === i && m.colorDotActive]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                </Pressable>
              ))}
            </View>
            <Text style={m.label}>What was it? *</Text>
            <View style={m.inputWrap}><View style={m.inputBase} /><TextInput style={m.input} placeholder="e.g. Dinner at Spice Route" placeholderTextColor="rgba(255,255,255,0.3)" value={title} onChangeText={setTitle} /></View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={m.label}>Amount (₹) *</Text>
                <View style={m.inputWrap}><View style={m.inputBase} /><TextInput style={m.input} placeholder="0" placeholderTextColor="rgba(255,255,255,0.3)" value={amount} onChangeText={setAmount} keyboardType="numeric" /></View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={m.label}>People *</Text>
                <View style={m.inputWrap}><View style={m.inputBase} /><TextInput style={m.input} placeholder="2" placeholderTextColor="rgba(255,255,255,0.3)" value={members} onChangeText={setMembers} keyboardType="numeric" /></View>
              </View>
            </View>
            <Text style={m.label}>Paid by</Text>
            <View style={m.inputWrap}><View style={m.inputBase} /><TextInput style={m.input} placeholder="Who paid?" placeholderTextColor="rgba(255,255,255,0.3)" value={paidBy} onChangeText={setPaidBy} autoCapitalize="words" /></View>
            <Text style={m.label}>Location (optional)</Text>
            <View style={m.inputWrap}><View style={m.inputBase} /><TextInput style={m.input} placeholder="e.g. Connaught Place" placeholderTextColor="rgba(255,255,255,0.3)" value={location} onChangeText={setLocation} /></View>
            <Text style={m.label}>Note (optional)</Text>
            <View style={m.inputWrap}><View style={m.inputBase} /><TextInput style={m.input} placeholder="Any extra details..." placeholderTextColor="rgba(255,255,255,0.3)" value={note} onChangeText={setNote} /></View>
            {perPerson > 0 && (
              <View style={m.previewCard}>
                <LinearGradient colors={[COLOR_OPTIONS[colorIdx][0] + '22', 'rgba(10,5,36,0.6)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]} />
                <View style={[StyleSheet.absoluteFillObject, { borderRadius: 14, borderWidth: 1, borderColor: COLOR_OPTIONS[colorIdx][0] + '40' }]} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={m.previewLabel}>Each person pays</Text>
                    <Text style={[m.previewVal, { color: COLOR_OPTIONS[colorIdx][1] }]}>{'\u20b9'}{perPerson.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={m.previewLabel}>Total</Text>
                    <Text style={m.previewTotal}>{'\u20b9'}{parseFloat(amount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                </View>
                <Text style={m.previewPaidBy}>Paid by {paidBy || 'You'}  ·  {parseInt(members || 2)} people  ·  {EMOJI_CATEGORY[emoji] || 'Other'}</Text>
              </View>
            )}
            <Pressable onPress={handleAdd}>
              <LinearGradient colors={['#7B61FF', '#00D4FF']} style={m.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={m.addBtnText}>Add Expense ✓</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SplitCard({ item, index, onDelete, onTap }) {
  const slideY = useRef(new Animated.Value(50)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, damping: 14, stiffness: 140, delay: index * 60, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, damping: 15, stiffness: 300, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, damping: 15, stiffness: 300, useNativeDriver: true }).start();
  const perPerson = Math.round(item.amount / item.members);
  const category = EMOJI_CATEGORY[item.emoji] || 'Other';
  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slideY }, { scale }] }}>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onTap(item); }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert('Options', item.title, [
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
            { text: 'Cancel', style: 'cancel' },
          ]);
        }}
        style={s.splitCard}
      >
        <View style={[StyleSheet.absoluteFillObject, { borderRadius: 20, backgroundColor: 'rgba(18,10,50,0.92)' }]} />
        <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]} />
        <LinearGradient colors={item.color} style={s.splitAccentBar} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
        <LinearGradient colors={[item.color[0] + '28', 'transparent']} style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]} start={{ x: 0, y: 0.5 }} end={{ x: 0.55, y: 0.5 }} />
        <View style={[s.splitBorder, { borderColor: item.color[0] + '45' }]} />
        <View style={s.splitInner}>
          <LinearGradient colors={[item.color[0] + '66', item.color[1] + '33']} style={s.emojiBox}>
            <Text style={s.emojiText}>{item.emoji}</Text>
          </LinearGradient>
          <View style={s.splitInfo}>
            <Text style={s.splitTitle} numberOfLines={1}>{item.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <View style={[s.catDot, { backgroundColor: item.color[0] }]} />
              <Text style={s.splitCategory}>{category}</Text>
              <Text style={s.splitDot}>·</Text>
              <Text style={s.splitMeta}>{item.members} people</Text>
            </View>
            <Text style={s.splitLocation} numberOfLines={1}>📍 {item.location}  ·  {formatDate(item.createdAt || item.date)}</Text>
            {item.paidBy && item.paidBy !== 'You' && <Text style={s.paidByText}>Paid by {item.paidBy}</Text>}
          </View>
          <View style={s.splitAmountCol}>
            <LinearGradient colors={item.color} style={s.amountBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.amountText}>{'\u20b9'}{item.amount >= 1000 ? (item.amount / 1000).toFixed(1) + 'k' : item.amount}</Text>
            </LinearGradient>
            <Text style={s.perPersonText}>{'\u20b9'}{perPerson}/person</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function DateHeader({ label, count, total }) {
  return (
    <View style={s.dateHeader}>
      <View style={s.dateLine} />
      <View style={s.datePill}>
        <View style={s.datePillBase} />
        <Text style={s.datePillText}>{label}</Text>
        {count > 0 && <Text style={s.datePillCount}>{count} · {'\u20b9'}{total.toLocaleString('en-IN')}</Text>}
      </View>
      <View style={s.dateLine} />
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { expenses, addExpense, deleteExpense, totalSpent, yourShare, totalOwed } = useData();
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailExp, setDetailExp] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const headerFade = useRef(new Animated.Value(0)).current;
  const searchWidth = useRef(new Animated.Value(0)).current;
  const searchOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  const toggleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!showSearch) {
      setShowSearch(true);
      Animated.parallel([
        Animated.spring(searchWidth, { toValue: 1, damping: 14, stiffness: 180, useNativeDriver: false }),
        Animated.timing(searchOp, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(searchWidth, { toValue: 0, duration: 250, useNativeDriver: false }),
        Animated.timing(searchOp, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => { setShowSearch(false); setSearchQuery(''); });
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const name = profile?.name ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const filteredExpenses = expenses.filter(e => {
    const matchCat = activeFilter === 'All' || (EMOJI_CATEGORY[e.emoji] || 'Other') === activeFilter;
    const matchSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const categoryCounts = { All: expenses.length };
  CATEGORY_FILTERS.slice(1).forEach(cat => {
    categoryCounts[cat] = expenses.filter(e => (EMOJI_CATEGORY[e.emoji] || 'Other') === cat).length;
  });

  const grouped = groupByDate(filteredExpenses);
  const lastExpense = expenses[0] || null;
  const searchAnimWidth = searchWidth.interpolate({ inputRange: [0, 1], outputRange: [0, W - 100] });

  return (
    <MeshBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7B61FF" colors={['#7B61FF']} />}
      >
        <Animated.View style={[s.header, { opacity: headerFade }]}>
          {showSearch ? (
            <Animated.View style={[s.searchBar, { width: searchAnimWidth, opacity: searchOp }]}>
              <View style={s.searchBarBase} />
              <View style={s.searchBarBorder} />
              <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
              <TextInput style={s.searchInput} placeholder="Search expenses..." placeholderTextColor="rgba(255,255,255,0.35)" value={searchQuery} onChangeText={setSearchQuery} autoFocus />
              <Pressable onPress={toggleSearch}><Text style={{ color: 'rgba(255,255,255,0.50)', fontSize: 16, marginLeft: 8 }}>✕</Text></Pressable>
            </Animated.View>
          ) : (
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>{greeting} 👋</Text>
              <Text style={s.username}>{name}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            {!showSearch && (
              <Pressable onPress={toggleSearch} style={s.iconBtn}>
                <Text style={{ fontSize: 18 }}>🔍</Text>
              </Pressable>
            )}
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowModal(true); }} style={{ overflow: 'hidden', borderRadius: 50 }}>
              <LinearGradient colors={['#7B61FF', '#00D4FF']} style={s.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={s.addBtnText}>+ Add</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>

        <BalanceCard total={totalSpent} yourShare={yourShare} totalOwed={totalOwed} expenseCount={expenses.length} />
        <QuickStats expenses={expenses} />
        <InsightBanner expenses={expenses} />
        {expenses.length > 0 && <CategoryFilter active={activeFilter} onChange={setActiveFilter} counts={categoryCounts} />}

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>
            {filteredExpenses.length === 0 && expenses.length > 0 ? 'No ' + (activeFilter !== 'All' ? activeFilter : '') + ' expenses' : expenses.length === 0 ? 'No Splits Yet' : 'Splits'}
          </Text>
          {filteredExpenses.length > 0 && (
            <Text style={s.splitCount}>{filteredExpenses.length} · {'\u20b9'}{filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}</Text>
          )}
        </View>

        {expenses.length === 0 ? (
          <Pressable onPress={() => setShowModal(true)} style={s.emptyState}>
            <View style={[StyleSheet.absoluteFillObject, { borderRadius: 24, backgroundColor: 'rgba(18,10,50,0.85)' }]} />
            <View style={[StyleSheet.absoluteFillObject, { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }]} />
            <Text style={s.emptyEmoji}>💸</Text>
            <Text style={s.emptyTitle}>No expenses yet</Text>
            <Text style={s.emptySub}>Tap here or "+ Add" to start tracking your first split</Text>
            <LinearGradient colors={['#7B61FF', '#00D4FF']} style={s.emptyBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.emptyBtnText}>Add First Expense</Text>
            </LinearGradient>
          </Pressable>
        ) : filteredExpenses.length === 0 ? (
          <View style={[s.emptyState, { paddingVertical: 30 }]}>
            <View style={[StyleSheet.absoluteFillObject, { borderRadius: 24, backgroundColor: 'rgba(18,10,50,0.85)' }]} />
            <Text style={{ fontSize: 36 }}>🔍</Text>
            <Text style={s.emptyTitle}>No results</Text>
            <Text style={s.emptySub}>Try a different filter</Text>
            <Pressable onPress={() => { setActiveFilter('All'); setSearchQuery(''); setShowSearch(false); }}>
              <Text style={{ color: '#7B61FF', fontSize: 14, fontWeight: '700', marginTop: 8 }}>Clear filters</Text>
            </Pressable>
          </View>
        ) : (
          Object.entries(grouped).map(([dateLabel, items]) => (
            <View key={dateLabel}>
              <DateHeader label={dateLabel} count={items.length} total={items.reduce((s, e) => s + e.amount, 0)} />
              <View style={{ gap: 10, marginBottom: 8 }}>
                {items.map((item, i) => (
                  <SplitCard key={item.id} item={item} index={i} onDelete={deleteExpense} onTap={(exp) => { setDetailExp(exp); setShowDetail(true); }} />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <AddExpenseModal visible={showModal} onClose={() => setShowModal(false)} onAdd={addExpense} lastExpense={lastExpense} />
      <ExpenseDetailModal visible={showDetail} expense={detailExp} onClose={() => { setShowDetail(false); setDetailExp(null); }} onDelete={deleteExpense} />
    </MeshBackground>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12 },
  greeting: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },
  username: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  addBtn: { paddingHorizontal: 22, paddingVertical: 11, borderRadius: 50, shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  searchBar: { flex: 1, height: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, overflow: 'hidden' },
  searchBarBase: { ...StyleSheet.absoluteFillObject, borderRadius: 14, backgroundColor: 'rgba(18,10,50,0.92)' },
  searchBarBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(123,97,255,0.50)' },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  heroOuter: { marginBottom: 20, borderRadius: 28, shadowColor: '#5B3FFF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 14 },
  heroCard: { borderRadius: 28, overflow: 'hidden' },
  heroBlob: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#6B4FFF', top: -90, left: -70 },
  heroTopEdge: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 },
  heroBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  heroContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20 },
  heroLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  heroAmount: { color: '#FFFFFF', fontSize: 46, fontWeight: '800', marginTop: 6, marginBottom: 4, letterSpacing: -1.5 },
  heroSub: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.10)', marginTop: 4 },
  statBox: { flex: 1, paddingVertical: 16, paddingHorizontal: 24, gap: 4 },
  statSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.10)', marginVertical: 12 },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statLabel: { color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '600' },
  statValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  splitCount: { color: 'rgba(255,255,255,0.40)', fontSize: 12, fontWeight: '600' },
  dateHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 },
  dateLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50, overflow: 'hidden' },
  datePillBase: { ...StyleSheet.absoluteFillObject, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)' },
  datePillText: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700' },
  datePillCount: { color: 'rgba(255,255,255,0.30)', fontSize: 11 },
  emptyState: { borderRadius: 24, overflow: 'hidden', alignItems: 'center', paddingVertical: 44, paddingHorizontal: 24, gap: 10 },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  emptySub: { color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center' },
  emptyBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 50 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  splitCard: { borderRadius: 20, overflow: 'hidden', minHeight: 82 },
  splitAccentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
  splitBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 20, borderWidth: 1 },
  splitInner: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 16, paddingVertical: 14, gap: 12 },
  emojiBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emojiText: { fontSize: 23 },
  splitInfo: { flex: 1, gap: 2 },
  splitTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  catDot: { width: 5, height: 5, borderRadius: 2.5 },
  splitCategory: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '600' },
  splitDot: { color: 'rgba(255,255,255,0.25)', fontSize: 11 },
  splitMeta: { color: 'rgba(255,255,255,0.40)', fontSize: 11 },
  splitLocation: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 },
  paidByText: { color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 1 },
  splitAmountCol: { alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  amountBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50 },
  amountText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  perPersonText: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
});
const qs = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  card: { flex: 1, borderRadius: 14, overflow: 'hidden', alignItems: 'center', paddingVertical: 12, gap: 3 },
  cardBase: { ...StyleSheet.absoluteFillObject, borderRadius: 14, backgroundColor: 'rgba(18,10,50,0.88)' },
  cardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 14, borderWidth: 1 },
  cardEmoji: { fontSize: 18, marginBottom: 2 },
  cardVal: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  cardLabel: { color: 'rgba(255,255,255,0.40)', fontSize: 10, fontWeight: '600' },
});
const ins = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  icon: { fontSize: 20, flexShrink: 0 },
  text: { color: 'rgba(255,255,255,0.75)', fontSize: 13, flex: 1, lineHeight: 18 },
});
const cf = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipActiveText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  chipInactive: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', flexDirection: 'row', alignItems: 'center', gap: 6, overflow: 'hidden' },
  chipBase: { ...StyleSheet.absoluteFillObject, borderRadius: 50, backgroundColor: 'rgba(18,10,50,0.80)' },
  chipText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600' },
  countBadge: { backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 50, paddingHorizontal: 6, paddingVertical: 1 },
  countText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', padding: 24, paddingBottom: 40, maxHeight: '94%' },
  base: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0E0730', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  topBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'center', marginBottom: 0 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  repeatBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, backgroundColor: 'rgba(123,97,255,0.20)', borderWidth: 1, borderColor: 'rgba(123,97,255,0.40)' },
  repeatBtnText: { color: '#A78BFA', fontSize: 12, fontWeight: '700' },
  label: { color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  inputWrap: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  inputBase: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,8,44,0.92)', borderRadius: 14 },
  input: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', padding: 14 },
  emojiBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  emojiBtnActive: { borderColor: '#7B61FF', backgroundColor: 'rgba(123,97,255,0.25)' },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  colorDotActive: { width: 34, height: 34, borderRadius: 17, borderWidth: 2.5, borderColor: '#FFFFFF' },
  previewCard: { borderRadius: 14, overflow: 'hidden', padding: 14, gap: 6 },
  previewLabel: { color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  previewVal: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  previewTotal: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  previewPaidBy: { color: 'rgba(255,255,255,0.40)', fontSize: 12 },
  addBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
const d = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.60)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', paddingBottom: 40 },
  base: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A0520', borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  topBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'center', marginTop: 14, marginBottom: 12 },
  emojiHero: { width: 70, height: 70, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  expTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3, paddingHorizontal: 24 },
  expDate: { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 16, paddingHorizontal: 24 },
  amountCard: { marginHorizontal: 18, borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 13 },
  rowLabel: { color: 'rgba(255,255,255,0.50)', fontSize: 14 },
  rowVal: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 22 },
  categoryPill: { backgroundColor: 'rgba(123,97,255,0.20)', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(123,97,255,0.40)' },
  categoryText: { color: '#A78BFA', fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 22, paddingTop: 16 },
  closeBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deleteBtn: { height: 52, borderRadius: 14, backgroundColor: 'rgba(255,77,109,0.15)', borderWidth: 1, borderColor: 'rgba(255,77,109,0.40)', paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: '#FF4D6D', fontSize: 15, fontWeight: '700' },
});
