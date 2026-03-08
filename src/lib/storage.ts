import type { HistoryEntry } from './payrix/types';

const HISTORY_KEY = 'payrix_history';
const MAX_HISTORY_ITEMS = 100;

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored) as HistoryEntry[];
    }
  } catch (error) {
    console.error('Error reading history from localStorage:', error);
  }

  return [];
}

function persistHistory(entries: HistoryEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY_ITEMS)));
  } catch (error) {
    console.error('Error saving history to localStorage:', error);
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry {
  const historyEntry: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  addExistingHistoryEntry(historyEntry);
  return historyEntry;
}

export function addExistingHistoryEntry(entry: HistoryEntry): void {
  if (typeof window === 'undefined') {
    return;
  }

  const history = getHistory();
  const filtered = history.filter((item) => item.id !== entry.id);
  persistHistory([entry, ...filtered]);
}

export function clearHistory(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing history from localStorage:', error);
  }
}

export function deleteHistoryEntry(id: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const history = getHistory().filter((entry) => entry.id !== id);
  persistHistory(history);
}

// Server-side history management for server actions
const serverHistory: HistoryEntry[] = [];
const MAX_SERVER_HISTORY = 100;

export function addToServerHistory(entry: HistoryEntry): void {
  // Remove existing entry with same ID
  const filtered = serverHistory.filter((item) => item.id !== entry.id);
  // Add new entry at beginning
  filtered.unshift(entry);
  // Trim to max size
  serverHistory.length = 0;
  serverHistory.push(...filtered.slice(0, MAX_SERVER_HISTORY));
}

export function getServerHistory(): HistoryEntry[] {
  return [...serverHistory];
}
