import dayjs from 'dayjs';
import { AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Varian } from '@/components/debt/DebtPage';
import { CurrencyTextField } from '@/components/Form';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogDivider, DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { Label } from '@/components/ui/label';
import { useUpdateDebt } from '@/hooks/mutation/useMutateDebt';
import { cn } from '@/lib/cn';
import { Datum } from '@/typings/debts';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/**
 * Cara uangnya berpindah — dan akun kas yang ikut bergerak karenanya.
 *
 * Petanya sama persis dengan `CreateLedgerJob::AKUN_PEMBAYARAN` di backend. Kalau di sana
 * bertambah, di sini juga; preview jurnal di bawah dialog ini membacanya dari sini.
 */
const METODE = [
  { value: 'cash', label: 'Kas' },
  { value: 'bank', label: 'Bank' },
  { value: 'current_account', label: 'Giro' },
];

const akunKas = (metode: string) => METODE.find((m) => m.value === metode)?.label ?? 'Kas';

/**
 * Kata dan arah jurnal per jenis tagihan.
 *
 * Utang giro TIDAK menawarkan metode sama sekali: `setDebtLedger` cabang `current_account`
 * mengabaikan `payment_method` dan selalu mengkredit Giro, jadi pilihan yang tidak
 * berpengaruh lebih baik tidak ada daripada ada dan berbohong.
 */
const KATA = {
  receivable: {
    judul: 'Terima piutang',
    tombol: 'Terima piutang',
    pihak: 'Atas nama',
    jumlah: 'Jumlah piutang',
    sudah: 'Sudah diterima',
    isian: 'Jumlah diterima',
    lewatLabel: 'Diterima lewat',
    lebih: 'Melebihi sisa piutang',
    pilihMetode: true,
  },
  debt: {
    judul: 'Bayar utang',
    tombol: 'Bayar utang',
    pihak: 'Ke supplier',
    jumlah: 'Jumlah utang',
    sudah: 'Sudah dibayar',
    isian: 'Jumlah dibayar',
    lewatLabel: 'Dibayar lewat',
    lebih: 'Melebihi sisa utang',
    pilihMetode: true,
  },
  current_account: {
    judul: 'Bayar utang giro',
    tombol: 'Bayar utang giro',
    pihak: 'Ke supplier',
    jumlah: 'Jumlah utang giro',
    sudah: 'Sudah dibayar',
    isian: 'Jumlah dibayar',
    lewatLabel: 'Dibayar lewat',
    lebih: 'Melebihi sisa utang giro',
    pilihMetode: false,
  },
} as const;

/**
 * Menerima pembayaran piutang.
 *
 * Yang dulu tiga angka bertumpuk setinggi layar sekarang satu blok ringkas, dan batas
 * maksimalnya bukan lagi catatan merah yang selalu tampil — ia muncul hanya kalau memang
 * dilanggar.
 */
export function PayDebtDialog({
  variant,
  debt,
  isOpen,
  onClose,
}: {
  variant: Varian;
  debt: Datum | null;
  isOpen: boolean;
  onClose: () => void;
}): JSX.Element {
  const kata = KATA[variant];
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [penuh, setPenuh] = useState(false);
  // Giro tidak punya pilihan; metodenya memang selalu giro.
  const [metode, setMetode] = useState(variant === 'current_account' ? 'current_account' : 'cash');
  const { mutateAsync, isLoading } = useUpdateDebt();

  const total = +(debt?.amount ?? 0);
  const sudah = +(debt?.paid_amount ?? 0);
  const sisa = total - sudah;

  // Isian tagihan sebelumnya tidak boleh terbawa ke dialog berikutnya.
  useEffect(() => {
    if (!isOpen) return;
    setJumlah('');
    setPenuh(false);
    setMetode(variant === 'current_account' ? 'current_account' : 'cash');
  }, [isOpen, debt?.id, variant]);

  const nilai = penuh ? sisa : +(jumlah || 0);
  const lebih = nilai > sisa;
  const bisaSimpan = nilai > 0 && !lebih;

  const tempo = debt?.due_date ? dayjs(debt.due_date) : null;
  const lewat = tempo && !debt?.is_paid ? dayjs().diff(tempo, 'day') : 0;

  const simpan = async () => {
    if (!debt || !bisaSimpan) return;
    try {
      await mutateAsync({ id: debt.id, data: { paid_amount: nilai, payment_method: metode } });
      onClose();
    } catch {
      // Pesannya sudah muncul sebagai toast di hook-nya.
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={isLoading ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title={kata.judul}>
          {variant === 'receivable'
            ? `Uangnya masuk sekarang juga: ${akunKas(metode)} bertambah, piutang customer berkurang.`
            : `Uangnya keluar sekarang juga: ${akunKas(metode)} berkurang, utang ke supplier berkurang.`}
        </DialogHeading>

        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <DialogRow label={kata.pihak} value={debt?.related_model?.name ?? '—'} mono={false} />
          <DialogRow label="Keterangan" value={debt?.description ?? '—'} mono={false} />
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-foreground-muted">Jatuh tempo</span>
            <span className={cn('font-medium', lewat > 0 && 'text-destructive')}>
              {tempo ? tempo.format('DD MMM YYYY') : '—'}
              {lewat > 0 && ` · lewat ${lewat} hari`}
            </span>
          </div>
          <DialogDivider />
          <DialogRow label={kata.jumlah} value={formatNumber(total)} />
          <DialogRow label={kata.sudah} value={formatNumber(sudah)} />
          <DialogRow label="Sisa" value={formatNumber(sisa)} strong tone="warning" />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label htmlFor="jumlah">{kata.isian}</Label>
            <label htmlFor="penuh" className="flex cursor-pointer items-center gap-1.5 text-sm">
              <Checkbox
                id="penuh"
                name="penuh"
                checked={penuh}
                disabled={isLoading}
                onChange={(e) => setPenuh(e.target.checked)}
              />
              Seluruhnya
            </label>
          </div>

          {penuh ? (
            <div className="flex h-8 items-center justify-between rounded-control border border-border bg-surface-raised px-2.5 font-mono text-base font-semibold tabular-nums text-foreground-muted">
              <span className="text-xs">Rp</span>
              {formatNumber(sisa)}
            </div>
          ) : (
            <CurrencyTextField
              name="jumlah"
              aria-label={kata.isian}
              value={jumlah}
              placeholder="0"
              prefix=""
              disabled={isLoading}
              className={cn('h-8 w-full rounded-control px-2.5 text-right font-mono', lebih && 'border-destructive')}
              onChange={(val) => setJumlah(val ?? '')}
            />
          )}

          {/* Keterangan di bawah input menyebut AKIBATNYA, bukan aturannya. Aturan baru
              muncul saat dilanggar. */}
          {lebih ? (
            <span className="mt-1 flex items-center gap-1.25 text-sm text-destructive" role="alert">
              <AlertTriangle size={13} strokeWidth={2} aria-hidden />
              {kata.lebih} <span className="font-mono font-semibold tabular-nums">{formatNumber(sisa)}</span>
            </span>
          ) : (
            <span className="mt-1 block text-xs text-foreground-subtle">
              {nilai > 0 && nilai === sisa ? (
                <span className="text-success">Tagihan ini menjadi lunas.</span>
              ) : (
                <>
                  Sisa sesudah ini{' '}
                  <span className="font-mono font-semibold tabular-nums text-warning">
                    {formatNumber(Math.max(sisa - nilai, 0))}
                  </span>
                </>
              )}
            </span>
          )}
        </div>

        <div>
          <Label className="mb-1.25">{kata.lewatLabel}</Label>
          {kata.pilihMetode ? (
            <div className="flex gap-1.5">
              {METODE.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setMetode(m.value)}
                  className={cn(
                    'inline-flex h-7 items-center rounded-control px-2.75 text-sm transition-colors duration-fast',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                    metode === m.value
                      ? 'bg-success-subtle font-semibold text-success'
                      : 'border border-border-strong bg-surface text-foreground-muted hover:text-foreground'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.75">
              <span className="inline-flex h-7 items-center rounded-control bg-warning-subtle px-2.75 text-sm font-semibold text-warning">
                Giro
              </span>
              <span className="text-xs text-foreground-subtle">
                Tagihan giro selalu dibayar lewat giro — tidak ada pilihan lain.
              </span>
            </div>
          )}
        </div>

        {/* Jurnal yang benar-benar ditulis backend — diturunkan dari
            CreateLedgerJob::setDebtLedger cabang `receivable`. */}
        {bisaSimpan && (
          <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
            <span className="text-xs font-bold text-foreground-subtle">Jurnal yang ditulis</span>
            {variant === 'receivable' ? (
              <>
                <DialogRow label={`Debit ${akunKas(metode)}`} value={formatNumber(nilai)} />
                <DialogRow label="Kredit Piutang" value={formatNumber(nilai)} />
              </>
            ) : (
              <>
                <DialogRow label="Debit Utang" value={formatNumber(nilai)} />
                <DialogRow label={`Kredit ${akunKas(metode)}`} value={formatNumber(nilai)} />
              </>
            )}
          </div>
        )}

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" disabled={isLoading} onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" loading={isLoading} disabled={!bisaSimpan} onClick={simpan}>
            {kata.tombol}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PayDebtDialog;
