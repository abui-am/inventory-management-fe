import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';

const OPTIONS = [
  { value: 'light', label: 'Terang', Icon: Sun },
  { value: 'dark', label: 'Gelap', Icon: Moon },
  { value: 'system', label: 'Sistem', Icon: Monitor },
] as const;

/**
 * Pengalih tema. Tiga pilihan, bukan dua: "Sistem" mengikuti prefers-color-scheme
 * dan itulah bawaannya, sehingga pengguna yang perangkatnya sudah gelap langsung
 * dapat tema gelap tanpa memilih apa pun.
 *
 * `mounted` menahan render sampai setelah hidrasi: sebelum itu next-themes belum
 * tahu tema mana yang aktif, dan menebaknya menghasilkan ketidakcocokan hidrasi.
 */
export function ThemeToggle(): JSX.Element {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5"
      role="radiogroup"
      aria-label="Tema tampilan"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex h-6 w-6 items-center justify-center rounded-md transition duration-fast',
              active
                ? 'bg-accent-subtle text-accent'
                : 'text-foreground-subtle hover:bg-surface-raised hover:text-foreground'
            )}
          >
            <Icon size={14} strokeWidth={1.75} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;
