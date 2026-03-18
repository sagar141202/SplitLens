import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, Pressable,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import MeshBackground from '../components/MeshBackground';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const EMOJI_OPTIONS = ['🍽️','🛒','🏖️','🎬','⛽','☕','🍕','🎮','✈️','🏠','💊','🎁'];
const COLOR_OPTIONS = [
  ['#7B61FF','#00D4FF'],['#FF3A8C','#FF9F1C'],['#00E6A0','#00D4FF'],
  ['#FF6FB0','#7B61FF'],['#FF9F1C','#FF3A8C'],['#00D4FF','#7B61FF'],
];

function AnimatedNumber({ value, prefix='₹', style }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 1200, useNativeDriver: false }).start();
    anim.addListener(({ value: v }) => setDisplay(Math.floor(v).toLocaleString('en-IN')));
    return () => anim.removeAllListeners();
  }, [value]);
  return <Text style={style}>{prefix}{display}</Text>;
}

function AddExpenseModal({ visible, onClose, onAdd }) {
  const [title,    setTitle]    = useState('');
  const [amount,   setAmount]   = useState('');
  const [members,  setMembers]  = useState('2');
  const [location, setLocation] = useState('');
  const [emoji,    setEmoji]    = useState('🍽️');
  const [colorIdx, setColorIdx] = useState(0);

  const reset = () => { setTitle(''); setAmount(''); setMembers('2'); setLocation(''); setEmoji('🍽️'); setColorIdx(0); };

  const handleAdd = () => {
    if (!title.trim())                          { Alert.alert('Missing', 'Please enter a title.'); return; }
    if (!amount || isNaN(amount) || +amount<=0) { Alert.alert('Missing', 'Please enter a valid amount.'); return; }
    if (!members || isNaN(members) || +members<2){ Alert.alert('Invalid', 'At least 2 people required.'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({ id: Date.now().toString(), title: title.trim(), amount: parseFloat(amount), members: parseInt(members), location: location.trim() || 'No location', emoji, color: COLOR_OPTIONS[colorIdx], date: 'Just now' });
    reset(); onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
        <TouchableWithoutFeedback onPress={onClose}><View style={m.overlay}/></TouchableWithoutFeedback>
        <View style={m.sheet}>
          <View style={m.base}/>
          <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFillObject,{borderRadius:28}]}/>
          <LinearGradient colors={['rgba(22,10,60,0.97)','rgba(12,6,36,0.99)']} style={[StyleSheet.absoluteFillObject,{borderRadius:28}]}/>
          <LinearGradient colors={['transparent','rgba(123,97,255,0.7)','rgba(0,212,255,0.5)','transparent']} style={m.topBorder} start={{x:0,y:0}} end={{x:1,y:0}}/>
          <View style={m.handle}/>
          <Text style={m.title}>Add Expense</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{gap:14,paddingBottom:20}}>
            <Text style={m.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10}}>
              {EMOJI_OPTIONS.map(e=>(
                <Pressable key={e} onPress={()=>setEmoji(e)} style={[m.emojiBtn, emoji===e&&m.emojiBtnActive]}>
                  <Text style={{fontSize:24}}>{e}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={m.label}>Color</Text>
            <View style={{flexDirection:'row',gap:10}}>
              {COLOR_OPTIONS.map((c,i)=>(
                <Pressable key={i} onPress={()=>setColorIdx(i)}>
                  <LinearGradient colors={c} style={[m.colorDot, colorIdx===i&&m.colorDotActive]} start={{x:0,y:0}} end={{x:1,y:0}}/>
                </Pressable>
              ))}
            </View>
            <Text style={m.label}>Title *</Text>
            <View style={m.inputWrap}><View style={m.inputBase}/><TextInput style={m.input} placeholder="e.g. Dinner at Spice Route" placeholderTextColor="rgba(255,255,255,0.3)" value={title} onChangeText={setTitle}/></View>
            <Text style={m.label}>Total Amount (₹) *</Text>
            <View style={m.inputWrap}><View style={m.inputBase}/><TextInput style={m.input} placeholder="0" placeholderTextColor="rgba(255,255,255,0.3)" value={amount} onChangeText={setAmount} keyboardType="numeric"/></View>
            <Text style={m.label}>Number of People *</Text>
            <View style={m.inputWrap}><View style={m.inputBase}/><TextInput style={m.input} placeholder="2" placeholderTextColor="rgba(255,255,255,0.3)" value={members} onChangeText={setMembers} keyboardType="numeric"/></View>
            <Text style={m.label}>Location (optional)</Text>
            <View style={m.inputWrap}><View style={m.inputBase}/><TextInput style={m.input} placeholder="e.g. Connaught Place, Delhi" placeholderTextColor="rgba(255,255,255,0.3)" value={location} onChangeText={setLocation}/></View>
            {amount && members && !isNaN(amount) && !isNaN(members) && +members>0 && (
              <View style={{alignItems:'center'}}>
                <LinearGradient colors={COLOR_OPTIONS[colorIdx]} style={m.previewPill} start={{x:0,y:0}} end={{x:1,y:0}}>
                  <Text style={m.previewText}>₹{Math.round(parseFloat(amount)/parseInt(members)).toLocaleString('en-IN')} per person</Text>
                </LinearGradient>
              </View>
            )}
            <Pressable onPress={handleAdd}>
              <LinearGradient colors={['#7B61FF','#00D4FF']} style={m.addBtn} start={{x:0,y:0}} end={{x:1,y:0}}>
                <Text style={m.addBtnText}>Add Expense ✓</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function BalanceCard({ total, yourShare, totalOwed }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.loop(Animated.sequence([
      Animated.timing(pulse,{toValue:1,duration:2500,useNativeDriver:true}),
      Animated.timing(pulse,{toValue:0,duration:2500,useNativeDriver:true}),
    ])).start();
  },[]);
  const glowOp = pulse.interpolate({inputRange:[0,1],outputRange:[0.25,0.55]});
  return (
    <View style={s.heroOuter}>
      <LinearGradient colors={['#2A1570','#16085E','#0A0525']} style={s.heroCard} start={{x:0,y:0}} end={{x:1,y:1}}>
        <Animated.View style={[s.heroBlob,{opacity:glowOp}]}/>
        <LinearGradient colors={['rgba(255,255,255,0.18)','transparent']} style={s.heroTopEdge} start={{x:0,y:0}} end={{x:1,y:0}}/>
        <View style={s.heroBorder}/>
        <View style={s.heroContent}>
          <Text style={s.heroLabel}>TOTAL EXPENSES</Text>
          <AnimatedNumber value={total} style={s.heroAmount}/>
          <Text style={s.heroSub}>{total===0 ? 'Add your first split below' : 'Tracked across all splits'}</Text>
        </View>
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <View style={[s.statDot,{backgroundColor:'#00E6A0'}]}/>
            <Text style={s.statLabel}>You're owed</Text>
            <AnimatedNumber value={totalOwed} style={[s.statValue,{color:'#00E6A0'}]}/>
          </View>
          <View style={s.statSep}/>
          <View style={s.statBox}>
            <View style={[s.statDot,{backgroundColor:'#FF4D6D'}]}/>
            <Text style={s.statLabel}>Your share</Text>
            <AnimatedNumber value={yourShare} style={[s.statValue,{color:'#FF4D6D'}]}/>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function SplitCard({ item, index, onDelete }) {
  const slideY = useRef(new Animated.Value(40)).current;
  const fade   = useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.parallel([
      Animated.timing(slideY,{toValue:0,duration:400,delay:index*80,useNativeDriver:true}),
      Animated.timing(fade,  {toValue:1,duration:400,delay:index*80,useNativeDriver:true}),
    ]).start();
  },[]);
  const perPerson = Math.round(item.amount/item.members);
  return (
    <Animated.View style={{opacity:fade,transform:[{translateY:slideY}]}}>
      <Pressable style={s.splitCard} onLongPress={()=>{ Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert('Delete Expense',`Remove "${item.title}"?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>onDelete(item.id)}]); }}>
        <View style={[StyleSheet.absoluteFillObject,{borderRadius:20,backgroundColor:'rgba(18,10,50,0.92)'}]}/>
        <LinearGradient colors={['rgba(255,255,255,0.09)','rgba(255,255,255,0.02)']} style={[StyleSheet.absoluteFillObject,{borderRadius:20}]}/>
        <LinearGradient colors={item.color} style={s.splitAccentBar} start={{x:0,y:0}} end={{x:0,y:1}}/>
        <LinearGradient colors={[item.color[0]+'30','transparent']} style={[StyleSheet.absoluteFillObject,{borderRadius:20}]} start={{x:0,y:0.5}} end={{x:0.6,y:0.5}}/>
        <View style={[s.splitBorder,{borderColor:item.color[0]+'55'}]}/>
        <View style={s.splitInner}>
          <LinearGradient colors={[item.color[0]+'66',item.color[1]+'33']} style={s.emojiBox}>
            <Text style={s.emojiText}>{item.emoji}</Text>
          </LinearGradient>
          <View style={s.splitInfo}>
            <Text style={s.splitTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={s.splitLocation} numberOfLines={1}>📍 {item.location}</Text>
            <Text style={s.splitMeta}>{item.date}  ·  {item.members} people</Text>
          </View>
          <View style={s.splitAmountCol}>
            <LinearGradient colors={item.color} style={s.amountBadge} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={s.amountText}>₹{item.amount>=1000?(item.amount/1000).toFixed(1)+'k':item.amount}</Text>
            </LinearGradient>
            <Text style={s.perPersonText}>₹{perPerson}/person</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { expenses, addExpense, deleteExpense, totalSpent, yourShare, totalOwed } = useData();
  const [showModal, setShowModal] = useState(false);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(headerFade,{toValue:1,duration:700,useNativeDriver:true}).start();
  },[]);

  const name    = profile?.name ?? 'there';
  const hour    = new Date().getHours();
  const greeting= hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';

  return (
    <MeshBackground>
      <ScrollView style={{flex:1}} contentContainerStyle={[s.scroll,{paddingTop:insets.top+20,paddingBottom:130}]} showsVerticalScrollIndicator={false}>
        <Animated.View style={[s.header,{opacity:headerFade}]}>
          <View>
            <Text style={s.greeting}>{greeting} 👋</Text>
            <Text style={s.username}>{name}</Text>
          </View>
          <Pressable onPress={()=>{ Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowModal(true); }}>
            <LinearGradient colors={['#7B61FF','#00D4FF']} style={s.addBtn} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={s.addBtnText}>+ Add</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <BalanceCard total={totalSpent} yourShare={yourShare} totalOwed={totalOwed}/>

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{expenses.length===0?'No Splits Yet':'Recent Splits'}</Text>
          {expenses.length>0&&<Text style={s.splitCount}>{expenses.length} total · long press to delete</Text>}
        </View>

        {expenses.length===0 ? (
          <Pressable onPress={()=>setShowModal(true)} style={s.emptyState}>
            <View style={[StyleSheet.absoluteFillObject,{borderRadius:20,backgroundColor:'rgba(18,10,50,0.85)'}]}/>
            <View style={[StyleSheet.absoluteFillObject,{borderRadius:20,borderWidth:1,borderColor:'rgba(255,255,255,0.12)'}]}/>
            <Text style={s.emptyEmoji}>💸</Text>
            <Text style={s.emptyTitle}>No expenses yet</Text>
            <Text style={s.emptySub}>Tap here or "+ Add" to track your first split</Text>
            <LinearGradient colors={['#7B61FF','#00D4FF']} style={s.emptyBtn} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={s.emptyBtnText}>Add First Expense</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <View style={s.splitList}>
            {expenses.map((item,i)=>(
              <SplitCard key={item.id} item={item} index={i} onDelete={deleteExpense}/>
            ))}
          </View>
        )}
      </ScrollView>
      <AddExpenseModal visible={showModal} onClose={()=>setShowModal(false)} onAdd={addExpense}/>
    </MeshBackground>
  );
}

const s = StyleSheet.create({
  scroll:{ paddingHorizontal:18 },
  header:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  greeting:{ color:'rgba(255,255,255,0.55)', fontSize:14 },
  username:{ color:'#FFFFFF', fontSize:24, fontWeight:'800', marginTop:2, letterSpacing:-0.3 },
  addBtn:{ paddingHorizontal:22, paddingVertical:11, borderRadius:50, shadowColor:'#7B61FF', shadowOffset:{width:0,height:4}, shadowOpacity:0.6, shadowRadius:12, elevation:8 },
  addBtnText:{ color:'#fff', fontWeight:'800', fontSize:14 },
  heroOuter:{ marginBottom:28, borderRadius:28, shadowColor:'#5B3FFF', shadowOffset:{width:0,height:10}, shadowOpacity:0.5, shadowRadius:24, elevation:14 },
  heroCard:{ borderRadius:28, overflow:'hidden' },
  heroBlob:{ position:'absolute', width:260, height:260, borderRadius:130, backgroundColor:'#6B4FFF', top:-90, left:-70 },
  heroTopEdge:{ position:'absolute', top:0, left:0, right:0, height:1.5 },
  heroBorder:{ ...StyleSheet.absoluteFillObject, borderRadius:28, borderWidth:1, borderColor:'rgba(255,255,255,0.22)' },
  heroContent:{ paddingHorizontal:24, paddingTop:30, paddingBottom:22 },
  heroLabel:{ color:'rgba(255,255,255,0.60)', fontSize:11, fontWeight:'700', letterSpacing:2 },
  heroAmount:{ color:'#FFFFFF', fontSize:48, fontWeight:'800', marginTop:8, marginBottom:6, letterSpacing:-1.5 },
  heroSub:{ color:'rgba(255,255,255,0.60)', fontSize:13 },
  statsRow:{ flexDirection:'row', borderTopWidth:1, borderTopColor:'rgba(255,255,255,0.12)', marginTop:4 },
  statBox:{ flex:1, paddingVertical:18, paddingHorizontal:24, gap:5 },
  statSep:{ width:1, backgroundColor:'rgba(255,255,255,0.12)', marginVertical:14 },
  statDot:{ width:7, height:7, borderRadius:3.5, marginBottom:1 },
  statLabel:{ color:'rgba(255,255,255,0.55)', fontSize:12, fontWeight:'600' },
  statValue:{ fontSize:22, fontWeight:'800', letterSpacing:-0.5 },
  sectionHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  sectionTitle:{ color:'#FFFFFF', fontSize:18, fontWeight:'800', letterSpacing:-0.2 },
  splitCount:{ color:'rgba(255,255,255,0.40)', fontSize:11 },
  emptyState:{ borderRadius:20, overflow:'hidden', alignItems:'center', paddingVertical:40, paddingHorizontal:24, gap:10 },
  emptyEmoji:{ fontSize:48, marginBottom:4 },
  emptyTitle:{ color:'#FFFFFF', fontSize:18, fontWeight:'800' },
  emptySub:{ color:'rgba(255,255,255,0.45)', fontSize:14, textAlign:'center' },
  emptyBtn:{ marginTop:8, paddingHorizontal:28, paddingVertical:13, borderRadius:50 },
  emptyBtnText:{ color:'#fff', fontWeight:'800', fontSize:15 },
  splitList:{ gap:12 },
  splitCard:{ borderRadius:20, overflow:'hidden', minHeight:82 },
  splitAccentBar:{ position:'absolute', left:0, top:0, bottom:0, width:4, borderTopLeftRadius:20, borderBottomLeftRadius:20 },
  splitBorder:{ ...StyleSheet.absoluteFillObject, borderRadius:20, borderWidth:1 },
  splitInner:{ flexDirection:'row', alignItems:'center', paddingLeft:20, paddingRight:16, paddingVertical:16, gap:12 },
  emojiBox:{ width:50, height:50, borderRadius:14, alignItems:'center', justifyContent:'center', flexShrink:0 },
  emojiText:{ fontSize:24 },
  splitInfo:{ flex:1, gap:4 },
  splitTitle:{ color:'#FFFFFF', fontSize:14, fontWeight:'700' },
  splitLocation:{ color:'rgba(255,255,255,0.60)', fontSize:12 },
  splitMeta:{ color:'rgba(255,255,255,0.40)', fontSize:11 },
  splitAmountCol:{ alignItems:'flex-end', gap:6, flexShrink:0 },
  amountBadge:{ paddingHorizontal:13, paddingVertical:6, borderRadius:50 },
  amountText:{ color:'#fff', fontSize:13, fontWeight:'800' },
  perPersonText:{ color:'rgba(255,255,255,0.50)', fontSize:11 },
});
const m = StyleSheet.create({
  overlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.5)' },
  sheet:{ borderTopLeftRadius:28, borderTopRightRadius:28, overflow:'hidden', padding:24, paddingBottom:40, maxHeight:'90%' },
  base:{ ...StyleSheet.absoluteFillObject, backgroundColor:'#0E0730', borderTopLeftRadius:28, borderTopRightRadius:28 },
  topBorder:{ position:'absolute', top:0, left:0, right:0, height:1 },
  handle:{ width:40, height:4, borderRadius:2, backgroundColor:'rgba(255,255,255,0.22)', alignSelf:'center', marginBottom:20 },
  title:{ color:'#FFFFFF', fontSize:22, fontWeight:'800', letterSpacing:-0.3, marginBottom:20 },
  label:{ color:'rgba(255,255,255,0.55)', fontSize:12, fontWeight:'700', letterSpacing:0.8, textTransform:'uppercase' },
  inputWrap:{ borderRadius:14, overflow:'hidden', borderWidth:1, borderColor:'rgba(255,255,255,0.18)' },
  inputBase:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(14,8,44,0.92)', borderRadius:14 },
  input:{ color:'#FFFFFF', fontSize:15, fontWeight:'500', padding:14 },
  emojiBtn:{ width:48, height:48, borderRadius:12, backgroundColor:'rgba(255,255,255,0.08)', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.12)' },
  emojiBtnActive:{ borderColor:'#7B61FF', backgroundColor:'rgba(123,97,255,0.25)' },
  colorDot:{ width:32, height:32, borderRadius:16 },
  colorDotActive:{ width:36, height:36, borderRadius:18, borderWidth:2.5, borderColor:'#FFFFFF' },
  previewPill:{ paddingHorizontal:20, paddingVertical:8, borderRadius:50 },
  previewText:{ color:'#fff', fontWeight:'800', fontSize:14 },
  addBtn:{ height:54, borderRadius:16, alignItems:'center', justifyContent:'center' },
  addBtnText:{ color:'#fff', fontSize:16, fontWeight:'800' },
});