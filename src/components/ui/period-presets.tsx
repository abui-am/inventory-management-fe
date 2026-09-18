import dayjs from 'dayjs';
import React from 'react';

import { DateRange } from '@/components/ui/date-range-filter';
import { cn } from '@/lib/cn';

/** Rentang bawaan halaman laporan: hari ini. Keduanya paling sering dibuka saat tutup toko. */
export const rentangHariIni = (): DateRange => [dayjs().startOf('day').toDate(), dayjs().endOf('day').toDate()];

/**
 * Rentang yang paling sering dipakai di halaman laporan, sekali klik.
 *
 * Daftar preset di dalam popover kalender lebih panjang (`date-range-filter`); yang di sini
 * sengaja empat saja — ia tinggal di toolbar, dan toolbar tidak punya lebar untuk tujuh.
 */
export const PRESET_RENTANG: { label: string; rentang: () => DateRange }[] = [
  { label: 'Hari ini', rentang: rentangHariIni },
  {
    label: '7 hari',
    rentang: () => [dayjs().subtract(6, 'day').startOf('day').toDate(), dayjs().endOf('day').toDate()],
  },
  {
    label: '30 hari',
    rentang: () => [dayjs().subtract(29, 'day').startOf('day').toDate(), dayjs().endOf('day').toDate()],
  },
  { label: 'Bulan ini', rentang: () => [dayjs().startOf('month').toDate(), dayjs().endOf('day').toDate()] },
];

const samaHari = (a: Date | null, b: Date | null) => !!a && !!b && dayjs(a).isSame(b, 'day');

/** Nama preset yang cocok dengan rentang ini, atau `undefined` kalau dipilih manual. */
export const presetRentangAktif = ([dari, sampai]: DateRange): string | undefined =>
  PRESET_RENTANG.find(({ rentang }) => {
    const [a, b] = rentang();
    return samaHari(dari, a) && samaHari(sampai, b);
  })?.label;

/** Deretan tab rentang. Penanda aktifnya latar putih terangkat, sama dengan `FilterTabs`. */
export function PeriodPresets({ value, onChange }: { value: DateRange; onChange: (range: DateRange) => void }) {
  const aktif = presetRentangAktif(value);

  return (
    <div className="flex items-center gap-0.75 rounded-control bg-surface-raised p-0.75">
      {PRESET_RENTANG.map(({ label, rentang }) => (
        <button
          key={label}
          type="button"
          aria-pressed={aktif === label}
          onClick={() => onChange(rentang())}
          className={cn(
            'inline-flex h-6.5 items-center rounded-md px-2.25 text-sm transition-colors duration-fast',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
            aktif === label
              ? 'bg-surface font-semibold text-foreground shadow-sm'
              : 'text-foreground-muted hover:text-foreground'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default PeriodPresets;
