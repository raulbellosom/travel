import { clsx } from "clsx";

/**
 * Utility function to merge Tailwind CSS classes
 * Uses clsx for conditional class names
 *
 * @param {...(string|object|array)} inputs - Class names or conditional objects
 * @returns {string} - Merged class names
 */
export function cn(...inputs) {
  return clsx(inputs);
}
