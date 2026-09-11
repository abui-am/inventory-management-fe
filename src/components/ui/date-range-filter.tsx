import dayjs from 'dayjs';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { forwardRef, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';

import { cn } from '@/lib/cn';

export type DateRange = [Date | null, Date | null];

/** "1 — 9 Sep", atau "9 Sep 2026" kalau keduanya sama hari. Tahun disembunyikan bila tahun ini. */
function labelOf([from, to]: DateRange): string {
  if (!from) return 'Semua tanggal';
  const iniTahunIni = dayjs(from).year() === dayjs().year();
  const fmt = iniTahunIni ? 'D MMM' : 'D MMM YYYY';
  if (!to || dayjs(from).isSame(to, 'day')) return dayjs(from).format(fmt);

  // Kalau kedua ujungnya beda tahun, tahun WAJIB ikut di ujung kiri juga. Tanpa itu
  // rentang setahun penuh terbaca "11 Sep — 11 Sep 2026", yang tampak seperti satu hari.
  const bedaTahun = dayjs(from).year() !== dayjs(to).year();
  return `${dayjs(from).format(bedaTahun ? 'D MMM YYYY' : 'D MMM')} — ${dayjs(to).format(fmt)}`;
}

const Trigger = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; label: string }>(
  ({ onClick, label }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      // SPEC-20: 32px, radius 7, gap 8px, teks foreground-muted — sejajar dengan
      // kotak cari dan tombol di sebelahnya.
      className={cn(
        'inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-control border border-border-strong bg-surface px-2.5',
        'text-base text-foreground-muted transition-colors duration-fast hover:bg-surface-raised',
        'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25'
      )}
    >
      <CalendarDays size={14} strokeWidth={1.9} className="text-foreground-subtle" aria-hidden />
      {label}
      <ChevronDown size={12} strokeWidth={2.2} className="text-foreground-subtle" aria-hidden />
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
  const [open, setOpen] = useState(false);

  // Waktu terakhir react-datepicker menutup kalendernya sendiri karena klik di luar.
  //
  // Menekan pemicunya saat kalender terbuka menghasilkan DUA kejadian berurutan:
  // `mousedown` menutup kalender lewat onClickOutside, lalu `click` memanggil
  // onInputClick yang membukanya lagi. Hasilnya kalender tidak pernah bisa ditutup
  // lewat tombolnya — persis seperti yang dilaporkan. Stempel waktu ini yang membuat
  // klik kedua itu diabaikan, bukan dijadikan pembuka.
  const lastOutsideClose = useRef(0);

  return (
    <DatePicker
      selectsRange
      open={open}
      onInputClick={() => setOpen((prev) => (Date.now() - lastOutsideClose.current < 250 ? false : !prev))}
      onClickOutside={() => {
        lastOutsideClose.current = Date.now();
        setOpen(false);
      }}
      startDate={from}
      endDate={to}
      // Setiap pembaruan diteruskan, termasuk saat baru satu ujung dipilih. `selectsRange`
      // dikendalikan lewat startDate/endDate, jadi menahan pembaruan setengah-rentang
      // membuat startDate tidak pernah tersimpan dan rentangnya tidak pernah bisa selesai.
      // Yang menunggu kedua ujung adalah pemanggilnya, saat menyusun query.
      onChange={(range) => {
        onChange(range as DateRange);
        // Ditutup hanya setelah kedua ujung terpilih. `shouldCloseOnSelect` bawaan tidak
        // dipakai lagi begitu `open` dikendalikan dari sini.
        const [a, b] = range as DateRange;
        if (a && b) setOpen(false);
      }}
      isClearable={false}
      maxDate={new Date()}
      popperClassName="!z-20"
      // Animasi buka yang sama dengan datepicker di form — tanpa ini kalender muncul
      // seketika sementara semua menu lain di aplikasi meluncur masuk.
      calendarClassName="datepicker-kalender"
      customInput={<Trigger label={labelOf(value)} />}
    />
  );
}

export default DateRangeFilter;
