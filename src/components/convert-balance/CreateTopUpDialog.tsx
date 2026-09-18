import React, { useEffect, useMemo, useState } from 'react';

import { SUMBER_DANA } from '@/components/expense/ExpenseCardList';
import { CurrencyTextField } from '@/components/Form';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { Label } from '@/components/ui/label';
import { useCreateLedgerTopUp } from '@/hooks/mutation/useMutateLedgerTopUp';
import { useFetchUnpaginatedLedgerAccounts } from '@/hooks/query/useFetchLedgerAccount';
import { cn } from '@/lib/cn';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/**
 * Sumber dana, dan akun yang DIKREDIT karenanya.
 *
 * Petanya sama persis dengan `CreateLedgerJob::setLedgerTopUpLedger`. Baris terakhirnya
 * yang penting: "uang pribadi" tidak mengkredit akun kas mana pun, ia mengkredit MODAL —
 * jadi konversi dari uang pribadi adalah setoran modal pemilik, bukan pemindahan uang
 * yang sudah ada. Layar lama tidak pernah menyebutkan itu.
 */
const SUMBER = [
  { value: 'cash', akun: 'Kas' },
  { value: 'bank', akun: 'Bank' },
  { value: 'current_account', akun: 'Giro' },
  { value: 'personal_money', akun: 'Modal' },
] as const;

type Sumber = (typeof SUMBER)[number]['value'];

/** Akun yang boleh jadi tujuan — `LedgerAccount::$types`, tiga akun kas. */
const TUJUAN = ['Kas', 'Bank', 'Giro'];

const akunSumber = (sumber: Sumber) => SUMBER.find((s) => s.value === sumber)?.akun ?? 'Kas';

/**
 * Memindahkan uang ke sebuah akun buku besar.
 *
 * Form lama menanyakan tiga hal dan tidak menjelaskan satu pun akibatnya: bahwa jurnalnya
 * ditulis saat itu juga, dan bahwa satu dari empat sumber dananya punya arti yang sama
 * sekali berbeda. Di sini ayatnya ditunjukkan sebelum tombol ditekan.
 */
export function CreateTopUpDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element {
  const { mutateAsync, isLoading } = useCreateLedgerTopUp();
  const { data: dataAkun } = useFetchUnpaginatedLedgerAccounts();

  const [tujuan, setTujuan] = useState('');
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [sumber, setSumber] = useState<Sumber>('cash');

  const akun = useMemo(
    () => (dataAkun?.data?.ledger_accounts ?? []).filter(({ name }) => TUJUAN.includes(name)),
    [dataAkun]
  );

  useEffect(() => {
    if (!isOpen) return;
    setTujuan('');
    setJumlah('');
    setSumber('cash');
  }, [isOpen]);

  const modal = sumber === 'personal_money';
  const namaSumber = akunSumber(sumber);

  // Akun yang jadi sumber dananya tidak boleh sekaligus jadi tujuan: jurnalnya akan
  // mendebit dan mengkredit akun yang sama, dan tidak ada uang yang berpindah.
  const pilihan = akun.filter(({ name }) => modal || name !== namaSumber);
  const terpilih = pilihan.find(({ id }) => id === tujuan);

  const angka = +(jumlah || 0);
  const bisaSimpan = !!terpilih && angka > 0;

  const simpan = async () => {
    if (!terpilih || !bisaSimpan) return;
    try {
      await mutateAsync({ amount: angka, payment_method: sumber, ledger_account_id: terpilih.id });
      onClose();
    } catch {
      // Pesannya sudah muncul sebagai toast di hook-nya.
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={isLoading ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title="Konversi saldo">
          Uang berpindah begitu disimpan, dan jurnalnya ditulis saat itu juga.
        </DialogHeading>

        <div>
          <Label className="mb-1.25">Sumber dana</Label>
          <div className="flex flex-wrap gap-1.5">
            {SUMBER.map(({ value }) => {
              const { label, Icon } = SUMBER_DANA[value];
              return (
                <button
                  key={value}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setSumber(value)}
                  className={cn(
                    'inline-flex h-7 items-center gap-1.5 rounded-control px-2.75 text-sm transition-colors duration-fast',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                    sumber === value
                      ? 'bg-success-subtle font-semibold text-success'
                      : 'border border-border-strong bg-surface text-foreground-muted hover:text-foreground'
                  )}
                >
                  <Icon size={13} strokeWidth={1.8} aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="mb-1.25">Akun tujuan</Label>
          <div className="flex flex-wrap gap-1.5">
            {pilihan.map(({ id, name }) => (
              <button
                key={id}
                type="button"
                disabled={isLoading}
                onClick={() => setTujuan(id)}
                className={cn(
                  'inline-flex h-7 items-center rounded-control px-2.75 text-sm transition-colors duration-fast',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                  tujuan === id
                    ? 'bg-success-subtle font-semibold text-success'
                    : 'border border-border-strong bg-surface text-foreground-muted hover:text-foreground'
                )}
              >
                {name}
              </button>
            ))}
            {pilihan.length === 0 && <span className="text-sm text-foreground-subtle">Memuat akun…</span>}
          </div>
        </div>

        <div>
          <Label htmlFor="jumlah-konversi" className="mb-1">
            Jumlah
          </Label>
          <CurrencyTextField
            name="jumlah-konversi"
            aria-label="Jumlah konversi"
            value={jumlah}
            placeholder="0"
            prefix=""
            disabled={isLoading}
            className="h-8 w-full rounded-control px-2.5 text-right font-mono"
            onChange={(val) => setJumlah(val ?? '')}
          />
        </div>

        {/* Peringatan ini muncul hanya untuk sumber yang memang punya arti lain. */}
        {modal && (
          <p className="rounded-lg bg-info-subtle px-3.25 py-2 text-sm leading-[17px] text-info">
            Uang pribadi dicatat sebagai <span className="font-semibold">setoran modal</span>, bukan pemindahan kas:
            kreditnya masuk ke akun Modal, dan modal pemilik bertambah sebesar ini.
          </p>
        )}

        {bisaSimpan && (
          <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
            <span className="text-xs font-bold text-foreground-subtle">Jurnal yang ditulis</span>
            <DialogRow label={`Debit ${terpilih?.name}`} value={formatNumber(angka)} />
            <DialogRow label={`Kredit ${namaSumber}`} value={formatNumber(angka)} />
          </div>
        )}

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" disabled={isLoading} onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" loading={isLoading} disabled={!bisaSimpan} onClick={simpan}>
            Simpan konversi
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CreateTopUpDialog;
