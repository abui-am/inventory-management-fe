import { Minus, PackageOpen, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { SelectInstance } from 'react-select';
import { v4 } from 'uuid';

import { SelectItemsDetail } from '@/components/Form';
import { Button } from '@/components/ui/button';
import { Counter } from '@/components/ui/counter';
import { cn } from '@/lib/cn';
import { Item } from '@/typings/item';
import { controlStyle, SelectGroup, SelectOption } from '@/utils/style';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

export type ItemOption = { label: string; value: string; data: Item };
export type ItemRow = { id: string; item: ItemOption | null; qty: number | '' };

// Nilainya sama persis dengan .th/.td di berkas desain: 11/700 dengan padding 9-10-7,
// dan sel 13px padding 8-10. Kembar dengan /transaction supaya dua tabel di alur yang
// sama tidak punya ritme yang berbeda.
const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/** Lama sorotan baris yang baru masuk. Cukup untuk terlihat, tidak sampai mengganggu. */
const SOROT_MS = 1200;

/** Tuts papan ketik, bukan teks biasa: yang ditekan harus beda bentuk dari keterangannya. */
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
 * Daftar barang transaksi.
 *
 * Tidak ada baris draf dan tidak ada tombol "+". Memilih barang di kotak cari BERARTI
 * barang itu masuk daftar — karena baris draf yang lama bentuknya sama persis dengan
 * baris yang sudah masuk, jadi ia terbaca seperti sudah tercatat padahal belum. Itulah
 * yang membuat barang terakhir sering hilang, dan pada transaksi satu barang seluruh
 * isinya hilang. Kalau tidak ada yang perlu ditekan, tidak ada yang bisa lupa ditekan.
 *
 * Qty diubah di tempat lewat stepper; barang yang sama dipilih dua kali menambah qty
 * barisnya, bukan membuat baris kedua — sama seperti memindai barang di kasir.
 */
export function ItemTable({
  items,
  onChange,
  disabled,
}: {
  items: ItemRow[];
  onChange: (items: ItemRow[]) => void;
  disabled?: boolean;
}): JSX.Element {
  const cariRef = useRef<SelectInstance<SelectOption, boolean, SelectGroup> | null>(null);
  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [barisBaru, setBarisBaru] = useState<string | null>(null);
  // Baris yang qty-nya harus difokuskan setelah render berikutnya. `autoFocus` tidak
  // cukup: baris yang qty-nya bertambah karena barang dipilih ulang tidak dipasang ulang.
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

  const tambah = (opsi: ItemOption) => {
    const stok = opsi.data?.quantity ?? 0;
    const adaBaris = items.find((row) => row.item?.value === opsi.value);

    if (adaBaris) {
      const berikutnya = +(adaBaris.qty || 0) + 1;
      if (berikutnya > stok) {
        toast.error(`Stok ${opsi.data.name} tinggal ${stok}`);
      } else {
        onChange(items.map((row) => (row.id === adaBaris.id ? { ...row, qty: berikutnya } : row)));
      }
      setBarisBaru(adaBaris.id);
      setFokusQty(adaBaris.id);
      return;
    }

    const id = v4();
    onChange([...items, { id, item: opsi, qty: 1 }]);
    setBarisBaru(id);
    setFokusQty(id);
  };

  /** Qty boleh kosong selama diketik; pembatasannya dilakukan saat nilainya ditetapkan. */
  const setQty = (row: ItemRow, nilai: number | '') =>
    onChange(items.map((b) => (b.id === row.id ? { ...b, qty: nilai } : b)));

  const tetapkanQty = (row: ItemRow, nilai: number) => {
    const stok = row.item?.data?.quantity ?? 0;
    if (nilai > stok) {
      toast.error(`Stok ${row.item?.data?.name} tinggal ${stok}`);
      setQty(row, stok);
      return;
    }
    setQty(row, Math.max(1, nilai));
  };

  const subtotal = items.reduce((total, { item, qty }) => total + (item?.data?.sell_price ?? 0) * +(qty || 0), 0);

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
              <col className="w-[112px]" />
              <col className="w-[128px]" />
              <col className="w-[52px]" />
            </colgroup>
            <thead>
              <tr>
                <th className={cn(TH, 'text-left')}>Nama</th>
                <th className={cn(TH, 'text-center')}>Qty</th>
                <th className={cn(TH, 'text-left')}>Satuan</th>
                <th className={cn(TH, 'text-right')}>Harga</th>
                <th className={cn(TH, 'text-right')}>Subtotal</th>
                <th className={TH} aria-label="Aksi" />
              </tr>
            </thead>

            <tbody>
              {items.map((row) => {
                const harga = row.item?.data?.sell_price ?? 0;
                const stok = row.item?.data?.quantity ?? 0;
                const baru = row.id === barisBaru;

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      'transition-colors duration-fast',
                      baru ? 'bg-accent-subtle' : 'hover:bg-surface-raised'
                    )}
                  >
                    <td className={TD}>
                      <div className="flex flex-col">
                        <span className="font-medium">{row.item?.data?.name ?? row.item?.label ?? ''}</span>
                        <span className="font-mono text-2xs text-foreground-subtle">
                          {row.item?.data?.item_id ?? '-'}
                        </span>
                      </div>
                    </td>

                    {/* Stepper, bukan tombol pensil lalu tombol centang: mengubah 1 jadi 2
                        adalah hal yang paling sering terjadi di sini, dan dulu ia butuh
                        tiga klik. */}
                    <td className={cn(TD, 'text-center')}>
                      {/* Cincin fokus dipasang di GRUP, bukan di inputnya. Input di dalam
                          grup ini tidak punya garis sendiri, jadi penanda fokus di
                          elemennya hanya mengubah latar satu ruas di tengah — terbaca
                          seperti kotak yang patah, bukan seperti kontrol yang aktif. */}
                      <div
                        className={cn(
                          'inline-flex items-center overflow-hidden rounded-control border border-border-strong',
                          'transition-colors duration-fast',
                          'focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/25'
                        )}
                      >
                        <button
                          type="button"
                          aria-label={`Kurangi ${row.item?.data?.name ?? ''}`}
                          disabled={disabled || +(row.qty || 0) <= 1}
                          onClick={() => tetapkanQty(row, +(row.qty || 0) - 1)}
                          className="flex size-7 select-none items-center justify-center text-foreground-subtle transition-colors duration-fast hover:bg-surface-raised hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                        >
                          <Minus size={14} strokeWidth={2} aria-hidden />
                        </button>
                        <input
                          ref={(el) => {
                            qtyRefs.current[row.id] = el;
                          }}
                          type="number"
                          min={1}
                          max={stok}
                          aria-label={`Jumlah ${row.item?.data?.name ?? ''}`}
                          disabled={disabled}
                          value={row.qty}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setQty(row, e.target.value === '' ? '' : +e.target.value)}
                          onBlur={() => tetapkanQty(row, +(row.qty || 0))}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter') return;
                            e.preventDefault();
                            tetapkanQty(row, +(row.qty || 0));
                            // Kembali ke kotak cari: satu transaksi berisi banyak barang,
                            // dan mengetik barang berikutnya tidak boleh butuh mouse.
                            cariRef.current?.focus();
                          }}
                          // 48px: cukup untuk tiga digit tanpa angkanya menempel ke tombol.
                          // Panah bawaan number input dimatikan — di lebar ini ia menutupi
                          // angkanya, dan naik-turunnya sudah punya tombol sendiri.
                          className="h-7 w-12 border-0 bg-transparent text-center font-mono text-base font-medium tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          aria-label={`Tambah ${row.item?.data?.name ?? ''}`}
                          disabled={disabled || +(row.qty || 0) >= stok}
                          onClick={() => tetapkanQty(row, +(row.qty || 0) + 1)}
                          className="flex size-7 select-none items-center justify-center text-foreground-subtle transition-colors duration-fast hover:bg-surface-raised hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                        >
                          <Plus size={14} strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    </td>

                    <td className={cn(TD, 'text-foreground-muted')}>{row.item?.data?.unit ?? '-'}</td>
                    <td className={cn(TD, 'text-right font-mono tabular-nums text-foreground-muted')}>
                      {formatNumber(harga)}
                    </td>
                    <td className={cn(TD, 'text-right font-mono font-semibold tabular-nums')}>
                      {formatNumber(harga * +(row.qty || 0))}
                    </td>

                    <td className={TD}>
                      <div className="flex justify-end">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          aria-label={`Hapus ${row.item?.data?.name ?? ''}`}
                          disabled={disabled}
                          className="border-transparent hover:text-destructive"
                          onClick={() => onChange(items.filter((b) => b.id !== row.id))}
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

      {/* Kotak cari duduk SETELAH daftar: barang yang baru masuk muncul tepat di atas
          tempat mengetiknya, dan posisinya tidak berpindah-pindah saat daftar bertambah. */}
      <div className="px-3.25 pt-3.25">
        <SelectItemsDetail
          ref={cariRef}
          name="itemSearch"
          instanceId="cari-barang"
          aria-label="Cari barang"
          placeholder="Ketik nama atau kode barang…"
          isDisabled={disabled}
          // Selalu kosong: pilihannya langsung pindah ke daftar, jadi kotak ini tidak
          // pernah menyimpan apa pun yang masih menunggu.
          value={null}
          additionalStyle={controlStyle}
          onChange={(val) => {
            const opsi = val as ItemOption | null;
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

      {/* Petunjuk tuts ditaruh SETELAH empty state, bukan sebelumnya. Di atas, ia menyelipkan
          satu baris di antara kotak cari dan pesan kosongnya, dan pesan itu berhenti berada
          di tengah kartu — persis yang terlihat janggal. */}
      <div className="flex flex-wrap items-center gap-3.5 px-3.25 pb-3.25 pt-2 text-xs">
        <Petunjuk tuts="↑ ↓">pilih</Petunjuk>
        <Petunjuk tuts="Enter">tambahkan</Petunjuk>
        {items.length > 0 && <Petunjuk tuts="Enter">di qty, kembali ke pencarian</Petunjuk>}
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

export default ItemTable;
