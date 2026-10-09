import { Info } from 'lucide-react';
import React from 'react';

import { AngkaModal, formatAngka, formatBertanda, formatUtuh, nadaKontribusi } from '@/components/capital-report/rows';
import Skeleton from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

/**
 * Satu baris laporan, dengan TANDA yang diturunkan dari nilainya.
 *
 * Layar lama menumpuk keempat baris sebagai daftar datar tanpa tanda plus/minus, jadi
 * Prive — yang mengurangi modal — terbaca seolah menambahnya. Tandanya dihitung dari
 * kontribusi baris itu ke modal akhir, bukan dipaku per baris: "Laba ditahan" bisa
 * negatif kalau periodenya rugi, dan baris yang dipaku "+" akan menampilkannya terbalik.
 */
function Baris({
  label,
  nilai,
  ket,
  dasar,
}: {
  label: string;
  nilai: number;
  ket?: string;
  /** Baris dasar (Modal awal): bukan penambah maupun pengurang, jadi tanpa tanda. */
  dasar?: boolean;
}): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <span className="text-base text-foreground-muted">{label}</span>
        {ket && <div className="mt-px text-xs text-foreground-subtle">{ket}</div>}
      </div>
      <span className={cn('font-mono text-base font-semibold tabular-nums', !dasar && nadaKontribusi(nilai))}>
        {dasar ? formatAngka(nilai) : formatBertanda(nilai)}
      </span>
    </div>
  );
}

function BarisTotal({ label, nilai }: { label: string; nilai: number }): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-border pb-0.5 pt-2">
      <span className="text-lg font-bold">{label}</span>
      <span className="font-mono text-lg font-bold tabular-nums tracking-[-0.02em]">{formatUtuh(nilai)}</span>
    </div>
  );
}

/**
 * Kartu perubahan modal: modal awal, lalu yang menambah, lalu yang mengurangi, baru
 * modal akhir — susunan laporan perubahan modal yang sebenarnya.
 *
 * Dipakai tiga layar sekaligus (periode berjalan, layar tutup buku, dan laporan periode
 * yang sudah tersimpan) supaya ketiganya tidak pernah menyusun barisnya berbeda.
 */
export function CapitalCard({
  angka,
  modalAkhir,
  judul,
  ket,
  loading,
  denganDiambil,
  catatan,
  className,
}: {
  angka: AngkaModal;
  modalAkhir: number;
  judul: string;
  ket: string;
  loading?: boolean;
  /** Menampilkan baris "Laba diambil pemilik" — hanya untuk periode yang sudah ditutup. */
  denganDiambil?: boolean;
  /** Kalimat kaki kartu; dipakai periode berjalan untuk bilang angkanya belum di buku besar. */
  catatan?: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-card border border-border bg-surface px-4.5 py-4 shadow-sm',
        className
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="text-base font-bold">{judul}</span>
        <span className="font-mono text-xs text-foreground-subtle">{ket}</span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 5 }, (_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          <Baris label="Modal awal" nilai={angka.modalAwal} ket="modal akhir periode sebelumnya" dasar />
          <Baris label="Modal disetor" nilai={angka.modalDisetor} ket="uang pribadi yang masuk lewat Konversi Saldo" />
          <Baris
            label={angka.labaDitahan < 0 ? 'Rugi periode ini' : 'Laba ditahan'}
            nilai={angka.labaDitahan}
            ket={
              angka.labaDitahan < 0
                ? 'periode ini merugi, dari Laporan Pendapatan'
                : 'laba bersih periode ini, dari Laporan Pendapatan'
            }
          />
          {/* Prive sudah bertanda negatif dari backend — dikirim apa adanya. */}
          <Baris label="Prive" nilai={angka.prive} ket="uang toko yang dipakai pemilik" />
          {denganDiambil && (
            <Baris label="Laba diambil pemilik" nilai={-Math.abs(angka.diambil)} ket="diambil dari laba periode ini" />
          )}
          <BarisTotal label="Modal akhir" nilai={modalAkhir} />
        </div>
      )}

      {catatan && (
        <div className="flex items-start gap-1.75 border-t border-dashed border-border pt-2.25 text-xs leading-[18px] text-foreground-subtle">
          <Info size={12} strokeWidth={1.9} className="mt-0.5 shrink-0 text-foreground-muted" aria-hidden />
          <span>{catatan}</span>
        </div>
      )}
    </div>
  );
}

export default CapitalCard;
