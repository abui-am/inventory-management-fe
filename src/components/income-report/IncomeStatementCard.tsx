import { Info } from 'lucide-react';
import React, { useState } from 'react';

import { Baris, BarisBar, BarisTotal, formatNumber, JudulSeksi } from '@/components/income-report/rows';
import Skeleton from '@/components/ui/skeleton';
import { IncomeReport, IncomeUserReportChild } from '@/typings/income-report';

type Laporan = IncomeReport['income_report'];

/**
 * Laba rugi satu rentang — sekaligus komposisi bebannya.
 *
 * Komposisi beban tidak berdiri sebagai kartu sendiri: daftarnya sama persis dengan seksi
 * Beban di sini, hanya ditambah persentase. Persentasenya dibawa ke barisnya masing-masing,
 * jadi satu daftar tetap satu daftar.
 *
 * Rincian per kasir dan per pencatat datang dari `POST /income-report/user-report`, bukan
 * dari laporan ini — `index()` tidak pernah mengirim pecahannya per pengguna.
 */
export function IncomeStatementCard({
  laporan,
  perUser,
  periode,
  loading,
}: {
  laporan?: Laporan;
  perUser?: IncomeUserReportChild[];
  periode: string;
  loading: boolean;
}): JSX.Element {
  const [bukaPenjualan, setBukaPenjualan] = useState(false);
  const [bukaBeban, setBukaBeban] = useState<string | null>(null);

  const penjualan = laporan?.incomes?.sales ?? 0;
  const hpp = laporan?.incomes?.hpp ?? 0;
  const diskon = laporan?.incomes?.discounts ?? 0;
  const ongkirDitagih = laporan?.incomes?.shipping_cost ?? 0;
  const pendapatanBersih = laporan?.total_income ?? 0;
  const totalBeban = laporan?.total_expense ?? 0;
  const laba = laporan?.total_profit ?? 0;

  const beban = laporan?.expenses ?? [];

  // Pecahan penjualan per kasir; pengguna tanpa penjualan di rentang ini tidak ditampilkan
  // karena barisnya akan berbunyi "0" tanpa memberi tahu apa pun.
  const kasir = (perUser ?? []).filter((u) => (u.income?.total_income ?? 0) > 0);

  const pencatatBeban = (nama: string) =>
    (perUser ?? [])
      .map((u) => ({ nama: u.name, jumlah: u.expense?.expenses?.find((e) => e.name === nama)?.amount ?? 0 }))
      .filter((r) => r.jumlah > 0);

  if (loading) {
    return (
      <div className="flex w-full flex-col gap-3.5 rounded-card border border-border bg-surface px-4.5 py-4 shadow-sm">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 9 }, (_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <Skeleton key={i} className="h-3.5 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3.5 rounded-card border border-border bg-surface px-4.5 py-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold">Laba rugi</h2>
        <span className="font-mono text-xs text-foreground-subtle">{periode}</span>
      </div>

      <div className="flex flex-col">
        <JudulSeksi>Pendapatan</JudulSeksi>
        <Baris
          label="Penjualan"
          nilai={penjualan}
          buka={kasir.length > 0 ? bukaPenjualan : undefined}
          onToggle={kasir.length > 0 ? () => setBukaPenjualan((v) => !v) : undefined}
        />
        {bukaPenjualan &&
          kasir.map((u) => <Baris key={u.name} label={u.name} nilai={u.income?.total_income ?? 0} anak indent={18} />)}
        <Baris label="HPP" nilai={hpp} tanda="−" />
        <Baris label="Diskon penjualan" nilai={diskon} tanda="−" />
        <BarisTotal label="Pendapatan bersih" nilai={pendapatanBersih} />
      </div>

      <div className="flex flex-col">
        <JudulSeksi>Beban</JudulSeksi>
        {beban.length === 0 && (
          <p className="py-2 text-sm text-foreground-subtle">Tidak ada beban tercatat di periode ini.</p>
        )}
        {beban.map((item) => {
          const pencatat = pencatatBeban(item.name);
          const terbuka = bukaBeban === item.name;
          return (
            <React.Fragment key={item.name}>
              <BarisBar
                label={item.name}
                nilai={+item.amount}
                persen={totalBeban > 0 ? Math.round((+item.amount / totalBeban) * 100) : 0}
                buka={pencatat.length > 0 ? terbuka : undefined}
                onToggle={pencatat.length > 0 ? () => setBukaBeban(terbuka ? null : item.name) : undefined}
              />
              {terbuka && pencatat.map((p) => <Baris key={p.nama} label={p.nama} nilai={p.jumlah} anak indent={18} />)}
            </React.Fragment>
          );
        })}
        <BarisTotal label="Total beban" nilai={totalBeban} tone="destructive" />
      </div>

      <div className="rounded-lg bg-surface-raised px-3.25 py-2.5">
        <BarisTotal
          label={laba >= 0 ? 'Laba bersih' : 'Rugi bersih'}
          nilai={Math.abs(laba)}
          tone={laba >= 0 ? 'success' : 'destructive'}
          besar
        />
        <p className="mt-1.25 text-xs text-foreground-subtle">
          Pendapatan bersih dikurangi semua beban di periode ini.
        </p>
      </div>

      {/* Dua ongkir yang sering tertukar: yang ditagih menambah penjualan, yang dibayar
          sendiri jadi beban. Keduanya ada di laporan ini, di dua tempat berbeda. */}
      <p className="flex items-start gap-1.75 border-t border-dashed border-border pt-2.25 text-xs leading-[17px] text-foreground-subtle">
        <Info size={12} strokeWidth={1.9} className="mt-0.5 shrink-0 text-foreground-muted" aria-hidden />
        <span>
          Ongkir <span className="font-mono text-foreground-muted">{formatNumber(ongkirDitagih)}</span> yang ditagih ke
          customer sudah ikut terhitung di Penjualan — sementara ongkir yang toko bayar sendiri muncul sebagai Beban
          Ongkir di atas.
        </span>
      </p>
    </div>
  );
}

export default IncomeStatementCard;
