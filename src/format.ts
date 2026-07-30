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
