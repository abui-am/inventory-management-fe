import { Check } from 'lucide-react';
import React from 'react';

import { BarisGaji } from '@/components/monthly-salary/rows';
import { Badge } from '@/components/ui/badge';

/**
 * Status pembayaran gaji, TIGA tingkat.
 *
 * Backend hanya punya dua (`Payroll::$statuses` — 'lunas' dan 'belum lunas'), sehingga
 * orang yang sudah dibayar separuh terbaca persis sama dengan yang belum dibayar sepeser
 * pun. Tingkat tengahnya diturunkan di sini dari `paid_amount` vs `employee_salary`, jadi
 * tidak ada status baru yang perlu ditambahkan di backend.
 */
export function StatusGaji({ baris }: { baris: BarisGaji }): JSX.Element {
  const label = (() => {
    if (baris.sisa === 0) return null;
    return baris.dibayar > 0 ? 'Dibayar sebagian' : 'Belum dibayar';
  })();

  return (
    <span className="inline-flex items-center gap-1.5">
      {label === null && (
        <Badge variant="success">
          <Check strokeWidth={2.6} aria-hidden /> Lunas
        </Badge>
      )}
      {label === 'Dibayar sebagian' && <Badge variant="warning">Dibayar sebagian</Badge>}
      {label === 'Belum dibayar' && <Badge variant="neutral">Belum dibayar</Badge>}

      {/* Bukan status tersendiri: keterangan dari mana uangnya sudah masuk. */}
      {baris.diMuka && <span className="text-xs text-foreground-subtle">di muka</span>}
    </span>
  );
}

export default StatusGaji;
