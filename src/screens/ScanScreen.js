import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, ScrollView, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MeshBackground from '../components/MeshBackground';
import { useData } from '../context/DataContext';

const { width: W } = Dimensions.get('window');

function ScanFrame({ scanning }) {
  const cornerAnim = useRef(new Animated.Value(0)).current;
  const lineY      = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  useEffect(()=>{
    Animated.timing(cornerAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
    if (scanning) {
      Animated.loop(Animated.sequence([
        Animated.timing(lineY,{toValue:1,duration:1800,useNativeDriver:true}),
        Animated.timing(lineY,{toValue:0,duration:0,useNativeDriver:true}),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim,{toValue:1.05,duration:700,useNativeDriver:true}),
        Animated.timing(pulseAnim,{toValue:1,duration:700,useNativeDriver:true}),
      ])).start();
    } else {
      lineY.stopAnimation();
      pulseAnim.stopAnimation();
    }
  },[scanning]);

  const lineTranslateY = lineY.interpolate({inputRange:[0,1],outputRange:[0,220]});

  return (
    <Animated.View style={[s.frame,{transform:[{scale:pulseAnim}]}]}>
      {[['TL',0,0],['TR',1,0],['BL',0,1],['BR',1,1]].map(([id,right,bottom])=>(
        <Animated.View key={id} style={[s.corner, right?{right:0,borderRightWidth:3,borderLeftWidth:0}:{left:0,borderLeftWidth:3}, bottom?{bottom:0,borderBottomWidth:3,borderTopWidth:0}:{top:0,borderTopWidth:3}, {opacity:cornerAnim}]}/>
      ))}
      {scanning && (
        <Animated.View style={[s.scanLine,{transform:[{translateY:lineTranslateY}]}]}>
          <LinearGradient colors={['transparent','#7B61FF','transparent']} style={{flex:1,height:2}} start={{x:0,y:0}} end={{x:1,y:0}}/>
        </Animated.View>
      )}
    </Animated.View>
  );
}

function ReceiptResult({ data, onSplit, onReset }) {
  const slideUp = useRef(new Animated.Value(80)).current;
  const fade    = useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.parallel([
      Animated.spring(slideUp,{toValue:0,damping:14,stiffness:160,useNativeDriver:true}),
      Animated.timing(fade,{toValue:1,duration:400,useNativeDriver:true}),
    ]).start();
  },[]);

  return (
    <Animated.View style={{transform:[{translateY:slideUp}],opacity:fade}}>
      <View style={r.card}>
        <View style={r.cardBase}/>
        <BlurView intensity={35} tint="dark" style={[StyleSheet.absoluteFillObject,{borderRadius:24}]}/>
        <LinearGradient colors={['rgba(255,255,255,0.10)','rgba(255,255,255,0.03)']} style={[StyleSheet.absoluteFillObject,{borderRadius:24}]}/>
        <LinearGradient colors={['transparent','rgba(123,97,255,0.7)','rgba(0,212,255,0.5)','transparent']} style={r.topBorder} start={{x:0,y:0}} end={{x:1,y:0}}/>
        <View style={r.border}/>

        <View style={r.inner}>
          <View style={r.header}>
            <LinearGradient colors={['#7B61FF','#00D4FF']} style={r.iconBox}><Text style={{fontSize:22}}>🧾</Text></LinearGradient>
            <View style={{flex:1}}>
              <Text style={r.restaurant}>{data.restaurant}</Text>
              <Text style={r.date}>{data.date}</Text>
            </View>
            <View style={r.successBadge}><Text style={r.successText}>✓ Scanned</Text></View>
          </View>

          <View style={r.divider}/>
          {data.items.map((item,i)=>(
            <View key={i} style={r.row}>
              <Text style={r.itemName}>{item.name}</Text>
              <Text style={r.itemPrice}>₹{item.price}</Text>
            </View>
          ))}
          <View style={r.divider}/>
          <View style={r.row}><Text style={r.metaText}>Subtotal</Text><Text style={r.metaText}>₹{data.subtotal}</Text></View>
          <View style={r.row}><Text style={r.metaText}>GST (18%)</Text><Text style={r.metaText}>₹{data.gst}</Text></View>
          <View style={[r.row,{marginTop:8}]}>
            <Text style={r.totalText}>Total</Text>
            <Text style={r.totalText}>₹{data.total}</Text>
          </View>

          <Pressable onPress={onSplit} style={{marginTop:20}}>
            <LinearGradient colors={['#7B61FF','#00D4FF']} style={r.splitBtn} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={r.splitBtnText}>Split This Bill →</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={onReset} style={{marginTop:10,alignItems:'center'}}>
            <Text style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontWeight:'600'}}>Scan another receipt</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned,  setScanned]  = useState(false);
  const [result,   setResult]   = useState(null);
  const insets = useSafeAreaInsets();
  const { addExpense } = useData();

  const MOCK_RECEIPT = {
    restaurant: 'Spice Route — Sector 17',
    date:       new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),
    items:      [
      {name:'Dal Makhani',     price:320},
      {name:'Butter Naan × 4',price:160},
      {name:'Paneer Tikka',   price:480},
      {name:'Mango Lassi × 2',price:180},
      {name:'Veg Biryani',    price:360},
    ],
    subtotal:1500, gst:270, total:1770,
  };

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanning(true);
    setTimeout(()=>{
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanning(false);
      setScanned(true);
      setResult(MOCK_RECEIPT);
    },2800);
  };

  const handlePickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality:0.9 });
    if (!res.canceled) {
      setScanning(true);
      setTimeout(()=>{ setScanning(false); setScanned(true); setResult(MOCK_RECEIPT); },2000);
    }
  };

  const handleSplitBill = () => {
    if (!result) return;
    addExpense({
      id:       Date.now().toString(),
      title:    result.restaurant,
      amount:   result.total,
      members:  2,
      location: result.restaurant,
      emoji:    '🧾',
      color:    ['#7B61FF','#00D4FF'],
      date:     'Just now',
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Added!', `₹${result.total} expense added to your splits.`,[
      {text:'View on Home', onPress:()=>navigation.navigate('Home')},
      {text:'OK'},
    ]);
    setScanned(false);
    setResult(null);
  };

  const handleReset = () => { setScanned(false); setResult(null); setScanning(false); };

  if (!permission) return <MeshBackground><View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#fff'}}>Checking camera...</Text></View></MeshBackground>;

  if (!permission.granted) {
    return (
      <MeshBackground>
        <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:32,gap:16}}>
          <Text style={{fontSize:48}}>📷</Text>
          <Text style={{color:'#FFFFFF',fontSize:22,fontWeight:'800',textAlign:'center'}}>Camera Access Needed</Text>
          <Text style={{color:'rgba(255,255,255,0.55)',fontSize:15,textAlign:'center'}}>SplitLens needs camera access to scan receipts and auto-fill expenses</Text>
          <Pressable onPress={requestPermission}>
            <LinearGradient colors={['#7B61FF','#00D4FF']} style={{paddingHorizontal:32,paddingVertical:14,borderRadius:50}} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={{color:'#fff',fontSize:16,fontWeight:'800'}}>Grant Permission</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </MeshBackground>
    );
  }

  return (
    <View style={{flex:1,backgroundColor:'#0A0A1A'}}>
      {!scanned ? (
        <View style={{flex:1}}>
          <CameraView style={StyleSheet.absoluteFillObject} facing="back"/>
          <View style={s.overlay}>
            <BlurView intensity={40} tint="dark" style={[s.camTopBar,{paddingTop:insets.top+8}]}>
              <Text style={s.camTitle}>Scan Receipt</Text>
              <Text style={s.camSub}>Point camera at any bill or invoice</Text>
            </BlurView>
            <View style={s.frameContainer}>
              <ScanFrame scanning={scanning}/>
              {scanning && (
                <BlurView intensity={20} tint="dark" style={s.processingBadge}>
                  <Text style={{color:'#fff',fontSize:14,fontWeight:'600'}}>🔍 Reading receipt...</Text>
                </BlurView>
              )}
            </View>
            <BlurView intensity={40} tint="dark" style={[s.camBottom,{paddingBottom:insets.bottom+90}]}>
              <Pressable onPress={handlePickImage} style={s.camSecondary}>
                <Text style={s.camSecondaryText}>📁 Gallery</Text>
              </Pressable>
              <Pressable onPress={handleScan} disabled={scanning}>
                <LinearGradient colors={scanning?['#444','#333']:['#7B61FF','#00D4FF']} style={s.scanBtn} start={{x:0,y:0}} end={{x:1,y:1}}>
                  <Text style={{fontSize:28,color:'#fff'}}>{scanning?'⏳':'⊙'}</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={handleReset} style={s.camSecondary}>
                <Text style={s.camSecondaryText}>✕ Cancel</Text>
              </Pressable>
            </BlurView>
          </View>
        </View>
      ) : (
        <MeshBackground>
          <ScrollView contentContainerStyle={{paddingTop:insets.top+20,paddingHorizontal:18,paddingBottom:120}} showsVerticalScrollIndicator={false}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <Text style={{color:'#FFFFFF',fontSize:24,fontWeight:'800'}}>Receipt Scanned! 🎉</Text>
            </View>
            {result && <ReceiptResult data={result} onSplit={handleSplitBill} onReset={handleReset}/>}
          </ScrollView>
        </MeshBackground>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  overlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.45)' },
  camTopBar:{ paddingHorizontal:24, paddingBottom:16, alignItems:'center', overflow:'hidden' },
  camTitle:{ color:'#FFFFFF', fontSize:20, fontWeight:'700' },
  camSub:{ color:'rgba(255,255,255,0.55)', fontSize:13, marginTop:2 },
  frameContainer:{ flex:1, alignItems:'center', justifyContent:'center' },
  frame:{ width:260, height:340, position:'relative', alignItems:'center', justifyContent:'center' },
  corner:{ position:'absolute', width:28, height:28, borderColor:'#7B61FF', borderRadius:2 },
  scanLine:{ position:'absolute', left:0, right:0, height:2, overflow:'hidden' },
  processingBadge:{ marginTop:24, paddingHorizontal:20, paddingVertical:8, borderRadius:50, overflow:'hidden', borderWidth:1, borderColor:'rgba(255,255,255,0.2)' },
  camBottom:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:40, paddingTop:24, overflow:'hidden' },
  scanBtn:{ width:72, height:72, borderRadius:36, alignItems:'center', justifyContent:'center', shadowColor:'#7B61FF', shadowOffset:{width:0,height:0}, shadowOpacity:0.6, shadowRadius:20, elevation:12 },
  camSecondary:{ padding:12, borderRadius:50, backgroundColor:'rgba(255,255,255,0.10)', borderWidth:1, borderColor:'rgba(255,255,255,0.2)' },
  camSecondaryText:{ color:'rgba(255,255,255,0.80)', fontSize:12, fontWeight:'600' },
});
const r = StyleSheet.create({
  card:{ borderRadius:24, overflow:'hidden' },
  cardBase:{ ...StyleSheet.absoluteFillObject, borderRadius:24, backgroundColor:'rgba(14,8,44,0.94)' },
  topBorder:{ position:'absolute', top:0, left:0, right:0, height:1 },
  border:{ ...StyleSheet.absoluteFillObject, borderRadius:24, borderWidth:1, borderColor:'rgba(255,255,255,0.14)' },
  inner:{ padding:20 },
  header:{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:16 },
  iconBox:{ width:50, height:50, borderRadius:14, alignItems:'center', justifyContent:'center' },
  restaurant:{ color:'#FFFFFF', fontSize:15, fontWeight:'700' },
  date:{ color:'rgba(255,255,255,0.45)', fontSize:12, marginTop:2 },
  successBadge:{ backgroundColor:'rgba(0,230,160,0.15)', borderRadius:50, paddingHorizontal:10, paddingVertical:4, borderWidth:1, borderColor:'rgba(0,230,160,0.35)' },
  successText:{ color:'#00E6A0', fontSize:11, fontWeight:'700' },
  divider:{ height:1, backgroundColor:'rgba(255,255,255,0.08)', marginVertical:12 },
  row:{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  itemName:{ color:'rgba(255,255,255,0.80)', fontSize:14 },
  itemPrice:{ color:'#FFFFFF', fontSize:14, fontWeight:'600' },
  metaText:{ color:'rgba(255,255,255,0.50)', fontSize:13 },
  totalText:{ color:'#FFFFFF', fontSize:16, fontWeight:'800' },
  splitBtn:{ height:54, borderRadius:16, alignItems:'center', justifyContent:'center', shadowColor:'#7B61FF', shadowOffset:{width:0,height:6}, shadowOpacity:0.5, shadowRadius:14, elevation:10 },
  splitBtnText:{ color:'#fff', fontSize:16, fontWeight:'800' },
});