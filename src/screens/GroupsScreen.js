import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, Pressable,
  TextInput, Modal, Alert, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MeshBackground from '../components/MeshBackground';
import { useData } from '../context/DataContext';

const EMOJI_OPTIONS = ['🏖️','🏠','🍱','⛰️','🎉','✈️','🎓','💼','🏋️','🎮','🎵','❤️'];
const GRADIENTS = [
  ['#FF3A8C','#FF9F1C'],['#7B61FF','#00D4FF'],['#00E6A0','#00D4FF'],
  ['#FF6FB0','#7B61FF'],['#FF9F1C','#FF3A8C'],['#00D4FF','#7B61FF'],
];
const AVATAR_COLORS = ['#7B61FF','#FF3A8C','#00D4FF','#FF9F1C','#00E6A0','#FF6FB0','#A78BFA','#34D399'];

// ── Create Group Modal ────────────────────────────────────
function CreateGroupModal({ visible, onClose, onCreate }) {
  const [name,      setName]      = useState('');
  const [members,   setMembers]   = useState('');
  const [emoji,     setEmoji]     = useState('🏖️');
  const [gradIdx,   setGradIdx]   = useState(0);

  const reset = () => { setName(''); setMembers(''); setEmoji('🏖️'); setGradIdx(0); };

  const handleCreate = () => {
    if (!name.trim()) { Alert.alert('Missing', 'Group name is required.'); return; }
    const memberList = members.split(',').map(m => m.trim()).filter(Boolean);
    if (memberList.length < 1) { Alert.alert('Missing', 'Add at least 1 member name.'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCreate({
      id:       Date.now().toString(),
      name:     name.trim(),
      emoji,
      gradient: GRADIENTS[gradIdx],
      members:  memberList.length + 1, // +1 for the user themselves
      avatars:  ['You', ...memberList].slice(0,8).map((m, i) => ({
        letter: m.charAt(0).toUpperCase(),
        color:  AVATAR_COLORS[i % AVATAR_COLORS.length],
      })),
      total:    0,
      settled:  0,
      myShare:  0,
      myPaid:   0,
      lastActivity: 'Just now',
      expenses: [],
    });
    reset(); onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
        <TouchableWithoutFeedback onPress={onClose}><View style={cg.overlay}/></TouchableWithoutFeedback>
        <View style={cg.sheet}>
          <View style={cg.base}/>
          <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFillObject,{borderRadius:28}]}/>
          <LinearGradient colors={['rgba(22,10,60,0.97)','rgba(12,6,36,0.99)']} style={[StyleSheet.absoluteFillObject,{borderRadius:28}]}/>
          <LinearGradient colors={['transparent','rgba(123,97,255,0.7)','rgba(0,212,255,0.5)','transparent']} style={cg.topBorder} start={{x:0,y:0}} end={{x:1,y:0}}/>
          <View style={cg.handle}/>
          <Text style={cg.title}>Create Group</Text>

          <Text style={cg.label}>Emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10,marginBottom:16}}>
            {EMOJI_OPTIONS.map(e=>(
              <Pressable key={e} onPress={()=>setEmoji(e)} style={[cg.emojiBtn,emoji===e&&cg.emojiBtnActive]}>
                <Text style={{fontSize:24}}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={cg.label}>Color</Text>
          <View style={{flexDirection:'row',gap:10,marginBottom:16}}>
            {GRADIENTS.map((g,i)=>(
              <Pressable key={i} onPress={()=>setGradIdx(i)}>
                <LinearGradient colors={g} style={[cg.colorDot,gradIdx===i&&cg.colorDotActive]} start={{x:0,y:0}} end={{x:1,y:0}}/>
              </Pressable>
            ))}
          </View>

          <Text style={cg.label}>Group Name *</Text>
          <View style={cg.inputWrap}>
            <View style={cg.inputBase}/>
            <TextInput style={cg.input} placeholder="e.g. Goa Trip 2026" placeholderTextColor="rgba(255,255,255,0.3)" value={name} onChangeText={setName} autoCapitalize="words"/>
          </View>

          <Text style={[cg.label,{marginTop:16}]}>Members (comma separated) *</Text>
          <View style={cg.inputWrap}>
            <View style={cg.inputBase}/>
            <TextInput style={cg.input} placeholder="Arjun, Priya, Rohan" placeholderTextColor="rgba(255,255,255,0.3)" value={members} onChangeText={setMembers} autoCapitalize="words"/>
          </View>
          <Text style={cg.hint}>You are automatically added as a member</Text>

          <View style={cg.btnRow}>
            <Pressable onPress={onClose} style={cg.cancelBtn}><Text style={cg.cancelText}>Cancel</Text></Pressable>
            <Pressable onPress={handleCreate} style={{flex:1}}>
              <LinearGradient colors={['#7B61FF','#00D4FF']} style={cg.createBtn} start={{x:0,y:0}} end={{x:1,y:0}}>
                <Text style={cg.createText}>Create Group</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Group Card ────────────────────────────────────────────
function GroupCard({ group, index, onDelete }) {
  const slideY = useRef(new Animated.Value(50)).current;
  const fade   = useRef(new Animated.Value(0)).current;
  const progress = group.total > 0 ? group.settled / group.total : 0;
  const isSettled = progress >= 1;
  const pct = group.total > 0 ? Math.round(progress * 100) : 0;
  const amountOwed = group.myShare - group.myPaid;

  useEffect(()=>{
    Animated.parallel([
      Animated.spring(slideY,{toValue:0,damping:14,stiffness:150,delay:index*80,useNativeDriver:true}),
      Animated.timing(fade,  {toValue:1,duration:400,delay:index*80,useNativeDriver:true}),
    ]).start();
  },[]);

  return (
    <Animated.View style={{opacity:fade,transform:[{translateY:slideY}],marginBottom:14}}>
      <Pressable
        style={s.card}
        onPress={()=>{ Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Alert.alert(group.name, `${group.members} members\nTotal: ₹${group.total.toLocaleString('en-IN')}\n\nGroup detail view coming in next update!`,[{text:'OK'}]); }}
        onLongPress={()=>{ Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert('Delete Group',`Remove "${group.name}"?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>onDelete(group.id)}]); }}
      >
        <View style={s.cardBase}/>
        <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFillObject,{borderRadius:24}]}/>
        <LinearGradient colors={['rgba(255,255,255,0.09)','rgba(255,255,255,0.02)']} style={[StyleSheet.absoluteFillObject,{borderRadius:24}]}/>
        <LinearGradient colors={[group.gradient[0]+'28','transparent']} style={[StyleSheet.absoluteFillObject,{borderRadius:24}]} start={{x:0,y:0}} end={{x:0.7,y:0}}/>
        <View style={[s.cardBorder,{borderColor:group.gradient[0]+'45'}]}/>
        <View style={s.cardInner}>
          <View style={s.topRow}>
            <LinearGradient colors={group.gradient} style={s.emojiBox}>
              <Text style={s.emojiText}>{group.emoji}</Text>
            </LinearGradient>
            <View style={{flex:1}}>
              <Text style={s.groupName}>{group.name}</Text>
              <Text style={s.groupMeta}>{group.members} members  ·  {group.lastActivity}</Text>
            </View>
            {isSettled
              ? <View style={[s.badge,{backgroundColor:'#00E6A022',borderColor:'#00E6A055'}]}><Text style={[s.badgeText,{color:'#00E6A0'}]}>✓ Settled</Text></View>
              : <View style={[s.badge,{backgroundColor:'#FF9F1C22',borderColor:'#FF9F1C55'}]}><Text style={[s.badgeText,{color:'#FF9F1C'}]}>Active</Text></View>
            }
          </View>
          <View style={s.divider}/>
          <View style={s.midRow}>
            <View style={s.avatarStack}>
              {(group.avatars||[]).slice(0,4).map((av,i)=>(
                <LinearGradient key={i} colors={[av.color,av.color+'AA']} style={[s.avatar,{marginLeft:i===0?0:-10,zIndex:10-i}]}>
                  <Text style={s.avatarLetter}>{av.letter}</Text>
                </LinearGradient>
              ))}
              {group.members > 4 && (
                <View style={[s.avatar,s.avatarExtra,{marginLeft:-10,zIndex:0}]}>
                  <Text style={s.avatarExtraText}>+{group.members-4}</Text>
                </View>
              )}
            </View>
            <View style={{alignItems:'flex-end'}}>
              <Text style={s.totalLabel}>Total Spend</Text>
              <Text style={s.totalValue}>₹{group.total.toLocaleString('en-IN')}</Text>
            </View>
          </View>
          <View style={s.progressSection}>
            <View style={s.progressBg}>
              <LinearGradient colors={isSettled?['#00E6A0','#00D4FF']:group.gradient} style={[s.progressFill,{width:`${pct}%`}]} start={{x:0,y:0}} end={{x:1,y:0}}/>
            </View>
            <View style={s.progressLabels}>
              <Text style={s.progressLeft}>₹{group.settled.toLocaleString('en-IN')} settled</Text>
              <Text style={[s.progressRight,{color:isSettled?'#00E6A0':group.gradient[0]}]}>{pct}%</Text>
            </View>
          </View>
          {!isSettled && amountOwed > 0 && (
            <View style={[s.myShareRow,{borderColor:group.gradient[0]+'35'}]}>
              <View style={[s.myShareBg,{backgroundColor:group.gradient[0]+'15'}]}/>
              <Text style={s.myShareLabel}>Your share</Text>
              <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
                <Text style={s.mySharePaid}>₹{group.myPaid.toLocaleString('en-IN')} paid</Text>
                <LinearGradient colors={group.gradient} style={s.owedPill} start={{x:0,y:0}} end={{x:1,y:0}}>
                  <Text style={s.owedText}>₹{amountOwed.toLocaleString('en-IN')} left</Text>
                </LinearGradient>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────
export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const { groups, addGroup, deleteGroup, totalSpent } = useData();
  const [search,     setSearch]     = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [sortBy,     setSortBy]     = useState('date');
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(headerFade,{toValue:1,duration:600,useNativeDriver:true}).start();
  },[]);

  const handleSort = () => {
    Alert.alert('Sort Groups', 'Choose sort order', [
      { text:'By Date (newest)', onPress:()=>setSortBy('date') },
      { text:'By Name (A-Z)',    onPress:()=>setSortBy('name') },
      { text:'By Total (high)',  onPress:()=>setSortBy('total') },
      { text:'By Progress',     onPress:()=>setSortBy('progress') },
      { text:'Cancel', style:'cancel' },
    ]);
  };

  let filtered = groups.filter(g=>g.name.toLowerCase().includes(search.toLowerCase()));
  if (sortBy==='name')     filtered = [...filtered].sort((a,b)=>a.name.localeCompare(b.name));
  if (sortBy==='total')    filtered = [...filtered].sort((a,b)=>b.total-a.total);
  if (sortBy==='progress') filtered = [...filtered].sort((a,b)=>(b.settled/Math.max(b.total,1))-(a.settled/Math.max(a.total,1)));

  const totalGroups  = groups.length;
  const activeGroups = groups.filter(g=>g.settled<g.total).length;
  const settledGroups= groups.filter(g=>g.total>0&&g.settled>=g.total).length;
  const totalSpendK  = (groups.reduce((s,g)=>s+g.total,0)/1000).toFixed(0);

  return (
    <MeshBackground>
      <ScrollView contentContainerStyle={[s.scroll,{paddingTop:insets.top+20,paddingBottom:130}]} showsVerticalScrollIndicator={false}>
        <Animated.View style={[s.header,{opacity:headerFade}]}>
          <View>
            <Text style={s.screenSubtitle}>Manage your</Text>
            <Text style={s.screenTitle}>Groups</Text>
          </View>
          <Pressable onPress={()=>{ Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCreate(true); }}>
            <LinearGradient colors={['#7B61FF','#00D4FF']} style={s.newBtn} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={s.newBtnText}>+ New</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Summary Banner */}
        <LinearGradient colors={['#1E0B5E','#120840','#0A0525']} style={s.banner} start={{x:0,y:0}} end={{x:1,y:1}}>
          <View style={s.bannerGlow}/>
          <View style={s.bannerBorder}/>
          <View style={s.bannerRow}>
            {[
              {val:totalGroups,  lbl:'Groups',  color:'#A78BFA'},
              {val:activeGroups, lbl:'Active',  color:'#FF9F1C'},
              {val:'₹'+totalSpendK+'k', lbl:'Spent', color:'#00D4FF'},
              {val:settledGroups,lbl:'Settled', color:'#00E6A0'},
            ].map((item,i)=>(
              <View key={i} style={[s.bannerStat,i>0&&s.bannerStatBorder]}>
                <Text style={[s.bannerVal,{color:item.color}]}>{item.val}</Text>
                <Text style={s.bannerLbl}>{item.lbl}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Search */}
        <View style={s.searchWrap}>
          <View style={s.searchBase}/>
          <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFillObject,{borderRadius:16}]}/>
          <View style={s.searchBorder}/>
          <Text style={{fontSize:16,marginRight:10}}>🔍</Text>
          <TextInput style={s.searchInput} placeholder="Search groups..." placeholderTextColor="rgba(255,255,255,0.30)" value={search} onChangeText={setSearch}/>
        </View>

        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>{filtered.length} {filtered.length===1?'group':'groups'}</Text>
          <Pressable onPress={handleSort}><Text style={s.sortBtn}>Sort ↕</Text></Pressable>
        </View>

        {filtered.length === 0 && groups.length === 0 ? (
          <Pressable onPress={()=>setShowCreate(true)} style={s.emptyState}>
            <View style={[StyleSheet.absoluteFillObject,{borderRadius:20,backgroundColor:'rgba(18,10,50,0.85)'}]}/>
            <View style={[StyleSheet.absoluteFillObject,{borderRadius:20,borderWidth:1,borderColor:'rgba(255,255,255,0.12)'}]}/>
            <Text style={{fontSize:48}}>👥</Text>
            <Text style={s.emptyTitle}>No groups yet</Text>
            <Text style={s.emptySub}>Tap here or "+ New" to create your first group</Text>
            <LinearGradient colors={['#7B61FF','#00D4FF']} style={s.emptyBtn} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={s.emptyBtnText}>Create First Group</Text>
            </LinearGradient>
          </Pressable>
        ) : filtered.length === 0 ? (
          <View style={{alignItems:'center',paddingTop:40,gap:10}}>
            <Text style={{fontSize:36}}>🔍</Text>
            <Text style={{color:'rgba(255,255,255,0.40)',fontSize:16,fontWeight:'600'}}>No groups match "{search}"</Text>
          </View>
        ) : (
          filtered.map((g,i)=><GroupCard key={g.id} group={g} index={i} onDelete={deleteGroup}/>)
        )}
      </ScrollView>
      <CreateGroupModal visible={showCreate} onClose={()=>setShowCreate(false)} onCreate={addGroup}/>
    </MeshBackground>
  );
}

const s = StyleSheet.create({
  scroll:{ paddingHorizontal:18 },
  header:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:22 },
  screenSubtitle:{ color:'rgba(255,255,255,0.45)', fontSize:13, fontWeight:'500' },
  screenTitle:{ color:'#FFFFFF', fontSize:30, fontWeight:'800', letterSpacing:-0.5, marginTop:2 },
  newBtn:{ paddingHorizontal:22, paddingVertical:11, borderRadius:50, shadowColor:'#7B61FF', shadowOffset:{width:0,height:4}, shadowOpacity:0.55, shadowRadius:12, elevation:8 },
  newBtnText:{ color:'#fff', fontWeight:'800', fontSize:14 },
  banner:{ borderRadius:22, overflow:'hidden', marginBottom:20, shadowColor:'#5B3FFF', shadowOffset:{width:0,height:8}, shadowOpacity:0.4, shadowRadius:20, elevation:10 },
  bannerGlow:{ position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'#6B4FFF', top:-80, left:-40, opacity:0.4 },
  bannerBorder:{ ...StyleSheet.absoluteFillObject, borderRadius:22, borderWidth:1, borderColor:'rgba(255,255,255,0.18)' },
  bannerRow:{ flexDirection:'row' },
  bannerStat:{ flex:1, alignItems:'center', paddingVertical:20, gap:4 },
  bannerStatBorder:{ borderLeftWidth:1, borderLeftColor:'rgba(255,255,255,0.10)' },
  bannerVal:{ fontSize:22, fontWeight:'800', letterSpacing:-0.5 },
  bannerLbl:{ color:'rgba(255,255,255,0.50)', fontSize:11, fontWeight:'600', letterSpacing:0.3 },
  searchWrap:{ height:52, borderRadius:16, flexDirection:'row', alignItems:'center', paddingHorizontal:16, overflow:'hidden', marginBottom:18 },
  searchBase:{ ...StyleSheet.absoluteFillObject, borderRadius:16, backgroundColor:'rgba(18,10,50,0.90)' },
  searchBorder:{ ...StyleSheet.absoluteFillObject, borderRadius:16, borderWidth:1, borderColor:'rgba(255,255,255,0.18)' },
  searchInput:{ flex:1, color:'#FFFFFF', fontSize:15, fontWeight:'500' },
  sectionRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  sectionLabel:{ color:'rgba(255,255,255,0.55)', fontSize:13, fontWeight:'600' },
  sortBtn:{ color:'#7B61FF', fontSize:13, fontWeight:'700' },
  emptyState:{ borderRadius:20, overflow:'hidden', alignItems:'center', paddingVertical:40, paddingHorizontal:24, gap:10 },
  emptyTitle:{ color:'#FFFFFF', fontSize:18, fontWeight:'800' },
  emptySub:{ color:'rgba(255,255,255,0.45)', fontSize:14, textAlign:'center' },
  emptyBtn:{ marginTop:8, paddingHorizontal:28, paddingVertical:13, borderRadius:50 },
  emptyBtnText:{ color:'#fff', fontWeight:'800', fontSize:15 },
  card:{ borderRadius:24, overflow:'hidden' },
  cardBase:{ ...StyleSheet.absoluteFillObject, borderRadius:24, backgroundColor:'rgba(16,8,48,0.93)' },
  cardBorder:{ ...StyleSheet.absoluteFillObject, borderRadius:24, borderWidth:1 },
  cardInner:{ padding:18 },
  topRow:{ flexDirection:'row', alignItems:'center', gap:14 },
  emojiBox:{ width:54, height:54, borderRadius:16, alignItems:'center', justifyContent:'center', flexShrink:0 },
  emojiText:{ fontSize:26 },
  groupName:{ color:'#FFFFFF', fontSize:16, fontWeight:'800', marginBottom:4, letterSpacing:-0.2 },
  groupMeta:{ color:'rgba(255,255,255,0.50)', fontSize:12, fontWeight:'500' },
  badge:{ borderRadius:50, paddingHorizontal:10, paddingVertical:5, borderWidth:1, flexShrink:0 },
  badgeText:{ fontSize:11, fontWeight:'800' },
  divider:{ height:1, backgroundColor:'rgba(255,255,255,0.08)', marginVertical:14 },
  midRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  avatarStack:{ flexDirection:'row', alignItems:'center' },
  avatar:{ width:34, height:34, borderRadius:17, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'rgba(16,8,48,0.9)' },
  avatarLetter:{ color:'#fff', fontSize:13, fontWeight:'800' },
  avatarExtra:{ backgroundColor:'rgba(255,255,255,0.12)' },
  avatarExtraText:{ color:'rgba(255,255,255,0.7)', fontSize:11, fontWeight:'700' },
  totalLabel:{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:'600', textAlign:'right' },
  totalValue:{ color:'#FFFFFF', fontSize:17, fontWeight:'800', letterSpacing:-0.3 },
  progressSection:{ gap:8 },
  progressBg:{ height:7, backgroundColor:'rgba(255,255,255,0.10)', borderRadius:4, overflow:'hidden' },
  progressFill:{ height:'100%', borderRadius:4 },
  progressLabels:{ flexDirection:'row', justifyContent:'space-between' },
  progressLeft:{ color:'rgba(255,255,255,0.50)', fontSize:11, fontWeight:'500' },
  progressRight:{ fontSize:12, fontWeight:'800' },
  myShareRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:14, borderRadius:12, paddingHorizontal:14, paddingVertical:10, borderWidth:1, overflow:'hidden' },
  myShareBg:{ ...StyleSheet.absoluteFillObject, borderRadius:12 },
  myShareLabel:{ color:'rgba(255,255,255,0.60)', fontSize:12, fontWeight:'600' },
  mySharePaid:{ color:'rgba(255,255,255,0.55)', fontSize:12 },
  owedPill:{ paddingHorizontal:10, paddingVertical:4, borderRadius:50 },
  owedText:{ color:'#fff', fontSize:11, fontWeight:'800' },
});
const cg = StyleSheet.create({
  overlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.5)' },
  sheet:{ borderTopLeftRadius:28, borderTopRightRadius:28, overflow:'hidden', padding:24, paddingBottom:40, maxHeight:'90%' },
  base:{ ...StyleSheet.absoluteFillObject, backgroundColor:'#0E0730', borderTopLeftRadius:28, borderTopRightRadius:28 },
  topBorder:{ position:'absolute', top:0, left:0, right:0, height:1 },
  handle:{ width:40, height:4, borderRadius:2, backgroundColor:'rgba(255,255,255,0.22)', alignSelf:'center', marginBottom:20 },
  title:{ color:'#FFFFFF', fontSize:22, fontWeight:'800', letterSpacing:-0.3, marginBottom:16 },
  label:{ color:'rgba(255,255,255,0.55)', fontSize:12, fontWeight:'700', letterSpacing:0.8, textTransform:'uppercase', marginBottom:8 },
  hint:{ color:'rgba(255,255,255,0.35)', fontSize:12, marginTop:4 },
  inputWrap:{ borderRadius:14, overflow:'hidden', borderWidth:1, borderColor:'rgba(255,255,255,0.18)' },
  inputBase:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(14,8,44,0.92)', borderRadius:14 },
  input:{ color:'#FFFFFF', fontSize:15, fontWeight:'500', padding:14 },
  emojiBtn:{ width:48, height:48, borderRadius:12, backgroundColor:'rgba(255,255,255,0.08)', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.12)' },
  emojiBtnActive:{ borderColor:'#7B61FF', backgroundColor:'rgba(123,97,255,0.25)' },
  colorDot:{ width:32, height:32, borderRadius:16 },
  colorDotActive:{ width:36, height:36, borderRadius:18, borderWidth:2.5, borderColor:'#FFFFFF' },
  btnRow:{ flexDirection:'row', gap:12, marginTop:24 },
  cancelBtn:{ height:54, borderRadius:14, borderWidth:1.5, borderColor:'rgba(255,255,255,0.20)', paddingHorizontal:20, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(255,255,255,0.06)' },
  cancelText:{ color:'rgba(255,255,255,0.65)', fontSize:15, fontWeight:'700' },
  createBtn:{ height:54, borderRadius:14, alignItems:'center', justifyContent:'center' },
  createText:{ color:'#fff', fontSize:15, fontWeight:'800' },
});