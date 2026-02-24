import type { HistoryItem } from "./types";

const STORAGE_KEY = "coslide_history";
const MAX_ITEMS = 50;

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: HistoryItem[] = JSON.parse(raw);
    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function saveToHistory(item: HistoryItem): void {
  const items = loadHistory();
  items.unshift(item);
  if (items.length > MAX_ITEMS) items.length = MAX_ITEMS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function updateHistoryItem(id: string, updates: Partial<HistoryItem>): void {
  const items = loadHistory();
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

export function deleteFromHistory(id: string): void {
  const items = loadHistory().filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小时前`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} 天前`;

  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}
