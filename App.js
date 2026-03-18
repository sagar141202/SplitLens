import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/firebase/config';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen    from './src/screens/auth/LoginScreen';
import SignupScreen   from './src/screens/auth/SignupScreen';
import HomeScreen     from './src/screens/HomeScreen';
import ScanScreen     from './src/screens/ScanScreen';
import GroupsScreen   from './src/screens/GroupsScreen';
import MapScreen      from './src/screens/MapScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TabBar         from './src/components/TabBar';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown:false, animation:'fade' }}>
      <Stack.Screen name="Login"  component={LoginScreen}  />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown:false }}>
      <Tab.Screen name="Home"     component={HomeScreen}     />
      <Tab.Screen name="Scan"     component={ScanScreen}     />
      <Tab.Screen name="Groups"   component={GroupsScreen}   />
      <Tab.Screen name="Map"      component={MapScreen}      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor:'#080616', alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color="#7B61FF" size="large" />
      </View>
    );
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown:false, animation:'fade' }}>
      {user
        ? <Stack.Screen name="AppTabs" component={AppTabs}   />
        : <Stack.Screen name="Auth"    component={AuthStack} />
      }
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
