import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable,
  TextInput, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { signIn, resetPassword } from '../../firebase/auth';

const { width: W, height: H } = Dimensions.get('window');

function IconMail({ color }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M22 6L12 13L2 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function IconLock({ color }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M19 11H5C3.9 11 3 11.9 3 13V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V13C21 11.9 20.1 11 19 11Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M7 11V7C7 4.8 8.8 3 11 3H13C15.2 3 17 4.8 17 7V11" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="16" r="1.5" fill={color}/>
    </Svg>
  );
}
function IconEye({ color, closed }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      {closed
        ? <Path d="M17.94 17.94A10.07 10.07 0 0112 20C7 20 2.73 16.39 1 12A18.45 18.45 0 015.06 6.06M9.9 4.24A9.12 9.12 0 0112 4C17 4 21.27 7.61 23 12a18.5 18.5 0 01-2.16 3.72M1 1L23 23M9.88 9.88A3 3 0 0014.12 14.12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        : <><Path d="M1 12C2.73 7.61 7 4 12 4C17 4 21.27 7.61 23 12C21.27 16.39 17 20 12 20C7 20 2.73 16.39 1 12Z" stroke={color} strokeWidth="1.8"/><Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8"/></>
      }
    </Svg>
  );
}

function AuthBackground() {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a1, { toValue: 1, duration: 5000, useNativeDriver: true }),
      Animated.timing(a1, { toValue: 0, duration: 5000, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(a2, { toValue: 1, duration: 7000, useNativeDriver: true }),
      Animated.timing(a2, { toValue: 0, duration: 7000, useNativeDriver: true }),
    ])).start();
  }, []);
  const t1 = a1.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const t2 = a2.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LinearGradient colors={['#080616', '#0E0730', '#060420']} style={StyleSheet.absoluteFillObject}/>
      <Animated.View style={[s.orb, { width:320, height:320, borderRadius:160, backgroundColor:'#6B3FFF', top:-100, left:-80, opacity:0.35, transform:[{translateY:t1}] }]}/>
      <Animated.View style={[s.orb, { width:260, height:260, borderRadius:130, backgroundColor:'#00D4FF', top:100, right:-60, opacity:0.22, transform:[{translateY:t2}] }]}/>
      <Animated.View style={[s.orb, { width:200, height:200, borderRadius:100, backgroundColor:'#FF3A8C', bottom:120, left:20, opacity:0.18, transform:[{translateY:t1}] }]}/>
      <Animated.View style={[s.orb, { width:180, height:180, borderRadius:90, backgroundColor:'#00E6A0', bottom:200, right:30, opacity:0.15, transform:[{translateY:t2}] }]}/>
    </View>
  );
}

function GlassInput({ icon: Icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, rightIcon, onRightPress }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(borderAnim, { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [focused]);
  const borderColor = borderAnim.interpolate({ inputRange:[0,1], outputRange:['rgba(255,255,255,0.18)','rgba(123,97,255,0.80)'] });
  return (
    <Animated.View style={[s.inputWrap, { borderColor }]}>
      <View style={s.inputBase}/>
      <BlurView intensity={25} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius:16 }]}/>
      <LinearGradient colors={['rgba(255,255,255,0.10)','rgba(255,255,255,0.03)']} style={[StyleSheet.absoluteFillObject, { borderRadius:16 }]}/>
      <View style={s.inputRow}>
        <View style={s.inputIcon}><Icon color={focused ? '#A78BFA' : 'rgba(255,255,255,0.38)'}/></View>
        <TextInput
          style={s.inputText}
          placeholder={placeholder}
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
        {rightIcon && (
          <Pressable onPress={onRightPress} style={s.inputRight}>{rightIcon}</Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const logoY  = useRef(new Animated.Value(-40)).current;
  const logoOp = useRef(new Animated.Value(0)).current;
  const cardY  = useRef(new Animated.Value(60)).current;
  const cardOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoY,  { toValue:0, damping:14, stiffness:120, useNativeDriver:true }),
      Animated.timing(logoOp, { toValue:1, duration:600, useNativeDriver:true }),
      Animated.spring(cardY,  { toValue:0, damping:14, stiffness:100, delay:200, useNativeDriver:true }),
      Animated.timing(cardOp, { toValue:1, duration:600, delay:200, useNativeDriver:true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.'); return;
    }
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signIn({ email: email.trim(), password });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msgs = {
        'auth/user-not-found':    'No account found with this email.',
        'auth/wrong-password':    'Incorrect password. Try again.',
        'auth/invalid-email':     'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
      };
      Alert.alert('Login Failed', msgs[err.code] ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) { Alert.alert('Enter email', 'Type your email above first.'); return; }
    try {
      await resetPassword(email.trim());
      Alert.alert('Email sent!', 'Check your inbox to reset your password.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios' ? 'padding' : 'height'}>
      <AuthBackground/>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[s.logoSection, { opacity:logoOp, transform:[{translateY:logoY}] }]}>
          <LinearGradient colors={['#7B61FF','#00D4FF']} style={s.logoBox} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Text style={s.logoEmoji}>💸</Text>
          </LinearGradient>
          <Text style={s.appName}>SplitLens</Text>
          <Text style={s.appTagline}>Smart bill splitting, simplified</Text>
        </Animated.View>

        <Animated.View style={[s.card, { opacity:cardOp, transform:[{translateY:cardY}] }]}>
          <View style={s.cardBase}/>
          <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, {borderRadius:28}]}/>
          <LinearGradient colors={['rgba(255,255,255,0.10)','rgba(255,255,255,0.03)']} style={[StyleSheet.absoluteFillObject, {borderRadius:28}]}/>
          <LinearGradient colors={['transparent','rgba(123,97,255,0.7)','rgba(0,212,255,0.5)','transparent']} style={s.cardTopBorder} start={{x:0,y:0}} end={{x:1,y:0}}/>
          <View style={s.cardBorder}/>

          <View style={s.cardInner}>
            <Text style={s.cardTitle}>Welcome back 👋</Text>
            <Text style={s.cardSub}>Sign in to your account</Text>

            <View style={s.fields}>
              <GlassInput icon={IconMail} placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address"/>
              <GlassInput icon={IconLock} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPwd}
                rightIcon={<IconEye color="rgba(255,255,255,0.4)" closed={showPwd}/>} onRightPress={() => setShowPwd(p => !p)}/>
            </View>

            <Pressable onPress={handleForgot} style={s.forgotWrap}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </Pressable>

            <Pressable onPress={handleLogin} disabled={loading} style={{marginTop:8}}>
              <LinearGradient colors={['#7B61FF','#4D9FFF']} style={s.loginBtn} start={{x:0,y:0}} end={{x:1,y:0}}>
                {loading
                  ? <ActivityIndicator color="#fff" size="small"/>
                  : <Text style={s.loginBtnText}>Sign In</Text>
                }
              </LinearGradient>
            </Pressable>

            <View style={s.dividerRow}>
              <View style={s.dividerLine}/>
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine}/>
            </View>

            <Pressable onPress={() => navigation.navigate('Signup')} style={s.signupRow}>
              <Text style={s.signupText}>Don't have an account? </Text>
              <Text style={s.signupLink}>Create one</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Text style={s.footer}>By signing in you agree to our Terms & Privacy Policy</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll:       { paddingHorizontal:24, alignItems:'center' },
  orb:          { position:'absolute' },
  logoSection:  { alignItems:'center', marginBottom:36 },
  logoBox:      { width:80, height:80, borderRadius:24, alignItems:'center', justifyContent:'center', marginBottom:16, shadowColor:'#7B61FF', shadowOffset:{width:0,height:8}, shadowOpacity:0.6, shadowRadius:20, elevation:12 },
  logoEmoji:    { fontSize:38 },
  appName:      { color:'#FFFFFF', fontSize:32, fontWeight:'800', letterSpacing:-0.5 },
  appTagline:   { color:'rgba(255,255,255,0.45)', fontSize:15, marginTop:6 },
  card:         { width:'100%', borderRadius:28, overflow:'hidden' },
  cardBase:     { ...StyleSheet.absoluteFillObject, borderRadius:28, backgroundColor:'rgba(14,8,44,0.94)' },
  cardTopBorder:{ position:'absolute', top:0, left:0, right:0, height:1 },
  cardBorder:   { ...StyleSheet.absoluteFillObject, borderRadius:28, borderWidth:1, borderColor:'rgba(255,255,255,0.14)' },
  cardInner:    { padding:28 },
  cardTitle:    { color:'#FFFFFF', fontSize:26, fontWeight:'800', letterSpacing:-0.3 },
  cardSub:      { color:'rgba(255,255,255,0.45)', fontSize:14, marginTop:6, marginBottom:28 },
  fields:       { gap:14 },
  inputWrap:    { height:56, borderRadius:16, borderWidth:1.5, overflow:'hidden' },
  inputBase:    { ...StyleSheet.absoluteFillObject, borderRadius:16, backgroundColor:'rgba(14,8,44,0.88)' },
  inputRow:     { flex:1, flexDirection:'row', alignItems:'center', paddingHorizontal:16, gap:12 },
  inputIcon:    { width:24, alignItems:'center' },
  inputText:    { flex:1, color:'#FFFFFF', fontSize:15, fontWeight:'500' },
  inputRight:   { padding:4 },
  forgotWrap:   { alignSelf:'flex-end', marginTop:12, marginBottom:4 },
  forgotText:   { color:'#A78BFA', fontSize:13, fontWeight:'600' },
  loginBtn:     { height:56, borderRadius:16, alignItems:'center', justifyContent:'center', shadowColor:'#7B61FF', shadowOffset:{width:0,height:6}, shadowOpacity:0.55, shadowRadius:16, elevation:10 },
  loginBtnText: { color:'#fff', fontSize:17, fontWeight:'800', letterSpacing:0.3 },
  dividerRow:   { flexDirection:'row', alignItems:'center', marginVertical:22, gap:12 },
  dividerLine:  { flex:1, height:1, backgroundColor:'rgba(255,255,255,0.10)' },
  dividerText:  { color:'rgba(255,255,255,0.30)', fontSize:13 },
  signupRow:    { flexDirection:'row', justifyContent:'center' },
  signupText:   { color:'rgba(255,255,255,0.45)', fontSize:14 },
  signupLink:   { color:'#7B61FF', fontSize:14, fontWeight:'800' },
  footer:       { color:'rgba(255,255,255,0.22)', fontSize:11, textAlign:'center', marginTop:28 },
});
