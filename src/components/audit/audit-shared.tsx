import { Lock } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/cn';
import { AuditsData } from '@/typings/audit';

/**
 * Jatah kirim per barang per hari.
 *
 * Bukan angka pilihan tampilan: `ItemAuditPolicy::update` menolak permintaan petugas
 * gudang begitu `update_count` mencapai 3. Layar ini hanya memperlihatkan aturan yang
 * sudah berlaku di backend.
 */
export const KESEMPATAN_MAKS = 3;

export const sudahDihitung = (row: AuditsData): boolean => row.update_count > 0;

export const terkunci = (row: AuditsData): boolean => row.update_count >= KESEMPATAN_MAKS;

/**
 * Selisih hitungan terhadap stok sistem.
 *
 * `null` ketika stok sistem tidak ikut dikirim — `ItemAudit::defaultView` memang tidak
 * mengirimkannya ke petugas gudang supaya hitungannya buta. Yang tetap diketahui kedua
 * peran adalah COCOK atau TIDAK (`is_valid`, dihitung backend), bukan selisihnya.
 */
export const selisihAudit = (row: AuditsData): number | null =>
  row.item_quantity === undefined || row.item_quantity === null ? null : +row.audit_quantity - +row.item_quantity;

export type StatusAudit = { label: string; variant: 'neutral' | 'success' | 'destructive' };

export const statusAudit = (row: AuditsData): StatusAudit => {
  if (row.is_approved) return { label: 'Disetujui', variant: 'success' };
  if (!sudahDihitung(row)) return { label: 'Belum dihitung', variant: 'neutral' };
  if (row.is_valid) return { label: 'Cocok', variant: 'success' };

  const beda = selisihAudit(row);
  if (beda === null) return { label: 'Selisih', variant: 'destructive' };
  return { label: `Selisih ${beda > 0 ? '+' : '−'}${Math.abs(beda)}`, variant: 'destructive' };
};

/**
 * Sisa kesempatan sebagai titik, bukan kalimat.
 *
 * Yang perlu dibaca sambil menghitung cuma "masih ada" atau "tinggal sedikit"; angkanya
 * baru penting di kesempatan terakhir, dan di situ warnanya berubah.
 */
export function Kesempatan({ terpakai, className }: { terpakai: number; className?: string }): JSX.Element {
  const habis = terpakai >= KESEMPATAN_MAKS;
  const terakhir = terpakai === KESEMPATAN_MAKS - 1;

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="inline-flex gap-0.75" aria-hidden>
        {Array.from({ length: KESEMPATAN_MAKS }, (_, i) => (
          <span
            key={i}
            className={cn(
              'size-1.5 rounded-full',
              i >= terpakai && 'border border-border-strong',
              i < terpakai && (terakhir ? 'bg-warning' : 'bg-foreground-subtle')
            )}
          />
        ))}
      </span>
      <span className={cn('text-xs text-foreground-subtle', terakhir && 'text-warning')}>
        {habis ? (
          <span className="inline-flex items-center gap-1">
            <Lock size={11} strokeWidth={2} aria-hidden />
            terkunci
          </span>
        ) : (
          `${KESEMPATAN_MAKS - terpakai} tersisa`
        )}
      </span>
    </span>
  );
}
