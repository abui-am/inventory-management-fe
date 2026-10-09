import { Banknote, Info, Landmark } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { CurrencyTextField } from '@/components/Form';
import Modal from '@/components/Modal';
import { BarisGaji, formatAngka } from '@/components/monthly-salary/rows';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogDivider, DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { Label } from '@/components/ui/label';
import { useUpdatePayroll } from '@/hooks/mutation/useMutateSalary';
import { cn } from '@/lib/cn';

/** Cara bayar yang diterima backend — `Payroll::$paymentMethods` membatasi ke cash|bank. */
const SUMBER = [
  { value: 'cash', label: 'Kas', Icon: Banknote },
  { value: 'bank', label: 'Bank', Icon: Landmark },
] as const;

/**
 * Membayar gaji satu orang, seluruhnya atau sebagian.
 *
 * Dialog lama menampilkan gaji dan yang sudah dibayar, tapi tidak pernah SISANYA — angka
 * yang sebenarnya sedang dicari orang saat membuka layar ini. Ia juga tidak menyebutkan
 * bahwa menyimpan pembayaran langsung menulis beban "Beban Gaji" ke buku besar lewat
 * `CreatePayrollExpenseJob`, yang membuat angkanya ikut terbawa ke Laporan Pendapatan.
 */
export function PaySalaryDialog({
  baris,
  bulan,
  isOpen,
  onClose,
}: {
  baris: BarisGaji;
  bulan: string;
  isOpen: boolean;
  onClose: () => void;
}): JSX.Element {
  const { mutateAsync, isLoading } = useUpdatePayroll();

  const [jumlah, setJumlah] = useState<number | undefined>(undefined);
  const [sekaligus, setSekaligus] = useState(true);
  const [sumber, setSumber] = useState<'cash' | 'bank'>('cash');

  useEffect(() => {
    if (!isOpen) return;
    setJumlah(baris.sisa);
    setSekaligus(true);
    setSumber('cash');
  }, [isOpen, baris.sisa]);

  const angka = sekaligus ? baris.sisa : +(jumlah ?? 0);
  const lebih = angka > baris.sisa;
  const bisaSimpan = angka > 0 && !lebih;
  const akunSumber = sumber === 'cash' ? 'Kas' : 'Bank';

  const simpan = async () => {
    if (!bisaSimpan) return;
    try {
      await mutateAsync({ id: baris.id, data: { amount: angka, payment_method: sumber } });
      onClose();
    } catch {
      // Pesannya sudah muncul sebagai toast di hook-nya.
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={isLoading ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title="Bayar gaji">
          Boleh dibayar sebagian. Sisanya tetap tercatat dan bisa dibayar lagi kapan saja.
        </DialogHeading>

        {/* Siapa yang dibayar, untuk bulan apa — tanpa ini dialognya bisa dibuka dari
            baris mana pun dan isinya tampak sama. */}
        <div className="flex items-center gap-2.25 rounded-group bg-surface-raised px-2.75 py-2.25">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-2xs font-bold text-accent">
            {(baris.nama.trim()[0] ?? '?').toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{baris.nama}</div>
            <div className="truncate text-xs text-foreground-muted">
              {baris.jabatan || '—'} · {bulan}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <DialogRow label="Gaji sebulan" value={formatAngka(baris.gaji)} />
          <DialogRow label="Sudah dibayar" value={formatAngka(baris.dibayar)} tone="success" />
          <DialogDivider />
          <DialogRow label="Sisa" value={formatAngka(baris.sisa)} strong tone="warning" />
        </div>

        <div>
          <Label htmlFor="jumlah-bayar-gaji" className="mb-1">
            Yang dibayarkan sekarang
          </Label>

          {/* Saat "sekaligus" dicentang, angkanya bukan isian lagi — ia hasil hitungan.
              Menampilkannya sebagai input yang aktif mengundang perubahan yang langsung
              ditimpa kembali. */}
          {sekaligus ? (
            <div className="flex h-9 items-center justify-between rounded-md border border-border-strong bg-surface-raised px-2.5">
              <span className="text-base text-foreground-muted">Rp</span>
              <span className="font-mono text-base font-semibold tabular-nums">{formatAngka(baris.sisa)}</span>
            </div>
          ) : (
            <CurrencyTextField
              id="jumlah-bayar-gaji"
              name="jumlah"
              prefix="Rp"
              placeholder="0"
              value={jumlah ?? ''}
              disabled={isLoading}
              aria-invalid={lebih}
              onChange={setJumlah}
            />
          )}

          <label className="mt-2 flex cursor-pointer items-center gap-2 text-base">
            <Checkbox
              name="sekaligus"
              checked={sekaligus}
              disabled={isLoading}
              onChange={(e) => {
                setSekaligus(e.target.checked);
                if (e.target.checked) setJumlah(baris.sisa);
              }}
            />
            Bayar sisanya sekaligus
          </label>

          {lebih ? (
            <span className="mt-1 block text-xs text-destructive">
              Tidak boleh melebihi sisa {formatAngka(baris.sisa)}. Backend menolaknya, bukan cuma formulirnya.
            </span>
          ) : (
            <span className="mt-1 block text-xs text-foreground-subtle">
              Batas maksimalnya sisa {formatAngka(baris.sisa)}.
            </span>
          )}
        </div>

        <div>
          <Label className="mb-1">Dibayar dari</Label>
          <div className="flex gap-1.5">
            {SUMBER.map(({ value, label, Icon }) => (
              <Button
                key={value}
                size="sm"
                variant="outline"
                aria-pressed={sumber === value}
                disabled={isLoading}
                onClick={() => setSumber(value)}
                className={cn(sumber === value && 'border-accent bg-accent-subtle text-accent')}
              >
                <Icon strokeWidth={1.9} aria-hidden /> {label}
              </Button>
            ))}
          </div>
        </div>

        <p className="flex items-start gap-1.5 rounded-lg bg-info-subtle px-2.75 py-2 text-sm leading-[17px] text-info">
          <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            Tercatat sebagai beban <b>Beban Gaji</b> hari ini dan langsung masuk buku besar, mengurangi saldo{' '}
            {akunSumber}.
          </span>
        </p>

        <div className="mt-1 flex justify-end gap-1.75">
          <Button size="sm" variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button size="sm" onClick={simpan} disabled={!bisaSimpan} loading={isLoading}>
            Bayar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PaySalaryDialog;
