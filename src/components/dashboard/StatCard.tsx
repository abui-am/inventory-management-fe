import Tippy from '@tippyjs/react';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import Skeleton from '@/components/ui/skeleton';

/** Perbandingan terhadap periode sebelumnya — semuanya sudah diformat oleh pemanggil. */
export type Comparison = {
  /** Nilai periode sebelumnya. `undefined` = belum datang. */
  previous?: number;
  /** Nilai periode sebelumnya yang sudah diformat, untuk ditulis di tooltip. */
  previousText?: string;
  /** Rentang pembandingnya, mis. "28 Agu — 3 Sep". */
  period: string;
};

/**
 * Satu angka besar dengan judul kecil di atasnya dan lencana perubahan di sampingnya.
 *
 * `value` boleh `undefined` — artinya datanya belum datang, dan yang tampil adalah
 * balok skeleton seukuran angkanya. Menampilkan 0 selagi menunggu adalah berbohong:
 * "Pemasukan 0" dan "Pemasukan belum dihitung" adalah dua keadaan yang berbeda.
 */
export function StatCard({
  label,
  value,
  current,
  comparison,
}: {
  label: string;
  /** Sudah diformat. `undefined` = belum datang. */
  value?: string;
  /** Nilai periode ini, apa adanya — dipakai untuk menghitung perubahan. */
  current?: number;
  comparison?: Comparison;
}): JSX.Element {
  return (
    // SPEC-03: kartu 10px, padding 12/14, kolom gap 5px
    <div className="flex min-w-0 flex-col gap-1.25 rounded-card border border-border bg-surface px-3.5 py-3 shadow-sm">
      {/* SPEC-04: 11px/700 subtle, Kapital di awal saja */}
      <span className="text-xs font-bold text-foreground-subtle">{label}</span>

      {/* SPEC-05: baris rata garis dasar supaya angka dan lencana duduk sejajar */}
      <div className="flex items-baseline justify-between gap-2">
        {value === undefined ? (
          // 28px = tinggi baris `text-xl`, 90px = lebar "17.301.000" pada JetBrains Mono
          // 22px. Bukan `h-[22px] w-3/5` yang cuma kira-kira: kartu ikut bergeser tinggi
          // begitu angkanya datang.
          <Skeleton className="h-7 w-[90px]" />
        ) : (
          // SPEC-06: mono 22px/600, tracking rapat — angka panjang jadi tidak melebar
          <span className="truncate font-mono text-xl font-semibold tabular-nums tracking-[-0.02em]">{value}</span>
        )}
        <DeltaBadge current={current} comparison={comparison} />
      </div>
    </div>
  );
}

/** Perubahan dalam persen. `null` kalau tidak bisa dihitung — pembagi nol. */
function persen(now: number, before: number): number | null {
  if (before === 0) return null;
  return ((now - before) / before) * 100;
}

const angkaPersen = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * SPEC-07.
 *
 * Sebelumnya lencana ini hilang sama sekali begitu periode pembandingnya nol — dan
 * karena data uji semuanya jatuh di satu pekan, ia praktis tidak pernah muncul. Hilang
 * tanpa jejak adalah jawaban yang paling buruk: pengguna tidak bisa membedakan "tidak
 * ada perubahan" dari "pembandingnya memang kosong".
 *
 * Sekarang ada tiga keadaan, dan ketiganya bisa dijelaskan lewat tooltip:
 *   pembanding > 0  → persentase naik/turun
 *   pembanding = 0, sekarang > 0 → "Baru" — tidak ada yang bisa dibandingkan
 *   keduanya 0      → tidak ada lencana; tidak ada yang perlu dikabarkan
 */
function DeltaBadge({ current, comparison }: { current?: number; comparison?: Comparison }): JSX.Element | null {
  if (current === undefined || comparison?.previous === undefined) return null;

  const { previous, previousText, period } = comparison;
  const delta = persen(current, previous);

  if (delta === null) {
    if (current === 0) return null;
    return (
      <Tip content={`Tidak ada data pada ${period}, jadi tidak ada yang bisa dibandingkan.`}>
        <Badge variant="neutral" className="shrink-0">
          <ArrowRight strokeWidth={2.4} aria-hidden />
          Baru
        </Badge>
      </Tip>
    );
  }

  const naik = delta >= 0;
  const Icon = naik ? ArrowUp : ArrowDown;
  // U+2212 minus, bukan tanda hubung: di angka, hubung terbaca sebagai pemisah.
  const tanda = naik ? '+' : '−';
  const arah = naik ? 'lebih tinggi' : 'lebih rendah';

  return (
    <Tip content={`${angkaPersen(Math.abs(delta))}% ${arah} dari ${period}, yang tercatat ${previousText}.`}>
      {/* shrink-0: di dua kolom pada layar sempit, angka dan lencana berbagi satu baris —
          tanpa ini lencananya yang mengalah dan "−98,3%" terpotong jadi "−98,". */}
      <Badge variant={naik ? 'success' : 'destructive'} className="shrink-0">
        <Icon strokeWidth={2.4} aria-hidden />
        {tanda}
        {angkaPersen(Math.abs(delta))}%
      </Badge>
    </Tip>
  );
}

/**
 * Tippy butuh anak yang bisa memegang ref dan menerima event; `Badge` merender `span`
 * biasa, jadi ia dibungkus sekali di sini. `tabIndex` supaya keterangannya juga bisa
 * dibaca lewat papan ketik, bukan hanya dengan menggantung kursor di atasnya.
 */
function Tip({ content, children }: { content: string; children: JSX.Element }): JSX.Element {
  return (
    <Tippy content={content} placement="top" delay={[250, 0]} offset={[0, 6]} maxWidth={260}>
      {/* `button` bukan `span`: elemen yang bisa difokus papan ketik harus punya peran,
          kalau tidak pembaca layar mengumumkan sesuatu yang bisa difokus tapi tak bisa
          dipakai. Tippy memasang keterangannya sebagai `aria-describedby` di sini. */}
      <button
        type="button"
        className="inline-flex cursor-default rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </button>
    </Tippy>
  );
}

export default StatCard;
