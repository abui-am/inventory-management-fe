import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge harus diberi tahu kelas kustom kita.
 *
 * Tanpa ini ia tidak tahu `rounded-control` sekelompok dengan `rounded-md`, jadi
 * keduanya lolos ke markup dan yang menang ditentukan urutan di berkas CSS — bukan
 * urutan yang kita tulis. Akibatnya override diam-diam gagal: kotak cari tetap
 * beradius 6px padahal `rounded-control` (7px) dikirim belakangan.
 *
 * `text-2xs` lebih berbahaya lagi: tanpa didaftarkan, twMerge menebaknya sebagai
 * warna teks dan bisa menggusur `text-foreground-subtle` di string yang sama.
 */
const twMerge = extendTailwindMerge({
  classGroups: {
    'font-size': [{ text: ['2xs', 'tremor-label', 'tremor-default', 'tremor-title', 'tremor-metric'] }],
    rounded: [{ rounded: ['pill', 'control', 'group', 'card', 'tremor-small', 'tremor-default', 'tremor-full'] }],
  },
});

/**
 * Gabung kelas Tailwind dengan aman: `clsx` untuk kondisional, `twMerge` supaya
 * kelas yang bertabrakan menang di sisi pemanggil (mis. `cn('px-3', 'px-4')` → `px-4`).
 * Konvensi shadcn/ui; semua komponen di components/ui memakainya.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
