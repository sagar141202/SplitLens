# SplitLens 💜

**Liquid Glassmorphism Bill Splitter — React Native + Expo Go**

A stunning, feature-rich expense splitting app with:
- 📷 **Camera OCR** — Scan receipts instantly
- 💾 **Offline Storage** — AsyncStorage for full offline support
- 🗺️ **Maps** — Tag expenses to real locations
- 💱 **Currency API** — Live exchange rates (ExchangeRate-API)
- ✨ **Glassmorphism UI** — Animated mesh gradients, blurred glass cards, spring animations

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Expo
npx expo start

# 3. Scan QR with Expo Go app on your phone
```

## Project Structure

```
SplitLens/
├── App.js                        # Root navigator
├── app.json                      # Expo config
├── package.json
└── src/
    ├── theme/
    │   └── index.js              # Colors, gradients, spacing, animations
    ├── components/
    │   ├── MeshBackground.js     # Animated gradient orb background
    │   ├── GlassCard.js          # Reusable glassmorphism card
    │   └── TabBar.js             # Custom animated tab bar
    ├── screens/
    │   ├── HomeScreen.js         # Dashboard — balance, friends, splits
    │   ├── ScanScreen.js         # Camera OCR receipt scanner
    │   ├── GroupsScreen.js       # Group management + progress
    │   ├── MapScreen.js          # Expense location map
    │   └── SettingsScreen.js     # Profile + preferences
    └── utils/
        ├── storage.js            # AsyncStorage CRUD helpers
        └── currency.js           # Exchange rate API + split math
```

## Features for Resume

| Feature | Technology | File |
|---|---|---|
| Receipt OCR scanning | expo-camera + expo-image-picker | ScanScreen.js |
| Offline data persistence | AsyncStorage | storage.js |
| Interactive expense map | react-native-maps + expo-location | MapScreen.js |
| Live currency conversion | ExchangeRate API | currency.js |
| Glassmorphism UI | expo-blur + LinearGradient | GlassCard.js |
| Spring animations | Animated API | All screens |
| Haptic feedback | expo-haptics | TabBar.js |

## Optional: Currency API Key

Sign up free at [exchangerate-api.com](https://www.exchangerate-api.com) and add to `app.json`:

```json
"extra": { "EXPO_PUBLIC_FX_KEY": "your_key_here" }
```

## Extending the App

- **Real OCR**: Integrate Google Vision API or AWS Textract in `ScanScreen.js`
- **Auth**: Add Firebase Auth or Supabase
- **Payments**: Integrate Razorpay or UPI deep links
- **Push Notifications**: Use `expo-notifications` for payment reminders
- **Backend**: Connect to Supabase for real-time group sync

---

Built with 💜 using React Native + Expo
