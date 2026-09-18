import { Check } from 'lucide-react';
import React from 'react';

import { Konfirmasi, useHitungan } from '@/components/audit/useHitungan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { AuditsData } from '@/typings/audit';

/**
 * Kotak isian hitungan fisik satu barang, berikut tombol kirimnya.
 *
 * Halaman lama memulai tiap baris dalam mode "sedang diedit" kalau belum pernah
 * dikirim, lalu berpindah ke mode baca yang hanya memunculkan pensil ketika kursor
 * lewat. Di sini tidak ada dua mode: barisnya isian sampai jatahnya habis, dan yang
 * berubah cuma isi dan statusnya.
 */
export function CountField({
  row,
  inputRef,
  onSelesai,
  onKonfirmasi,
  className,
}: {
  row: AuditsData;
  inputRef?: (el: HTMLInputElement | null) => void;
  onSelesai: (id: string) => void;
  onKonfirmasi: (konfirmasi: Konfirmasi) => void;
  className?: string;
}): JSX.Element {
  const { nilai, setNilai, simpan, batal, bisaSimpan, terkunci, isLoading } = useHitungan(row, {
    onSelesai,
    onKonfirmasi,
  });

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Input
        ref={inputRef}
        size="sm"
        type="number"
        min={0}
        inputMode="numeric"
        aria-label={`Hitungan fisik ${row.item_name ?? ''}`.trim()}
        className="w-[96px] text-right font-mono tabular-nums"
        value={nilai}
        placeholder={terkunci ? '' : '0'}
        disabled={terkunci || isLoading}
        onChange={(e) => setNilai(e.target.value)}
        onKeyDown={(e) => {
          // Enter menyimpan dan melompat ke barang berikutnya yang belum dihitung —
          // opname itu gerakan yang sama 35 kali, tangannya tidak boleh pindah ke tetikus.
          if (e.key === 'Enter') {
            e.preventDefault();
            simpan();
          }
          if (e.key === 'Escape') batal();
        }}
      />
      <Button
        size="icon-sm"
        variant={bisaSimpan ? 'default' : 'ghost'}
        aria-label={`Kirim hitungan ${row.item_name ?? ''}`.trim()}
        tooltip="Kirim hitungan"
        disabled={!bisaSimpan}
        loading={isLoading}
        onClick={simpan}
      >
        <Check strokeWidth={2.4} aria-hidden />
      </Button>
    </div>
  );
}

export default CountField;
