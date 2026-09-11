import dayjs, { Dayjs } from 'dayjs';
import { useId, useMemo, useState } from 'react';

import Skeleton from '@/components/ui/skeleton';
import { Datum } from '@/typings/ledgers';
import { formatNumber } from '@/utils/format';

/** SPEC-12: tinggi grafik 132px, sama seperti di berkas desain. */
const HEIGHT = 132;
/** Lebar viewBox — nilainya tidak penting karena SVG-nya melar, tapi harus tetap. */
const WIDTH = 560;
/** Ruang di atas puncak tertinggi supaya garisnya tidak menempel tepi kartu. */
const HEADROOM = 8;

type Bucket = { label: string; masuk: number; keluar: number };

/**
 * Arus kas harian dari akun Kas di buku besar.
 *
 * Masuk = sisi debit, keluar = sisi kredit — bukan penjualan dikurangi persediaan.
 * Kartu ini berjudul "Arus kas", jadi yang dihitung memang uang yang berpindah di akun
 * Kas: penjualan tunai, pembayaran utang, pembelian tunai. Penjualan kredit tidak
 * pernah menyentuh Kas dan memang tidak boleh muncul di sini.
 */
export function bucketByDay(rows: Datum[] | undefined, start: Dayjs, end: Dayjs): Bucket[] | undefined {
  if (!rows) return undefined;

  const days = Math.max(0, end.startOf('day').diff(start.startOf('day'), 'day'));
  const buckets = new Map<string, Bucket>();
  for (let i = 0; i <= days; i += 1) {
    const d = start.startOf('day').add(i, 'day');
    buckets.set(d.format('YYYY-MM-DD'), { label: d.format('D MMM'), masuk: 0, keluar: 0 });
  }

  rows.forEach(({ created_at, type, amount }) => {
    const key = dayjs(created_at).format('YYYY-MM-DD');
    const bucket = buckets.get(key);
    // Baris di luar rentang tidak dibuat-buatkan ember baru: kalau backend mengirim
    // sesuatu di tepi rentang karena zona waktu, ia diabaikan, bukan menggeser sumbu.
    if (!bucket) return;
    if (type === 'debit') bucket.masuk += amount;
    else bucket.keluar += amount;
  });

  return Array.from(buckets.values());
}

/** Titik-titik jadi koordinat. Kedua seri memakai skala yang sama supaya bisa dibandingkan. */
function toPoints(values: number[], max: number): { x: number; y: number }[] {
  const step = values.length > 1 ? WIDTH / (values.length - 1) : 0;
  const plot = HEIGHT - HEADROOM;
  return values.map((v, i) => ({
    x: values.length > 1 ? i * step : WIDTH / 2,
    y: max === 0 ? HEIGHT : HEIGHT - (v / max) * plot,
  }));
}

const lineOf = (pts: { x: number; y: number }[]) =>
  pts.map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

const areaOf = (pts: { x: number; y: number }[]) =>
  pts.length === 0 ? '' : `${lineOf(pts)} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

/**
 * Label hari yang muat. Tujuh sudah membuat sumbu penuh pada lebar kartu ini.
 *
 * Yang dikembalikan HANYA label yang dipakai, bukan satu slot per hari yang sebagian
 * dikosongkan: pada rentang tiga bulan, seratus slot `flex-1` menyisakan delapan piksel
 * untuk tiap label dan ketujuh label yang tersisa pun ikut terpotong jadi "1…" dan "5.".
 * Deretnya dirapatkan dengan `justify-between`, jadi label pertama duduk di ujung kiri
 * dan yang terakhir di ujung kanan — sejajar dengan ujung garisnya.
 */
function thinLabels(buckets: Bucket[]): string[] {
  const MAX = 7;
  if (buckets.length <= MAX) return buckets.map((b) => b.label);
  const step = (buckets.length - 1) / (MAX - 1);
  return Array.from({ length: MAX }, (_, i) => buckets[Math.round(i * step)].label);
}

export function CashFlowCard({ buckets }: { buckets?: Bucket[] }): JSX.Element {
  // Dua gradien per kartu, dan idnya harus unik di seluruh dokumen — kalau kartu ini
  // pernah dipakai dua kali, id yang sama membuat yang kedua memakai isian yang pertama.
  const uid = useId().replace(/:/g, '');

  const chart = useMemo(() => {
    if (!buckets || buckets.length === 0) return null;
    const max = Math.max(...buckets.flatMap((b) => [b.masuk, b.keluar]), 0);
    return {
      max,
      masuk: toPoints(
        buckets.map((b) => b.masuk),
        max
      ),
      keluar: toPoints(
        buckets.map((b) => b.keluar),
        max
      ),
    };
  }, [buckets]);

  const totalMasuk = buckets?.reduce((t, b) => t + b.masuk, 0);
  const totalKeluar = buckets?.reduce((t, b) => t + b.keluar, 0);

  // Hari yang sedang ditunjuk kursor. Grafiknya tidak punya sumbu nilai, jadi tanpa ini
  // yang bisa dibaca hanya bentuknya — angka per harinya tidak pernah bisa dilihat.
  const [hover, setHover] = useState<number | null>(null);

  const onPoint = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!buckets || buckets.length === 0) return;
    const box = e.currentTarget.getBoundingClientRect();
    const rasio = (e.clientX - box.left) / box.width;
    // Dibulatkan, bukan dipotong: titik terdekat yang dimaksud, bukan ember yang sedang
    // dilewati — di ujung kanan keduanya berbeda satu hari.
    const i = Math.round(rasio * (buckets.length - 1));
    setHover(Math.min(buckets.length - 1, Math.max(0, i)));
  };

  // Persen, bukan piksel: lebar SVG mengikuti lebar kartu, tingginya tetap 132px dan
  // viewBox-nya juga 132 — jadi koordinat y bisa dipakai apa adanya sebagai piksel.
  const kiriPersen = (i: number) => (buckets && buckets.length > 1 ? (i / (buckets.length - 1)) * 100 : 50);

  /**
   * Tooltip diletakkan di SEBERANG garis penunjuk, bukan di tengahnya: separuh kiri
   * ditunjuk, tooltipnya ke kanan, dan sebaliknya.
   *
   * Yang rata tengah akan menaungi garisnya sendiri — dan pada hari bernilai tinggi,
   * titik "Masuk" yang justru sedang dibaca tertutup kotaknya. Cara ini sekaligus
   * membuatnya tidak pernah keluar dari kartu, jadi tidak perlu penjepit di tepi.
   */
  const geserTooltip = (persen: number) => (persen <= 50 ? 'calc(0% + 8px)' : 'calc(-100% - 8px)');

  return (
    // SPEC-09: kartu, padding 14/16, kolom gap 10px
    <div className="flex min-w-0 flex-col gap-2.5 rounded-card border border-border bg-surface px-4 py-3.5 shadow-sm">
      {/* SPEC-10 */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-base font-semibold">Arus kas</span>
        <div className="flex gap-3">
          <Legend color="bg-accent" label="Masuk" total={totalMasuk} />
          <Legend color="bg-info" label="Keluar" total={totalKeluar} />
        </div>
      </div>

      {chart === null && (
        // Dua balok, bukan satu: baris label hari setinggi 16px juga bagian dari kartu,
        // dan tanpa penggantinya kartu melonjak 26px begitu datanya datang.
        <>
          <Skeleton className="h-[132px] w-full" />
          <Skeleton className="h-4 w-full" />
        </>
      )}

      {/* Semua nol: garis datar di dasar kotak setinggi 132px terbaca seperti grafik yang
          gagal dimuat, bukan seperti "memang tidak ada apa-apa". Sumbu harinya tetap
          ditampilkan supaya tinggi kartunya tidak berubah saat rentang diganti. */}
      {chart !== null && chart.max === 0 && (
        <div className="flex h-[132px] items-center justify-center">
          <p className="text-sm text-foreground-muted">Tidak ada kas masuk atau keluar dalam rentang ini.</p>
        </div>
      )}

      {chart !== null && chart.max > 0 && (
        <div
          className="relative"
          onPointerMove={onPoint}
          onPointerLeave={() => setHover(null)}
          // Grafiknya bukan kontrol, jadi tidak diberi peran atau fokus sendiri —
          // seluruh angkanya sudah terbaca screen reader lewat aria-label di <svg>.
        >
          {/* SPEC-12. preserveAspectRatio="none" supaya grafiknya mengisi lebar kartu
              berapa pun, seperti di berkas desain — garisnya ikut melar, dan itu memang
              yang diinginkan untuk bentuk tren tanpa sumbu nilai. */}
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            className="block h-[132px] w-full"
            role="img"
            aria-label={`Arus kas: masuk ${formatNumber(totalMasuk ?? 0)}, keluar ${formatNumber(totalKeluar ?? 0)}`}
          >
            <defs>
              <linearGradient id={`masuk-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.26" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id={`keluar-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--info))" stopOpacity="0.22" />
                <stop offset="100%" stopColor="hsl(var(--info))" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            <path d={areaOf(chart.masuk)} fill={`url(#masuk-${uid})`} />
            <path
              d={lineOf(chart.masuk)}
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path d={areaOf(chart.keluar)} fill={`url(#keluar-${uid})`} />
            <path
              d={lineOf(chart.keluar)}
              fill="none"
              stroke="hsl(var(--info))"
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Penanda dan tooltip digambar sebagai elemen HTML di ATAS grafik, bukan di
              dalam <svg>. Karena `preserveAspectRatio="none"`, apa pun yang digambar di
              dalam SVG ikut dilebarkan mengikuti lebar kartu — lingkaran akan jadi
              lonjong dan garis tegaknya menebal. Di luar SVG, ukurannya tetap. */}
          {hover !== null && buckets && (
            <>
              <div
                className="pointer-events-none absolute top-0 w-px bg-border-strong"
                style={{ left: `${kiriPersen(hover)}%`, height: HEIGHT }}
                aria-hidden
              />
              <Dot y={chart.masuk[hover].y} left={kiriPersen(hover)} className="bg-accent" />
              <Dot y={chart.keluar[hover].y} left={kiriPersen(hover)} className="bg-info" />

              <div
                className="pointer-events-none absolute top-0 z-10 flex flex-col gap-0.75 whitespace-nowrap rounded-control border border-border bg-surface px-2 py-1.25 shadow-md"
                style={{
                  left: `${kiriPersen(hover)}%`,
                  transform: `translateX(${geserTooltip(kiriPersen(hover))})`,
                }}
              >
                <span className="text-2xs font-bold text-foreground-subtle">{buckets[hover].label}</span>
                <TooltipRow color="bg-accent" label="Masuk" value={buckets[hover].masuk} />
                <TooltipRow color="bg-info" label="Keluar" value={buckets[hover].keluar} />
              </div>
            </>
          )}
        </div>
      )}

      {/* SPEC-13 */}
      {chart !== null && (
        <div className="flex justify-between gap-2 text-xs text-foreground-subtle">
          {thinLabels(buckets ?? []).map((label, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <span key={i} className="whitespace-nowrap">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Titik penanda di garis. 7px, dengan cincin sewarna latar supaya terbaca di atas area. */
function Dot({ y, left, className }: { y: number; left: number; className: string }): JSX.Element {
  return (
    <div
      className={`pointer-events-none absolute size-1.75 rounded-full ring-2 ring-surface ${className}`}
      style={{ top: y, left: `${left}%`, transform: 'translate(-50%, -50%)' }}
      aria-hidden
    />
  );
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: number }): JSX.Element {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={`size-1.75 shrink-0 rounded-[2px] ${color}`} aria-hidden />
      <span className="text-foreground-muted">{label}</span>
      <span className="ml-auto pl-3 font-mono tabular-nums text-foreground">{formatNumber(value)}</span>
    </span>
  );
}

/** SPEC-11. Totalnya ikut ditulis: bentuk garis tanpa satu angka pun tidak bisa dibaca. */
function Legend({ color, label, total }: { color: string; label: string; total?: number }): JSX.Element {
  return (
    <span className="flex items-center gap-1.25 text-xs text-foreground-muted">
      <span className={`size-1.75 rounded-[2px] ${color}`} aria-hidden />
      {label}
      {total !== undefined && <span className="font-mono tabular-nums text-foreground">{formatNumber(total)}</span>}
    </span>
  );
}

export default CashFlowCard;
