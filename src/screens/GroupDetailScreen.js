import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, Pressable,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useData } from '../context/DataContext';
import MeshBackground from '../components/MeshBackground';

const EMOJI_OPTIONS = ['🍽️','🛒','🏖️','🎬','⛽','☕','🍕','🎮','✈️','🏠','💊','🎁','🍺','🎂','🧾'];
const COLOR_OPTIONS = [
  ['#7B61FF','#00D4FF'],['#FF3A8C','#FF9F1C'],['#00E6A0','#00D4FF'],
  ['#FF6FB0','#7B61FF'],['#FF9F1C','#FF3A8C'],['#00D4FF','#7B61FF'],
];
const AVATAR_COLORS = ['#7B61FF','#FF3A8C','#00D4FF','#FF9F1C','#00E6A0','#FF6FB0','#A78BFA','#34D399'];

function formatDate(iso) {
  if (!iso || iso === 'Just now') return 'Just now';
  try {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const diff = Math.floor((new Date() - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch { return iso; }
}

// ── Add Expense Modal ─────────────────────────────────────
function AddExpenseModal({ visible, onClose, onAdd, group }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('You');
  const [emoji, setEmoji] = useState('🍽️');
  const [colorIdx, setColorIdx] = useState(0);
  const [note, setNote] = useState('');
  const reset = () => { setTitle(''); setAmount(''); setPaidBy('You'); setEmoji('🍽️'); setColorIdx(0); setNote(''); };
  const memberNames = (group?.avatars || []).map(a => a.fullName || a.letter === 'Y' ? (a.letter === 'Y' ? 'You' : a.fullName || a.letter) : a.letter);
  const membersCount = group?.members || 2;
  const perPerson = amount && !isNaN(amount) && +amount > 0 ? Math.round(parseFloat(amount) / membersCount) : 0;
  const handleAdd = () => {
    if (!title.trim()) { Alert.alert('Missing', 'Enter a title.'); return; }
    if (!amount || isNaN(amount) || +amount <= 0) { Alert.alert('Missing', 'Enter a valid amount.'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({ title: title.trim(), amount: parseFloat(amount), members: membersCount, paidBy, note: note.trim(), emoji, color: COLOR_OPTIONS[colorIdx], date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), location: group?.name || 'Group expense', createdAt: new Date().toISOString() });
    reset(); onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={onClose}><View style={m.overlay} /></TouchableWithoutFeedback>
        <View style={m.sheet}>
          <View style={m.base} /><BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
          <LinearGradient colors={['rgba(22,10,60,0.97)', 'rgba(12,6,36,0.99)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
          <LinearGradient colors={['transparent', 'rgba(123,97,255,0.7)', 'rgba(0,212,255,0.5)', 'transparent']} style={m.topBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={m.handle} /><Text style={m.title}>Add to {group?.name}</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
            <Text style={m.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {EMOJI_OPTIONS.map((e, i) => (<Pressable key={i} onPress={() => setEmoji(e)} style={[m.emojiBtn, emoji === e && m.emojiBtnActive]}><Text style={{ fontSize: 22 }}>{e}</Text></Pressable>))}
            </ScrollView>
            <Text style={m.label}>Color</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {COLOR_OPTIONS.map((c, i) => (<Pressable key={i} onPress={() => setColorIdx(i)}><LinearGradient colors={c} style={[m.colorDot, colorIdx === i && m.colorDotActive]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} /></Pressable>))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 2 }}>
                <Text style={m.label}>Title *</Text>
                <View style={m.inputWrap}><View style={m.inputBase} /><TextInput style={m.input} placeholder="What was it for?" placeholderTextColor="rgba(255,255,255,0.3)" value={title} onChangeText={setTitle} /></View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={m.label}>Amount *</Text>
                <View style={m.inputWrap}><View style={m.inputBase} /><TextInput style={m.input} placeholder="₹0" placeholderTextColor="rgba(255,255,255,0.3)" value={amount} onChangeText={setAmount} keyboardType="numeric" /></View>
              </View>
            </View>
            <Text style={m.label}>Paid by</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {memberNames.map((name, i) => (<Pressable key={i} onPress={() => setPaidBy(name)} style={[m.memberChip, paidBy === name && m.memberChipActive]}><Text style={[m.memberChipText, paidBy === name && m.memberChipTextActive]}>{name}</Text></Pressable>))}
            </ScrollView>
            <Text style={m.label}>Note (optional)</Text>
            <View style={m.inputWrap}><View style={m.inputBase} /><TextInput style={m.input} placeholder="Any details..." placeholderTextColor="rgba(255,255,255,0.3)" value={note} onChangeText={setNote} /></View>
            {perPerson > 0 && (
              <View style={m.previewCard}>
                <LinearGradient colors={[COLOR_OPTIONS[colorIdx][0] + '22', 'rgba(10,5,36,0.6)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]} />
                <View style={[StyleSheet.absoluteFillObject, { borderRadius: 14, borderWidth: 1, borderColor: COLOR_OPTIONS[colorIdx][0] + '40' }]} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View><Text style={m.previewLabel}>Split {membersCount} ways</Text><Text style={[m.previewVal, { color: COLOR_OPTIONS[colorIdx][1] }]}>{'\u20b9'}{perPerson.toLocaleString('en-IN')} each</Text></View>
                  <LinearGradient colors={COLOR_OPTIONS[colorIdx]} style={m.previewBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}><Text style={m.previewBadgeText}>{'\u20b9'}{parseFloat(amount).toLocaleString('en-IN')} total</Text></LinearGradient>
                </View>
                <Text style={m.previewPaidBy}>Paid by {paidBy}</Text>
              </View>
            )}
            <Pressable onPress={handleAdd}><LinearGradient colors={['#7B61FF', '#00D4FF']} style={m.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}><Text style={m.addBtnText}>Add to Group ✓</Text></LinearGradient></Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Settle Modal ──────────────────────────────────────────
function SettleModal({ visible, onClose, group, onSettle }) {
  const [amount, setAmount] = useState('');
  const [member, setMember] = useState(null);
  const perPerson = group && group.members > 0 ? Math.round(group.total / group.members) : 0;
  useEffect(() => { if (visible && group?.avatars?.length > 0) setMember(group.avatars[0]); }, [visible]);
  const handleSettle = () => {
    if (!amount || isNaN(amount) || +amount <= 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }
    if (!member) { Alert.alert('Select', 'Select who paid.'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSettle(member.letter, parseFloat(amount));
    setAmount(''); onClose();
  };
  const fillFull = () => { setAmount(String(perPerson)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={onClose}><View style={m.overlay} /></TouchableWithoutFeedback>
        <View style={[m.sheet, { maxHeight: '65%' }]}>
          <View style={m.base} /><BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
          <LinearGradient colors={['rgba(22,10,60,0.97)', 'rgba(12,6,36,0.99)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
          <LinearGradient colors={['transparent', 'rgba(0,230,160,0.6)', 'rgba(0,212,255,0.4)', 'transparent']} style={m.topBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={m.handle} /><Text style={m.title}>Settle Up 💸</Text>
          <Text style={m.label}>Who paid?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
            {(group?.avatars || []).map((av, i) => {
              const owes = Math.max(0, perPerson - (av.paid || 0));
              return (
                <Pressable key={i} onPress={() => setMember(av)} style={[m.memberChip, member?.letter === av.letter && m.memberChipActive]}>
                  <View style={[m.settleAvatar, { backgroundColor: av.color + '44', borderColor: av.color }]}>
                    <Text style={{ color: av.color, fontWeight: '800', fontSize: 13 }}>{av.letter}</Text>
                  </View>
                  <View>
                    <Text style={[m.memberChipText, member?.letter === av.letter && m.memberChipTextActive]}>{av.letter === 'Y' ? 'You' : (av.fullName || av.letter)}</Text>
                    {owes > 0 && <Text style={{ color: '#FF4D6D', fontSize: 10, fontWeight: '600' }}>owes {'\u20b9'}{owes.toLocaleString('en-IN')}</Text>}
                    {owes <= 0 && <Text style={{ color: '#00E6A0', fontSize: 10, fontWeight: '600' }}>settled ✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={m.label}>Amount paid ({'\u20b9'})</Text>
            {perPerson > 0 && <Pressable onPress={fillFull}><Text style={{ color: '#7B61FF', fontSize: 12, fontWeight: '700' }}>Fill full share ({'\u20b9'}{perPerson})</Text></Pressable>}
          </View>
          <View style={[m.inputWrap, { marginBottom: 20 }]}><View style={m.inputBase} /><TextInput style={m.input} placeholder="0" placeholderTextColor="rgba(255,255,255,0.3)" value={amount} onChangeText={setAmount} keyboardType="numeric" /></View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={onClose} style={m.cancelBtn}><Text style={m.cancelText}>Cancel</Text></Pressable>
            <Pressable onPress={handleSettle} style={{ flex: 1 }}><LinearGradient colors={['#00E6A0', '#00D4FF']} style={m.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}><Text style={m.addBtnText}>Mark as Paid ✓</Text></LinearGradient></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Expense Detail Modal ──────────────────────────────────
function ExpenseDetailModal({ visible, expense, onClose, onDelete, groupGradient }) {
  const slideY = useRef(new Animated.Value(80)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, damping: 14, stiffness: 150, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else { slideY.setValue(80); fade.setValue(0); }
  }, [visible]);
  if (!expense) return null;
  const perPerson = Math.round(expense.amount / (expense.members || 1));
  const color = expense.color || groupGradient;
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}><Animated.View style={[ed.overlay, { opacity: fade }]} /></TouchableWithoutFeedback>
      <Animated.View style={[ed.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={ed.base} /><BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
        <LinearGradient colors={['rgba(22,10,60,0.98)', 'rgba(12,6,36,0.99)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
        <LinearGradient colors={['transparent', color[0] + '70', color[1] + '50', 'transparent']} style={ed.topBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={ed.handle} />
        <LinearGradient colors={color} style={ed.emojiHero}><Text style={{ fontSize: 38 }}>{expense.emoji || '💸'}</Text></LinearGradient>
        <Text style={ed.title}>{expense.title}</Text>
        <Text style={ed.meta}>Paid by {expense.paidBy || 'You'}  ·  {formatDate(expense.createdAt || expense.date)}</Text>
        <View style={ed.amountRow}>
          {[
            { label: 'Total', val: '\u20b9' + expense.amount.toLocaleString('en-IN'), color: '#fff' },
            { label: 'People', val: expense.members, color: '#A78BFA' },
            { label: 'Each', val: '\u20b9' + perPerson.toLocaleString('en-IN'), color: color[1] },
          ].map((row, i) => (
            <View key={i} style={ed.amountItem}>
              <Text style={[ed.amountVal, { color: row.color }]}>{row.val}</Text>
              <Text style={ed.amountLabel}>{row.label}</Text>
            </View>
          ))}
        </View>
        {expense.note ? (
          <View style={ed.noteRow}>
            <Text style={ed.noteLabel}>📝 Note</Text>
            <Text style={ed.noteVal}>{expense.note}</Text>
          </View>
        ) : null}
        <View style={ed.actions}>
          <Pressable onPress={onClose} style={ed.doneBtn}><Text style={ed.doneBtnText}>Done</Text></Pressable>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert('Delete', 'Remove this expense?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { onDelete(expense.id); onClose(); } }]); }} style={ed.deleteBtn}>
            <Text style={ed.deleteBtnText}>Delete</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── IOU Calculator ────────────────────────────────────────
function IOUBreakdown({ group, groupExpenses }) {
  if (!group || groupExpenses.length === 0) return (
    <View style={{ alignItems: 'center', paddingVertical: 30, gap: 10 }}>
      <Text style={{ fontSize: 36 }}>🤝</Text>
      <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14, fontWeight: '600' }}>Add expenses to see who owes who</Text>
    </View>
  );
  const perPerson = group.total > 0 && group.members > 0 ? Math.round(group.total / group.members) : 0;
  const members = group.avatars || [];
  const ious = members.map(m => ({
    ...m,
    name: m.letter === 'Y' ? 'You' : (m.fullName || m.letter),
    owes: Math.max(0, perPerson - (m.paid || 0)),
    isSettled: (m.paid || 0) >= perPerson,
  })).filter(m => m.owes > 0 || m.isSettled);

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
        Each person owes {'\u20b9'}{perPerson.toLocaleString('en-IN')} total
      </Text>
      {ious.map((iou, i) => (
        <View key={i} style={iou2.row}>
          <View style={[StyleSheet.absoluteFillObject, { borderRadius: 14, backgroundColor: 'rgba(18,10,50,0.88)' }]} />
          <View style={[StyleSheet.absoluteFillObject, { borderRadius: 14, borderWidth: 1, borderColor: iou.isSettled ? '#00E6A055' : '#FF4D6D33' }]} />
          <LinearGradient colors={[iou.color, iou.color + 'AA']} style={iou2.avatar}>
            <Text style={iou2.avatarText}>{iou.letter}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={iou2.name}>{iou.name}</Text>
            <Text style={iou2.sub}>Paid {'\u20b9'}{(iou.paid || 0).toLocaleString('en-IN')} of {'\u20b9'}{perPerson.toLocaleString('en-IN')}</Text>
          </View>
          {iou.isSettled
            ? <View style={iou2.settledBadge}><Text style={iou2.settledText}>✓ Settled</Text></View>
            : <View style={iou2.owesBadge}>
                <Text style={iou2.owesAmt}>{'\u20b9'}{iou.owes.toLocaleString('en-IN')}</Text>
                <Text style={iou2.owesLabel}>still owes</Text>
              </View>
          }
        </View>
      ))}
    </View>
  );
}

// ── Spending Chart (simple bar) ───────────────────────────
function SpendingBars({ groupExpenses, gradient }) {
  if (groupExpenses.length === 0) return null;
  const max = Math.max(...groupExpenses.map(e => e.amount));
  const top5 = [...groupExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Top expenses</Text>
      {top5.map((exp, i) => (
        <View key={exp.id} style={{ gap: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{exp.emoji} {exp.title}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.60)', fontSize: 13, fontWeight: '700' }}>{'\u20b9'}{exp.amount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <LinearGradient colors={gradient} style={{ height: '100%', width: (exp.amount / max * 100) + '%', borderRadius: 3 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────
export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();
  const { groups, addGroupExpense, deleteExpense, settleGroupMember, getGroupExpenses } = useData();
  const [showAddExp, setShowAddExp] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const [showExpDetail, setShowExpDetail] = useState(false);
  const [selectedExp, setSelectedExp] = useState(null);
  const [activeTab, setActiveTab] = useState('expenses');
  const [expSearch, setExpSearch] = useState('');
  const headerY = useRef(new Animated.Value(-20)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const statsScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY, { toValue: 0, damping: 14, stiffness: 120, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(statsScale, { toValue: 1, damping: 14, stiffness: 140, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  const group = groups.find(g => g.id === groupId);
  const allGroupExpenses = getGroupExpenses(groupId);
  const groupExpenses = expSearch
    ? allGroupExpenses.filter(e => e.title.toLowerCase().includes(expSearch.toLowerCase()))
    : allGroupExpenses;

  if (!group) {
    return (
      <MeshBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <Text style={{ fontSize: 52 }}>❓</Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>Group not found</Text>
          <Pressable onPress={() => navigation.goBack()} style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50, backgroundColor: 'rgba(123,97,255,0.25)', borderWidth: 1, borderColor: 'rgba(123,97,255,0.5)' }}>
            <Text style={{ color: '#A78BFA', fontWeight: '700', fontSize: 15 }}>← Go Back</Text>
          </Pressable>
        </View>
      </MeshBackground>
    );
  }

  const members = group.avatars || [];
  const perPersonShare = group.members > 0 && group.total > 0 ? Math.round(group.total / group.members) : 0;
  const progress = group.total > 0 ? Math.min(group.settled / group.total, 1) : 0;
  const pct = Math.round(progress * 100);
  const isSettled = progress >= 1;
  const remaining = Math.max(0, group.total - group.settled);

  const handleAddExpense = async (exp) => await addGroupExpense(group.id, exp);
  const handleSettle = async (memberLetter, amount) => {
    await settleGroupMember(group.id, memberLetter, amount);
    Alert.alert('Recorded ✓', '\u20b9' + amount + ' marked as paid.');
  };

  const handleShare = async () => {
    const lines = [
      '📊 ' + group.name + ' — Expense Summary',
      '─────────────────────',
      'Total: \u20b9' + group.total.toLocaleString('en-IN'),
      'Settled: \u20b9' + group.settled.toLocaleString('en-IN') + ' (' + pct + '%)',
      'Per person: \u20b9' + perPersonShare.toLocaleString('en-IN'),
      'Members: ' + group.members,
      '─────────────────────',
      ...allGroupExpenses.map(e => '• ' + e.title + ': \u20b9' + e.amount + ' (paid by ' + (e.paidBy || 'You') + ')'),
      '\nShared via SplitLens 💜',
    ];
    await Share.share({ message: lines.join('\n'), title: group.name });
  };

  const TABS = [
    { key: 'expenses', label: 'Expenses', count: allGroupExpenses.length },
    { key: 'members', label: 'Members', count: members.length },
    { key: 'summary', label: 'Summary', count: null },
  ];

  return (
    <MeshBackground>
      {/* Header */}
      <Animated.View style={[s.header, { paddingTop: insets.top + 12, opacity: headerOp, transform: [{ translateY: headerY }] }]}>
        <View style={s.headerBase} />
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject} />
        <LinearGradient colors={['rgba(14,7,48,0.95)', 'rgba(10,5,36,0.90)']} style={StyleSheet.absoluteFillObject} />
        <LinearGradient colors={['transparent', ...group.gradient.map(c => c + '55'), 'transparent']} style={s.headerBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={s.headerContent}>
          <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backBtnText}>←</Text>
          </Pressable>
          <LinearGradient colors={group.gradient} style={s.headerEmoji}>
            <Text style={{ fontSize: 22 }}>{group.emoji}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle} numberOfLines={1}>{group.name}</Text>
            <Text style={s.headerMeta}>{group.members} members · {group.lastActivity}</Text>
          </View>
          <Pressable onPress={handleShare} style={s.shareBtn}>
            <Text style={s.shareBtnText}>Share</Text>
          </Pressable>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingTop: insets.top + 80, paddingBottom: 160 }]} showsVerticalScrollIndicator={false}>

        {/* Stats Banner */}
        <Animated.View style={{ transform: [{ scale: statsScale }], marginBottom: 18 }}>
          <LinearGradient colors={['#1E0B5E', '#120840', '#0A0525']} style={s.statsBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={s.statsBannerGlow} />
            <View style={s.statsBannerBorder} />
            <View style={s.statsRow}>
              {[
                { val: '\u20b9' + group.total.toLocaleString('en-IN'), lbl: 'Total', color: '#A78BFA' },
                { val: '\u20b9' + group.settled.toLocaleString('en-IN'), lbl: 'Settled', color: '#00E6A0' },
                { val: '\u20b9' + remaining.toLocaleString('en-IN'), lbl: 'Remaining', color: '#FF4D6D' },
                { val: '\u20b9' + perPersonShare.toLocaleString('en-IN'), lbl: 'Per person', color: '#00D4FF' },
              ].map((stat, i) => (
                <View key={i} style={[s.statItem, i > 0 && s.statBorder]}>
                  <Text style={[s.statVal, { color: stat.color }]}>{stat.val}</Text>
                  <Text style={s.statLbl}>{stat.lbl}</Text>
                </View>
              ))}
            </View>
            <View style={s.progressWrap}>
              <View style={s.progressBg}>
                <LinearGradient colors={isSettled ? ['#00E6A0', '#00D4FF'] : group.gradient} style={[s.progressFill, { width: pct + '%' }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={s.progressLabel}>{'\u20b9'}{group.settled.toLocaleString('en-IN')} settled</Text>
                <Text style={[s.progressPct, { color: isSettled ? '#00E6A0' : group.gradient[0] }]}>{pct}% done</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => { setActiveTab(tab.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
            >
              {activeTab === tab.key && <LinearGradient colors={group.gradient} style={[StyleSheet.absoluteFillObject, { borderRadius: 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
                {tab.label}{tab.count !== null ? ' (' + tab.count + ')' : ''}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── EXPENSES TAB ── */}
        {activeTab === 'expenses' && (
          <View style={{ gap: 10 }}>
            {allGroupExpenses.length > 2 && (
              <View style={s.searchWrap}>
                <View style={s.searchBase} />
                <View style={s.searchBorder} />
                <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
                <TextInput style={s.searchInput} placeholder="Search expenses..." placeholderTextColor="rgba(255,255,255,0.30)" value={expSearch} onChangeText={setExpSearch} />
                {expSearch.length > 0 && <Pressable onPress={() => setExpSearch('')}><Text style={{ color: 'rgba(255,255,255,0.40)', marginLeft: 8 }}>✕</Text></Pressable>}
              </View>
            )}
            {groupExpenses.length === 0 ? (
              <Pressable onPress={() => setShowAddExp(true)} style={s.emptyState}>
                <View style={[StyleSheet.absoluteFillObject, { borderRadius: 20, backgroundColor: 'rgba(18,10,50,0.85)' }]} />
                <View style={[StyleSheet.absoluteFillObject, { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }]} />
                <Text style={{ fontSize: 44 }}>💸</Text>
                <Text style={s.emptyTitle}>{expSearch ? 'No results' : 'No expenses yet'}</Text>
                <Text style={s.emptySub}>{expSearch ? 'Try a different search' : 'Tap "+ Add Expense" to add the first one'}</Text>
                {!expSearch && <LinearGradient colors={group.gradient} style={s.emptyBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}><Text style={s.emptyBtnText}>Add First Expense</Text></LinearGradient>}
              </Pressable>
            ) : (
              groupExpenses.map(exp => (
                <Pressable
                  key={exp.id}
                  style={s.expRow}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedExp(exp); setShowExpDetail(true); }}
                  onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert('Options', exp.title, [{ text: 'Delete', style: 'destructive', onPress: () => deleteExpense(exp.id) }, { text: 'Cancel', style: 'cancel' }]); }}
                >
                  <View style={[StyleSheet.absoluteFillObject, { borderRadius: 16, backgroundColor: 'rgba(18,10,50,0.90)' }]} />
                  <LinearGradient colors={(exp.color || group.gradient)} style={s.expAccent} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
                  <LinearGradient colors={[(exp.color || group.gradient)[0] + '25', 'transparent']} style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} start={{ x: 0, y: 0.5 }} end={{ x: 0.5, y: 0.5 }} />
                  <View style={[StyleSheet.absoluteFillObject, { borderRadius: 16, borderWidth: 1, borderColor: (exp.color || group.gradient)[0] + '40' }]} />
                  <LinearGradient colors={exp.color || group.gradient} style={s.expEmojiBox}>
                    <Text style={{ fontSize: 20 }}>{exp.emoji || '💸'}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={s.expTitle} numberOfLines={1}>{exp.title}</Text>
                    <Text style={s.expMeta}>{formatDate(exp.createdAt || exp.date)}  ·  {exp.members} people  ·  Paid by {exp.paidBy || 'You'}</Text>
                    {exp.note ? <Text style={s.expNote} numberOfLines={1}>📝 {exp.note}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <LinearGradient colors={exp.color || group.gradient} style={s.expAmtBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={s.expAmtText}>{'\u20b9'}{exp.amount >= 1000 ? (exp.amount / 1000).toFixed(1) + 'k' : exp.amount}</Text>
                    </LinearGradient>
                    <Text style={s.expPerPerson}>{'\u20b9'}{Math.round(exp.amount / (exp.members || 2))}/person</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* ── MEMBERS TAB ── */}
        {activeTab === 'members' && (
          <View style={{ gap: 10 }}>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
              {perPersonShare > 0 ? 'Each member owes \u20b9' + perPersonShare.toLocaleString('en-IN') + ' total' : 'Add expenses to see balances'}
            </Text>
            {members.map((member, i) => {
              const owes = Math.max(0, perPersonShare - (member.paid || 0));
              const isSettledMember = owes <= 0 && perPersonShare > 0;
              const paidPct = perPersonShare > 0 ? Math.min(100, Math.round(((member.paid || 0) / perPersonShare) * 100)) : 0;
              return (
                <View key={i} style={s.memberCard}>
                  <View style={[StyleSheet.absoluteFillObject, { borderRadius: 16, backgroundColor: 'rgba(18,10,50,0.88)' }]} />
                  <View style={[StyleSheet.absoluteFillObject, { borderRadius: 16, borderWidth: 1, borderColor: isSettledMember ? '#00E6A055' : 'rgba(255,255,255,0.10)' }]} />
                  <LinearGradient colors={[member.color, member.color + 'AA']} style={s.memberAvatar}>
                    <Text style={s.memberAvatarText}>{member.letter}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={s.memberName}>{member.letter === 'Y' ? 'You' : (member.fullName || member.letter)}</Text>
                    <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 2, overflow: 'hidden' }}>
                      <LinearGradient colors={isSettledMember ? ['#00E6A0', '#00D4FF'] : group.gradient} style={{ height: '100%', width: paidPct + '%', borderRadius: 2 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                    </View>
                    <Text style={s.memberPaid}>Paid {'\u20b9'}{(member.paid || 0).toLocaleString('en-IN')} · {paidPct}%</Text>
                  </View>
                  {perPersonShare > 0 && (
                    isSettledMember
                      ? <View style={s.settledBadge}><Text style={s.settledText}>✓ Settled</Text></View>
                      : <View style={[s.owedBadge, { backgroundColor: group.gradient[0] + '22', borderColor: group.gradient[0] + '55' }]}>
                          <Text style={[s.owedBadgeText, { color: group.gradient[0] }]}>{'\u20b9'}{owes.toLocaleString('en-IN')} left</Text>
                        </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ── SUMMARY TAB ── */}
        {activeTab === 'summary' && (
          <View style={{ gap: 20 }}>
            {/* IOU Breakdown */}
            <View style={s.summarySection}>
              <View style={s.summarySectionBase} />
              <View style={s.summarySectionBorder} />
              <Text style={s.summarySectionTitle}>Who Owes Who</Text>
              <IOUBreakdown group={group} groupExpenses={allGroupExpenses} />
            </View>
            {/* Spending bars */}
            {allGroupExpenses.length > 0 && (
              <View style={s.summarySection}>
                <View style={s.summarySectionBase} />
                <View style={s.summarySectionBorder} />
                <Text style={s.summarySectionTitle}>Spending Breakdown</Text>
                <SpendingBars groupExpenses={allGroupExpenses} gradient={group.gradient} />
              </View>
            )}
            {/* Quick stats */}
            <View style={s.summarySection}>
              <View style={s.summarySectionBase} />
              <View style={s.summarySectionBorder} />
              <Text style={s.summarySectionTitle}>Group Stats</Text>
              <View style={{ gap: 10 }}>
                {[
                  { label: 'Created', val: group.createdAt ? new Date(group.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown' },
                  { label: 'Total expenses', val: allGroupExpenses.length },
                  { label: 'Average expense', val: allGroupExpenses.length > 0 ? '\u20b9' + Math.round(group.total / allGroupExpenses.length).toLocaleString('en-IN') : 'N/A' },
                  { label: 'Biggest expense', val: allGroupExpenses.length > 0 ? '\u20b9' + Math.max(...allGroupExpenses.map(e => e.amount)).toLocaleString('en-IN') : 'N/A' },
                  { label: 'Settlement rate', val: pct + '%' },
                ].map((row, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.07)' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13 }}>{row.label}</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{row.val}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[s.actionBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.actionBarBase} />
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject} />
        <LinearGradient colors={['rgba(14,7,48,0.96)', 'rgba(10,5,36,0.98)']} style={StyleSheet.absoluteFillObject} />
        <LinearGradient colors={['transparent', 'rgba(123,97,255,0.5)', 'rgba(0,212,255,0.3)', 'transparent']} style={s.actionBarBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={s.actionBtns}>
          <Pressable onPress={() => setShowSettle(true)} style={s.settleBtn}>
            <View style={s.settleBtnBase} /><View style={s.settleBtnBorder} />
            <Text style={s.settleBtnText}>💸  Settle Up</Text>
          </Pressable>
          <Pressable onPress={() => setShowAddExp(true)} style={{ flex: 1 }}>
            <LinearGradient colors={group.gradient} style={s.addExpBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.addExpBtnText}>+  Add Expense</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <AddExpenseModal visible={showAddExp} onClose={() => setShowAddExp(false)} onAdd={handleAddExpense} group={group} />
      <SettleModal visible={showSettle} onClose={() => setShowSettle(false)} group={group} onSettle={handleSettle} />
      <ExpenseDetailModal visible={showExpDetail} expense={selectedExp} onClose={() => { setShowExpDetail(false); setSelectedExp(null); }} onDelete={deleteExpense} groupGradient={group.gradient} />
    </MeshBackground>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 18 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, overflow: 'hidden', paddingBottom: 12 },
  headerBase: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,4,24,0.92)' },
  headerBorder: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  backBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerEmoji: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  headerMeta: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 1 },
  shareBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, backgroundColor: 'rgba(123,97,255,0.20)', borderWidth: 1, borderColor: 'rgba(123,97,255,0.40)' },
  shareBtnText: { color: '#A78BFA', fontSize: 13, fontWeight: '700' },
  statsBanner: { borderRadius: 22, overflow: 'hidden', shadowColor: '#5B3FFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  statsBannerGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#6B4FFF', top: -80, left: -40, opacity: 0.35 },
  statsBannerBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  statsRow: { flexDirection: 'row', paddingTop: 4 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 18, gap: 4 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.10)' },
  statVal: { fontSize: 14, fontWeight: '800', letterSpacing: -0.5 },
  statLbl: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  progressWrap: { paddingHorizontal: 18, paddingBottom: 16 },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  progressPct: { fontSize: 12, fontWeight: '800' },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, height: 40, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  tabActive: { borderColor: 'transparent' },
  tabText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  searchWrap: { height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, overflow: 'hidden', marginBottom: 4 },
  searchBase: { ...StyleSheet.absoluteFillObject, borderRadius: 14, backgroundColor: 'rgba(18,10,50,0.90)' },
  searchBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  expRow: { borderRadius: 16, overflow: 'hidden', minHeight: 72 },
  expAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  expEmojiBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: 14 },
  expTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 3 },
  expMeta: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  expNote: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  expAmtBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  expAmtText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  expPerPerson: { color: 'rgba(255,255,255,0.40)', fontSize: 10, textAlign: 'right' },
  memberCard: { borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  memberAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  memberAvatarText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  memberName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  memberPaid: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  settledBadge: { backgroundColor: 'rgba(0,230,160,0.15)', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,230,160,0.40)' },
  settledText: { color: '#00E6A0', fontSize: 11, fontWeight: '800' },
  owedBadge: { borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  owedBadgeText: { fontSize: 11, fontWeight: '800' },
  summarySection: { borderRadius: 18, overflow: 'hidden', padding: 18 },
  summarySectionBase: { ...StyleSheet.absoluteFillObject, borderRadius: 18, backgroundColor: 'rgba(16,8,48,0.90)' },
  summarySectionBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  summarySectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 16, letterSpacing: -0.2 },
  emptyState: { borderRadius: 20, overflow: 'hidden', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  emptySub: { color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center' },
  emptyBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 50 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden' },
  actionBarBase: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A0520' },
  actionBarBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  actionBtns: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingTop: 12 },
  settleBtn: { height: 52, borderRadius: 14, overflow: 'hidden', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  settleBtnBase: { ...StyleSheet.absoluteFillObject, borderRadius: 14, backgroundColor: 'rgba(14,8,44,0.90)' },
  settleBtnBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,230,160,0.40)' },
  settleBtnText: { color: '#00E6A0', fontSize: 14, fontWeight: '800' },
  addExpBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addExpBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', padding: 24, paddingBottom: 40, maxHeight: '92%' },
  base: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0E0730', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  topBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'center', marginBottom: 20 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 16 },
  label: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  inputWrap: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  inputBase: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,8,44,0.92)', borderRadius: 14 },
  input: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', padding: 14 },
  emojiBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  emojiBtnActive: { borderColor: '#7B61FF', backgroundColor: 'rgba(123,97,255,0.25)' },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  colorDotActive: { width: 34, height: 34, borderRadius: 17, borderWidth: 2.5, borderColor: '#FFFFFF' },
  memberChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberChipActive: { backgroundColor: 'rgba(123,97,255,0.25)', borderColor: '#7B61FF' },
  memberChipText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600' },
  memberChipTextActive: { color: '#FFFFFF' },
  settleAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  previewCard: { borderRadius: 14, overflow: 'hidden', padding: 14, gap: 6 },
  previewLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  previewVal: { fontSize: 20, fontWeight: '800' },
  previewBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 },
  previewBadgeText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  previewPaidBy: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  addBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn: { height: 54, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.20)', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  cancelText: { color: 'rgba(255,255,255,0.65)', fontSize: 15, fontWeight: '700' },
});
const ed = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.60)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', paddingBottom: 36 },
  base: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A0520', borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  topBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'center', marginTop: 14, marginBottom: 12 },
  emojiHero: { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 10 },
  title: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', textAlign: 'center', paddingHorizontal: 24 },
  meta: { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 16, paddingHorizontal: 24 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, marginHorizontal: 18, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 12 },
  amountItem: { alignItems: 'center', gap: 4 },
  amountVal: { fontSize: 18, fontWeight: '800' },
  amountLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600' },
  noteRow: { marginHorizontal: 18, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 12 },
  noteLabel: { color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  noteVal: { color: '#FFFFFF', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 18 },
  doneBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deleteBtn: { height: 50, borderRadius: 14, backgroundColor: 'rgba(255,77,109,0.15)', borderWidth: 1, borderColor: 'rgba(255,77,109,0.40)', paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: '#FF4D6D', fontSize: 15, fontWeight: '700' },
});
const iou2 = StyleSheet.create({
  row: { borderRadius: 14, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 13, gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  name: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  sub: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },
  settledBadge: { backgroundColor: 'rgba(0,230,160,0.15)', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,230,160,0.40)' },
  settledText: { color: '#00E6A0', fontSize: 11, fontWeight: '800' },
  owesBadge: { alignItems: 'flex-end' },
  owesAmt: { color: '#FF4D6D', fontSize: 14, fontWeight: '800' },
  owesLabel: { color: 'rgba(255,255,255,0.40)', fontSize: 10 },
});
