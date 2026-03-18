// ─────────────────────────────────────────────────────────
//  SplitLens — Global Data Context
//  Single source of truth for expenses + groups
//  Persists everything to AsyncStorage automatically
// ─────────────────────────────────────────────────────────
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DataContext = createContext(null);

const KEYS = {
  EXPENSES: '@splitlens:expenses',
  GROUPS:   '@splitlens:groups',
  SETTINGS: '@splitlens:settings',
};

const DEFAULT_SETTINGS = { currency: 'INR ₹', splitMethod: 'Equal', notifications: true };

export function DataProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded,   setLoaded]   = useState(false);

  // ── Load from AsyncStorage on mount ──
  useEffect(() => {
    (async () => {
      try {
        const [eRaw, gRaw, sRaw] = await Promise.all([
          AsyncStorage.getItem(KEYS.EXPENSES),
          AsyncStorage.getItem(KEYS.GROUPS),
          AsyncStorage.getItem(KEYS.SETTINGS),
        ]);
        if (eRaw) setExpenses(JSON.parse(eRaw));
        if (gRaw) setGroups(JSON.parse(gRaw));
        if (sRaw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(sRaw) });
      } catch (e) { console.warn('DataContext load error', e); }
      finally { setLoaded(true); }
    })();
  }, []);

  // ── Persist helpers ──
  const saveExpenses = async (data) => {
    setExpenses(data);
    await AsyncStorage.setItem(KEYS.EXPENSES, JSON.stringify(data));
  };
  const saveGroups = async (data) => {
    setGroups(data);
    await AsyncStorage.setItem(KEYS.GROUPS, JSON.stringify(data));
  };
  const saveSettings = async (data) => {
    setSettings(data);
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(data));
  };

  // ── Expense actions ──
  const addExpense = async (expense) => {
    const updated = [{ ...expense, createdAt: new Date().toISOString() }, ...expenses];
    await saveExpenses(updated);
  };
  const deleteExpense = async (id) => {
    await saveExpenses(expenses.filter(e => e.id !== id));
  };

  // ── Group actions ──
  const addGroup = async (group) => {
    const updated = [{ ...group, createdAt: new Date().toISOString() }, ...groups];
    await saveGroups(updated);
  };
  const deleteGroup = async (id) => {
    await saveGroups(groups.filter(g => g.id !== id));
  };
  const updateGroup = async (id, changes) => {
    await saveGroups(groups.map(g => g.id === id ? { ...g, ...changes } : g));
  };

  // ── Computed stats ──
  const totalSpent    = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const yourShare     = expenses.reduce((s, e) => s + Math.round((e.amount || 0) / (e.members || 1)), 0);
  const totalOwed     = Math.max(0, totalSpent - yourShare);

  return (
    <DataContext.Provider value={{
      expenses, groups, settings, loaded,
      addExpense, deleteExpense,
      addGroup, deleteGroup, updateGroup,
      saveSettings,
      totalSpent, yourShare, totalOwed,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
}