import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';

/**
 * Progress bar tipis di tepi atas untuk perpindahan halaman.
 *
 * Menggantikan loader lama yang menutupi seluruh layar dengan bidang putih dan spinner
 * 80px: itu membuang konteks yang sedang dibaca pengguna, membuat perpindahan terasa
 * seperti muat ulang penuh, dan di mode gelap bidang putihnya menyilaukan.
 *
 * Panjangnya tidak bisa diketahui — Next tidak melaporkan progres — jadi ia merayap ke
 * 90% lalu menunggu, dan melompat ke 100% saat rute selesai. Pola yang sama dipakai
 * GitHub dan YouTube.
 */
export function ProgressBar({ active }: { active: boolean }): JSX.Element | null {
  const [value, setValue] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      setValue(8);
      // Merayap melambat: pertambahan mengecil seiring mendekati 90%, jadi tidak pernah
      // sampai dan tidak pernah berhenti total.
      const id = setInterval(() => setValue((v) => (v >= 90 ? v : v + Math.max(0.4, (90 - v) / 12))), 120);
      return () => clearInterval(id);
    }

    if (!visible) return undefined;

    setValue(100);
    const id = setTimeout(() => {
      setVisible(false);
      setValue(0);
    }, 240);
    return () => clearTimeout(id);
    // `visible` sengaja tidak jadi dependensi: menambahkannya membuat efek ini berjalan
    // ulang saat ia disetel di dalam efek yang sama.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <div
        className={cn('h-full bg-accent shadow-sm transition-[width,opacity] duration-slow ease-out')}
        style={{ width: `${value}%`, opacity: value === 100 ? 0 : 1 }}
      />
    </div>
  );
}

export default ProgressBar;
