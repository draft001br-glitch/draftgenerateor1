import { HistoryItem, HistoryActionType } from '../types/history';
import { AppealPointInstruction } from '../components/InputPanel';

const STORAGE_KEY = 'rekatsu_generation_history_v1';
const MAX_HISTORY_ITEMS = 50;

/**
 * Extracts a concise title from the generated description
 */
export function extractTitleFromDraft(description: string, fallbackTitle: string = '無題の求人原稿'): string {
  if (!description) return fallbackTitle;

  const lines = description.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Try to find a header or catchphrase line
  for (const line of lines) {
    // If markdown header
    if (line.startsWith('#')) {
      const clean = line.replace(/^#+\s*/, '').replace(/[*_`]/g, '').trim();
      if (clean && clean.length > 2) {
        return clean.slice(0, 40);
      }
    }
    // If contains 【キャッチコピー】 or 【職種名】 or 【仕事内容】
    if (line.includes('【') && line.includes('】')) {
      const clean = line.replace(/[*_`]/g, '').trim();
      if (clean.length > 2) {
        return clean.slice(0, 40);
      }
    }
  }

  // Fallback to first non-empty line
  if (lines.length > 0) {
    const clean = lines[0].replace(/^[#\-*\d.]+\s*/, '').replace(/[*_`]/g, '').trim();
    if (clean) {
      return clean.slice(0, 40);
    }
  }

  return fallbackTitle;
}

/**
 * Formats timestamp to YYYY/MM/DD HH:mm
 */
export function formatTimestamp(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${hh}:${mm}`;
}

/**
 * Loads history from localStorage
 */
export function loadHistoryItems(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error('Failed to load generation history from localStorage:', err);
    return [];
  }
}

interface CreateHistoryInput {
  description: string;
  title?: string;
  sources?: { uri: string; title: string }[];
  interviewLog?: string;
  sampleMessage?: string;
  appealPointRules?: AppealPointInstruction[];
  catchphraseTemperature?: number;
  manuscriptTemperature?: number;
  actionType: HistoryActionType;
  actionLabel?: string;
  instructionUsed?: string;
}

const ACTION_LABELS: Record<HistoryActionType, string> = {
  generate: '新規生成',
  refine: '微調整',
  senior_voice: '先輩社員追加',
  ng_replace: 'NG置換',
  format: '原稿整形',
  manual_save: '手動保存',
};

/**
 * Saves a new item to history and persists to localStorage
 */
export function saveHistoryItem(input: CreateHistoryInput): { item: HistoryItem; list: HistoryItem[] } {
  const now = new Date();
  const title = input.title?.trim() || extractTitleFromDraft(input.description);
  const actionLabel = input.actionLabel || ACTION_LABELS[input.actionType] || '生成履歴';

  const newItem: HistoryItem = {
    id: `hist_${now.getTime()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now.getTime(),
    formattedDate: formatTimestamp(now),
    title,
    description: input.description,
    sources: input.sources || [],
    interviewLog: input.interviewLog,
    sampleMessage: input.sampleMessage,
    appealPointRules: input.appealPointRules,
    catchphraseTemperature: input.catchphraseTemperature,
    manuscriptTemperature: input.manuscriptTemperature,
    actionType: input.actionType,
    actionLabel,
    instructionUsed: input.instructionUsed,
    charCount: input.description.length,
  };

  const currentList = loadHistoryItems();
  // Filter out if duplicate description with identical text was just saved in the last 2 seconds
  const filtered = currentList.filter(item => {
    if (item.description === newItem.description && Math.abs(item.createdAt - newItem.createdAt) < 2000) {
      return false;
    }
    return true;
  });

  const updatedList = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to save history to localStorage:', err);
  }

  return { item: newItem, list: updatedList };
}

/**
 * Deletes a single history item by id
 */
export function deleteHistoryItem(id: string): HistoryItem[] {
  const currentList = loadHistoryItems();
  const updatedList = currentList.filter(item => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to delete history item from localStorage:', err);
  }
  return updatedList;
}

/**
 * Renames a history item
 */
export function updateHistoryItemTitle(id: string, newTitle: string): HistoryItem[] {
  const currentList = loadHistoryItems();
  const updatedList = currentList.map(item => {
    if (item.id === id) {
      return { ...item, title: newTitle.trim() || item.title };
    }
    return item;
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to update history title:', err);
  }
  return updatedList;
}

/**
 * Clears all history items
 */
export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear history from localStorage:', err);
  }
}
