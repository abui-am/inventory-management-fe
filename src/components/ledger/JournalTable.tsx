import dayjs from 'dayjs';
import { Eye, Info } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { GOLONGAN, GOLONGAN_LEGENDA, golonganAkun, HALAMAN_SUMBER } from '@/components/ledger/accounts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { Datum } from '@/typings/ledgers';
import { formatNumber } from '@/utils/format';

// SPEC-13: 11px/700 subtle, padding 10px 10px 7px, garis bawah. `pt-*` ditulis tegas —
// preflight Tailwind tidak menyentuh padding `th`, jadi tanpa itu padding-atas jatuh ke
// bawaan browser (1px).
const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.5 text-xs font-bold text-foreground-subtle';
// SPEC-16: 13px, padding 8px 10px, garis bawah di SETIAP baris termasuk yang terakhir.
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/** Lebar tiap sel skeleton, mengikuti bentuk isi kolomnya. */
const SKELETON_SEL: [string, string][] = [
  ['w-10', ''],
  ['w-24', ''],
  ['w-48', ''],
  ['w-16', 'ml-auto'],
  ['w-16', 'ml-auto'],
  ['w-20', 'ml-auto'],
  ['w-[26px]', 'ml-auto'],
];

/** SPEC-15: baris dikelompokkan per hari. */
function perHari(rows: Datum[]): { tanggal: string; rows: Datum[] }[] {
  const groups: { tanggal: string; rows: Datum[] }[] = [];
  rows.forEach((row) => {
    const tanggal = dayjs(row.created_at).format('D MMM');
    const terakhir = groups[groups.length - 1];
    if (terakhir?.tanggal === tanggal) terakhir.rows.push(row);
    else groups.push({ tanggal, rows: [row] });
  });
  return groups;
}

export function JournalTable({
  rows,
  loading,
  perPage,
  selectedSourceId,
  onSelect,
  onOpenSource,
  empty,
  pagination,
}: {
  rows?: Datum[];
  loading: boolean;
  perPage: number;
  /** `source.id` ayat yang sheet-nya sedang terbuka — seluruh barisnya ikut ditandai. */
  selectedSourceId?: string | null;
  onSelect: (row: Datum) => void;
  /** Dipanggil saat penanda sumbernya ditekan — membuka rincian dokumen asalnya. */
  onOpenSource: (row: Datum) => void;
  empty: React.ReactNode;
  pagination: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      {/* SPEC-12 */}
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {/* SPEC-14 */}
                <th scope="col" style={{ width: 58 }} className={cn(TH, 'text-left')}>
                  Waktu
                </th>
                <th scope="col" className={cn(TH, 'whitespace-nowrap text-left')}>
                  Akun
                </th>
                <th scope="col" className={cn(TH, 'w-full text-left')}>
                  Sumber
                </th>
                <th scope="col" style={{ width: 120 }} className={cn(TH, 'text-right')}>
                  Debit
                </th>
                <th scope="col" style={{ width: 120 }} className={cn(TH, 'text-right')}>
                  Kredit
                </th>
                <th scope="col" style={{ width: 130 }} className={cn(TH, 'text-right')}>
                  Saldo
                </th>
                <th scope="col" style={{ width: 50 }} className={cn(TH, 'text-right')}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: perPage }, (_, i) => (
                  // SPEC-35: setinggi baris sungguhan (37.5px), tanpa jarak antar baris.
                  //
                  // Tujuh sel, bukan satu `colSpan={7}`: tanpa sel per kolom, browser
                  // tidak punya apa pun untuk melebarkan kolomnya dan tabelnya menciut
                  // ke lebar isi — balok skeleton-nya berhenti di tengah kartu.
                  <tr key={i}>
                    {SKELETON_SEL.map(([lebar, rata], kolom) => (
                      // 42px + 1px garis = 43px, tinggi baris terisi yang sebenarnya —
                      // yang ditentukan lencana akun (20px), bukan teksnya. Tanpa ini
                      // tabelnya melonjak 8px per baris begitu datanya datang.
                      // eslint-disable-next-line react/no-array-index-key
                      <td key={kolom} className={cn(TD, 'h-[42px] py-0')}>
                        <Skeleton className={cn('h-[18px]', lebar, rata)} />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading &&
                perHari(rows ?? []).map(({ tanggal, rows: harian }) => (
                  <React.Fragment key={tanggal}>
                    {/* SPEC-15 */}
                    <tr>
                      <td colSpan={7} className="border-b border-border px-2.5 pb-1.25 pt-2.75">
                        <span className="text-xs font-bold">{tanggal}</span>
                      </td>
                    </tr>
                    {harian.map((row) => (
                      <Baris
                        key={row.id}
                        row={row}
                        aktif={!!row.source && row.source.id === selectedSourceId}
                        onSelect={onSelect}
                        onOpenSource={onOpenSource}
                      />
                    ))}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && rows?.length === 0 && empty}
        {pagination}
      </div>

      <Legenda />
    </div>
  );
}

function Baris({
  row,
  aktif,
  onSelect,
  onOpenSource,
}: {
  row: Datum;
  aktif: boolean;
  onSelect: (row: Datum) => void;
  onOpenSource: (row: Datum) => void;
}): JSX.Element {
  const golongan = golonganAkun(row.description, row.source?.type);
  const debit = row.type === 'debit' ? row.amount : null;
  const kredit = row.type === 'credit' ? row.amount : null;

  return (
    // SPEC-23, SPEC-24
    <tr className={cn('transition-colors duration-fast', aktif ? 'bg-accent-subtle' : 'hover:bg-surface-raised')}>
      {/* SPEC-17 */}
      <td className={cn(TD, 'whitespace-nowrap font-mono tabular-nums text-foreground-muted')}>
        {dayjs(row.created_at).format('HH:mm')}
      </td>
      {/* SPEC-18 */}
      <td className={cn(TD, 'whitespace-nowrap')}>
        <Badge variant={GOLONGAN[golongan].variant}>{row.description}</Badge>
      </td>
      {/* SPEC-19 */}
      <td className={TD}>
        <Sumber row={row} onOpen={onOpenSource} />
      </td>
      {/* SPEC-20. Tanpa warna: kolomnya sudah bernama Debit dan Kredit, dan lencana akun
          di kiri sudah membawa warnanya sendiri. */}
      <td
        className={cn(
          TD,
          'whitespace-nowrap text-right font-mono tabular-nums',
          debit === null ? 'text-foreground-subtle' : 'font-semibold'
        )}
      >
        {debit === null ? '—' : formatNumber(debit)}
      </td>
      <td
        className={cn(
          TD,
          'whitespace-nowrap text-right font-mono tabular-nums',
          kredit === null ? 'text-foreground-subtle' : 'font-semibold'
        )}
      >
        {kredit === null ? '—' : formatNumber(kredit)}
      </td>
      {/* SPEC-21 */}
      <td className={cn(TD, 'whitespace-nowrap text-right font-mono tabular-nums text-foreground-muted')}>
        {formatNumber(row.remaining_balance)}
      </td>
      {/* SPEC-22: tanpa sumber tidak ada ayat yang bisa dikumpulkan, jadi tombolnya
          tidak ditampilkan — bukan ditampilkan lalu dimatikan. */}
      <td className={cn(TD, 'text-right')}>
        {row.source && (
          <Button size="icon-xs" variant="ghost" aria-label="Lihat ayat jurnal" onClick={() => onSelect(row)}>
            <Eye strokeWidth={1.7} aria-hidden />
          </Button>
        )}
      </td>
    </tr>
  );
}

/**
 * SPEC-19. Baris tanpa dokumen asal ditulis `—`, bukan ditautkan ke mana-mana.
 *
 * Yang ditampilkan hanya penandanya — kode transaksi — bukan kalimat lengkap
 * "Penjualan ke Kios Mekar Sari". Di tabel yang tiap transaksinya memakan empat baris
 * berturut-turut, kalimat itu terulang empat kali dan jadi dinding teks; nama
 * customernya toh ada di sheet yang dibuka tepat dari sini.
 */
function Sumber({ row, onOpen }: { row: Datum; onOpen: (row: Datum) => void }): JSX.Element {
  if (!row.source) return <span className="text-sm text-foreground-subtle">—</span>;

  const { type, code, label } = row.source;
  const teks = code ?? label ?? '—';

  // Transaksi punya sheet rinciannya sendiri, jadi ia dibuka DI SINI — daftar jurnalnya
  // tetap di belakang dan posisi bacanya tidak hilang. Sebelumnya ini tautan ke
  // /transaction, yang cuma mendaratkan orang di daftar 58 baris untuk mencari sendiri.
  if (type === 'transactions') {
    return (
      <button
        type="button"
        onClick={() => onOpen(row)}
        className="rounded-sm text-sm text-accent decoration-border-strong underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {teks}
      </button>
    );
  }

  const href = HALAMAN_SUMBER[type];
  if (!href) return <span className="text-sm text-foreground-muted">{teks}</span>;

  return (
    <Link href={href}>
      <a className="text-sm text-accent decoration-border-strong underline-offset-2 hover:underline">{teks}</a>
    </Link>
  );
}

/** SPEC-26 */
function Legenda(): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="flex items-center gap-1.25 text-xs text-foreground-subtle">
        <Info size={12} strokeWidth={1.9} aria-hidden />
        Tiap transaksi menulis dua baris: satu debit, satu kredit.
      </span>
      <span className="h-3 w-px bg-border" aria-hidden />
      {GOLONGAN_LEGENDA.map((key) => (
        <span key={key} className="flex items-center gap-1.25 text-xs text-foreground-muted">
          <span className={cn('size-1.75 rounded-[2px]', GOLONGAN[key].dot)} aria-hidden />
          {GOLONGAN[key].label}
        </span>
      ))}
    </div>
  );
}

export default JournalTable;
