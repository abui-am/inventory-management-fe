import Tippy from '@tippyjs/react';
import { AlertTriangle, ArrowRight, Check, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { CurrencyTextField } from '@/components/Form';
import Modal from '@/components/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Skeleton from '@/components/ui/skeleton';
import { useUpdateStockIn } from '@/hooks/mutation/useMutateStockIn';
import { useFetchTransactionById } from '@/hooks/query/useFetchStockIn';
import { cn } from '@/lib/cn';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** Harga eceran tidak pernah berakhiran 37 rupiah. Markup selalu dibulatkan ke 500 terdekat. */
const bulatkan = (n: number) => Math.round(n / 500) * 500;

const TH =
  'sticky top-0 z-10 border-b border-border bg-surface px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/** Margin terhadap harga beli rata-rata, dalam persen. `null` selama harganya belum diisi. */
const margin = (rata: number, jual: number): number | null => {
  if (!jual) return null;
  return ((jual - rata) / jual) * 100;
};

function PillMargin({ nilai }: { nilai: number | null }): JSX.Element {
  if (nilai === null) return <span className="text-sm text-foreground-subtle">—</span>;
  if (nilai < 0) return <Badge variant="destructive">Rugi</Badge>;
  return <Badge variant={nilai < 15 ? 'warning' : 'success'}>{nilai.toFixed(0)}%</Badge>;
}

/**
 * Terima barang masuk — sekaligus menentukan harga jualnya.
 *
 * Namanya bukan "Tentukan Harga Jual" lagi, karena bukan itu akibat terbesarnya: menyimpan
 * di sini menaikkan status ke Diterima dan MENAMBAH STOK. Harga jualnya ikut karena backend
 * memang menuntutnya (`items.*.sell_price` bersifat `required_if:status,accepted`) — dan
 * memang di titik inilah harga jual pantas diputuskan, saat harga belinya baru saja diketahui.
 *
 * Jurnalnya sendiri sudah ditulis waktu status naik ke Ditinjau, jadi layar ini tidak
 * menyentuh buku besar sama sekali.
 */
export function ReceiveStockInDialog({
  transactionId,
  onClose,
}: {
  transactionId: string;
  onClose: () => void;
}): JSX.Element {
  const { data, isFetching } = useFetchTransactionById(transactionId, { enabled: !!transactionId });
  const { mutateAsync, isLoading } = useUpdateStockIn();

  const [harga, setHarga] = useState<Record<string, number | ''>>({});
  const [markup, setMarkup] = useState<number | ''>(20);

  const transaction = data?.data?.transaction;
  const items = useMemo(() => transaction?.items ?? [], [transaction]);

  // Transaksi lain berarti isian lain. Tanpa ini harga barang dari dialog sebelumnya
  // ikut terbawa ke barang masuk berikutnya.
  useEffect(() => {
    setHarga({});
  }, [transactionId]);

  const baris = items.map((item) => {
    const qty = +(item.pivot?.quantity ?? 0);
    const beli = +(item.pivot?.purchase_price ?? 0);
    // Rata-rata tertimbang stok lama dan barang yang baru masuk — ini yang dipakai
    // backend sebagai harga beli barangnya setelah diterima, jadi ini pula dasar margin.
    const rata = +(item.pivot?.median_purchase_price ?? beli);
    const stok = +(item.quantity ?? 0);
    const jualLama = +(item.sell_price ?? 0);
    const jualBaru = +(harga[item.id] || 0);

    return {
      id: item.id,
      nama: item.pivot?.item_name ?? item.name,
      kode: item.item_id,
      satuan: item.pivot?.item_unit ?? item.unit,
      qty,
      beli,
      rata,
      stok,
      jualLama,
      jualBaru,
    };
  });

  const belumDiisi = baris.filter((b) => b.jualBaru <= 0).length;
  const rugi = baris.filter((b) => b.jualBaru > 0 && b.jualBaru < b.rata).length;

  const nilaiMasuk = baris.reduce((total, b) => total + b.beli * b.qty, 0);
  const proyeksiLaba = baris.reduce((total, b) => total + (b.jualBaru > 0 ? (b.jualBaru - b.rata) * b.qty : 0), 0);

  const bisaSimpan = baris.length > 0 && belumDiisi === 0 && !isFetching;

  const terapkanMarkup = () => {
    const persen = +(markup || 0);
    setHarga(
      baris.reduce<Record<string, number | ''>>(
        (hasil, b) => ({ ...hasil, [b.id]: bulatkan(b.rata * (1 + persen / 100)) }),
        {}
      )
    );
  };

  const simpan = async () => {
    if (!bisaSimpan) return;
    try {
      await mutateAsync({
        transactionId,
        data: {
          status: 'accepted',
          items: baris.map((b) => ({ id: b.id, sell_price: b.jualBaru })),
        },
      });
      onClose();
    } catch {
      // Pesannya sudah muncul sebagai toast di hook-nya.
    }
  };

  return (
    <Modal
      isOpen={!!transactionId}
      onRequestClose={isLoading ? undefined : onClose}
      variant="large"
      bodyClassName="flex max-h-[80vh] flex-col overflow-hidden p-0"
    >
      {/* SPEC-02 */}
      <div className="flex flex-shrink-0 items-start gap-3 border-b border-border px-4 py-3.25">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Terima barang</h2>
            <Badge variant="info">
              Ditinjau <ArrowRight size={10} strokeWidth={2.4} aria-hidden /> Diterima
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-[17px] text-foreground-muted">
            Tentukan harga jual dulu — harga inilah yang dipakai kasir begitu barangnya masuk stok.
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-mono text-sm font-semibold">{transaction?.transaction_code ?? '—'}</div>
          <div className="text-xs text-foreground-subtle">{transaction?.supplier?.name ?? '—'}</div>
        </div>

        <Button size="icon-xs" variant="ghost" aria-label="Tutup" disabled={isLoading} onClick={onClose}>
          <X strokeWidth={2} aria-hidden />
        </Button>
      </div>

      {/* SPEC-03: mengisi enam harga satu per satu adalah pekerjaan yang sama enam kali. */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2.25 border-b border-border bg-surface-raised px-4 py-2.25">
        <span className="text-sm text-foreground-muted">Isi semua dengan markup</span>
        <div className="flex h-7 w-[76px] items-center gap-1 rounded-control border border-border-strong bg-surface px-2">
          <Input
            size="xs"
            type="number"
            aria-label="Markup persen"
            className="h-6 w-full border-0 bg-transparent px-0 text-right font-mono tabular-nums focus-visible:ring-0"
            value={markup}
            onChange={(e) => setMarkup(e.target.value === '' ? '' : +e.target.value)}
          />
          <span className="text-xs text-foreground-subtle">%</span>
        </div>
        <Button size="xs" variant="outline" disabled={isFetching} onClick={terapkanMarkup}>
          Terapkan
        </Button>
        <span className="text-xs text-foreground-subtle">dari harga beli rata-rata, dibulatkan ke 500 terdekat</span>

        <span className="flex-1" />

        {belumDiisi > 0 && (
          <span className="flex items-baseline gap-1.25 text-xs text-warning">
            {/* Angka mono punya tinggi huruf sendiri: dirata-tengahkan ia naik setengah
                piksel dari kalimatnya. Yang disejajarkan garis dasarnya, ikonnya menyusul. */}
            <AlertTriangle size={12} strokeWidth={2} aria-hidden className="self-center" />
            <span className="font-mono font-semibold tabular-nums">{belumDiisi}</span> barang belum punya harga jual
          </span>
        )}
        {belumDiisi === 0 && rugi > 0 && (
          <span className="flex items-baseline gap-1.25 text-xs text-destructive">
            <AlertTriangle size={12} strokeWidth={2} aria-hidden className="self-center" />
            <span className="font-mono font-semibold tabular-nums">{rugi}</span> barang dijual di bawah harga beli
          </span>
        )}
      </div>

      {/* SPEC-04 */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={cn(TH, 'text-left')}>Barang</th>
              <th className={cn(TH, 'w-[104px] text-left')}>Masuk</th>
              <th className={cn(TH, 'w-[96px] text-right')}>Harga beli</th>
              <th className={cn(TH, 'w-[112px] text-right')}>Beli rata-rata</th>
              <th className={cn(TH, 'w-[104px] text-right')}>Jual sekarang</th>
              <th className={cn(TH, 'w-[148px] text-right')}>Harga jual baru</th>
              <th className={cn(TH, 'w-[76px] text-right')}>Margin</th>
            </tr>
          </thead>

          <tbody>
            {isFetching &&
              Array.from({ length: 4 }, (_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={i}>
                  {Array.from({ length: 7 }, (_, k) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <td key={k} className={TD}>
                      <div className="flex h-[30px] items-center">
                        <Skeleton className="h-3.5 w-full" />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}

            {!isFetching &&
              baris.map((b) => (
                <tr key={b.id} className="transition-colors duration-fast hover:bg-surface-raised">
                  <td className={TD}>
                    <div className="font-medium">{b.nama}</div>
                    <div className="mt-px font-mono text-2xs text-foreground-subtle">{b.kode || '—'}</div>
                  </td>

                  {/* Akibat pada stok, sebelum disimpan. */}
                  <td className={TD}>
                    <div className="font-mono">
                      {b.qty} {b.satuan}
                    </div>
                    <div className="mt-px flex items-center gap-1 text-xs text-foreground-subtle">
                      <span className="font-mono">{b.stok}</span>
                      <ArrowRight size={10} strokeWidth={2.4} aria-hidden />
                      <span className="font-mono font-semibold text-foreground-muted">{b.stok + b.qty}</span>
                    </div>
                  </td>

                  <td className={cn(TD, 'text-right font-mono tabular-nums text-foreground-muted')}>
                    {formatNumber(b.beli)}
                  </td>

                  <td className={cn(TD, 'text-right font-mono tabular-nums')}>
                    <Tippy
                      content="Rata-rata tertimbang stok lama dan barang yang baru masuk. Ini yang jadi harga beli barangnya setelah diterima, jadi ini juga dasar marginnya."
                      placement="top"
                      delay={[350, 0]}
                    >
                      <span className="cursor-help border-b border-dashed border-border-strong">
                        {formatNumber(b.rata)}
                      </span>
                    </Tippy>
                  </td>

                  <td className={cn(TD, 'text-right font-mono tabular-nums text-foreground-subtle')}>
                    {b.jualLama > 0 ? formatNumber(b.jualLama) : '—'}
                  </td>

                  <td className={cn(TD, 'text-right')}>
                    <CurrencyTextField
                      name={`sell-price-${b.id}`}
                      aria-label={`Harga jual ${b.nama}`}
                      value={harga[b.id] ?? ''}
                      placeholder="0"
                      prefix=""
                      disabled={isLoading}
                      className={cn(
                        'ml-auto h-7.5 w-[128px] rounded-control px-2.5 text-right font-mono',
                        b.jualBaru <= 0 && 'border-warning'
                      )}
                      onChange={(val) => setHarga((lama) => ({ ...lama, [b.id]: val ?? '' }))}
                    />
                  </td>

                  <td className={cn(TD, 'text-right')}>
                    <PillMargin nilai={margin(b.rata, b.jualBaru)} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* SPEC-07 */}
      <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border bg-surface-raised px-4 py-2.75">
        <div className="flex gap-4.5">
          <div className="flex flex-col">
            <span className="text-xs text-foreground-subtle">Nilai barang masuk</span>
            <span className="font-mono text-[14px] font-bold tabular-nums">{formatNumber(nilaiMasuk)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-foreground-subtle">Proyeksi laba bila habis terjual</span>
            <span
              className={cn(
                'font-mono text-[14px] font-bold tabular-nums',
                proyeksiLaba < 0 ? 'text-destructive' : 'text-success'
              )}
            >
              {proyeksiLaba < 0 ? '−' : '+'} {formatNumber(Math.abs(proyeksiLaba))}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={isLoading} onClick={onClose}>
            Batal
          </Button>

          {/* Tippy di SPAN pembungkus: tombol disabled memakai `pointer-events: none`,
              jadi tooltip di tombolnya sendiri tidak pernah muncul justru saat dibutuhkan. */}
          <Tippy
            content={`${belumDiisi} barang belum punya harga jual`}
            disabled={bisaSimpan}
            placement="top"
            delay={[250, 0]}
          >
            <span className="block">
              <Button size="sm" loading={isLoading} disabled={!bisaSimpan} onClick={simpan}>
                <Check strokeWidth={2.2} aria-hidden /> Terima barang
              </Button>
            </span>
          </Tippy>
        </div>
      </div>
    </Modal>
  );
}

export default ReceiveStockInDialog;
