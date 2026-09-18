import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

import { BarisOrang, formatBertanda, jumlahkan, nadaSaldo } from '@/components/income-user-report/rows';
import Skeleton from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/** Angka laporan: nol ditulis "—" supaya kolom yang memang kosong tidak ikut dibaca. */
function Angka({ nilai, tone, tebal }: { nilai: number; tone?: 'saldo'; tebal?: boolean }): JSX.Element {
  if (nilai === 0) return <span className="font-mono tabular-nums text-foreground-subtle">—</span>;
  const nada = tone === 'saldo' ? nadaSaldo(nilai) : '';
  return (
    <span className={cn('font-mono tabular-nums', tebal ? 'font-bold' : 'font-semibold', nada)}>
      {formatBertanda(nilai)}
    </span>
  );
}

/** Inisial nama, bukan foto: backend tidak mengirim avatar dan halaman ini tidak butuh satu. */
function Inisial({ nama }: { nama: string }): JSX.Element {
  return (
    <span
      aria-hidden
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-xs font-bold text-accent"
    >
      {(nama.trim()[0] ?? '?').toUpperCase()}
    </span>
  );
}

/** Pecahan satu orang menurut cara bayar — dibuka dari barisnya. */
function Rincian({ baris }: { baris: BarisOrang }): JSX.Element {
  return (
    <tr>
      <td colSpan={5} className="border-b border-border bg-surface-raised px-2.5 py-2.5 pl-10">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className="pb-1 text-left text-xs font-bold text-foreground-subtle">
                  Dibayar melalui
                </th>
                {['Penjualan', 'Pembelian', 'Beban', 'Saldo'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="w-[150px] pb-1 text-right text-xs font-bold text-foreground-subtle"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {baris.metode.map((m) => (
                <tr key={m.label}>
                  <td className="border-b border-border-subtle py-1.5 pr-2.5 text-base text-foreground-muted">
                    {m.label}
                    {m.ket && <span className="block text-xs text-warning">{m.ket}</span>}
                  </td>
                  <td className="border-b border-border-subtle py-1.5 text-right">
                    <Angka nilai={m.jual} />
                  </td>
                  <td className="border-b border-border-subtle py-1.5 text-right">
                    <Angka nilai={m.beli} />
                  </td>
                  <td className="border-b border-border-subtle py-1.5 text-right">
                    <Angka nilai={m.beban} />
                  </td>
                  <td className="border-b border-border-subtle py-1.5 text-right">
                    <Angka nilai={m.saldo} tone="saldo" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs leading-[17px] text-foreground-subtle">
          Rincian beban {baris.nama} per jenis ada di halaman Beban; di sini hanya cara bayarnya.
        </p>
      </td>
    </tr>
  );
}

/**
 * Satu baris per orang, ukurannya jadi kolom.
 *
 * Layar lama menaruhnya terbalik — ukuran sebagai baris, orang sebagai kolom — sehingga tiap
 * karyawan baru menambah satu kolom dan tabelnya harus digulir ke samping dengan kolom
 * pertama dipaku. Empat tabnya (Pendapatan / Pembelian / Beban / Total Balance) juga lebur
 * ke sini: keempatnya sejak awal datang dari satu permintaan yang sama, jadi memecahnya jadi
 * empat layar hanya memaksa membandingkan empat halaman untuk satu pertanyaan.
 */
export function UserReportTable({
  baris,
  loading,
  kosong,
}: {
  baris: BarisOrang[];
  loading: boolean;
  kosong: React.ReactNode;
}): JSX.Element {
  const [buka, setBuka] = useState<string | null>(null);
  const total = jumlahkan(baris);

  return (
    <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-sm md:block">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-raised">
              <th scope="col" className={cn(TH, 'text-left')}>
                Nama
              </th>
              {['Penjualan', 'Pembelian', 'Beban'].map((h) => (
                <th key={h} scope="col" style={{ width: '170px' }} className={cn(TH, 'text-right')}>
                  {h}
                </th>
              ))}
              <th scope="col" style={{ width: '190px' }} className={cn(TH, 'text-right')}>
                Saldo
              </th>
            </tr>
          </thead>

          <tbody>
            {loading &&
              Array.from({ length: 3 }, (_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={i}>
                  {Array.from({ length: 5 }, (_, j) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <td key={j} className={TD}>
                      <div className="flex h-[26px] items-center">
                        <Skeleton className="h-3.5 w-full" />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && baris.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2.5 py-12 text-center">
                  {kosong}
                </td>
              </tr>
            )}

            {!loading &&
              baris.map((o) => {
                const terbuka = buka === o.nama;
                return (
                  <React.Fragment key={o.nama}>
                    <tr className="transition-colors duration-fast hover:bg-surface-raised">
                      <td className={cn(TD, 'max-w-0')}>
                        <button
                          type="button"
                          aria-expanded={terbuka}
                          onClick={() => setBuka(terbuka ? null : o.nama)}
                          className={cn(
                            'flex w-full items-center gap-2 text-left transition-colors duration-fast',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25'
                          )}
                        >
                          {terbuka ? (
                            <ChevronDown
                              size={12}
                              strokeWidth={1.9}
                              className="shrink-0 text-foreground-subtle"
                              aria-hidden
                            />
                          ) : (
                            <ChevronRight
                              size={12}
                              strokeWidth={1.9}
                              className="shrink-0 text-foreground-subtle"
                              aria-hidden
                            />
                          )}
                          <Inisial nama={o.nama} />
                          <span className="truncate font-medium" title={o.nama}>
                            {o.nama}
                          </span>
                        </button>
                      </td>
                      <td className={cn(TD, 'whitespace-nowrap text-right')}>
                        <Angka nilai={o.jual} />
                      </td>
                      <td className={cn(TD, 'whitespace-nowrap text-right')}>
                        <Angka nilai={o.beli} />
                      </td>
                      <td className={cn(TD, 'whitespace-nowrap text-right')}>
                        <Angka nilai={o.beban} />
                      </td>
                      <td className={cn(TD, 'whitespace-nowrap text-right')}>
                        <Angka nilai={o.saldo} tone="saldo" tebal />
                      </td>
                    </tr>
                    {terbuka && <Rincian baris={o} />}
                  </React.Fragment>
                );
              })}
          </tbody>

          {!loading && baris.length > 0 && (
            <tfoot>
              <tr className="bg-surface-raised">
                <td className="px-2.5 py-2 text-base font-bold">Semua orang</td>
                <td className="whitespace-nowrap px-2.5 py-2 text-right">
                  <Angka nilai={total.jual} tebal />
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 text-right">
                  <Angka nilai={total.beli} tebal />
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 text-right">
                  <Angka nilai={total.beban} tebal />
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 text-right">
                  <Angka nilai={total.saldo} tone="saldo" tebal />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export default UserReportTable;
