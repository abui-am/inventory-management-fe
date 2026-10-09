import { useRef } from 'react';

import { cn } from '@/lib/cn';

/**
 * `tone` mewarnai pilihan yang SEDANG terpilih. Dipakai kalau nilainya punya arti —
 * status karyawan aktif/nonaktif — supaya warnanya sama dengan lencana dan tombol yang
 * membicarakan hal yang sama di layar lain. Tanpa `tone`, yang terpilih tampil netral.
 */
export type SegmentedTone = 'success' | 'destructive' | 'warning' | 'accent';

export type SegmentedOption<T extends string> = { value: T; label: string; tone?: SegmentedTone };

/** Ditulis utuh, bukan dirangkai `bg-${tone}-subtle` — Tailwind memindai kelas sebagai teks. */
const WARNA: Record<SegmentedTone, string> = {
  success: 'bg-success-subtle text-success',
  destructive: 'bg-destructive-subtle text-destructive',
  warning: 'bg-warning-subtle text-warning',
  accent: 'bg-accent-subtle text-accent',
};

/**
 * Kendali dua-atau-tiga pilihan di dalam formulir — bukan penyaring daftar.
 *
 * `FilterTabs` terlihat mirip tapi perannya berbeda: ia menyaring apa yang ditampilkan
 * dan membawa jumlah di tiap tabnya. Yang ini mengisi sebuah NILAI yang akan terkirim,
 * jadi bentuknya `radiogroup`: panah kiri/kanan berpindah pilihan, dan satu-satunya
 * elemen yang bisa difokus adalah pilihan yang sedang terpilih (pola roving tabindex).
 * Dipakai memilih status karyawan di halaman ubah.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
  'aria-label': ariaLabel,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  'aria-label': string;
  className?: string;
}): JSX.Element {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const pindah = (arah: 1 | -1) => {
    const i = options.findIndex((o) => o.value === value);
    const berikut = options[(i + arah + options.length) % options.length];
    onChange(berikut.value);
    refs.current[berikut.value]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      // Tinggi kontrol 32px seperti kontrol lain di halaman yang sudah dipindahkan; isian
      // 3px di tiap sisi membuat tombol di dalamnya 26px tanpa angka itu ditulis di sini.
      className={cn(
        'inline-flex h-8 items-center gap-0.5 rounded-group bg-surface-sunken p-0.75',
        disabled && 'opacity-45',
        className
      )}
    >
      {options.map((option) => {
        const terpilih = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[option.value] = el;
            }}
            type="button"
            role="radio"
            aria-checked={terpilih}
            tabIndex={terpilih ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                pindah(1);
              }
              if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                pindah(-1);
              }
            }}
            className={cn(
              'inline-flex h-full items-center rounded-md px-2.75 text-sm transition-colors duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25',
              terpilih && 'font-semibold shadow-sm',
              terpilih && (option.tone ? WARNA[option.tone] : 'bg-surface text-foreground'),
              !terpilih && 'text-foreground-muted hover:text-foreground',
              disabled && 'cursor-not-allowed'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default Segmented;
