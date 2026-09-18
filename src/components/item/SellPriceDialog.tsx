import { AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { CurrencyTextField } from '@/components/Form';
import Modal from '@/components/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogDivider, DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { Label } from '@/components/ui/label';
import { useUpdateItem } from '@/hooks/mutation/useMutateItems';
import { cn } from '@/lib/cn';
import { ItemData } from '@/typings/item';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** Harga eceran tidak pernah berakhiran 37 rupiah. Markup selalu dibulatkan ke 500 terdekat. */
const bulatkan = (n: number) => Math.round(n / 500) * 500;

const MARKUP = [15, 20, 25, 30];

/**
 * Mengubah harga jual satu barang.
 *
 * Dialog lama hanya berisi satu kotak angka tanpa konteks apa pun — harga belinya tidak
 * terlihat, jadi tidak ada cara menilai apakah angka yang diketik masuk akal. Di sini
 * harga beli, margin, dan akibatnya ada di layar yang sama.
 *
 * Harga di bawah modal DIPERINGATKAN, bukan dilarang: barang pancingan memang kadang
 * dijual rugi.
 */
export function SellPriceDialog({
  item,
  isOpen,
  onClose,
}: {
  item: ItemData | null;
  isOpen: boolean;
  onClose: () => void;
}): JSX.Element {
  const [harga, setHarga] = useState<number | ''>('');
  const { mutateAsync, isLoading } = useUpdateItem();

  const beli = +(item?.buy_price ?? 0);
  const lama = +(item?.sell_price ?? 0);
  const baru = +(harga || 0);

  // Barang lain berarti isian lain.
  useEffect(() => {
    if (!isOpen) return;
    setHarga(lama > 0 ? lama : '');
  }, [isOpen, item?.id, lama]);

  const margin = baru > 0 ? ((baru - beli) / baru) * 100 : null;
  const rugi = baru > 0 && baru < beli;
  const bisaSimpan = baru > 0;

  /** Keterangan di bawah input: akibat perubahannya, bukan aturan yang belum dilanggar. */
  const keterangan = (() => {
    if (baru <= 0) {
      return <span className="text-warning">Selama harganya nol, kasir tidak bisa menjual barang ini.</span>;
    }
    if (lama > 0 && baru !== lama) {
      return (
        <>
          {baru > lama ? 'Naik' : 'Turun'}{' '}
          <span className="font-mono font-semibold tabular-nums">{formatNumber(Math.abs(baru - lama))}</span> dari harga
          sekarang.
        </>
      );
    }
    return 'Harga yang berlaku untuk penjualan berikutnya.';
  })();

  const simpan = async () => {
    if (!item || !bisaSimpan) return;
    try {
      const res = await mutateAsync({ id: item.id, data: { sell_price: baru } });
      toast.success(res.message);
      onClose();
    } catch {
      // Pesannya sudah muncul sebagai toast di hook-nya.
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={isLoading ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title="Ubah harga jual">
          Berlaku untuk penjualan berikutnya. Transaksi yang sudah terjadi tidak ikut berubah.
        </DialogHeading>

        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <DialogRow label="Barang" value={item?.name ?? '—'} mono={false} />
          <DialogRow label="Kode" value={item?.item_id || '—'} />
          <DialogRow label="Stok" value={`${item?.quantity ?? 0} ${item?.unit ?? ''}`.trim()} mono={false} />
          <DialogDivider />
          <DialogRow label="Harga beli rata-rata" value={formatNumber(beli)} />
          <DialogRow label="Harga jual sekarang" value={lama > 0 ? formatNumber(lama) : '—'} />
        </div>

        <div>
          <Label htmlFor="harga" className="mb-1">
            Harga jual baru
          </Label>
          <CurrencyTextField
            name="harga"
            aria-label="Harga jual baru"
            value={harga}
            placeholder="0"
            prefix=""
            disabled={isLoading}
            className={cn('h-8 w-full rounded-control px-2.5 text-right font-mono', rugi && 'border-destructive')}
            onChange={(val) => setHarga(val ?? '')}
          />

          {rugi ? (
            <span className="mt-1 flex items-center gap-1.25 text-sm text-destructive" role="alert">
              <AlertTriangle size={13} strokeWidth={2} aria-hidden />
              Di bawah harga beli <span className="font-mono font-semibold tabular-nums">{formatNumber(beli)}</span> —
              tiap penjualan rugi{' '}
              <span className="font-mono font-semibold tabular-nums">{formatNumber(beli - baru)}</span>
            </span>
          ) : (
            <span className="mt-1 block text-xs text-foreground-subtle">{keterangan}</span>
          )}
        </div>

        {/* Mengetik harga dari nol itu pekerjaan yang sama berulang-ulang; markup-nya
            dihitung dari harga beli, sama seperti di layar Terima barang. */}
        <div>
          <Label className="mb-1.25">Markup cepat</Label>
          <div className="flex flex-wrap gap-1.5">
            {MARKUP.map((persen) => (
              <button
                key={persen}
                type="button"
                disabled={isLoading || beli <= 0}
                onClick={() => setHarga(bulatkan(beli * (1 + persen / 100)))}
                className={cn(
                  'inline-flex h-7 items-center rounded-control px-2.5 text-sm transition-colors duration-fast',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                  'disabled:pointer-events-none disabled:opacity-40',
                  baru === bulatkan(beli * (1 + persen / 100))
                    ? 'bg-accent-subtle font-semibold text-accent'
                    : 'border border-border-strong bg-surface text-foreground-muted hover:text-foreground'
                )}
              >
                +{persen}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-surface-raised px-3.25 py-2.5">
          <span className="text-sm text-foreground-muted">Margin</span>
          {/* eslint-disable-next-line no-nested-ternary */}
          {margin === null ? (
            <span className="text-sm text-foreground-subtle">—</span>
          ) : margin < 0 ? (
            <Badge variant="destructive">Rugi</Badge>
          ) : (
            <Badge variant={margin < 15 ? 'warning' : 'success'}>{margin.toFixed(0)}%</Badge>
          )}
        </div>

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" disabled={isLoading} onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" loading={isLoading} disabled={!bisaSimpan} onClick={simpan}>
            Simpan harga
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SellPriceDialog;
