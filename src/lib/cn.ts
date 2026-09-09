import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Gabung kelas Tailwind dengan aman: `clsx` untuk kondisional, `twMerge` supaya
 * kelas yang bertabrakan menang di sisi pemanggil (mis. `cn('px-3', 'px-4')` → `px-4`).
 * Konvensi shadcn/ui; semua komponen di components/ui memakainya.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
