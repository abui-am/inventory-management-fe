import { ArrowRight, Minus, PackageOpen, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SelectInstance } from 'react-select';

import { CurrencyTextField, SelectItems } from '@/components/Form';
import { Button } from '@/components/ui/button';
import { Counter } from '@/components/ui/counter';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { Option } from '@/typings/common';
import { ItemData } from '@/typings/item';
import { controlStyle, SelectGroup, SelectOption } from '@/utils/style';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** Bentuknya sengaja sama dengan yang lama supaya payload `create` tidak ikut berubah. */
export type StockInRow = {
  /** `data` hanya ada untuk barang yang sudah terdaftar; barang baru hanya punya label. */
  item: Partial<Option<ItemData>> | null;
  qty: number | string;
  buyPrice: number | string;
  unit: string;
  memo: string;
  isNew: boolean;
  itemId: string;
  shippingCost: number | '';
};

const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
// Disalin PERSIS dari ItemTable di /transaction/add — barisnya memang lebih tinggi di
// sini karena isinya lebih banyak, tapi paddingnya tidak boleh ikut berbeda.
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/** Lama sorotan baris yang baru masuk. */
const SOROT_MS = 1200;

function Tuts({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <span className="rounded-md border border-border bg-surface-raised px-1.25 font-mono text-xs leading-4 text-foreground-muted">
      {children}
    </span>
  );
}

function Petunjuk({ tuts, children }: { tuts: string; children: React.ReactNode }): JSX.Element {
  return (
    <span className="flex items-center gap-1.25">
      <Tuts>{tuts}</Tuts>
      <span className="text-foreground-subtle">{children}</span>
    </span>
  );
}

/**
 * Daftar barang pada barang masuk baru.
 *
 * Sama seperti di penjualan: tidak ada modal "Informasi Barang", tidak ada baris draf,
 * tidak ada tombol tambah. Memilih barang BERARTI barang itu masuk daftar; sisanya —
 * jumlah, harga beli, catatan — diisi di barisnya sendiri.
 *
 * Bedanya dengan penjualan ada tiga, dan ketiganya khas pembelian:
 *   1. HARGA BELI diisi per baris. Ia datang dari supplier, bukan dari master barang.
 *   2. Stok ditampilkan sebagai akibat: 8 → 20, sebelum disimpan.
 *   3. Barang yang belum terdaftar boleh dibuat di sini — ketik namanya, lalu isi satuan
 *      dan kodenya di barisnya. Inilah satu-satunya layar yang boleh, karena barang
 *      memang lahir dari pembelian.
 */
export function StockInItemTable({
  items,
  onChange,
  disabled,
}: {
  items: StockInRow[];
  onChange: (items: StockInRow[]) => void;
  disabled?: boolean;
}): JSX.Element {
  const cariRef = useRef<SelectInstance<SelectOption, boolean, SelectGroup> | null>(null);
  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [barisBaru, setBarisBaru] = useState<string | null>(null);
  const [fokusQty, setFokusQty] = useState<string | null>(null);

  useEffect(() => {
    if (!fokusQty) return;
    const input = qtyRefs.current[fokusQty];
    input?.focus();
    input?.select();
    setFokusQty(null);
  }, [fokusQty]);

  useEffect(() => {
    if (!barisBaru) return undefined;
    const timer = setTimeout(() => setBarisBaru(null), SOROT_MS);
    return () => clearTimeout(timer);
  }, [barisBaru]);

  /** Kunci baris: id barang yang sudah terdaftar, atau namanya untuk barang baru. */
  const kunci = (row: StockInRow) => `${row.item?.value ?? row.item?.label ?? ''}`;

  // Label option berbunyi `Nama (ID: KODE)` — kodenya sudah punya kolom sendiri di baris
  // ini, jadi yang ditampilkan namanya saja.
  const nama = (row: StockInRow) => row.item?.data?.name ?? row.item?.label ?? '';

  const tambah = (opsi: Option<ItemData> & { __isNew__?: boolean }) => {
    // `__isNew__` nama milik react-select untuk option yang baru diketik — bukan kita
    // yang memilih namanya.
    // eslint-disable-next-line no-underscore-dangle
    const baru = !!opsi.__isNew__;
    const { data } = opsi;
    const id = `${opsi.value ?? opsi.label}`;

    const adaBaris = items.find((row) => kunci(row) === id);
    if (adaBaris) {
      onChange(items.map((row) => (kunci(row) === id ? { ...row, qty: +(row.qty || 0) + 1 } : row)));
      setBarisBaru(id);
      setFokusQty(id);
      return;
    }

    onChange([
      ...items,
      {
        item: baru ? { label: opsi.label, value: opsi.label } : opsi,
        qty: 1,
        // Harga beli terakhir dipakai sebagai titik awal, bukan sebagai jawaban: ia
        // hampir selalu benar dan tetap bisa diketik ulang saat supplier menaikkan harga.
        buyPrice: baru ? '' : data?.buy_price ?? '',
        unit: baru ? '' : data?.unit ?? '',
        memo: '',
        isNew: baru,
        itemId: baru ? '' : data?.item_id ?? '',
        shippingCost: '',
      },
    ]);
    setBarisBaru(id);
    setFokusQty(id);
  };

  const ubah = (id: string, patch: Partial<StockInRow>) =>
    onChange(items.map((row) => (kunci(row) === id ? { ...row, ...patch } : row)));

  const subtotal = items.reduce((total, row) => total + +(row.qty || 0) * +(row.buyPrice || 0), 0);

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised px-3.25 py-2.25">
        <span className="text-base font-semibold">Barang</span>
        <Counter value={items.length} />
      </div>

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <colgroup>
              <col />
              <col className="w-[132px]" />
              <col className="w-[88px]" />
              <col className="w-[128px]" />
              <col className="w-[104px]" />
              <col className="w-[120px]" />
              <col className="w-[44px]" />
            </colgroup>
            <thead>
              <tr>
                <th className={cn(TH, 'text-left')}>Nama</th>
                <th className={cn(TH, 'text-center')}>Qty</th>
                <th className={cn(TH, 'text-left')}>Satuan</th>
                <th className={cn(TH, 'text-right')}>Harga beli</th>
                <th className={cn(TH, 'text-left')}>Stok</th>
                <th className={cn(TH, 'text-right')}>Subtotal</th>
                <th className={TH} aria-label="Aksi" />
              </tr>
            </thead>

            <tbody>
              {items.map((row) => {
                const id = kunci(row);
                const qty = +(row.qty || 0);
                const stok = +(row.item?.data?.quantity ?? 0);
                const baru = id === barisBaru;

                return (
                  <tr
                    key={id}
                    className={cn(
                      'transition-colors duration-fast',
                      baru ? 'bg-accent-subtle' : 'hover:bg-surface-raised'
                    )}
                  >
                    <td className={TD}>
                      <div className="font-medium">{nama(row)}</div>
                      <div className="mt-px flex items-center gap-1.5">
                        {row.isNew ? (
                          <>
                            <span className="rounded-md bg-accent-subtle px-1.5 text-2xs font-semibold text-accent">
                              barang baru
                            </span>
                            {/* Kode barang WAJIB untuk barang baru: ia yang dipakai kasir
                                mencarinya nanti. Di form lama ini satu field di modal
                                tersendiri; di sini ia menempel pada barisnya. */}
                            <Input
                              size="xs"
                              aria-label={`Kode ${nama(row)}`}
                              placeholder="Kode barang"
                              disabled={disabled}
                              value={row.itemId}
                              onChange={(e) => ubah(id, { itemId: e.target.value })}
                              className="w-[104px] font-mono text-2xs"
                            />
                          </>
                        ) : (
                          <span className="font-mono text-2xs text-foreground-subtle">{row.itemId || '—'}</span>
                        )}
                      </div>
                      <Input
                        size="xs"
                        aria-label={`Catatan ${nama(row)}`}
                        placeholder="+ Catatan"
                        disabled={disabled}
                        value={row.memo}
                        onChange={(e) => ubah(id, { memo: e.target.value })}
                        className="mt-1 h-6 w-full border-transparent bg-transparent px-0 text-xs placeholder:text-foreground-subtle hover:border-border-strong hover:px-2 focus-visible:px-2"
                      />
                    </td>

                    <td className={cn(TD, 'text-center')}>
                      <div
                        className={cn(
                          'inline-flex items-center overflow-hidden rounded-control border border-border-strong',
                          'transition-colors duration-fast',
                          'focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/25'
                        )}
                      >
                        <button
                          type="button"
                          aria-label={`Kurangi ${nama(row)}`}
                          disabled={disabled || qty <= 1}
                          onClick={() => ubah(id, { qty: qty - 1 })}
                          className="flex size-7 select-none items-center justify-center text-foreground-subtle transition-colors duration-fast hover:bg-surface-raised hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                        >
                          <Minus size={14} strokeWidth={2} aria-hidden />
                        </button>
                        <input
                          ref={(el) => {
                            qtyRefs.current[id] = el;
                          }}
                          type="number"
                          min={1}
                          aria-label={`Jumlah ${nama(row)}`}
                          disabled={disabled}
                          value={row.qty}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => ubah(id, { qty: e.target.value === '' ? '' : +e.target.value })}
                          onBlur={() => ubah(id, { qty: Math.max(1, qty) })}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter') return;
                            e.preventDefault();
                            ubah(id, { qty: Math.max(1, qty) });
                            cariRef.current?.focus();
                          }}
                          className="h-7 w-12 border-0 bg-transparent text-center font-mono text-base font-medium tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          aria-label={`Tambah ${nama(row)}`}
                          disabled={disabled}
                          onClick={() => ubah(id, { qty: qty + 1 })}
                          className="flex size-7 select-none items-center justify-center text-foreground-subtle transition-colors duration-fast hover:bg-surface-raised hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                        >
                          <Plus size={14} strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    </td>

                    {/* Satuan hanya bisa diketik untuk barang baru — barang yang sudah
                        terdaftar memakai satuan yang sudah tercatat di master. */}
                    <td className={TD}>
                      {row.isNew ? (
                        <Input
                          size="xs"
                          aria-label={`Satuan ${nama(row)}`}
                          placeholder="pak"
                          disabled={disabled}
                          value={row.unit}
                          onChange={(e) => ubah(id, { unit: e.target.value })}
                          className="w-[72px]"
                        />
                      ) : (
                        <span className="text-foreground-muted">{row.unit || '—'}</span>
                      )}
                    </td>

                    <td className={cn(TD, 'text-right')}>
                      <CurrencyTextField
                        name={`buyPrice-${id}`}
                        aria-label={`Harga beli ${nama(row)}`}
                        value={row.buyPrice}
                        placeholder="0"
                        prefix=""
                        disabled={disabled}
                        className="h-7 w-[108px] rounded-control px-2 text-right font-mono"
                        onChange={(val) => ubah(id, { buyPrice: val ?? '' })}
                      />
                    </td>

                    {/* Akibat transaksi ini pada stok, sebelum disimpan. */}
                    <td className={cn(TD, 'whitespace-nowrap text-sm')}>
                      {row.isNew ? (
                        <span className="text-foreground-subtle">Baru</span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="font-mono text-foreground-subtle">{stok}</span>
                          <ArrowRight size={11} strokeWidth={2} className="text-foreground-subtle" aria-hidden />
                          <span className="font-mono font-semibold">{stok + qty}</span>
                        </span>
                      )}
                    </td>

                    <td className={cn(TD, 'text-right font-mono font-semibold tabular-nums')}>
                      {formatNumber(qty * +(row.buyPrice || 0))}
                    </td>

                    <td className={TD}>
                      <div className="flex justify-end">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          aria-label={`Hapus ${nama(row)}`}
                          disabled={disabled}
                          className="border-transparent hover:text-destructive"
                          onClick={() => onChange(items.filter((b) => kunci(b) !== id))}
                        >
                          <X strokeWidth={2} aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-3.25 pt-3.25">
        <SelectItems
          ref={cariRef}
          name="itemSearch"
          instanceId="cari-barang-masuk"
          aria-label="Cari barang"
          placeholder="Ketik nama atau kode barang…"
          isDisabled={disabled}
          value={null}
          additionalStyle={controlStyle}
          formatCreateLabel={(nama: string) => `Barang baru: ${nama}`}
          onChange={(val) => {
            const opsi = val as (Option<ItemData> & { __isNew__?: boolean }) | null;
            if (opsi) tambah(opsi);
          }}
        />
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center gap-1 px-3.25 py-6 text-center">
          <PackageOpen size={22} strokeWidth={1.5} className="text-foreground-subtle" aria-hidden />
          <span className="text-base text-foreground-muted">Belum ada barang</span>
          <span className="text-sm text-foreground-subtle">
            Pilih barang di dropdown di atas — begitu dipilih, barang langsung masuk daftar.
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3.5 px-3.25 pb-3.25 pt-2 text-xs">
        <Petunjuk tuts="↑ ↓">pilih</Petunjuk>
        <Petunjuk tuts="Enter">tambahkan</Petunjuk>
        <Petunjuk tuts="Ketik">nama baru untuk membuat barang</Petunjuk>
      </div>

      {items.length > 0 && (
        <div className="flex items-center justify-between border-t border-border bg-surface-raised px-3.25 py-2.25">
          <span className="text-sm text-foreground-muted">{items.length} barang</span>
          <span className="flex items-baseline gap-2">
            <span className="text-sm text-foreground-muted">Subtotal</span>
            <span className="font-mono text-lg font-bold tabular-nums">{formatNumber(subtotal)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

export default StockInItemTable;
