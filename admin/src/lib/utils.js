import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes without conflicts
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in Indian currency format
 */
export function formatPrice(price) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

/**
 * Format date to readable string
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Truncate text to a given length
 */
export function truncate(text, length = 50) {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}...` : text;
}
