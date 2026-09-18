import dayjs from 'dayjs';
import React from 'react';

import { PAYMENT_METHOD_COLOR } from '@/constants/options';
import { cn } from '@/lib/cn';
import { formatPaymentMethod } from '@/utils/format';

/**
 * Bagian-bagian isi sheet rincian — dipakai bersama oleh rincian penjualan dan rincian
 * barang masuk.
 *
 * Keduanya sempat menulis sendiri seksi, baris nilai, dan penanda metode bayarnya, dan
 * hasilnya menyimpang: judul seksi 15px gelap di satu sisi dan 11px redup di sisi lain,
 * metode bayar berupa titik warna di satu sisi dan pill di sisi lain. Dua panel yang bisa
 * dibuka dari halaman yang sama tidak boleh terlihat seperti dua produk.
 */

/** Judul seksi: 11px/700 redup, jarak 7px ke isinya, pemisah tipis antar seksi. */
export function Seksi({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="border-b border-border-subtle px-4 py-3">
      <div className="mb-1.75 flex items-center gap-1.5">
        <span className="text-xs font-bold text-foreground-subtle">{title}</span>
        {count !== undefined && <span className="font-mono text-2xs text-foreground-subtle">{count}</span>}
      </div>
      {children}
    </div>
  );
}

/** Sepasang label–nilai; nilainya mono dan tabular supaya angkanya sejajar antar baris. */
export function BarisNilai({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-foreground-muted">{label}</span>
      <span className="font-mono font-medium tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Kelas pill per warna, ditulis UTUH.
 *
 * Tailwind memindai berkas sebagai teks; kelas yang baru terbentuk saat runtime
 * (`bg-${warna}-subtle`) tidak pernah ikut dibangkitkan, jadi pill-nya tampil tanpa warna.
 */
const WARNA_METODE: Record<string, string> = {
  success: 'bg-success-subtle text-success',
  info: 'bg-info-subtle text-info',
  warning: 'bg-warning-subtle text-warning',
  destructive: 'bg-destructive-subtle text-destructive',
};

/**
 * Metode bayar sebagai pill berwarna — warnanya sama dengan baris pembayaran di
 * /transaction/add, dan artinya sama: akibat pembayaran itu pada utang-piutang.
 *
 * `metode` adalah nilai MENTAH dari backend (`cash`, `debt`, …), bukan labelnya.
 * PAYMENT_METHOD_COLOR memang berkunci nilai mentah; mengindeksnya dengan label yang
 * sudah diformat membuat warnanya selalu jatuh ke bawaan.
 */
export function PillMetode({ metode }: { metode: string }): JSX.Element {
  const warna = PAYMENT_METHOD_COLOR[metode] ?? 'success';
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-control px-2 text-xs font-semibold',
        WARNA_METODE[warna]
      )}
    >
      {formatPaymentMethod(metode)}
    </span>
  );
}

/** Keterangan satu pembayaran: sudah dibayar kapan, atau jatuh temponya kapan. */
export function ketBayar(p: {
  paid?: boolean;
  payment_date?: Date | string;
  maturity_date?: Date | string;
  due_date?: Date | string;
}): string {
  const tempo = p.maturity_date ?? p.due_date;
  if (p.paid) return `Dibayar ${dayjs(p.payment_date).format('DD MMM YYYY')}`;
  if (tempo) return `Jatuh tempo ${dayjs(tempo).format('DD MMM YYYY')}`;
  return 'Belum dibayar';
}
