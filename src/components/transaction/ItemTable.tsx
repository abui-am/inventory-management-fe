import { Check, Pencil, Plus, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { v4 } from 'uuid';

import { SelectItemsDetail } from '@/components/Form';
import { Button } from '@/components/ui/button';
import { Counter } from '@/components/ui/counter';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { Item } from '@/typings/item';
import { AdditionalStyle, controlStyle } from '@/utils/style';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

export type ItemOption = { label: string; value: string; data: Item };
export type ItemRow = { id: string; item: ItemOption | null; qty: number | '' };

// Nilainya sama persis dengan .th/.td di berkas desain: 11/700 dengan padding 9-10-7,
// dan sel 13px padding 8-10. Kembar dengan /transaction supaya dua tabel di alur yang
// sama tidak punya ritme yang berbeda.
const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/** Select barang: tinggi seragam, bedanya hanya garis aksen selama baris entri aktif. */
const itemSelectStyle: AdditionalStyle = {
  ...controlStyle,
  control: (base, state) => ({
    ...(controlStyle.control as (b: unknown, s: unknown) => object)(base, state),
    borderColor: state.isFocused ? 'hsl(var(--accent))' : 'hsl(var(--accent) / 0.55)',
  }),
};

/**
 * Tabel barang dengan baris entri di dalamnya.
 *
 * Sebelumnya penambahan barang adalah blok form tersendiri di atas tabel, lengkap
 * dengan tombol Batalkan/Tambah. Akibatnya kolom form tidak sejajar dengan kolom
 * tabel, dan mata harus berpindah dua kali untuk satu barang. Di sini barisnya adalah
 * row pertama tabel: kolomnya sejajar, dan yang baru ditambahkan langsung muncul
 * tepat di bawah tempat mengetiknya.
 *
 * Ubah juga terjadi di tempat — tidak lagi membuka modal. Yang bisa berubah hanya qty:
 * harga datang dari harga jual barang, dan menukar barangnya sama saja dengan
 * menghapus row lalu menambah yang lain.
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
  const [draft, setEntri] = useState<ItemOption | null>(null);
  const [draftQty, setEntriQty] = useState<number | ''>(1);
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number | ''>('');

  const stock = draft?.data?.quantity ?? 0;
  const price = draft?.data?.sell_price ?? 0;
  const canAdd = !!draft && +draftQty > 0 && +draftQty <= stock;

  const addRow = () => {
    if (!draft) {
      toast.error('Pilih barangnya dulu');
      return;
    }
    if (+draftQty <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }
    if (+draftQty > stock) {
      toast.error(`Stok ${draft.data.name} tinggal ${stock}`);
      return;
    }
    onChange([...items, { id: v4(), item: draft, qty: +draftQty }]);
    setEntri(null);
    setEntriQty(1);
  };

  const saveEdit = (row: ItemRow) => {
    const max = row.item?.data?.quantity ?? 0;
    if (+editQty <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }
    if (+editQty > max) {
      toast.error(`Stok ${row.item?.data?.name} tinggal ${max}`);
      return;
    }
    onChange(items.map((b) => (b.id === row.id ? { ...b, qty: +editQty } : b)));
    setEditId(null);
  };

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised px-3.25 py-2.25">
        <span className="text-base font-semibold">Barang</span>
        <Counter value={items.length} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <colgroup>
            <col />
            <col className="w-[104px]" />
            <col className="w-[88px]" />
            <col className="w-[112px]" />
            <col className="w-[128px]" />
            <col className="w-[86px]" />
          </colgroup>
          <thead>
            <tr>
              <th className={cn(TH, 'text-left')}>Nama</th>
              <th className={cn(TH, 'text-right')}>Qty</th>
              <th className={cn(TH, 'text-left')}>Satuan</th>
              <th className={cn(TH, 'text-right')}>Harga</th>
              <th className={cn(TH, 'text-right')}>Subtotal</th>
              <th className={TH} aria-label="Aksi" />
            </tr>
          </thead>

          <tbody>
            {/* Baris draft cepat — selalu row pertama, tidak pernah hilang. */}
            <tr className="bg-accent-subtle">
              <td className={TD}>
                <SelectItemsDetail
                  name="itemSearch"
                  aria-label="Cari barang"
                  placeholder="Ketik nama atau kode barang…"
                  isDisabled={disabled}
                  value={draft}
                  additionalStyle={itemSelectStyle}
                  onChange={(val) => {
                    setEntri(val as ItemOption | null);
                    setEntriQty(1);
                  }}
                />
              </td>
              <td className={TD}>
                <Input
                  size="sm"
                  type="number"
                  min={1}
                  max={stock || undefined}
                  aria-label="Jumlah"
                  disabled={disabled || !draft}
                  onFocus={(e) => e.target.select()}
                  value={draftQty}
                  onChange={(e) => setEntriQty(e.target.value === '' ? '' : +e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRow();
                    }
                  }}
                  className="rounded-control border-accent/55 text-right font-mono tabular-nums"
                />
              </td>
              <td className={cn(TD, draft ? 'text-foreground-muted' : 'text-foreground-subtle')}>
                {draft?.data?.unit ?? '—'}
              </td>
              <td
                className={cn(
                  TD,
                  'text-right font-mono tabular-nums',
                  draft ? 'text-foreground-muted' : 'text-foreground-subtle'
                )}
              >
                {draft ? formatNumber(price) : '—'}
              </td>
              <td
                className={cn(
                  TD,
                  'text-right font-mono tabular-nums',
                  draft ? 'font-semibold' : 'text-foreground-subtle'
                )}
              >
                {draft ? formatNumber(price * +draftQty) : '—'}
              </td>
              <td className={TD}>
                <div className="flex justify-end">
                  <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label="Tambahkan barang"
                    disabled={disabled || !canAdd}
                    className="border-accent bg-surface text-accent hover:bg-accent-subtle"
                    onClick={addRow}
                  >
                    <Plus strokeWidth={2.2} aria-hidden />
                  </Button>
                </div>
              </td>
            </tr>

            {items.map((row) => {
              const isEditing = row.id === editId;
              const rowPrice = row.item?.data?.sell_price ?? 0;
              const displayQty = isEditing ? editQty : row.qty;
              return (
                <tr
                  key={row.id}
                  className={cn(
                    isEditing ? 'bg-accent-subtle' : 'transition-colors duration-fast hover:bg-surface-raised'
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

                  <td className={cn(TD, 'text-right')}>
                    {isEditing ? (
                      <Input
                        size="sm"
                        type="number"
                        min={1}
                        max={row.item?.data?.quantity}
                        aria-label={`Jumlah ${row.item?.data?.name ?? ''}`}
                        autoFocus
                        // Tanpa ini kursor mendarat di ujung formatNumber lama: mengetik "3" pada
                        // qty 1 jadi 13, bukan 3.
                        onFocus={(e) => e.target.select()}
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value === '' ? '' : +e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveEdit(row);
                          }
                          if (e.key === 'Escape') setEditId(null);
                        }}
                        className="rounded-control border-accent text-right font-mono tabular-nums"
                      />
                    ) : (
                      <span className="font-mono tabular-nums">{row.qty}</span>
                    )}
                  </td>

                  <td className={cn(TD, 'text-foreground-muted')}>{row.item?.data?.unit ?? '-'}</td>
                  <td className={cn(TD, 'text-right font-mono tabular-nums text-foreground-muted')}>
                    {formatNumber(rowPrice)}
                  </td>
                  <td className={cn(TD, 'text-right font-mono font-semibold tabular-nums')}>
                    {formatNumber(rowPrice * +(displayQty || 0))}
                  </td>

                  <td className={TD}>
                    <div className="flex justify-end gap-1.25">
                      {isEditing ? (
                        <Button
                          size="icon-sm"
                          variant="outline"
                          aria-label="Simpan perubahan"
                          className="border-accent bg-surface text-accent hover:bg-accent-subtle"
                          onClick={() => saveEdit(row)}
                        >
                          <Check strokeWidth={2.4} aria-hidden />
                        </Button>
                      ) : (
                        <Button
                          size="icon-sm"
                          variant="outline"
                          aria-label="Ubah jumlah"
                          disabled={disabled}
                          onClick={() => {
                            setEditId(row.id);
                            setEditQty(row.qty);
                          }}
                        >
                          <Pencil strokeWidth={1.9} aria-hidden />
                        </Button>
                      )}
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label={isEditing ? 'Batalkan perubahan' : 'Hapus barang'}
                        disabled={disabled}
                        onClick={() => {
                          if (isEditing) {
                            setEditId(null);
                            return;
                          }
                          onChange(items.filter((b) => b.id !== row.id));
                        }}
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
    </div>
  );
}

export default ItemTable;
