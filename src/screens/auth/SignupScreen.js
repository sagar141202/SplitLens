import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable,
  TextInput, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { signUp } from '../../firebase/auth';

function IconUser({ color }) {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
    <Path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>;
}
function IconMail({ color }) {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M22 6L12 13L2 6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>;
}
function IconLock({ color }) {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M19 11H5C3.9 11 3 11.9 3 13V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V13C21 11.9 20.1 11 19 11Z" stroke={color} strokeWidth="1.8"/>
    <Path d="M7 11V7C7 4.8 8.8 3 11 3H13C15.2 3 17 4.8 17 7V11" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <Circle cx="12" cy="16" r="1.5" fill={color}/>
  </Svg>;
}
function IconUPI({ color }) {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    <Path d="M9 22V12H15V22" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>;
}
function IconEye({ color, closed }) {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    {closed
      ? <Path d="M17.94 17.94A10.07 10.07 0 0112 20C7 20 2.73 16.39 1 12A18.45 18.45 0 015.06 6.06M9.9 4.24A9.12 9.12 0 0112 4C17 4 21.27 7.61 23 12a18.5 18.5 0 01-2.16 3.72M1 1L23 23M9.88 9.88A3 3 0 0014.12 14.12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      : <><Path d="M1 12C2.73 7.61 7 4 12 4C17 4 21.27 7.61 23 12C21.27 16.39 17 20 12 20C7 20 2.73 16.39 1 12Z" stroke={color} strokeWidth="1.8"/><Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8"/></>
    }
  </Svg>;
}

function AuthBackground() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue:1, duration:6000, useNativeDriver:true }),
      Animated.timing(a, { toValue:0, duration:6000, useNativeDriver:true }),
    ])).start();
  }, []);
  const t = a.interpolate({ inputRange:[0,1], outputRange:[0,35] });
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LinearGradient colors={['#080616','#0C0528','#060320']} style={StyleSheet.absoluteFillObject}/>
      <Animated.View style={[s.orb, { width:300, height:300, borderRadius:150, backgroundColor:'#FF3A8C', top:-80, right:-60, opacity:0.22, transform:[{translateY:t}] }]}/>
      <Animated.View style={[s.orb, { width:280, height:280, borderRadius:140, backgroundColor:'#7B61FF', top:80, left:-80, opacity:0.28, transform:[{translateY:t}] }]}/>
      <Animated.View style={[s.orb, { width:220, height:220, borderRadius:110, backgroundColor:'#00D4FF', bottom:80, right:-40, opacity:0.18, transform:[{translateY:t}] }]}/>
    </View>
  );
}

function GlassInput({ icon:Icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, rightIcon, onRightPress, optional }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(borderAnim, { toValue:focused?1:0, duration:200, useNativeDriver:false }).start();
  }, [focused]);
  const borderColor = borderAnim.interpolate({ inputRange:[0,1], outputRange:['rgba(255,255,255,0.18)','rgba(123,97,255,0.80)'] });
  return (
    <Animated.View style={[s.inputWrap, { borderColor }]}>
      <View style={s.inputBase}/>
      <BlurView intensity={25} tint="dark" style={[StyleSheet.absoluteFillObject, {borderRadius:16}]}/>
      <LinearGradient colors={['rgba(255,255,255,0.10)','rgba(255,255,255,0.03)']} style={[StyleSheet.absoluteFillObject, {borderRadius:16}]}/>
      <View style={s.inputRow}>
        <View style={s.inputIcon}><Icon color={focused ? '#A78BFA' : 'rgba(255,255,255,0.38)'}/></View>
        <TextInput
          style={s.inputText}
          placeholder={optional ? `${placeholder} (optional)` : placeholder}
          placeholderTextColor="rgba(255,255,255,0.28)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCorrect={false}
        />
        {rightIcon && <Pressable onPress={onRightPress} style={s.inputRight}>{rightIcon}</Pressable>}
      </View>
    </Animated.View>
  );
}

function PasswordStrength({ password }) {
  const getStrength = () => {
    if (!password) return { level:0, label:'', color:'transparent' };
    let score = 0;
    if (password.length >= 8)           score++;
    if (/[A-Z]/.test(password))         score++;
    if (/[0-9]/.test(password))         score++;
    if (/[^A-Za-z0-9]/.test(password))  score++;
    const levels = [
      { level:1, label:'Weak',   color:'#FF4D6D' },
      { level:2, label:'Fair',   color:'#FF9F1C' },
      { level:3, label:'Good',   color:'#00D4FF' },
      { level:4, label:'Strong', color:'#00E6A0' },
    ];
    return levels[score - 1] ?? { level:0, label:'', color:'transparent' };
  };
  const str = getStrength();
  if (!password) return null;
  return (
    <View style={s.strengthRow}>
      {[1,2,3,4].map(i => (
        <View key={i} style={[s.strengthBar, { backgroundColor: i <= str.level ? str.color : 'rgba(255,255,255,0.12)' }]}/>
      ))}
      <Text style={[s.strengthLabel, { color: str.color }]}>{str.label}</Text>
    </View>
  );
}

export default function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [upi,      setUpi]      = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [showCon,  setShowCon]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState(1);

  const cardY  = useRef(new Animated.Value(60)).current;
  const cardOp = useRef(new Animated.Value(0)).current;
  const logoY  = useRef(new Animated.Value(-30)).current;
  const logoOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoY,  { toValue:0, damping:14, stiffness:120, useNativeDriver:true }),
      Animated.timing(logoOp, { toValue:1, duration:500, useNativeDriver:true }),
      Animated.spring(cardY,  { toValue:0, damping:14, stiffness:100, delay:150, useNativeDriver:true }),
      Animated.timing(cardOp, { toValue:1, duration:500, delay:150, useNativeDriver:true }),
    ]).start();
  }, []);

  const goStep2 = () => {
    if (!name.trim())  { Alert.alert('Missing', 'Please enter your name.'); return; }
    if (!email.trim()) { Alert.alert('Missing', 'Please enter your email.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { Alert.alert('Invalid', 'Please enter a valid email.'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(2);
  };

  const handleSignup = async () => {
    if (!password)            { Alert.alert('Missing', 'Please enter a password.'); return; }
    if (password.length < 8)  { Alert.alert('Weak password', 'Password must be at least 8 characters.'); return; }
    if (password !== confirm) { Alert.alert('Mismatch', "Passwords don't match."); return; }
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signUp({ name: name.trim(), email: email.trim(), password, upi: upi.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msgs = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/weak-password':        'Password is too weak.',
        'auth/invalid-email':        'Please enter a valid email.',
      };
      Alert.alert('Sign Up Failed', msgs[err.code] ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
      <AuthBackground/>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop:insets.top+16, paddingBottom:insets.bottom+40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[s.logoSection, { opacity:logoOp, transform:[{translateY:logoY}] }]}>
          <LinearGradient colors={['#FF3A8C','#7B61FF']} style={s.logoBox} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Text style={s.logoEmoji}>✨</Text>
          </LinearGradient>
          <Text style={s.appName}>Create Account</Text>
          <Text style={s.appTagline}>Join SplitLens today — it's free</Text>
        </Animated.View>

        <View style={s.stepRow}>
          {[1,2].map(n => (
            <View key={n} style={s.stepItem}>
              <LinearGradient
                colors={step >= n ? ['#7B61FF','#00D4FF'] : ['rgba(255,255,255,0.12)','rgba(255,255,255,0.06)']}
                style={s.stepDot} start={{x:0,y:0}} end={{x:1,y:0}}
              >
                <Text style={[s.stepNum, step >= n && { color:'#fff' }]}>{n}</Text>
              </LinearGradient>
              <Text style={[s.stepLabel, step >= n && { color:'rgba(255,255,255,0.7)' }]}>
                {n===1 ? 'Profile' : 'Security'}
              </Text>
            </View>
          ))}
          <View style={s.stepConnector}/>
        </View>

        <Animated.View style={[s.card, { opacity:cardOp, transform:[{translateY:cardY}] }]}>
          <View style={s.cardBase}/>
          <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, {borderRadius:28}]}/>
          <LinearGradient colors={['rgba(255,255,255,0.10)','rgba(255,255,255,0.03)']} style={[StyleSheet.absoluteFillObject, {borderRadius:28}]}/>
          <LinearGradient colors={['transparent','rgba(255,58,140,0.6)','rgba(123,97,255,0.5)','transparent']} style={s.cardTopBorder} start={{x:0,y:0}} end={{x:1,y:0}}/>
          <View style={s.cardBorder}/>

          <View style={s.cardInner}>
            {step === 1 ? (
              <>
                <Text style={s.cardTitle}>Tell us about you</Text>
                <Text style={s.cardSub}>Step 1 of 2 — Basic info</Text>
                <View style={s.fields}>
                  <GlassInput icon={IconUser} placeholder="Full name"     value={name}  onChangeText={setName}  autoCapitalize="words"/>
                  <GlassInput icon={IconMail} placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address"/>
                  <GlassInput icon={IconUPI}  placeholder="UPI ID (e.g. name@ybl)" value={upi} onChangeText={setUpi} optional/>
                </View>
                <Pressable onPress={goStep2} style={{marginTop:24}}>
                  <LinearGradient colors={['#FF3A8C','#7B61FF']} style={s.btn} start={{x:0,y:0}} end={{x:1,y:0}}>
                    <Text style={s.btnText}>Continue →</Text>
                  </LinearGradient>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={s.cardTitle}>Secure your account</Text>
                <Text style={s.cardSub}>Step 2 of 2 — Set a strong password</Text>
                <View style={s.fields}>
                  <GlassInput icon={IconLock} placeholder="Password" value={password} onChangeText={setPassword}
                    secureTextEntry={!showPwd} rightIcon={<IconEye color="rgba(255,255,255,0.4)" closed={showPwd}/>}
                    onRightPress={() => setShowPwd(p=>!p)}/>
                  <PasswordStrength password={password}/>
                  <GlassInput icon={IconLock} placeholder="Confirm password" value={confirm} onChangeText={setConfirm}
                    secureTextEntry={!showCon} rightIcon={<IconEye color="rgba(255,255,255,0.4)" closed={showCon}/>}
                    onRightPress={() => setShowCon(p=>!p)}/>
                </View>
                <View style={s.btnRow}>
                  <Pressable onPress={() => setStep(1)} style={s.backBtn}>
                    <Text style={s.backBtnText}>← Back</Text>
                  </Pressable>
                  <Pressable onPress={handleSignup} disabled={loading} style={{flex:1}}>
                    <LinearGradient colors={['#7B61FF','#00D4FF']} style={s.btn} start={{x:0,y:0}} end={{x:1,y:0}}>
                      {loading
                        ? <ActivityIndicator color="#fff" size="small"/>
                        : <Text style={s.btnText}>Create Account 🎉</Text>
                      }
                    </LinearGradient>
                  </Pressable>
                </View>
              </>
            )}
            <Pressable onPress={() => navigation.navigate('Login')} style={s.loginRow}>
              <Text style={s.loginText}>Already have an account? </Text>
              <Text style={s.loginLink}>Sign in</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll:        { paddingHorizontal:24, alignItems:'center' },
  orb:           { position:'absolute' },
  logoSection:   { alignItems:'center', marginBottom:24 },
  logoBox:       { width:72, height:72, borderRadius:22, alignItems:'center', justifyContent:'center', marginBottom:14, shadowColor:'#FF3A8C', shadowOffset:{width:0,height:8}, shadowOpacity:0.5, shadowRadius:18, elevation:10 },
  logoEmoji:     { fontSize:34 },
  appName:       { color:'#FFFFFF', fontSize:28, fontWeight:'800', letterSpacing:-0.4 },
  appTagline:    { color:'rgba(255,255,255,0.45)', fontSize:14, marginTop:5 },
  stepRow:       { flexDirection:'row', alignItems:'center', marginBottom:24, position:'relative', width:'60%' },
  stepItem:      { alignItems:'center', gap:5, flex:1 },
  stepDot:       { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center' },
  stepNum:       { color:'rgba(255,255,255,0.35)', fontSize:13, fontWeight:'800' },
  stepLabel:     { color:'rgba(255,255,255,0.30)', fontSize:10, fontWeight:'600', letterSpacing:0.3 },
  stepConnector: { position:'absolute', top:16, left:'25%', right:'25%', height:1, backgroundColor:'rgba(255,255,255,0.12)', zIndex:-1 },
  card:          { width:'100%', borderRadius:28, overflow:'hidden' },
  cardBase:      { ...StyleSheet.absoluteFillObject, borderRadius:28, backgroundColor:'rgba(14,8,44,0.94)' },
  cardTopBorder: { position:'absolute', top:0, left:0, right:0, height:1 },
  cardBorder:    { ...StyleSheet.absoluteFillObject, borderRadius:28, borderWidth:1, borderColor:'rgba(255,255,255,0.14)' },
  cardInner:     { padding:28 },
  cardTitle:     { color:'#FFFFFF', fontSize:24, fontWeight:'800', letterSpacing:-0.3 },
  cardSub:       { color:'rgba(255,255,255,0.45)', fontSize:13, marginTop:5, marginBottom:24 },
  fields:        { gap:14 },
  inputWrap:     { height:56, borderRadius:16, borderWidth:1.5, overflow:'hidden' },
  inputBase:     { ...StyleSheet.absoluteFillObject, borderRadius:16, backgroundColor:'rgba(14,8,44,0.88)' },
  inputRow:      { flex:1, flexDirection:'row', alignItems:'center', paddingHorizontal:16, gap:12 },
  inputIcon:     { width:24, alignItems:'center' },
  inputText:     { flex:1, color:'#FFFFFF', fontSize:15, fontWeight:'500' },
  inputRight:    { padding:4 },
  strengthRow:   { flexDirection:'row', alignItems:'center', gap:5, marginTop:-6 },
  strengthBar:   { flex:1, height:3, borderRadius:2 },
  strengthLabel: { fontSize:11, fontWeight:'700', minWidth:40 },
  btn:           { height:56, borderRadius:16, alignItems:'center', justifyContent:'center', shadowColor:'#7B61FF', shadowOffset:{width:0,height:6}, shadowOpacity:0.5, shadowRadius:14, elevation:10 },
  btnText:       { color:'#fff', fontSize:16, fontWeight:'800', letterSpacing:0.3 },
  btnRow:        { flexDirection:'row', gap:12, marginTop:24 },
  backBtn:       { height:56, borderRadius:16, borderWidth:1.5, borderColor:'rgba(255,255,255,0.20)', paddingHorizontal:20, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(255,255,255,0.06)' },
  backBtnText:   { color:'rgba(255,255,255,0.65)', fontSize:15, fontWeight:'700' },
  loginRow:      { flexDirection:'row', justifyContent:'center', marginTop:24 },
  loginText:     { color:'rgba(255,255,255,0.45)', fontSize:14 },
  loginLink:     { color:'#7B61FF', fontSize:14, fontWeight:'800' },
});
