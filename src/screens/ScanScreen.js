import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable,
  ScrollView, Alert, Dimensions, TextInput,
  KeyboardAvoidingView, Platform, Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MeshBackground from '../components/MeshBackground';
import { useData } from '../context/DataContext';

const { width: W, height: H } = Dimensions.get('window');

// ── Mock receipts pool (random on each scan) ──────────────
const MOCK_RECEIPTS = [
  {
    restaurant: 'Spice Route — Sector 17',
    items: [
      { id: '1', name: 'Dal Makhani', price: 320, selected: true },
      { id: '2', name: 'Butter Naan x4', price: 160, selected: true },
      { id: '3', name: 'Paneer Tikka', price: 480, selected: true },
      { id: '4', name: 'Mango Lassi x2', price: 180, selected: true },
      { id: '5', name: 'Veg Biryani', price: 360, selected: true },
    ],
    tax: 18,
  },
  {
    restaurant: 'Cafe Coffee Day — CP',
    items: [
      { id: '1', name: 'Cappuccino x2', price: 380, selected: true },
      { id: '2', name: 'Chocolate Cake', price: 220, selected: true },
      { id: '3', name: 'Cold Coffee', price: 190, selected: true },
    ],
    tax: 5,
  },
  {
    restaurant: 'Dominos Pizza',
    items: [
      { id: '1', name: 'Farmhouse Pizza L', price: 549, selected: true },
      { id: '2', name: 'Peppy Paneer M', price: 389, selected: true },
      { id: '3', name: 'Garlic Bread', price: 149, selected: true },
      { id: '4', name: 'Coke x2', price: 100, selected: true },
    ],
    tax: 5,
  },
];

function buildReceipt(mock) {
  const subtotal = mock.items.reduce((s, i) => s + i.price, 0);
  const gst = Math.round(subtotal * mock.tax / 100);
  return {
    restaurant: mock.restaurant,
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    items: mock.items.map(i => ({ ...i })),
    subtotal,
    gst,
    tax: mock.tax,
    total: subtotal + gst,
  };
}

// ── Animated scanning corners ─────────────────────────────
function ScanFrame({ scanning, success }) {
  const cornerAnim  = useRef(new Animated.Value(0)).current;
  const lineY       = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const glowAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cornerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (scanning) {
      Animated.loop(Animated.sequence([
        Animated.timing(lineY, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(lineY, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])).start();
    } else {
      lineY.stopAnimation();
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
      lineY.setValue(0);
    }
    if (success) {
      Animated.spring(successAnim, { toValue: 1, damping: 10, stiffness: 200, useNativeDriver: true }).start();
    } else {
      successAnim.setValue(0);
    }
  }, [scanning, success]);

  const lineTranslateY = lineY.interpolate({ inputRange: [0, 1], outputRange: [0, 240] });
  const cornerColor = success ? '#00E6A0' : '#7B61FF';
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.7] });

  return (
    <Animated.View style={[sc.frame, { transform: [{ scale: pulseAnim }] }]}>
      {/* Glow background */}
      {scanning && (
        <Animated.View style={[sc.frameGlow, { opacity: glowOpacity }]} />
      )}
      {/* 4 corners */}
      {[
        { id: 'TL', style: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 } },
        { id: 'TR', style: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 } },
        { id: 'BL', style: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 } },
        { id: 'BR', style: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 } },
      ].map(c => (
        <Animated.View
          key={c.id}
          style={[sc.corner, c.style, { borderColor: cornerColor, opacity: cornerAnim }]}
        />
      ))}
      {/* Scan line */}
      {scanning && (
        <Animated.View style={[sc.scanLine, { transform: [{ translateY: lineTranslateY }] }]}>
          <LinearGradient
            colors={['transparent', '#7B61FF', '#00D4FF', '#7B61FF', 'transparent']}
            style={{ flex: 1, height: 2 }}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          {/* Glow dot on scan line */}
          <View style={sc.scanDot} />
        </Animated.View>
      )}
      {/* Success checkmark */}
      {success && (
        <Animated.View style={[sc.successIcon, { transform: [{ scale: successAnim }] }]}>
          <LinearGradient colors={['#00E6A0', '#00D4FF']} style={sc.successCircle}>
            <Text style={{ fontSize: 32, color: '#fff' }}>✓</Text>
          </LinearGradient>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ── Processing progress indicator ─────────────────────────
function ProcessingIndicator({ progress }) {
  const width = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: progress, duration: 400, useNativeDriver: false }).start();
    Animated.sequence([
      Animated.timing(bounce, { toValue: 1.05, duration: 150, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [progress]);
  const barWidth = width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const steps = ['Detecting receipt...', 'Reading text...', 'Parsing items...', 'Done!'];
  const stepIdx = Math.min(Math.floor(progress * steps.length), steps.length - 1);
  return (
    <Animated.View style={[pi.wrap, { transform: [{ scale: bounce }] }]}>
      <View style={pi.base} />
      <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]} />
      <View style={pi.border} />
      <Text style={pi.stepText}>{steps[stepIdx]}</Text>
      <View style={pi.barBg}>
        <Animated.View style={pi.barFill}>
          <LinearGradient colors={['#7B61FF', '#00D4FF']} style={{ flex: 1, borderRadius: 4 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        </Animated.View>
      </View>
      <Text style={pi.pctText}>{Math.round(progress * 100)}%</Text>
    </Animated.View>
  );
}

// ── Manual Entry Modal ─────────────────────────────────────
function ManualEntryModal({ visible, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [members, setMembers] = useState('2');
  const [location, setLocation] = useState('');
  const handleAdd = () => {
    if (!title.trim()) { Alert.alert('Missing', 'Enter a title.'); return; }
    if (!amount || isNaN(amount) || +amount <= 0) { Alert.alert('Missing', 'Enter a valid amount.'); return; }
    if (!members || isNaN(members) || +members < 2) { Alert.alert('Invalid', 'Min 2 people.'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({
      title: title.trim(), amount: parseFloat(amount),
      members: parseInt(members), location: location.trim() || 'Manual entry',
      emoji: '🧾', color: ['#7B61FF', '#00D4FF'],
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      createdAt: new Date().toISOString(),
    });
    setTitle(''); setAmount(''); setMembers('2'); setLocation('');
    onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={onClose}><View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} /></TouchableWithoutFeedback>
        <View style={me.sheet}>
          <View style={me.base} />
          <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
          <LinearGradient colors={['rgba(22,10,60,0.97)', 'rgba(12,6,36,0.99)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
          <LinearGradient colors={['transparent', 'rgba(123,97,255,0.7)', 'rgba(0,212,255,0.5)', 'transparent']} style={me.topBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={me.handle} />
          <Text style={me.title}>Enter Manually</Text>
          <View style={{ gap: 14 }}>
            <Text style={me.label}>Title *</Text>
            <View style={me.inputWrap}><View style={me.inputBase} /><TextInput style={me.input} placeholder="e.g. Dinner at Rooftop Cafe" placeholderTextColor="rgba(255,255,255,0.3)" value={title} onChangeText={setTitle} /></View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={me.label}>Amount (₹) *</Text>
                <View style={me.inputWrap}><View style={me.inputBase} /><TextInput style={me.input} placeholder="0" placeholderTextColor="rgba(255,255,255,0.3)" value={amount} onChangeText={setAmount} keyboardType="numeric" /></View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={me.label}>People *</Text>
                <View style={me.inputWrap}><View style={me.inputBase} /><TextInput style={me.input} placeholder="2" placeholderTextColor="rgba(255,255,255,0.3)" value={members} onChangeText={setMembers} keyboardType="numeric" /></View>
              </View>
            </View>
            <Text style={me.label}>Location (optional)</Text>
            <View style={me.inputWrap}><View style={me.inputBase} /><TextInput style={me.input} placeholder="Restaurant / place name" placeholderTextColor="rgba(255,255,255,0.3)" value={location} onChangeText={setLocation} /></View>
            <Pressable onPress={handleAdd}>
              <LinearGradient colors={['#7B61FF', '#00D4FF']} style={me.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={me.addBtnText}>Add Expense ✓</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Receipt Result with editable items ───────────────────
function ReceiptResult({ data, onSplit, onReset, groups }) {
  const [items, setItems] = useState(data.items.map(i => ({ ...i, selected: true })));
  const [members, setMembers] = useState('2');
  const [splitType, setSplitType] = useState('equal'); // equal | byitem
  const [editingName, setEditingName] = useState(null);
  const [editNameVal, setEditNameVal] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const slideUp = useRef(new Animated.Value(80)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideUp, { toValue: 0, damping: 14, stiffness: 140, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const selectedItems = items.filter(i => i.selected);
  const selectedSubtotal = selectedItems.reduce((s, i) => s + i.price, 0);
  const selectedGst = Math.round(selectedSubtotal * data.tax / 100);
  const selectedTotal = selectedSubtotal + selectedGst;
  const mem = parseInt(members) || 2;
  const perPerson = Math.round(selectedTotal / mem);

  const toggleItem = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  };

  const startEditName = (item) => {
    setEditingName(item.id);
    setEditNameVal(item.name);
  };

  const saveEditName = (id) => {
    if (editNameVal.trim()) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, name: editNameVal.trim() } : i));
    }
    setEditingName(null);
  };

  return (
    <Animated.View style={{ transform: [{ translateY: slideUp }], opacity: fade }}>
      {/* Receipt card */}
      <View style={rr.card}>
        <View style={rr.cardBase} />
        <BlurView intensity={35} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]} />
        <LinearGradient colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.02)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]} />
        <LinearGradient colors={['transparent', 'rgba(123,97,255,0.6)', 'rgba(0,212,255,0.4)', 'transparent']} style={rr.topBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={rr.border} />
        <View style={rr.inner}>
          {/* Header */}
          <View style={rr.header}>
            <LinearGradient colors={['#7B61FF', '#00D4FF']} style={rr.iconBox}>
              <Text style={{ fontSize: 22 }}>🧾</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={rr.restaurant}>{data.restaurant}</Text>
              <Text style={rr.date}>{data.date}</Text>
            </View>
            <View style={rr.successBadge}><Text style={rr.successText}>✓ Scanned</Text></View>
          </View>

          <View style={rr.divider} />

          {/* Items hint */}
          <Text style={rr.hint}>Tap item to deselect  ·  Long press to rename</Text>

          {/* Items list */}
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => toggleItem(item.id)}
              onLongPress={() => startEditName(item)}
              style={[rr.itemRow, !item.selected && rr.itemRowDisabled]}
            >
              {item.selected && (
                <LinearGradient colors={['#7B61FF20', 'transparent']} style={[StyleSheet.absoluteFillObject, { borderRadius: 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              )}
              <View style={[rr.itemCheck, item.selected && rr.itemCheckActive]}>
                {item.selected && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>}
              </View>
              {editingName === item.id ? (
                <TextInput
                  style={rr.itemNameInput}
                  value={editNameVal}
                  onChangeText={setEditNameVal}
                  onBlur={() => saveEditName(item.id)}
                  onSubmitEditing={() => saveEditName(item.id)}
                  autoFocus
                />
              ) : (
                <Text style={[rr.itemName, !item.selected && rr.itemNameDisabled]} numberOfLines={1}>{item.name}</Text>
              )}
              <Text style={[rr.itemPrice, !item.selected && rr.itemPriceDisabled]}>{'\u20b9'}{item.price}</Text>
            </Pressable>
          ))}

          {/* Deselected notice */}
          {selectedItems.length < items.length && (
            <View style={rr.deselectedNotice}>
              <Text style={rr.deselectedText}>{items.length - selectedItems.length} item{items.length - selectedItems.length > 1 ? 's' : ''} excluded from split</Text>
            </View>
          )}

          <View style={rr.divider} />
          <View style={rr.summaryRow}><Text style={rr.metaText}>Subtotal</Text><Text style={rr.metaText}>{'\u20b9'}{selectedSubtotal.toLocaleString('en-IN')}</Text></View>
          <View style={rr.summaryRow}><Text style={rr.metaText}>Tax ({data.tax}%)</Text><Text style={rr.metaText}>{'\u20b9'}{selectedGst.toLocaleString('en-IN')}</Text></View>
          <View style={[rr.summaryRow, { marginTop: 6 }]}>
            <Text style={rr.totalText}>Total</Text>
            <Text style={rr.totalText}>{'\u20b9'}{selectedTotal.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </View>

      {/* Split config card */}
      <View style={[rr.card, { marginTop: 14 }]}>
        <View style={rr.cardBase} />
        <BlurView intensity={25} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]} />
        <LinearGradient colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]} />
        <View style={rr.border} />
        <View style={rr.inner}>
          <Text style={rr.configTitle}>Split Settings</Text>

          {/* People count */}
          <View style={rr.configRow}>
            <Text style={rr.configLabel}>People</Text>
            <View style={rr.peopleRow}>
              {[2, 3, 4, 5, 6].map(n => (
                <Pressable
                  key={n}
                  onPress={() => { setMembers(String(n)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={{ overflow: 'hidden', borderRadius: 50 }}
                >
                  {String(n) === members
                    ? <LinearGradient colors={['#7B61FF', '#00D4FF']} style={rr.personChipActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={rr.personChipActiveText}>{n}</Text>
                      </LinearGradient>
                    : <View style={rr.personChip}><Text style={rr.personChipText}>{n}</Text></View>
                  }
                </Pressable>
              ))}
              <View style={rr.personChipInput}>
                <TextInput
                  style={rr.personInput}
                  value={members}
                  onChangeText={v => setMembers(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="?"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  maxLength={2}
                />
              </View>
            </View>
          </View>

          {/* Split type */}
          <View style={[rr.configRow, { marginTop: 14 }]}>
            <Text style={rr.configLabel}>Split type</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { key: 'equal', label: 'Equal' },
                { key: 'byitem', label: 'By items' },
              ].map(opt => (
                <Pressable
                  key={opt.key}
                  onPress={() => { setSplitType(opt.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={{ overflow: 'hidden', borderRadius: 50 }}
                >
                  {splitType === opt.key
                    ? <LinearGradient colors={['#7B61FF', '#00D4FF']} style={rr.typeChipActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{opt.label}</Text>
                      </LinearGradient>
                    : <View style={rr.typeChip}><Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600' }}>{opt.label}</Text></View>
                  }
                </Pressable>
              ))}
            </View>
          </View>

          {/* Per person */}
          <View style={[rr.perPersonCard, { marginTop: 16 }]}>
            <LinearGradient colors={['rgba(123,97,255,0.18)', 'rgba(0,212,255,0.08)']} style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={[StyleSheet.absoluteFillObject, { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(123,97,255,0.35)' }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '600' }}>Each person pays</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '800', letterSpacing: -1 }}>{'\u20b9'}{perPerson.toLocaleString('en-IN')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: 'rgba(255,255,255,0.50)', fontSize: 11 }}>{mem} people</Text>
                <Text style={{ color: '#A78BFA', fontSize: 14, fontWeight: '700' }}>{'\u20b9'}{selectedTotal.toLocaleString('en-IN')} total</Text>
              </View>
            </View>
          </View>

          {/* Group selector */}
          {groups && groups.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={rr.configLabel}>Add to group (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
                <Pressable
                  onPress={() => setSelectedGroup(null)}
                  style={[rr.groupChip, !selectedGroup && rr.groupChipActive]}
                >
                  <Text style={[rr.groupChipText, !selectedGroup && { color: '#fff' }]}>None</Text>
                </Pressable>
                {groups.map(g => (
                  <Pressable
                    key={g.id}
                    onPress={() => { setSelectedGroup(g.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[rr.groupChip, selectedGroup === g.id && rr.groupChipActive]}
                  >
                    <Text style={{ fontSize: 14 }}>{g.emoji}</Text>
                    <Text style={[rr.groupChipText, selectedGroup === g.id && { color: '#fff' }]} numberOfLines={1}>{g.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Split button */}
          <Pressable onPress={() => onSplit({ items: selectedItems, total: selectedTotal, members: mem, groupId: selectedGroup, splitType })} style={{ marginTop: 16 }}>
            <LinearGradient colors={['#7B61FF', '#00D4FF']} style={rr.splitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={rr.splitBtnText}>Split {'\u20b9'}{selectedTotal.toLocaleString('en-IN')} between {mem} people →</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={onReset} style={{ marginTop: 10, alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14, fontWeight: '600' }}>Scan another receipt</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────
export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [facing, setFacing] = useState('back');
  const [torch, setTorch] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const insets = useSafeAreaInsets();
  const { addExpense, addGroupExpense, groups } = useData();
  const progressTimer = useRef(null);

  const runScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanning(true);
    setProgress(0);
    setSuccess(false);
    let p = 0;
    progressTimer.current = setInterval(() => {
      p += Math.random() * 0.18 + 0.08;
      if (p >= 1) {
        p = 1;
        clearInterval(progressTimer.current);
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSuccess(true);
          setTimeout(() => {
            const mock = MOCK_RECEIPTS[Math.floor(Math.random() * MOCK_RECEIPTS.length)];
            setResult(buildReceipt(mock));
            setScanning(false);
            setScanned(true);
            setSuccess(false);
            setProgress(0);
          }, 700);
        }, 200);
      }
      setProgress(Math.min(p, 1));
    }, 250);
  };

  const handlePickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (!res.canceled) {
      setScanning(true);
      setProgress(0);
      let p = 0;
      progressTimer.current = setInterval(() => {
        p += Math.random() * 0.25 + 0.10;
        if (p >= 1) {
          p = 1;
          clearInterval(progressTimer.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const mock = MOCK_RECEIPTS[Math.floor(Math.random() * MOCK_RECEIPTS.length)];
          setResult(buildReceipt(mock));
          setScanning(false);
          setScanned(true);
          setProgress(0);
        }
        setProgress(Math.min(p, 1));
      }, 200);
    }
  };

  const handleSplitBill = ({ items, total, members, groupId, splitType }) => {
    if (!result) return;
    const expense = {
      id: Date.now().toString(),
      title: result.restaurant,
      amount: total,
      members,
      location: result.restaurant,
      emoji: '��',
      color: ['#7B61FF', '#00D4FF'],
      paidBy: 'You',
      note: items.map(i => i.name).join(', '),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      createdAt: new Date().toISOString(),
    };
    if (groupId) {
      addGroupExpense(groupId, expense);
      const g = groups.find(x => x.id === groupId);
      Alert.alert('Added to group!', '\u20b9' + total + ' added to "' + (g ? g.name : 'group') + '"', [
        { text: 'View Group', onPress: () => navigation.navigate('GroupDetail', { groupId }) },
        { text: 'OK' },
      ]);
    } else {
      addExpense(expense);
      Alert.alert('Bill Split!', '\u20b9' + total.toLocaleString('en-IN') + ' split between ' + members + ' people (\u20b9' + Math.round(total / members).toLocaleString('en-IN') + ' each)', [
        { text: 'View on Home', onPress: () => navigation.navigate('Home') },
        { text: 'OK' },
      ]);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScanned(false);
    setResult(null);
  };

  const handleCancel = () => {
    clearInterval(progressTimer.current);
    setScanning(false);
    setProgress(0);
    setSuccess(false);
  };

  const handleReset = () => { setScanned(false); setResult(null); setScanning(false); setSuccess(false); setProgress(0); };

  const handleManualAdd = (expense) => {
    addExpense(expense);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Added!', 'Expense added to your splits.', [
      { text: 'View on Home', onPress: () => navigation.navigate('Home') },
      { text: 'OK' },
    ]);
  };

  if (!permission) {
    return (
      <MeshBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16 }}>Checking camera...</Text>
        </View>
      </MeshBackground>
    );
  }

  if (!permission.granted) {
    return (
      <MeshBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 }}>
          <Text style={{ fontSize: 64 }}>📷</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 }}>Camera Access Needed</Text>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
            SplitLens needs camera to scan receipts and auto-fill your expenses
          </Text>
          <Pressable onPress={requestPermission}>
            <LinearGradient colors={['#7B61FF', '#00D4FF']} style={{ paddingHorizontal: 36, paddingVertical: 15, borderRadius: 50 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Grant Permission</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => setShowManual(true)} style={{ paddingVertical: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: '600' }}>Or enter expense manually</Text>
          </Pressable>
          <ManualEntryModal visible={showManual} onClose={() => setShowManual(false)} onAdd={handleManualAdd} />
        </View>
      </MeshBackground>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#080616' }}>
      {!scanned ? (
        <View style={{ flex: 1 }}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            enableTorch={torch}
          />

          {/* Dark overlay */}
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.42)' }}>

            {/* Top bar */}
            <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
              <View style={s.topBarBase} />
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
              <LinearGradient colors={['rgba(8,6,22,0.90)', 'rgba(8,6,22,0.70)']} style={StyleSheet.absoluteFillObject} />
              <View style={s.topBarBorder} />
              <View style={s.topBarContent}>
                <View>
                  <Text style={s.camTitle}>Scan Receipt</Text>
                  <Text style={s.camSub}>Point at any bill or invoice</Text>
                </View>
                {/* Controls */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {/* Torch toggle */}
                  <Pressable
                    onPress={() => { setTorch(t => !t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[s.controlBtn, torch && s.controlBtnActive]}
                  >
                    <Text style={{ fontSize: 18 }}>{torch ? '🔦' : '💡'}</Text>
                  </Pressable>
                  {/* Flip camera */}
                  <Pressable
                    onPress={() => { setFacing(f => f === 'back' ? 'front' : 'back'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={s.controlBtn}
                  >
                    <Text style={{ fontSize: 18 }}>🔄</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Frame + processing */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 }}>
              <ScanFrame scanning={scanning} success={success} />
              {scanning && <ProcessingIndicator progress={progress} />}
              {!scanning && !scanned && (
                <View style={s.hintPill}>
                  <View style={s.hintBase} />
                  <Text style={s.hintText}>Align receipt inside the frame</Text>
                </View>
              )}
            </View>

            {/* Bottom controls */}
            <View style={[s.camBottom, { paddingBottom: insets.bottom + 90 }]}>
              <View style={s.camBottomBase} />
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
              <LinearGradient colors={['rgba(8,6,22,0.85)', 'rgba(8,6,22,0.70)']} style={StyleSheet.absoluteFillObject} />
              <View style={s.camBottomContent}>
                {/* Gallery */}
                <Pressable onPress={handlePickImage} disabled={scanning} style={[s.sideBtn, scanning && { opacity: 0.4 }]}>
                  <View style={s.sideBtnBase} />
                  <Text style={{ fontSize: 22 }}>📁</Text>
                  <Text style={s.sideBtnText}>Gallery</Text>
                </Pressable>

                {/* Main scan button */}
                <Pressable onPress={scanning ? handleCancel : runScan}>
                  <LinearGradient
                    colors={scanning ? ['#FF4D6D', '#FF9F1C'] : ['#7B61FF', '#00D4FF']}
                    style={s.scanBtn}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Text style={{ fontSize: scanning ? 22 : 28, color: '#fff' }}>
                      {scanning ? '✕' : '⊙'}
                    </Text>
                    <Text style={s.scanBtnLabel}>{scanning ? 'Cancel' : 'Scan'}</Text>
                  </LinearGradient>
                </Pressable>

                {/* Manual entry */}
                <Pressable onPress={() => setShowManual(true)} disabled={scanning} style={[s.sideBtn, scanning && { opacity: 0.4 }]}>
                  <View style={s.sideBtnBase} />
                  <Text style={{ fontSize: 22 }}>✏️</Text>
                  <Text style={s.sideBtnText}>Manual</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <MeshBackground>
          <ScrollView
            contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 18, paddingBottom: 130 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }}>
                Receipt Scanned 🎉
              </Text>
              <Pressable onPress={handleReset} style={s.rescanBtn}>
                <Text style={s.rescanBtnText}>↩ Rescan</Text>
              </Pressable>
            </View>
            {result && (
              <ReceiptResult
                data={result}
                onSplit={handleSplitBill}
                onReset={handleReset}
                groups={groups}
              />
            )}
          </ScrollView>
        </MeshBackground>
      )}

      <ManualEntryModal visible={showManual} onClose={() => setShowManual(false)} onAdd={handleManualAdd} />
    </View>
  );
}

const s = StyleSheet.create({
  topBar: { overflow: 'hidden', position: 'relative' },
  topBarBase: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,6,22,0.88)' },
  topBarBorder: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(123,97,255,0.30)' },
  topBarContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14 },
  camTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  camSub: { color: 'rgba(255,255,255,0.50)', fontSize: 13, marginTop: 2 },
  controlBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  controlBtnActive: { backgroundColor: 'rgba(255,184,0,0.25)', borderColor: 'rgba(255,184,0,0.60)' },
  hintPill: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 50, overflow: 'hidden' },
  hintBase: { ...StyleSheet.absoluteFillObject, borderRadius: 50, backgroundColor: 'rgba(14,8,44,0.80)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  hintText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600' },
  camBottom: { overflow: 'hidden', position: 'relative' },
  camBottomBase: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,6,22,0.88)' },
  camBottomContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 36, paddingTop: 20, gap: 0 },
  sideBtn: { alignItems: 'center', gap: 5, width: 64, paddingVertical: 10, borderRadius: 16, overflow: 'hidden' },
  sideBtnBase: { ...StyleSheet.absoluteFillObject, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  sideBtnText: { color: 'rgba(255,255,255,0.70)', fontSize: 11, fontWeight: '600' },
  scanBtn: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', gap: 2, shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 20, elevation: 14 },
  scanBtnLabel: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  rescanBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  rescanBtnText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '700' },
});
const sc = StyleSheet.create({
  frame: { width: 264, height: 340, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  frameGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 8, backgroundColor: 'rgba(123,97,255,0.08)', borderWidth: 1, borderColor: 'rgba(123,97,255,0.25)' },
  corner: { position: 'absolute', width: 28, height: 28, borderRadius: 3 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, overflow: 'visible' },
  scanDot: { position: 'absolute', right: 0, top: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#00D4FF', shadowColor: '#00D4FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 8 },
  successIcon: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  successCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', shadowColor: '#00E6A0', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 12 },
});
const pi = StyleSheet.create({
  wrap: { borderRadius: 20, overflow: 'hidden', paddingHorizontal: 24, paddingVertical: 16, gap: 10, minWidth: 220 },
  base: { ...StyleSheet.absoluteFillObject, borderRadius: 20, backgroundColor: 'rgba(14,8,44,0.92)' },
  border: { ...StyleSheet.absoluteFillObject, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(123,97,255,0.35)' },
  stepText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  barBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
  pctText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center' },
});
const rr = StyleSheet.create({
  card: { borderRadius: 24, overflow: 'hidden' },
  cardBase: { ...StyleSheet.absoluteFillObject, borderRadius: 24, backgroundColor: 'rgba(14,8,44,0.94)' },
  topBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  border: { ...StyleSheet.absoluteFillObject, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  inner: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  restaurant: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  date: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  successBadge: { backgroundColor: 'rgba(0,230,160,0.15)', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,230,160,0.35)' },
  successText: { color: '#00E6A0', fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 },
  hint: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 10, textAlign: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 8, borderRadius: 10, marginBottom: 4, overflow: 'hidden' },
  itemRowDisabled: { opacity: 0.38 },
  itemCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.30)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemCheckActive: { backgroundColor: '#7B61FF', borderColor: '#7B61FF' },
  itemName: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  itemNameDisabled: { color: 'rgba(255,255,255,0.40)' },
  itemNameInput: { flex: 1, color: '#FFFFFF', fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#7B61FF', padding: 0 },
  itemPrice: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', flexShrink: 0 },
  itemPriceDisabled: { color: 'rgba(255,255,255,0.30)' },
  deselectedNotice: { backgroundColor: 'rgba(255,184,0,0.10)', borderRadius: 8, padding: 8, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,184,0,0.25)' },
  deselectedText: { color: '#FFB800', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metaText: { color: 'rgba(255,255,255,0.50)', fontSize: 13 },
  totalText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  configTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 14, letterSpacing: -0.2 },
  configRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  configLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  peopleRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  personChip: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  personChipText: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '700' },
  personChipActive: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  personChipActiveText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  personChipInput: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(123,97,255,0.50)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  personInput: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center', width: 36 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  typeChipActive: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50 },
  perPersonCard: { borderRadius: 14, overflow: 'hidden', padding: 14 },
  groupChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  groupChipActive: { backgroundColor: 'rgba(123,97,255,0.25)', borderColor: 'rgba(123,97,255,0.60)' },
  groupChipText: { color: 'rgba(255,255,255,0.60)', fontSize: 13, fontWeight: '600', maxWidth: 100 },
  splitBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  splitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
const me = StyleSheet.create({
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', padding: 24, paddingBottom: 40 },
  base: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0E0730', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  topBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'center', marginBottom: 20 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 20 },
  label: { color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  inputWrap: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 4 },
  inputBase: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,8,44,0.92)', borderRadius: 14 },
  input: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', padding: 14 },
  addBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
