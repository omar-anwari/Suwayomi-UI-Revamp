import type { MangaStatus } from './gql/graphql';

const STATUS_LABELS: Record<MangaStatus, string> = {
  UNKNOWN: 'Unknown',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  LICENSED: 'Licensed',
  PUBLISHING_FINISHED: 'Publishing finished',
  CANCELLED: 'Cancelled',
  ON_HIATUS: 'On hiatus',
};

export function mangaStatusLabel(status: MangaStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatEpochMs(value: string): string {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return '';
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function chapterLabel(name: string, chapterNumber: number): string {
  if (name && name.trim()) return name;
  return `Chapter ${chapterNumber}`;
}

export function sourceLinkLabel(sourceName?: string | null): string {
  return sourceName ? `Open on ${sourceName}` : 'Open on source website';
}

export function fetchedAtToMs(value: string): number {
  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds * 1000 : 0;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatDayLabel(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'Unknown';
  const date = new Date(ms);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTimeOfDay(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '';
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
