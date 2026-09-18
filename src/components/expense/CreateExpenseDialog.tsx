import dayjs from 'dayjs';
import { Banknote, Landmark } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { CurrencyTextField, DatePickerComponent } from '@/components/Form';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogHeading } from '@/components/ui/dialog-summary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateExpense } from '@/hooks/mutation/useMutateExpense';
import { useFetchExpenseNames } from '@/hooks/query/useFetchExpense';
import { cn } from '@/lib/cn';
import { formatDateYYYYMMDDHHmmss } from '@/utils/format';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** Sumber dana yang diterima backend — `ExpenseRequest` membatasi ke cash|bank. */
const SUMBER = [
  { value: 'cash', label: 'Kas', Icon: Banknote },
  { value: 'bank', label: 'Bank', Icon: Landmark },
] as const;

/**
 * Mencatat beban.
 *
 * Form lama meminta "Saldo" dan "Dari" — istilah top-up yang terbawa karena skema
 * validasinya memang milik top-up (`validationSchemaLedgerTopUp`). Yang lebih penting:
 * ia tidak pernah menyebut bahwa menyimpan beban langsung menulis jurnal dan mengurangi
 * saldo sumber dananya. Di sini ayatnya ditunjukkan sebelum tombol ditekan.
 */
export function CreateExpenseDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element {
  const { mutateAsync, isLoading } = useCreateExpense();
  const { data: dataNama } = useFetchExpenseNames();

  const [nama, setNama] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [sumber, setSumber] = useState<'cash' | 'bank'>('cash');
  const [tanggal, setTanggal] = useState(new Date());
  const [namaDisentuh, setNamaDisentuh] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setNama('');
    setKeterangan('');
    setJumlah('');
    setSumber('cash');
    setTanggal(new Date());
    setNamaDisentuh(false);
  }, [isOpen]);

  const daftarNama = useMemo(
    () => (dataNama?.data?.expense_names ?? []).map(({ name }) => name).filter(Boolean),
    [dataNama]
  );

  // Saran menyempit sambil mengetik, dan hilang begitu namanya sudah persis sama —
  // supaya daftar tidak menutupi isian tanpa gunanya.
  const saran = useMemo(() => {
    const cari = nama.trim().toLowerCase();
    return daftarNama
      .filter((item) => item.toLowerCase() !== cari && (!cari || item.toLowerCase().includes(cari)))
      .slice(0, 5);
  }, [daftarNama, nama]);

  const angka = +(jumlah || 0);
  const bisaSimpan = nama.trim().length > 0 && angka > 0;
  const akunSumber = sumber === 'cash' ? 'Kas' : 'Bank';

  const simpan = async () => {
    if (!bisaSimpan) return;
    try {
      const res = await mutateAsync({
        name: nama.trim(),
        description: keterangan.trim(),
        amount: angka,
        payment_method: sumber,
        date: formatDateYYYYMMDDHHmmss(tanggal),
      });
      toast.success(res.message);
      onClose();
    } catch {
      // Pesannya sudah muncul sebagai toast di hook-nya.
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={isLoading ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title="Catat beban">
          Uangnya dianggap keluar saat disimpan: jurnal di bawah langsung ditulis, dan saldo {akunSumber} berkurang
          sebesar itu.
        </DialogHeading>

        <div>
          <Label htmlFor="nama-beban" className="mb-1">
            Nama beban
          </Label>
          <Input
            id="nama-beban"
            size="sm"
            placeholder="Beban Listrik"
            value={nama}
            disabled={isLoading}
            aria-invalid={namaDisentuh && nama.trim().length === 0}
            onBlur={() => setNamaDisentuh(true)}
            onChange={(e) => setNama(e.target.value)}
          />
          {namaDisentuh && nama.trim().length === 0 && (
            <span className="mt-1 block text-xs text-destructive">Nama beban wajib diisi.</span>
          )}

          {/* Nama yang pernah dipakai: tanpa ini satu beban yang sama tercatat dengan
              tiga ejaan berbeda dan pengelompokannya di laporan pecah. */}
          {saran.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.25">
              {saran.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setNama(item)}
                  className={cn(
                    'inline-flex h-6 items-center rounded-control border border-border-strong bg-surface px-2 text-xs',
                    'text-foreground-muted transition-colors duration-fast hover:text-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
                    'disabled:pointer-events-none disabled:opacity-40'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="keterangan" className="mb-1">
            Keterangan
          </Label>
          <Input
            id="keterangan"
            size="sm"
            placeholder="Tagihan September"
            value={keterangan}
            disabled={isLoading}
            onChange={(e) => setKeterangan(e.target.value)}
          />
        </div>

        <div className="flex gap-2.5">
          <div className="flex-1">
            <Label htmlFor="jumlah-beban" className="mb-1">
              Jumlah
            </Label>
            <CurrencyTextField
              name="jumlah-beban"
              aria-label="Jumlah beban"
              value={jumlah}
              placeholder="0"
              prefix=""
              disabled={isLoading}
              className="h-8 w-full rounded-control px-2.5 text-right font-mono"
              onChange={(val) => setJumlah(val ?? '')}
            />
          </div>

          <div className="flex-1">
            <Label className="mb-1">Sumber dana</Label>
            <div className="flex h-8 gap-0.75 rounded-control bg-surface-raised p-0.75">
              {SUMBER.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={sumber === value}
                  disabled={isLoading}
                  onClick={() => setSumber(value)}
                  className={cn(
                    'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md text-sm transition-colors duration-fast',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
                    sumber === value
                      ? 'bg-surface font-semibold text-foreground shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                  )}
                >
                  <Icon size={13} strokeWidth={1.9} aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label className="mb-1">Tanggal</Label>
          <DatePickerComponent
            selected={tanggal}
            showTimeSelect
            disabled={isLoading}
            onChange={(value) => {
              if (value) setTanggal(value as Date);
            }}
          />
          <span className="mt-1 block text-xs text-foreground-subtle">
            Bawaannya {dayjs(tanggal).format('DD MMM YYYY HH.mm')} — ubah kalau bebannya terjadi di hari lain.
          </span>
        </div>

        {/* Pratinjau jurnal — warna debit/kredit sama dengan Buku Besar. */}
        <div className="rounded-lg bg-surface-raised px-3.25 py-2.5">
          <div className="mb-1 text-sm font-semibold">Jurnal yang ditulis</div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="pb-1 text-left text-xs font-bold text-foreground-subtle">Akun</th>
                <th className="pb-1 text-right text-xs font-bold text-foreground-subtle">Debit</th>
                <th className="pb-1 text-right text-xs font-bold text-foreground-subtle">Kredit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-0.75 text-sm">Beban</td>
                <td className="py-0.75 text-right font-mono text-sm font-semibold tabular-nums text-destructive">
                  {formatNumber(angka)}
                </td>
                <td className="py-0.75 text-right font-mono text-sm tabular-nums text-foreground-subtle">—</td>
              </tr>
              <tr>
                <td className="py-0.75 text-sm">{akunSumber}</td>
                <td className="py-0.75 text-right font-mono text-sm tabular-nums text-foreground-subtle">—</td>
                <td className="py-0.75 text-right font-mono text-sm font-semibold tabular-nums text-success">
                  {formatNumber(angka)}
                </td>
              </tr>
              <tr className="border-t border-border">
                <td className="pt-1.25 text-sm font-semibold">Balance</td>
                <td className="pt-1.25 text-right font-mono text-sm font-bold tabular-nums text-destructive">
                  {formatNumber(angka)}
                </td>
                <td className="pt-1.25 text-right font-mono text-sm font-bold tabular-nums text-success">
                  {formatNumber(angka)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" disabled={isLoading} onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" loading={isLoading} disabled={!bisaSimpan} onClick={simpan}>
            Simpan beban
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CreateExpenseDialog;
