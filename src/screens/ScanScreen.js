import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable,
  Dimensions, ScrollView, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MeshBackground from '../components/MeshBackground';
import GlassCard from '../components/GlassCard';
import { COLORS, RADIUS, SPACE, SHADOW } from '../theme';

const { width: W, height: H } = Dimensions.get('window');

// Mock OCR result after "scanning"
const MOCK_RECEIPT = {
  restaurant: 'Spice Route — Sector 17',
  date: '18 Mar 2026',
  items: [
    { name: 'Dal Makhani',      price: 320 },
    { name: 'Butter Naan × 4', price: 160 },
    { name: 'Paneer Tikka',     price: 480 },
    { name: 'Mango Lassi × 2', price: 180 },
    { name: 'Veg Biryani',     price: 360 },
  ],
  subtotal: 1500,
  gst: 270,
  total: 1770,
};

// ─── Scan Viewfinder ─────────────────────────────────────
function ScanFrame({ scanning }) {
  const cornerAnim = useRef(new Animated.Value(0)).current;
  const lineY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Corner fade in
    Animated.timing(cornerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    if (scanning) {
      // Scan line sweep
      Animated.loop(
        Animated.sequence([
          Animated.timing(lineY, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(lineY, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();

      // Pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      lineY.stopAnimation();
      pulseAnim.stopAnimation();
    }
  }, [scanning]);

  const lineTranslateY = lineY.interpolate({ inputRange: [0, 1], outputRange: [0, 220] });
  const FRAME = 260;

  return (
    <Animated.View style={[styles.frame, { width: FRAME, height: FRAME + 80, transform: [{ scale: pulseAnim }] }]}>
      {/* Corners */}
      {[['TL', 0, 0], ['TR', 1, 0], ['BL', 0, 1], ['BR', 1, 1]].map(([id, right, bottom]) => (
        <Animated.View
          key={id}
          style={[
            styles.corner,
            right   ? { right: 0, borderRightWidth: 3, borderLeftWidth: 0 } : { left: 0, borderLeftWidth: 3 },
            bottom  ? { bottom: 0, borderBottomWidth: 3, borderTopWidth: 0 } : { top: 0, borderTopWidth: 3 },
            { opacity: cornerAnim },
          ]}
        />
      ))}

      {/* Scan line */}
      {scanning && (
        <Animated.View
          style={[styles.scanLine, { transform: [{ translateY: lineTranslateY }] }]}
        >
          <LinearGradient
            colors={['transparent', COLORS.accent.primary, 'transparent']}
            style={{ flex: 1, height: 2 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─── Parsed Receipt Card ──────────────────────────────────
function ReceiptResult({ data, onSplit }) {
  const slideUp = useRef(new Animated.Value(80)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideUp, { toValue: 0, damping: 14, stiffness: 160, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: slideUp }], opacity: fade }}>
      <GlassCard padding={20} borderRadius={RADIUS.xl} glowColor={COLORS.accent.primary}>
        {/* Header */}
        <View style={styles.receiptHeader}>
          <LinearGradient colors={['#7B61FF', '#00D4FF']} style={styles.receiptIcon}>
            <Text style={{ fontSize: 20 }}>🧾</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.receiptRestaurant}>{data.restaurant}</Text>
            <Text style={styles.receiptDate}>{data.date}</Text>
          </View>
          <View style={styles.successBadge}>
            <Text style={styles.successText}>✓ Scanned</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.receiptDivider} />
        {data.items.map((item, i) => (
          <View key={i} style={styles.receiptRow}>
            <Text style={styles.receiptItem}>{item.name}</Text>
            <Text style={styles.receiptPrice}>₹{item.price}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.receiptDivider} />
        <View style={styles.receiptRow}>
          <Text style={styles.receiptMeta}>Subtotal</Text>
          <Text style={styles.receiptMeta}>₹{data.subtotal}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptMeta}>GST (18%)</Text>
          <Text style={styles.receiptMeta}>₹{data.gst}</Text>
        </View>
        <View style={[styles.receiptRow, { marginTop: 8 }]}>
          <Text style={styles.receiptTotal}>Total</Text>
          <Text style={styles.receiptTotal}>₹{data.total}</Text>
        </View>

        {/* Split CTA */}
        <Pressable onPress={onSplit} style={{ marginTop: SPACE.lg }}>
          <LinearGradient
            colors={['#7B61FF', '#00D4FF']}
            style={styles.splitBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.splitBtnText}>Split This Bill</Text>
          </LinearGradient>
        </Pressable>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────
export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState(null);
  const insets = useSafeAreaInsets();
  const btnScale = useRef(new Animated.Value(1)).current;

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanning(true);

    // Simulate OCR processing
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanning(false);
      setScanned(true);
      setResult(MOCK_RECEIPT);
    }, 2800);
  };

  const handleReset = () => {
    setScanned(false);
    setResult(null);
    setScanning(false);
  };

  const handlePickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!res.canceled) {
      setScanning(true);
      setTimeout(() => {
        setScanning(false);
        setScanned(true);
        setResult(MOCK_RECEIPT);
      }, 2000);
    }
  };

  if (!permission) return <MeshBackground><View style={styles.center}><Text style={styles.permText}>Checking camera...</Text></View></MeshBackground>;

  if (!permission.granted) {
    return (
      <MeshBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <Text style={styles.permTitle}>Camera Access Needed</Text>
          <Text style={styles.permText}>Allow camera to scan receipts</Text>
          <Pressable onPress={requestPermission} style={{ marginTop: 20 }}>
            <LinearGradient colors={['#7B61FF','#00D4FF']} style={styles.splitBtn}>
              <Text style={styles.splitBtnText}>Grant Permission</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </MeshBackground>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A1A' }}>
      {/* Camera or Result view */}
      {!scanned ? (
        <View style={{ flex: 1 }}>
          <CameraView style={StyleSheet.absoluteFillObject} facing="back" />

          {/* Dark overlay outside frame */}
          <View style={styles.cameraOverlay}>
            {/* Top bar */}
            <BlurView intensity={40} tint="dark" style={[styles.camTopBar, { paddingTop: insets.top + 8 }]}>
              <Text style={styles.camTitle}>Scan Receipt</Text>
              <Text style={styles.camSub}>Point at a bill or invoice</Text>
            </BlurView>

            {/* Frame */}
            <View style={styles.frameContainer}>
              <ScanFrame scanning={scanning} />
              {scanning && (
                <BlurView intensity={20} tint="dark" style={styles.processingBadge}>
                  <Text style={styles.processingText}>🔍 Reading receipt...</Text>
                </BlurView>
              )}
            </View>

            {/* Bottom controls */}
            <BlurView intensity={40} tint="dark" style={[styles.camBottom, { paddingBottom: insets.bottom + 90 }]}>
              <Pressable onPress={handlePickImage} style={styles.camSecondary}>
                <Text style={styles.camSecondaryText}>📁 Gallery</Text>
              </Pressable>

              <Pressable onPress={handleScan} disabled={scanning}>
                <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                  <LinearGradient
                    colors={scanning ? ['#444','#333'] : ['#7B61FF', '#00D4FF']}
                    style={styles.scanBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.scanBtnText}>{scanning ? '⏳' : '⊙'}</Text>
                  </LinearGradient>
                </Animated.View>
              </Pressable>

              <Pressable onPress={handleReset} style={styles.camSecondary}>
                <Text style={styles.camSecondaryText}>✕ Cancel</Text>
              </Pressable>
            </BlurView>
          </View>
        </View>
      ) : (
        <MeshBackground>
          <ScrollView
            contentContainerStyle={[styles.resultScroll, { paddingTop: insets.top + 60, paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Receipt Scanned! 🎉</Text>
              <Pressable onPress={handleReset}>
                <Text style={styles.scanAgain}>Scan again</Text>
              </Pressable>
            </View>
            {result && <ReceiptResult data={result} onSplit={() => Alert.alert('Split!', 'Opening split flow…')} />}
          </ScrollView>
        </MeshBackground>
      )}
    </View>
  );
}

const FRAME_W = 260;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permTitle: { color: COLORS.text.primary, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  permText: { color: COLORS.text.secondary, fontSize: 15, textAlign: 'center' },

  cameraOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },

  camTopBar: {
    paddingHorizontal: SPACE.xl,
    paddingBottom: SPACE.md,
    alignItems: 'center',
    overflow: 'hidden',
  },
  camTitle: { color: COLORS.text.primary, fontSize: 20, fontWeight: '700' },
  camSub:   { color: COLORS.text.secondary, fontSize: 13, marginTop: 2 },

  frameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28, height: 28,
    borderColor: COLORS.accent.primary,
    borderRadius: 2,
  },
  scanLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 2,
    overflow: 'hidden',
  },
  processingBadge: {
    marginTop: 24,
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  processingText: { color: COLORS.text.primary, fontSize: 14, fontWeight: '600' },

  camBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: SPACE.xl,
    overflow: 'hidden',
  },
  scanBtn: {
    width: 72, height: 72,
    borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.glow('#7B61FF', 20),
  },
  scanBtnText: { fontSize: 28, color: '#fff' },
  camSecondary: {
    padding: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.glass.white10,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  camSecondaryText: { color: COLORS.text.secondary, fontSize: 12, fontWeight: '600' },

  // Result
  resultScroll: { paddingHorizontal: SPACE.lg },
  resultHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACE.lg,
  },
  resultTitle: { color: COLORS.text.primary, fontSize: 22, fontWeight: '800' },
  scanAgain:   { color: COLORS.accent.primary, fontSize: 14, fontWeight: '600' },

  // Receipt card
  receiptHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  receiptIcon: {
    width: 48, height: 48, borderRadius: RADIUS.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  receiptRestaurant: { color: COLORS.text.primary, fontSize: 15, fontWeight: '700' },
  receiptDate: { color: COLORS.text.tertiary, fontSize: 12, marginTop: 2 },
  successBadge: {
    backgroundColor: COLORS.accent.success + '22',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: COLORS.accent.success + '55',
  },
  successText: { color: COLORS.accent.success, fontSize: 11, fontWeight: '700' },

  receiptDivider: { height: 0.5, backgroundColor: COLORS.glass.borderSub, marginVertical: 12 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  receiptItem: { color: COLORS.text.secondary, fontSize: 14 },
  receiptPrice: { color: COLORS.text.primary, fontSize: 14, fontWeight: '600' },
  receiptMeta:  { color: COLORS.text.tertiary, fontSize: 13 },
  receiptTotal: { color: COLORS.text.primary, fontSize: 16, fontWeight: '800' },

  splitBtn: {
    borderRadius: RADIUS.full,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOW.glow('#7B61FF', 12),
  },
  splitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
