import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated,
  Pressable, Switch, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import MeshBackground from '../components/MeshBackground';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { updateProfile, resetPassword } from '../firebase/auth';

function EditProfileModal({ visible, onClose, profile }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [upi,  setUpi]  = useState(profile?.upi  ?? '');
  const [loading, setLoading] = useState(false);
  useEffect(()=>{ if(visible){ setName(profile?.name??''); setUpi(profile?.upi??''); } },[visible,profile]);
  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Missing','Name cannot be empty.'); return; }
    try {
      setLoading(true);
      await updateProfile({ uid:profile?.uid, name:name.trim(), upi:upi.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved!','Your profile has been updated.');
      onClose();
    } catch(err) { Alert.alert('Error',err.message); }
    finally { setLoading(false); }
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
        <Pressable style={e.overlay} onPress={onClose}/>
        <View style={e.sheet}>
          <View style={e.base}/><BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFillObject,{borderRadius:28}]}/>
          <LinearGradient colors={['rgba(22,10,60,0.97)','rgba(12,6,36,0.99)']} style={[StyleSheet.absoluteFillObject,{borderRadius:28}]}/>
          <LinearGradient colors={['transparent','rgba(123,97,255,0.7)','rgba(0,212,255,0.5)','transparent']} style={e.topBorder} start={{x:0,y:0}} end={{x:1,y:0}}/>
          <View style={e.handle}/><Text style={e.title}>Edit Profile</Text>
          <Text style={e.label}>Full Name</Text>
          <View style={e.inputWrap}><View style={e.inputBase}/><TextInput style={e.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="rgba(255,255,255,0.3)" autoCapitalize="words"/></View>
          <Text style={[e.label,{marginTop:16}]}>UPI ID</Text>
          <View style={e.inputWrap}><View style={e.inputBase}/><TextInput style={e.input} value={upi} onChangeText={setUpi} placeholder="name@ybl" placeholderTextColor="rgba(255,255,255,0.3)" autoCapitalize="none"/></View>
          <View style={e.btnRow}>
            <Pressable onPress={onClose} style={e.cancelBtn}><Text style={e.cancelText}>Cancel</Text></Pressable>
            <Pressable onPress={handleSave} disabled={loading} style={{flex:1}}>
              <LinearGradient colors={['#7B61FF','#00D4FF']} style={e.saveBtn} start={{x:0,y:0}} end={{x:1,y:0}}>
                {loading?<ActivityIndicator color="#fff" size="small"/>:<Text style={e.saveText}>Save Changes</Text>}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Row({ icon, label, value, onPress, isToggle, toggled, onToggle, danger }) {
  return (
    <Pressable style={s.row} onPress={onPress}>
      <View style={[s.rowIcon,{backgroundColor:danger?'rgba(255,77,109,0.15)':'rgba(255,255,255,0.08)'}]}>
        <Text style={{fontSize:16}}>{icon}</Text>
      </View>
      <Text style={[s.rowLabel,danger&&{color:'#FF4D6D'}]}>{label}</Text>
      {isToggle
        ? <Switch value={toggled} onValueChange={onToggle} trackColor={{false:'rgba(255,255,255,0.12)',true:'#7B61FF'}} thumbColor="#fff"/>
        : <Text style={s.rowValue}>{value}{value?' ›':''}</Text>
      }
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, logout } = useAuth();
  const { expenses, groups, totalSpent, settings, saveSettings } = useData();
  const [showEdit,   setShowEdit]   = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(()=>{ Animated.timing(headerFade,{toValue:1,duration:600,useNativeDriver:true}).start(); },[]);

  const name   = profile?.name  ?? 'User';
  const upi    = profile?.upi   ?? '';
  const avatar = profile?.avatar ?? name.charAt(0).toUpperCase();
  const email  = profile?.email ?? '';

  const handleLogout = () => {
    Alert.alert('Sign Out','Are you sure you want to sign out?',[
      {text:'Cancel',style:'cancel'},
      {text:'Sign Out',style:'destructive',onPress:async()=>{
        try { setLoggingOut(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); await logout(); }
        catch(err) { Alert.alert('Error',err.message); setLoggingOut(false); }
      }},
    ]);
  };

  const handleChangePassword = async () => {
    if (!email) { Alert.alert('Error','No email found for this account.'); return; }
    Alert.alert('Change Password',`A password reset link will be sent to:\n${email}`,[
      {text:'Cancel',style:'cancel'},
      {text:'Send Email',onPress:async()=>{
        try { await resetPassword(email); Alert.alert('Sent!','Check your inbox for the reset link.'); }
        catch(err) { Alert.alert('Error',err.message); }
      }},
    ]);
  };

  const handleExport = async () => {
    if (expenses.length === 0) { Alert.alert('Nothing to export','Add some expenses first.'); return; }
    const headers = 'Title,Amount,Members,Per Person,Location,Date\n';
    const rows = expenses.map(e=>`"${e.title}",${e.amount},${e.members},${Math.round(e.amount/e.members)},"${e.location}","${e.date}"`).join('\n');
    const csv = headers + rows;
    try {
      await Share.share({ message: csv, title: 'SplitLens Expenses' });
    } catch(err) { Alert.alert('Error','Could not share: '+err.message); }
  };

  const handleCurrencyToggle = () => {
    const opts = ['INR ₹','USD $','EUR €','GBP £'];
    const next = opts[(opts.indexOf(settings.currency)+1) % opts.length];
    saveSettings({...settings, currency:next});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account','This will permanently delete all your data. This action cannot be undone.',[
      {text:'Cancel',style:'cancel'},
      {text:'I understand, delete',style:'destructive',onPress:()=>{
        Alert.alert('Final confirmation','Type your email to confirm deletion. This is permanent.',[
          {text:'Cancel',style:'cancel'},
          {text:'Delete Account',style:'destructive',onPress:async()=>{
            try { await logout(); } catch(err) { Alert.alert('Error',err.message); }
          }},
        ]);
      }},
    ]);
  };

  return (
    <MeshBackground>
      <ScrollView contentContainerStyle={[s.scroll,{paddingTop:insets.top+20,paddingBottom:130}]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{opacity:headerFade}}>

          {/* Profile Card */}
          <View style={s.profileCard}>
            <View style={s.profileCardBase}/>
            <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFillObject,{borderRadius:24}]}/>
            <LinearGradient colors={['rgba(123,97,255,0.20)','rgba(0,212,255,0.08)']} style={[StyleSheet.absoluteFillObject,{borderRadius:24}]}/>
            <LinearGradient colors={['transparent','rgba(123,97,255,0.6)','rgba(0,212,255,0.4)','transparent']} style={s.profileTopBorder} start={{x:0,y:0}} end={{x:1,y:0}}/>
            <View style={s.profileBorder}/>
            <View style={s.profileInner}>
              <View style={s.profileRow}>
                <LinearGradient colors={['#7B61FF','#00D4FF']} style={s.avatar}>
                  <Text style={s.avatarText}>{avatar}</Text>
                </LinearGradient>
                <View style={{flex:1}}>
                  <Text style={s.profileName}>{name}</Text>
                  <Text style={s.profileEmail}>{email}</Text>
                  {upi ? <Text style={s.profileUpi}>⚡ {upi}</Text> : <Text style={s.profileUpi}>No UPI set · tap Edit to add</Text>}
                </View>
                <Pressable onPress={()=>setShowEdit(true)} style={s.editBtn}>
                  <Text style={s.editBtnText}>Edit</Text>
                </Pressable>
              </View>
              <View style={s.statsRow}>
                {[
                  {val:'₹'+(totalSpent/1000).toFixed(1)+'k', lbl:'Total Split'},
                  {val:groups.length,                         lbl:'Groups'},
                  {val:expenses.length,                       lbl:'Expenses'},
                ].map((stat,i)=>(
                  <View key={i} style={[s.statItem,i>0&&s.statBorder]}>
                    <Text style={s.statVal}>{stat.val}</Text>
                    <Text style={s.statLbl}>{stat.lbl}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Preferences */}
          <Text style={s.sectionLabel}>Preferences</Text>
          <View style={s.section}>
            <Row icon="💱" label="Currency" value={settings.currency} onPress={handleCurrencyToggle}/>
            <View style={s.divider}/>
            <Row icon="÷"  label="Split Method" value={settings.splitMethod ?? 'Equal'} onPress={()=>Alert.alert('Split Method','Choose how to split bills',[{text:'Equal',onPress:()=>saveSettings({...settings,splitMethod:'Equal'})},{text:'Percentage',onPress:()=>saveSettings({...settings,splitMethod:'Percentage'})},{text:'Custom',onPress:()=>saveSettings({...settings,splitMethod:'Custom'})},{text:'Cancel',style:'cancel'}])}/>
            <View style={s.divider}/>
            <Row icon="🔔" label="Notifications" isToggle toggled={settings.notifications??true} onToggle={(v)=>{ saveSettings({...settings,notifications:v}); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}/>
          </View>

          {/* Account */}
          <Text style={s.sectionLabel}>Account</Text>
          <View style={s.section}>
            <Row icon="🔒" label="Change Password" value="" onPress={handleChangePassword}/>
            <View style={s.divider}/>
            <Row icon="📤" label="Export Expenses CSV" value="" onPress={handleExport}/>
            <View style={s.divider}/>
            <Row icon="🗑️" label="Delete Account" danger onPress={handleDeleteAccount}/>
          </View>

          {/* About */}
          <Text style={s.sectionLabel}>About</Text>
          <View style={s.section}>
            <Row icon="ℹ️" label="Version" value="1.0.0"/>
            <View style={s.divider}/>
            <Row icon="⭐" label="Rate SplitLens" value="" onPress={()=>Alert.alert('Thank you! ⭐','We appreciate your support. Rating feature coming soon!')}/>
            <View style={s.divider}/>
            <Row icon="📋" label="Privacy Policy" value="" onPress={()=>Alert.alert('Privacy Policy','Your data is encrypted and stored securely in Firebase. We never share your personal data with third parties. Expenses are stored locally on your device via AsyncStorage.')}/>
          </View>

          {/* Sign Out */}
          <Pressable onPress={handleLogout} disabled={loggingOut} style={s.logoutWrap}>
            <View style={s.logoutBase}/>
            <BlurView intensity={20} tint="dark" style={[StyleSheet.absoluteFillObject,{borderRadius:16}]}/>
            <LinearGradient colors={['rgba(255,77,109,0.20)','rgba(255,77,109,0.08)']} style={[StyleSheet.absoluteFillObject,{borderRadius:16}]}/>
            <View style={s.logoutBorder}/>
            {loggingOut
              ? <ActivityIndicator color="#FF4D6D" size="small"/>
              : <><Text style={{fontSize:18}}>🚪</Text><Text style={s.logoutText}>Sign Out</Text></>
            }
          </Pressable>

          <Text style={s.footer}>SplitLens v1.0.0  ·  Made with 💜  ·  {email}</Text>
        </Animated.View>
      </ScrollView>
      <EditProfileModal visible={showEdit} onClose={()=>setShowEdit(false)} profile={profile}/>
    </MeshBackground>
  );
}

const s = StyleSheet.create({
  scroll:{ paddingHorizontal:18 },
  profileCard:{ borderRadius:24, overflow:'hidden', marginBottom:24 },
  profileCardBase:{ ...StyleSheet.absoluteFillObject, borderRadius:24, backgroundColor:'rgba(14,8,44,0.92)' },
  profileTopBorder:{ position:'absolute', top:0, left:0, right:0, height:1 },
  profileBorder:{ ...StyleSheet.absoluteFillObject, borderRadius:24, borderWidth:1, borderColor:'rgba(255,255,255,0.16)' },
  profileInner:{ padding:20 },
  profileRow:{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:18 },
  avatar:{ width:58, height:58, borderRadius:29, alignItems:'center', justifyContent:'center', shadowColor:'#7B61FF', shadowOffset:{width:0,height:4}, shadowOpacity:0.5, shadowRadius:12, elevation:8 },
  avatarText:{ color:'#fff', fontSize:22, fontWeight:'800' },
  profileName:{ color:'#FFFFFF', fontSize:18, fontWeight:'800', marginBottom:2 },
  profileEmail:{ color:'rgba(255,255,255,0.50)', fontSize:12 },
  profileUpi:{ color:'rgba(255,255,255,0.40)', fontSize:12, marginTop:2 },
  editBtn:{ paddingHorizontal:14, paddingVertical:7, borderRadius:50, borderWidth:1, borderColor:'rgba(123,97,255,0.5)', backgroundColor:'rgba(123,97,255,0.12)' },
  editBtnText:{ color:'#A78BFA', fontSize:13, fontWeight:'700' },
  statsRow:{ flexDirection:'row', borderTopWidth:1, borderTopColor:'rgba(255,255,255,0.10)', paddingTop:14 },
  statItem:{ flex:1, alignItems:'center', gap:3 },
  statBorder:{ borderLeftWidth:1, borderLeftColor:'rgba(255,255,255,0.10)' },
  statVal:{ color:'#FFFFFF', fontSize:17, fontWeight:'800' },
  statLbl:{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:'600' },
  sectionLabel:{ color:'rgba(255,255,255,0.40)', fontSize:11, fontWeight:'700', letterSpacing:1.2, textTransform:'uppercase', marginBottom:8, marginLeft:4 },
  section:{ borderRadius:18, overflow:'hidden', marginBottom:22 },
  row:{ flexDirection:'row', alignItems:'center', padding:15, gap:13, backgroundColor:'rgba(14,8,44,0.90)' },
  rowIcon:{ width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
  rowLabel:{ flex:1, color:'#FFFFFF', fontSize:15, fontWeight:'500' },
  rowValue:{ color:'rgba(255,255,255,0.45)', fontSize:14 },
  divider:{ height:1, backgroundColor:'rgba(255,255,255,0.07)', marginLeft:64 },
  logoutWrap:{ borderRadius:16, overflow:'hidden', height:56, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, marginBottom:24 },
  logoutBase:{ ...StyleSheet.absoluteFillObject, borderRadius:16, backgroundColor:'rgba(14,8,44,0.90)' },
  logoutBorder:{ ...StyleSheet.absoluteFillObject, borderRadius:16, borderWidth:1, borderColor:'rgba(255,77,109,0.40)' },
  logoutText:{ color:'#FF4D6D', fontSize:16, fontWeight:'800', letterSpacing:0.3 },
  footer:{ textAlign:'center', color:'rgba(255,255,255,0.22)', fontSize:11, marginBottom:8 },
});
const e = StyleSheet.create({
  overlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.5)' },
  sheet:{ borderTopLeftRadius:28, borderTopRightRadius:28, overflow:'hidden', padding:24, paddingBottom:40 },
  base:{ ...StyleSheet.absoluteFillObject, backgroundColor:'#0E0730', borderTopLeftRadius:28, borderTopRightRadius:28 },
  topBorder:{ position:'absolute', top:0, left:0, right:0, height:1 },
  handle:{ width:40, height:4, borderRadius:2, backgroundColor:'rgba(255,255,255,0.22)', alignSelf:'center', marginBottom:20 },
  title:{ color:'#FFFFFF', fontSize:22, fontWeight:'800', marginBottom:20 },
  label:{ color:'rgba(255,255,255,0.55)', fontSize:12, fontWeight:'700', letterSpacing:0.8, textTransform:'uppercase', marginBottom:8 },
  inputWrap:{ borderRadius:14, overflow:'hidden', borderWidth:1, borderColor:'rgba(255,255,255,0.18)' },
  inputBase:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(14,8,44,0.92)', borderRadius:14 },
  input:{ color:'#FFFFFF', fontSize:15, fontWeight:'500', padding:14 },
  btnRow:{ flexDirection:'row', gap:12, marginTop:24 },
  cancelBtn:{ height:54, borderRadius:14, borderWidth:1.5, borderColor:'rgba(255,255,255,0.20)', paddingHorizontal:20, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(255,255,255,0.06)' },
  cancelText:{ color:'rgba(255,255,255,0.65)', fontSize:15, fontWeight:'700' },
  saveBtn:{ height:54, borderRadius:14, alignItems:'center', justifyContent:'center' },
  saveText:{ color:'#fff', fontSize:15, fontWeight:'800' },
});