import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Dimensions, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../context/DataContext';

const { width: W } = Dimensions.get('window');
const CATEGORIES = ['All','Food','Travel','Shopping','Fun','Other'];

// Map emoji to category
const emojiToCategory = (emoji) => {
  if (['🍽️','☕','🍕','🍱'].includes(emoji))   return 'Food';
  if (['✈️','⛽','🛺'].includes(emoji))          return 'Travel';
  if (['🛒','🎁'].includes(emoji))               return 'Shopping';
  if (['🎬','🎮','🎵'].includes(emoji))          return 'Fun';
  return 'Other';
};

const DARK_MAP_STYLE = [
  { elementType:'geometry',           stylers:[{color:'#0D0927'}] },
  { elementType:'labels.text.stroke', stylers:[{color:'#0D0927'}] },
  { elementType:'labels.text.fill',   stylers:[{color:'rgba(255,255,255,0.45)'}] },
  { featureType:'road',         elementType:'geometry',        stylers:[{color:'#1C1250'}] },
  { featureType:'road',         elementType:'geometry.stroke', stylers:[{color:'#251870'}] },
  { featureType:'road.highway', elementType:'geometry',        stylers:[{color:'#2A1A80'}] },
  { featureType:'water',        elementType:'geometry',        stylers:[{color:'#050318'}] },
  { featureType:'poi',          elementType:'geometry',        stylers:[{color:'#160E40'}] },
  { featureType:'landscape',    elementType:'geometry',        stylers:[{color:'#110B35'}] },
];

function PinMarker({ pin, isSelected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(()=>{
    Animated.spring(scale,{toValue:isSelected?1.3:1,damping:12,stiffness:200,useNativeDriver:true}).start();
  },[isSelected]);
  return (
    <Pressable onPress={onPress}>
      <Animated.View style={{transform:[{scale}],alignItems:'center'}}>
        <View style={[s.pinOuter,{borderColor:pin.color+'99',shadowColor:pin.color}]}>
          <LinearGradient colors={[pin.color,pin.color+'BB']} style={s.pinInner}>
            <Text style={s.pinEmoji}>{pin.emoji}</Text>
          </LinearGradient>
        </View>
        <View style={[s.pinTail,{backgroundColor:pin.color}]}/>
        {isSelected && (
          <View style={s.calloutWrap}>
            <View style={s.calloutBase}/>
            <View style={[s.calloutBorder,{borderColor:pin.color+'55'}]}/>
            <Text style={s.calloutTitle} numberOfLines={1}>{pin.title}</Text>
            <Text style={[s.calloutAmt,{color:pin.color}]}>₹{pin.amount.toLocaleString('en-IN')}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

function FilterChip({ label, isActive, onPress }) {
  return (
    <Pressable onPress={onPress} style={{overflow:'hidden',borderRadius:50}}>
      {isActive
        ? <LinearGradient colors={['#7B61FF','#00D4FF']} style={s.chipActive} start={{x:0,y:0}} end={{x:1,y:0}}>
            <Text style={s.chipActiveText}>{label}</Text>
          </LinearGradient>
        : <View style={s.chipInactive}>
            <View style={s.chipBase}/>
            <Text style={s.chipText}>{label}</Text>
          </View>
      }
    </Pressable>
  );
}

// Fake location offsets so pins spread around the map
const OFFSETS = [
  {lat:0,lng:0},{lat:0.01,lng:0.015},{lat:-0.008,lng:0.02},
  {lat:0.015,lng:-0.01},{lat:-0.012,lng:-0.008},{lat:0.005,lng:0.025},
  {lat:-0.018,lng:0.012},{lat:0.022,lng:0.005},
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { expenses } = useData();
  const mapRef = useRef(null);
  const [selected,     setSelected]     = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [userLocation, setUserLocation] = useState(null);
  const sheetY = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    (async()=>{
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation(loc.coords);
      }
    })();
    Animated.spring(sheetY,{toValue:1,damping:16,stiffness:140,useNativeDriver:true}).start();
  },[]);

  // Convert expenses to map pins with fake coordinates spread around user or default
  const BASE_LAT = userLocation?.latitude  ?? 29.3909;
  const BASE_LNG = userLocation?.longitude ?? 76.9635;

  const pins = expenses.map((e,i)=>({
    id:       e.id,
    title:    e.title,
    amount:   e.amount,
    emoji:    e.emoji,
    color:    e.color?.[0] ?? '#7B61FF',
    category: emojiToCategory(e.emoji),
    lat:      BASE_LAT + (OFFSETS[i % OFFSETS.length]?.lat ?? 0),
    lng:      BASE_LNG + (OFFSETS[i % OFFSETS.length]?.lng ?? 0),
  }));

  const filtered = activeFilter==='All' ? pins : pins.filter(p=>p.category===activeFilter);
  const total    = filtered.reduce((s,p)=>s+p.amount,0);

  const focusPin = (pin) => {
    setSelected(prev=>prev===pin.id?null:pin.id);
    mapRef.current?.animateToRegion({ latitude:pin.lat-0.004, longitude:pin.lng, latitudeDelta:0.02, longitudeDelta:0.02 },700);
  };

  const sheetTranslate = sheetY.interpolate({inputRange:[0,1],outputRange:[400,0]});

  const INITIAL_REGION = { latitude:BASE_LAT, longitude:BASE_LNG, latitudeDelta:0.06, longitudeDelta:0.06 };

  return (
    <View style={{flex:1,backgroundColor:'#080616'}}>
      <MapView ref={mapRef} style={StyleSheet.absoluteFillObject} provider={PROVIDER_GOOGLE} customMapStyle={DARK_MAP_STYLE} initialRegion={INITIAL_REGION} showsUserLocation showsMyLocationButton={false} showsCompass={false} toolbarEnabled={false}>
        {filtered.map(pin=>(
          <Marker key={pin.id} coordinate={{latitude:pin.lat,longitude:pin.lng}} tracksViewChanges={false} anchor={{x:0.5,y:1}}>
            <PinMarker pin={pin} isSelected={selected===pin.id} onPress={()=>focusPin(pin)}/>
          </Marker>
        ))}
      </MapView>

      {/* Top Bar */}
      <View style={[s.topBar,{paddingTop:insets.top+10}]}>
        <View style={s.topBarBase}/>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject}/>
        <LinearGradient colors={['rgba(14,7,48,0.92)','rgba(14,7,48,0.75)']} style={StyleSheet.absoluteFillObject}/>
        <View style={s.topBarBorder}/>
        <View style={s.topBarContent}>
          <View>
            <Text style={s.topBarSub}>Tracking</Text>
            <Text style={s.topBarTitle}>Expense Map</Text>
          </View>
          <LinearGradient colors={['#7B61FF','#00D4FF']} style={s.totalPill} start={{x:0,y:0}} end={{x:1,y:0}}>
            <Text style={s.totalPillText}>₹{total.toLocaleString('en-IN')} mapped</Text>
          </LinearGradient>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {CATEGORIES.map(cat=>(
            <FilterChip key={cat} label={cat} isActive={activeFilter===cat} onPress={()=>setActiveFilter(cat)}/>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[s.sheet,{transform:[{translateY:sheetTranslate}],paddingBottom:insets.bottom+85}]}>
        <View style={s.sheetBase}/>
        <BlurView intensity={55} tint="dark" style={[StyleSheet.absoluteFillObject,{borderRadius:28}]}/>
        <LinearGradient colors={['rgba(22,10,60,0.96)','rgba(12,6,36,0.98)']} style={[StyleSheet.absoluteFillObject,{borderRadius:28}]}/>
        <LinearGradient colors={['transparent','#7B61FF99','#00D4FF66','transparent']} style={s.sheetTopBorder} start={{x:0,y:0}} end={{x:1,y:0}}/>
        <View style={s.sheetHandle}/>
        <View style={s.sheetHeader}>
          <View>
            <Text style={s.sheetTitle}>Tagged Expenses</Text>
            <Text style={s.sheetSub}>{filtered.length} locations · tap to focus</Text>
          </View>
          <View style={s.sheetCountBadge}><Text style={s.sheetCountText}>{filtered.length}</Text></View>
        </View>

        {filtered.length === 0 ? (
          <View style={{alignItems:'center',paddingVertical:24,gap:8}}>
            <Text style={{fontSize:32}}>📍</Text>
            <Text style={{color:'rgba(255,255,255,0.40)',fontSize:14,fontWeight:'600'}}>
              {expenses.length===0 ? 'Add expenses on Home to see them here' : 'No expenses in this category'}
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{maxHeight:200}} contentContainerStyle={{gap:4,paddingHorizontal:18,paddingBottom:8}}>
            {filtered.map(pin=>(
              <Pressable key={pin.id} onPress={()=>focusPin(pin)} style={[s.expRow,selected===pin.id&&{backgroundColor:pin.color+'18'}]}>
                <LinearGradient colors={[pin.color,pin.color+'AA']} style={s.expIcon}><Text style={{fontSize:18}}>{pin.emoji}</Text></LinearGradient>
                <View style={{flex:1}}>
                  <Text style={s.expTitle} numberOfLines={1}>{pin.title}</Text>
                  <View style={{flexDirection:'row',alignItems:'center',gap:5}}>
                    <View style={[s.expCatDot,{backgroundColor:pin.color}]}/>
                    <Text style={s.expCat}>{pin.category}</Text>
                  </View>
                </View>
                <View style={[s.expAmtPill,{backgroundColor:pin.color+'22',borderColor:pin.color+'55'}]}>
                  <Text style={[s.expAmt,{color:pin.color}]}>₹{pin.amount.toLocaleString('en-IN')}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={s.summaryStrip}>
          <LinearGradient colors={['rgba(123,97,255,0.18)','rgba(0,212,255,0.10)']} style={[StyleSheet.absoluteFillObject,{borderRadius:16}]} start={{x:0,y:0}} end={{x:1,y:0}}/>
          <View style={s.summaryStripBorder}/>
          {[
            {lbl:'Expenses',val:filtered.length,         color:'#A78BFA'},
            {lbl:'Total',   val:'₹'+(total/1000).toFixed(1)+'k', color:'#00D4FF'},
            {lbl:'Avg',     val:'₹'+Math.round(total/Math.max(filtered.length,1)).toLocaleString('en-IN'), color:'#00E6A0'},
          ].map((stat,i)=>(
            <View key={i} style={[s.summaryStat,i>0&&s.summaryStatBorder]}>
              <Text style={[s.summaryVal,{color:stat.color}]}>{stat.val}</Text>
              <Text style={s.summaryLbl}>{stat.lbl}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  topBar:{ position:'absolute', top:0, left:0, right:0, overflow:'hidden' },
  topBarBase:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(8,6,22,0.88)' },
  topBarBorder:{ position:'absolute', bottom:0, left:0, right:0, height:1, backgroundColor:'rgba(123,97,255,0.35)' },
  topBarContent:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingBottom:12 },
  topBarSub:{ color:'rgba(255,255,255,0.45)', fontSize:12, fontWeight:'500' },
  topBarTitle:{ color:'#FFFFFF', fontSize:22, fontWeight:'800', letterSpacing:-0.3, marginTop:2 },
  totalPill:{ paddingHorizontal:16, paddingVertical:8, borderRadius:50, shadowColor:'#7B61FF', shadowOffset:{width:0,height:3}, shadowOpacity:0.5, shadowRadius:10, elevation:6 },
  totalPillText:{ color:'#fff', fontSize:13, fontWeight:'800' },
  filterRow:{ paddingHorizontal:16, paddingBottom:14, gap:8 },
  chipActive:{ paddingHorizontal:16, paddingVertical:7, borderRadius:50 },
  chipActiveText:{ color:'#fff', fontSize:13, fontWeight:'700' },
  chipInactive:{ paddingHorizontal:16, paddingVertical:7, borderRadius:50, borderWidth:1, borderColor:'rgba(255,255,255,0.22)', overflow:'hidden' },
  chipBase:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(14,8,40,0.7)', borderRadius:50 },
  chipText:{ color:'rgba(255,255,255,0.70)', fontSize:13, fontWeight:'600' },
  pinOuter:{ width:46, height:46, borderRadius:23, borderWidth:2.5, overflow:'hidden', shadowOffset:{width:0,height:4}, shadowOpacity:0.6, shadowRadius:10, elevation:8 },
  pinInner:{ flex:1, alignItems:'center', justifyContent:'center' },
  pinEmoji:{ fontSize:20 },
  pinTail:{ width:4, height:8, borderRadius:2, marginTop:-1 },
  calloutWrap:{ position:'absolute', bottom:68, borderRadius:12, overflow:'hidden', minWidth:170, maxWidth:200, paddingHorizontal:12, paddingVertical:9, alignSelf:'center' },
  calloutBase:{ ...StyleSheet.absoluteFillObject, borderRadius:12, backgroundColor:'rgba(14,8,44,0.92)' },
  calloutBorder:{ ...StyleSheet.absoluteFillObject, borderRadius:12, borderWidth:1 },
  calloutTitle:{ color:'#FFFFFF', fontSize:12, fontWeight:'700', marginBottom:2 },
  calloutAmt:{ fontSize:14, fontWeight:'800' },
  sheet:{ position:'absolute', bottom:0, left:0, right:0, borderTopLeftRadius:28, borderTopRightRadius:28, overflow:'hidden' },
  sheetBase:{ ...StyleSheet.absoluteFillObject, borderTopLeftRadius:28, borderTopRightRadius:28, backgroundColor:'#0E0730' },
  sheetTopBorder:{ position:'absolute', top:0, left:0, right:0, height:1 },
  sheetHandle:{ width:40, height:4, borderRadius:2, backgroundColor:'rgba(255,255,255,0.22)', alignSelf:'center', marginTop:12, marginBottom:16 },
  sheetHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, marginBottom:14 },
  sheetTitle:{ color:'#FFFFFF', fontSize:18, fontWeight:'800', letterSpacing:-0.2 },
  sheetSub:{ color:'rgba(255,255,255,0.45)', fontSize:12, marginTop:3 },
  sheetCountBadge:{ width:32, height:32, borderRadius:16, backgroundColor:'rgba(123,97,255,0.25)', borderWidth:1, borderColor:'rgba(123,97,255,0.5)', alignItems:'center', justifyContent:'center' },
  sheetCountText:{ color:'#A78BFA', fontSize:14, fontWeight:'800' },
  expRow:{ flexDirection:'row', alignItems:'center', gap:12, paddingVertical:10, paddingHorizontal:14, borderRadius:14 },
  expIcon:{ width:44, height:44, borderRadius:12, alignItems:'center', justifyContent:'center', flexShrink:0 },
  expTitle:{ color:'#FFFFFF', fontSize:14, fontWeight:'700', marginBottom:4 },
  expCatDot:{ width:6, height:6, borderRadius:3 },
  expCat:{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:'600' },
  expAmtPill:{ paddingHorizontal:10, paddingVertical:5, borderRadius:50, borderWidth:1, flexShrink:0 },
  expAmt:{ fontSize:13, fontWeight:'800' },
  summaryStrip:{ flexDirection:'row', marginHorizontal:18, marginTop:14, borderRadius:16, overflow:'hidden', position:'relative' },
  summaryStripBorder:{ ...StyleSheet.absoluteFillObject, borderRadius:16, borderWidth:1, borderColor:'rgba(123,97,255,0.30)' },
  summaryStat:{ flex:1, alignItems:'center', paddingVertical:14, gap:3 },
  summaryStatBorder:{ borderLeftWidth:1, borderLeftColor:'rgba(255,255,255,0.08)' },
  summaryVal:{ fontSize:18, fontWeight:'800', letterSpacing:-0.3 },
  summaryLbl:{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:'600' },
});