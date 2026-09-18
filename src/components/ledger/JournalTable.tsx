import dayjs from 'dayjs';
import { Eye, Info } from 'lucide-react';
import React from 'react';

import { GOLONGAN, GOLONGAN_LEGENDA, golonganAkun } from '@/components/ledger/accounts';
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

/** Lebar tiap sel skeleton, mengikuti bentuk isi kolomnya. Indeks 1 = kolom Akun. */
const SKELETON_SEL: [string, string][] = [
  ['w-10', ''],
  ['w-24', ''],
  ['w-28', ''],
  ['w-24', 'ml-auto'],
  ['w-24', 'ml-auto'],
  ['w-24', 'ml-auto'],
  ['w-[26px]', 'ml-auto'],
];

/** Penanda sumber yang berbentuk kode dokumen, mis. TRDO2609075 — bukan kata seperti "Beban". */
const KODE = /^[A-Z0-9/-]+$/;

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
  hideAccount = false,
  selectedSourceId,
  onSelect,
  empty,
  pagination,
}: {
  rows?: Datum[];
  loading: boolean;
  perPage: number;
  /** Buku besar satu akun: kolom Akun dibuang karena isinya sama di setiap baris. */
  hideAccount?: boolean;
  /** `source.id` ayat yang sheet-nya sedang terbuka — seluruh barisnya ikut ditandai. */
  selectedSourceId?: string | null;
  onSelect: (row: Datum) => void;
  empty: React.ReactNode;
  pagination: React.ReactNode;
}): JSX.Element {
  const kolom = hideAccount ? 6 : 7;
  const skeletonSel = hideAccount ? SKELETON_SEL.filter((_, i) => i !== 1) : SKELETON_SEL;

  return (
    <div className="flex flex-col gap-3">
      {/* SPEC-12 */}
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-raised">
                {/* SPEC-14: lebar kolom dibiarkan seperti di /transaction — tidak ada
                    yang dipatok kecuali Aksi, dan `table-layout: auto` membagi sisa ruang
                    ke semuanya. Dua tabel ini jadi berperilaku sama persis. */}
                <th scope="col" className={cn(TH, 'text-left')}>
                  Waktu
                </th>
                {!hideAccount && (
                  <th scope="col" className={cn(TH, 'text-left')}>
                    Akun
                  </th>
                )}
                <th scope="col" className={cn(TH, 'text-left')}>
                  Sumber
                </th>
                {/* Tiga kolom angka dipatok; sisanya tetap otomatis seperti di
                    /transaction. Dibiarkan otomatis, ketiganya melar sampai ~300px dan
                    angkanya berjauhan — padahal nominal terpanjang di sini hanya sekitar
                    70px. 150px memberi napas tanpa jadi ladang kosong. */}
                <th scope="col" style={{ width: '150px' }} className={cn(TH, 'text-right')}>
                  Debit
                </th>
                <th scope="col" style={{ width: '150px' }} className={cn(TH, 'text-right')}>
                  Kredit
                </th>
                <th scope="col" style={{ width: '150px' }} className={cn(TH, 'text-right')}>
                  Saldo
                </th>
                <th scope="col" style={{ width: '96px' }} className={cn(TH, 'text-right')}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Pemisah hari ikut ditakar, disisipkan tiap tiga baris. Jumlah persisnya
                mustahil diketahui sebelum datanya datang — ia sebanyak hari berbeda di
                halaman itu — tapi tanpa penakar ini tabelnya melonjak lebih dari 200px
                begitu data tiba. Disisipkan, bukan ditumpuk di atas: empat pita kosong
                berderet di kepala tabel terbaca seperti kesalahan render. */}
              {loading &&
                Array.from({ length: perPage }, (_, i) => (
                  // SPEC-35: setinggi baris sungguhan (43px), tanpa jarak antar baris.
                  //
                  // Tujuh sel, bukan satu `colSpan={7}`: tanpa sel per kolom, browser
                  // tidak punya apa pun untuk melebarkan kolomnya dan tabelnya menciut
                  // ke lebar isi — balok skeleton-nya berhenti di tengah kartu.
                  <React.Fragment key={i}>
                    {i % 3 === 0 && (
                      <tr aria-hidden>
                        <td colSpan={kolom} className="h-[41px] border-b border-border px-2.5">
                          {/* Sengaja kosong: ini penakar tinggi, bukan isi. */}
                        </td>
                      </tr>
                    )}
                    <tr>
                      {skeletonSel.map(([lebar, rata], i) => (
                        // 42px + 1px garis = 43px, tinggi baris terisi yang sebenarnya —
                        // yang ditentukan lencana akun (20px), bukan teksnya. Tanpa ini
                        // tabelnya melonjak 8px per baris begitu datanya datang.
                        // eslint-disable-next-line react/no-array-index-key
                        <td key={i} className={cn(TD, 'h-[42px] py-0')}>
                          <Skeleton className={cn('h-[18px]', lebar, rata)} />
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                ))}

              {!loading &&
                perHari(rows ?? []).map(({ tanggal, rows: harian }) => (
                  <React.Fragment key={tanggal}>
                    {/* SPEC-15 */}
                    <tr>
                      <td colSpan={kolom} className="border-b border-border px-2.5 pb-1.25 pt-2.75">
                        <span className="text-xs font-bold">{tanggal}</span>
                      </td>
                    </tr>
                    {harian.map((row) => (
                      <Baris
                        key={row.id}
                        row={row}
                        hideAccount={hideAccount}
                        aktif={!!row.source && row.source.id === selectedSourceId}
                        onSelect={onSelect}
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
  hideAccount,
  onSelect,
}: {
  row: Datum;
  aktif: boolean;
  hideAccount: boolean;
  onSelect: (row: Datum) => void;
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
      {!hideAccount && (
        <td className={TD}>
          <Badge variant={GOLONGAN[golongan].variant}>{row.description}</Badge>
        </td>
      )}
      {/* SPEC-19. Teks biasa, bukan tautan: satu baris sudah punya satu tujuan — tombol
          mata di kolom Aksi, yang membuka ayat jurnalnya beserta dokumen asalnya. Dua
          tujuan di satu baris membuat klik yang meleset sedikit mendarat di tempat lain.

          Kodenya saja, tanpa rincian: rinciannya sudah ada di ayat jurnal yang dibuka
          tombol mata, dan di kolom sesempit ini ia lebih sering terpotong daripada terbaca. */}
      <td className={cn(TD, 'text-sm')}>
        {row.source ? (
          <span className="flex items-baseline gap-1.5">
            <span
              className={cn(
                'whitespace-nowrap font-medium text-foreground',
                // Kode transaksi memakai font yang sama dengan kolom Kode di /transaction.
                // Hanya yang memang berbentuk kode — "Beban", "Prive", "Tutup buku" adalah
                // kata biasa, dan mono membuatnya terbaca seperti nomor dokumen.
                KODE.test(row.source.code ?? '') && 'font-mono'
              )}
            >
              {row.source.code}
            </span>
            {/* Tanpa penanda ini, ayat koreksi terbaca sebagai transaksi kedua dengan
                kode yang sama — arahnya saja yang terbalik. */}
            {row.is_reversal && (
              <Badge variant="destructive" className="flex-shrink-0">
                Koreksi
              </Badge>
            )}
          </span>
        ) : (
          <span className="text-foreground-subtle">—</span>
        )}
      </td>
      {/* SPEC-20. Debit dan kredit diberi warna berlawanan supaya arah tiap baris terbaca
          sebelum angkanya dibaca — dan karena keduanya selalu berpasangan, satu ayat
          terlihat utuh sambil mata menyapu ke bawah. Sel kosong tetap netral, dan kolom
          Saldo sengaja tidak ikut berwarna: ia bukan arah, melainkan posisi. */}
      <td
        className={cn(
          TD,
          'whitespace-nowrap text-right font-mono tabular-nums',
          debit === null ? 'text-foreground-subtle' : 'font-semibold text-destructive'
        )}
      >
        {debit === null ? '—' : formatNumber(debit)}
      </td>
      <td
        className={cn(
          TD,
          'whitespace-nowrap text-right font-mono tabular-nums',
          kredit === null ? 'text-foreground-subtle' : 'font-semibold text-success'
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
