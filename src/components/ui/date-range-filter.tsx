import dayjs from 'dayjs';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';

import { cn } from '@/lib/cn';

export type DateRange = [Date | null, Date | null];

/** "1—9 Sep", atau "9 Sep 2026" kalau keduanya sama hari. Tahun disembunyikan bila tahun ini. */
function labelOf([from, to]: DateRange): string {
  if (!from) return 'Semua tanggal';
  const sameYear = dayjs(from).year() === dayjs().year();
  const fmt = sameYear ? 'D MMM' : 'D MMM YYYY';
  if (!to || dayjs(from).isSame(to, 'day')) return dayjs(from).format(fmt);
  return `${dayjs(from).format('D MMM')} — ${dayjs(to).format(fmt)}`;
}

const Trigger = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; label: string }>(
  ({ onClick, label }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-border-strong bg-surface px-2.5 text-base',
        'transition-colors duration-fast hover:bg-surface-raised',
        'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25'
      )}
    >
      <CalendarDays size={16} className="text-foreground-subtle" aria-hidden />
      {label}
      <ChevronDown size={14} className="text-foreground-subtle" aria-hidden />
    </button>
  )
);

Trigger.displayName = 'DateRangeTrigger';

/**
 * Satu tombol yang membuka kalender rentang, bukan dua kotak tanggal berdampingan.
 * Dua kotak memaksa pengguna memilih dua kali untuk satu maksud ("minggu ini"), dan
 * memakan lebar toolbar yang dibutuhkan pencarian.
 */
export function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}): JSX.Element {
  const [from, to] = value;
  return (
    <DatePicker
      selectsRange
      startDate={from}
      endDate={to}
      // Setiap pembaruan diteruskan, termasuk saat baru satu ujung dipilih. `selectsRange`
      // dikendalikan lewat startDate/endDate, jadi menahan pembaruan setengah-rentang
      // membuat startDate tidak pernah tersimpan dan rentangnya tidak pernah bisa selesai.
      // Yang menunggu kedua ujung adalah pemanggilnya, saat menyusun query.
      onChange={(range) => onChange(range as DateRange)}
      isClearable={false}
      maxDate={new Date()}
      popperClassName="!z-20"
      customInput={<Trigger label={labelOf(value)} />}
    />
  );
}

export default DateRangeFilter;
