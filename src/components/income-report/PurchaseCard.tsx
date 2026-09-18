import React from 'react';

import { Baris, BarisTotal } from '@/components/income-report/rows';
import Skeleton from '@/components/ui/skeleton';
import { IncomeReport } from '@/typings/income-report';

/**
 * Uang yang keluar untuk barang — sengaja DI LUAR laba rugi.
 *
 * Pertanyaan yang selalu muncul saat laporan dibaca: "labanya sekian, kenapa kasnya
 * berkurang lebih banyak?". Jawabannya pembelian barang, dan angkanya sudah dikirim
 * `IncomeReportController::index` sebagai `stock_ins` sejak awal tanpa pernah ditampilkan.
 */
export function PurchaseCard({
  stockIns,
  loading,
}: {
  stockIns?: IncomeReport['income_report']['stock_ins'];
  loading: boolean;
}): JSX.Element {
  const barang = stockIns?.purchases ?? 0;
  const ongkir = stockIns?.shipping_cost ?? 0;

  return (
    <div className="flex flex-col gap-0.5 rounded-card border border-border bg-surface px-3.5 py-3 shadow-sm">
      <h2 className="mb-1 text-base font-bold">Pembelian barang</h2>

      {loading ? (
        <div className="flex flex-col gap-2 py-1">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      ) : (
        <>
          {/* `purchases` sudah termasuk ongkirnya — ongkir ditampilkan terpisah supaya
              terlihat, jadi barisnya dikurangi dulu agar totalnya tidak dihitung dua kali. */}
          <Baris label="Barang dibeli" nilai={barang - ongkir} />
          <Baris label="Ongkir dibayar" nilai={ongkir} />
          <BarisTotal label="Uang keluar untuk barang" nilai={barang} />
          <p className="mt-1.5 text-xs leading-[17px] text-foreground-subtle">
            Tidak ikut mengurangi laba. Uang ini berubah jadi <span className="font-medium">Persediaan</span>, dan baru
            masuk laporan sebagai HPP ketika barangnya terjual.
          </p>
        </>
      )}
    </div>
  );
}

export default PurchaseCard;
