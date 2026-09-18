import React from 'react';

import { cn } from '@/lib/cn';

/**
 * Baris ringkasan di dalam dialog konfirmasi.
 *
 * Nilainya SELALU mono dan tabular — angka di dialog dibaca untuk diperiksa, bukan
 * sekadar dilihat, jadi lebarnya harus seragam antar baris. Warna disisakan untuk yang
 * benar-benar punya arti: total, selisih, dan peringatan.
 */
export function DialogRow({
  label,
  value,
  strong,
  tone,
  mono = true,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'accent' | 'warning' | 'success';
  /** Matikan untuk nilai yang bukan angka — nama orang atau toko tidak dibaca kolom per kolom. */
  mono?: boolean;
}): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-foreground-muted">{label}</span>
      <span
        className={cn(
          mono && 'font-mono tabular-nums',
          strong ? 'font-semibold' : 'font-medium',
          tone === 'accent' && 'text-accent',
          tone === 'warning' && 'text-warning',
          tone === 'success' && 'text-success'
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Garis pemisah tipis di dalam blok ringkasan dialog. */
export function DialogDivider(): JSX.Element {
  return <div className="my-0.5 h-px bg-border" />;
}

/**
 * Judul dialog beserta kalimat penjelasnya.
 *
 * Jaraknya ke kalimat di bawahnya 8px, bukan 2px: judul yang menempel pada penjelasnya
 * terbaca sebagai satu paragraf, dan yang pertama dibaca orang sebelum menekan tombol
 * justru judul itu. Dipakai bersama supaya jaraknya tidak berbeda dari satu dialog ke
 * dialog lain.
 */
export function DialogHeading({
  title,
  children,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
}): JSX.Element {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children ? <p className="mt-2 text-sm leading-[17px] text-foreground-muted">{children}</p> : null}
    </div>
  );
}
