import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  EXPENSES:  '@splitlens:expenses',
  GROUPS:    '@splitlens:groups',
  FRIENDS:   '@splitlens:friends',
  SETTINGS:  '@splitlens:settings',
};

// ── Expenses ──────────────────────────────────────────────
export async function saveExpense(expense) {
  try {
    const existing = await getExpenses();
    const updated = [expense, ...existing];
    await AsyncStorage.setItem(KEYS.EXPENSES, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error('saveExpense error:', e);
    return false;
  }
}

export async function getExpenses() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.EXPENSES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function deleteExpense(id) {
  try {
    const expenses = await getExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    await AsyncStorage.setItem(KEYS.EXPENSES, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

// ── Groups ────────────────────────────────────────────────
export async function saveGroup(group) {
  try {
    const existing = await getGroups();
    const idx = existing.findIndex(g => g.id === group.id);
    if (idx >= 0) existing[idx] = group;
    else existing.unshift(group);
    await AsyncStorage.setItem(KEYS.GROUPS, JSON.stringify(existing));
    return true;
  } catch {
    return false;
  }
}

export async function getGroups() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.GROUPS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ── Friends ───────────────────────────────────────────────
export async function saveFriend(friend) {
  try {
    const existing = await getFriends();
    const idx = existing.findIndex(f => f.id === friend.id);
    if (idx >= 0) existing[idx] = friend;
    else existing.push(friend);
    await AsyncStorage.setItem(KEYS.FRIENDS, JSON.stringify(existing));
    return true;
  } catch {
    return false;
  }
}

export async function getFriends() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.FRIENDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ── Settings ──────────────────────────────────────────────
export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export async function getSettings() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : {
      currency: 'INR',
      splitMethod: 'equal',
      notifications: true,
    };
  } catch {
    return { currency: 'INR', splitMethod: 'equal', notifications: true };
  }
}

// ── Wipe all data ─────────────────────────────────────────
export async function clearAllData() {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
    return true;
  } catch {
    return false;
  }
}
