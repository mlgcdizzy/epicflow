import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}
