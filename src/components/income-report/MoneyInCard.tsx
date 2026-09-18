import { Banknote, FileText, Landmark } from 'lucide-react';
import React from 'react';

import { BarisBar, formatNumber } from '@/components/income-report/rows';
import Skeleton from '@/components/ui/skeleton';
import { IncomeUserReportChild } from '@/typings/income-report';

/**
 * Cara pembayaran penjualan, dan akun yang menerimanya.
 *
 * Urutannya sengaja: yang benar-benar jadi uang dulu, yang masih janji belakangan.
 * `debt` dan `current_account` ikut terhitung sebagai penjualan di laba rugi, padahal
 * uangnya belum ada — itulah satu-satunya alasan kartu ini dibuat.
 */
const METODE = [
  { key: 'cash' as const, label: 'Kas', Icon: Banknote, uang: true },
  { key: 'bank' as const, label: 'Bank', Icon: Landmark, uang: true },
  { key: 'debt' as const, label: 'Piutang', Icon: FileText, uang: false },
  { key: 'current_account' as const, label: 'Giro', Icon: Landmark, uang: false },
];

/**
 * Uang masuk dari penjualan, dipecah menurut cara bayarnya.
 *
 * "Penjualan 6.240.000" tidak menjawab berapa yang ada di laci sore ini; pertanyaan itu
 * yang dibawa orang saat menutup toko. Angkanya dijumlah dari `payment_methods` tiap
 * pengguna di `POST /income-report/user-report`.
 */
export function MoneyInCard({
  perUser,
  periodeHariIni,
  loading,
}: {
  perUser?: IncomeUserReportChild[];
  /** Judulnya menyebut "hari ini" hanya kalau rentangnya memang hari ini. */
  periodeHariIni: boolean;
  loading: boolean;
}): JSX.Element {
  const jumlah = METODE.map((m) => ({
    ...m,
    nilai: (perUser ?? []).reduce((total, u) => total + (u.income?.payment_methods?.[m.key] ?? 0), 0),
  }));

  const total = jumlah.reduce((a, b) => a + b.nilai, 0);
  const belumJadiUang = jumlah.filter((m) => !m.uang).reduce((a, b) => a + b.nilai, 0);
  const diterima = total - belumJadiUang;

  return (
    <div className="flex flex-col gap-0.5 rounded-card border border-border bg-surface px-3.5 py-3 shadow-sm">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold">Uang masuk {periodeHariIni ? 'hari ini' : 'periode ini'}</h2>
        {loading ? (
          <Skeleton className="h-3 w-20" />
        ) : (
          <span className="font-mono text-xs text-foreground-subtle">{formatNumber(total)}</span>
        )}
      </div>

      {loading &&
        Array.from({ length: 4 }, (_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="py-1.25">
            <Skeleton className="h-3.5 w-full" />
          </div>
        ))}

      {!loading && total === 0 && (
        <p className="py-2 text-sm text-foreground-subtle">
          Belum ada penjualan di periode ini, jadi belum ada uang yang masuk.
        </p>
      )}

      {!loading &&
        total > 0 &&
        jumlah.map((m) => (
          <BarisBar
            key={m.key}
            label={m.label}
            nilai={m.nilai}
            persen={Math.round((m.nilai / total) * 100)}
            tone={m.uang ? 'accent' : 'warning'}
            Icon={m.Icon}
          />
        ))}

      {!loading && belumJadiUang > 0 && (
        <p className="mt-1.5 text-xs leading-[17px] text-foreground-subtle">
          <span className="font-mono font-semibold text-warning">{formatNumber(belumJadiUang)}</span> di antaranya belum
          jadi uang — piutang customer dan giro yang belum cair. Yang benar-benar diterima{' '}
          <span className="font-mono">{formatNumber(diterima)}</span>.
        </p>
      )}
    </div>
  );
}

export default MoneyInCard;
