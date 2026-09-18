import dayjs from 'dayjs';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { forwardRef, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

export type DateRange = [Date | null, Date | null];

/**
 * Rentang yang bisa dipilih sekali klik.
 *
 * Urutannya dari yang paling sempit ke paling lebar, dan yang berbasis BULAN sengaja ada
 * dua: buku besar dibaca per periode akuntansi, dan "bulan lalu" adalah periode yang
 * dipakai saat menutup buku. Rentang "n hari terakhir" tidak bisa menggantikannya.
 */
const PRESET: { label: string; rentang: () => DateRange }[] = [
  { label: 'Hari ini', rentang: () => [dayjs().startOf('day').toDate(), dayjs().endOf('day').toDate()] },
  {
    label: 'Kemarin',
    rentang: () => [
      dayjs().subtract(1, 'day').startOf('day').toDate(),
      dayjs().subtract(1, 'day').endOf('day').toDate(),
    ],
  },
  {
    label: '7 hari terakhir',
    rentang: () => [dayjs().subtract(6, 'day').startOf('day').toDate(), dayjs().endOf('day').toDate()],
  },
  { label: 'Bulan ini', rentang: () => [dayjs().startOf('month').toDate(), dayjs().endOf('day').toDate()] },
  {
    label: 'Bulan lalu',
    rentang: () => [
      dayjs().subtract(1, 'month').startOf('month').toDate(),
      dayjs().subtract(1, 'month').endOf('month').toDate(),
    ],
  },
  { label: 'Tahun ini', rentang: () => [dayjs().startOf('year').toDate(), dayjs().endOf('day').toDate()] },
  {
    label: '1 tahun terakhir',
    rentang: () => [dayjs().subtract(1, 'year').startOf('day').toDate(), dayjs().endOf('day').toDate()],
  },
];

/** Nama preset yang cocok dengan rentang ini, atau `undefined` kalau dipilih manual. */
function presetAktif([from, to]: DateRange): string | undefined {
  if (!from || !to) return undefined;
  return PRESET.find(({ rentang }) => {
    const [a, b] = rentang();
    return dayjs(from).isSame(a, 'day') && dayjs(to).isSame(b, 'day');
  })?.label;
}

/**
 * Nama presetnya kalau rentangnya memang salah satu preset, kalau tidak tanggalnya:
 * "1 — 9 Sep", atau "9 Sep 2026" kalau keduanya sama hari. Tahun disembunyikan bila
 * tahun ini.
 *
 * Nama lebih dulu karena ia menyebut MAKSUDNYA. "Bulan ini" terbaca sekali lihat,
 * sedangkan "1 Sep — 11 Sep 2026" harus dibaca dulu baru dimengerti — dan panjangnya
 * berubah-ubah, yang membuat lebar pemicunya ikut melompat tiap kali rentangnya diganti.
 */
function labelOf(value: DateRange): string {
  const nama = presetAktif(value);
  if (nama) return nama;

  const [from, to] = value;
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
 * Kalender dipindahkan ke <body>.
 *
 * Bawaannya ia disisipkan sebagai saudara pemicu, jadi setiap leluhur yang memotong
 * isinya — `overflow-hidden` di kartu atau di wadah isi halaman — ikut memotong
 * kalendernya, dan tidak ada perhitungan posisi yang bisa menyelamatkannya. Di body ia
 * tidak punya leluhur yang memotong; posisinya tetap dihitung popper terhadap pemicunya.
 */
function KalenderDiBody({ children }: { children: React.ReactNode }): JSX.Element | null {
  // Render pertama di server tidak punya document; popper baru bekerja setelah mount.
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

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
  const aktif = presetAktif(value);

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
      // Kalender dipatok ke ujung KANAN pemicunya. Dengan penempatan bawaan
      // (`bottom-start`) ia tumbuh ke kanan dari tepi kiri pemicu — dan karena pemicunya
      // sendiri sudah menempel di tepi kanan toolbar, kalender 328px itu selalu melewati
      // batas halaman lalu terpotong. Makin pendek labelnya makin parah: begitu satu
      // ujung rentang dihapus, tepi kiri pemicu bergeser ke kanan dan potongannya
      // bertambah — persis keadaan yang dilaporkan.
      popperPlacement="bottom-end"
      // Penempatan saja ternyata belum cukup jaminan. `altAxis` menyuruh popper
      // MENGGESER kalender di sumbu-x sampai ia muat di dalam batas layarnya, apa pun
      // lebar jendela dan seberapa pendek label pemicunya — jadi terpotong tidak lagi
      // bergantung pada perhitungan penempatan yang benar.
      popperModifiers={[
        { name: 'preventOverflow', options: { padding: 12, altAxis: true, rootBoundary: 'viewport' } },
        { name: 'flip', options: { fallbackPlacements: ['top-end', 'bottom-start', 'top-start'] } },
      ]}
      popperContainer={KalenderDiBody}
      // Dengan `fixed`, posisinya dihitung terhadap viewport — bukan terhadap induk
      // berposisi yang kebetulan ada — sehingga menempel di pemicunya walau kalendernya
      // sekarang tinggal di body.
      popperProps={{ strategy: 'fixed' }}
      popperClassName="!z-20"
      // Animasi buka yang sama dengan datepicker di form — tanpa ini kalender muncul
      // seketika sementara semua menu lain di aplikasi meluncur masuk.
      calendarClassName="datepicker-kalender"
      customInput={<Trigger label={labelOf(value)} />}
    >
      {/* Daftar preset hidup DI DALAM popover kalender, bukan sebagai tombol terpisah di
            toolbar. Tombol terpisah memakan lebar yang dibutuhkan kotak cari, dan hanya
            satu-dua yang muat — sisanya tidak pernah bisa ditawarkan. Di sini jumlahnya
            bisa tumbuh tanpa mengubah apa pun di halaman. */}
      {/* Tanpa padding dan tanpa radius: latar pilihan yang sedang aktif harus penuh dari
          tepi ke tepi kolomnya, seperti daftar menu. Garis pemisah dan tinggi kolomnya
          diatur di datepicker.css, karena wadahnya milik react-datepicker. */}
      <div className="flex w-full flex-col">
        {PRESET.map(({ label, rentang }) => (
          <button
            key={label}
            type="button"
            aria-current={label === aktif ? 'true' : undefined}
            onClick={() => {
              onChange(rentang());
              setOpen(false);
            }}
            className={cn(
              // `flex-1`: ketujuhnya berbagi tinggi kolom sama rata, jadi item terakhir
              // berakhir tepat di dasar kalender — tanpa ini latarnya berhenti di tengah
              // dan menyisakan ruang kosong yang terbaca seperti daftarnya terpotong.
              // Tingginya ikut kalender (5 atau 6 baris), jadi `min-h` menjaga sasaran
              // kliknya tetap layak saat bulannya pendek.
              'flex flex-1 min-h-[30px] items-center px-3 text-left text-base transition-colors duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40',
              label === aktif
                ? 'bg-accent-subtle font-medium text-accent'
                : 'text-foreground-muted hover:bg-surface-raised hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </DatePicker>
  );
}

export default DateRangeFilter;
