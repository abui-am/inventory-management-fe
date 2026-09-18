import { Tag } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecordCard, RecordCardList } from '@/components/ui/record-card';
import { ItemData } from '@/typings/item';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** Margin terhadap harga beli, dalam persen. `null` selama harga jualnya belum ada. */
export const marginBarang = (beli: number, jual: number): number | null => {
  if (!jual) return null;
  return ((jual - beli) / jual) * 100;
};

export function PillMargin({ nilai }: { nilai: number | null }): JSX.Element {
  if (nilai === null) return <Badge variant="destructive">Belum</Badge>;
  if (nilai < 0) return <Badge variant="destructive">Rugi</Badge>;
  return <Badge variant={nilai < 15 ? 'warning' : 'success'}>{nilai.toFixed(0)}%</Badge>;
}

/** Daftar barang di layar sempit. Peran tiap kolom dijelaskan di `RecordCard`. */
export function ItemCardList({
  rows,
  loading,
  perPage,
  empty,
  canAdjustPrice,
  onAdjustPrice,
}: {
  rows?: ItemData[];
  loading: boolean;
  perPage: number;
  empty: { judul: string; pesan: string };
  canAdjustPrice: boolean;
  onAdjustPrice: (row: ItemData) => void;
}): JSX.Element {
  return (
    <RecordCardList loading={loading} count={perPage} empty={empty} isEmpty={rows?.length === 0}>
      {rows?.map((row) => {
        const stok = +(row.quantity ?? 0);
        const beli = +(row.buy_price ?? 0);
        const jual = +(row.sell_price ?? 0);

        return (
          <RecordCard
            key={row.id}
            ariaLabel={`Ubah harga jual ${row.name}`}
            onOpen={() => (canAdjustPrice ? onAdjustPrice(row) : undefined)}
            utama={row.name}
            pendamping={[
              // eslint-disable-next-line react/jsx-key
              <span className="font-mono">{row.item_id || '—'}</span>,
              `Beli ${formatNumber(beli)} · stok ${stok} ${row.unit ?? ''}`.trim(),
            ]}
            nilaiLabel="Harga jual"
            nilai={jual > 0 ? formatNumber(jual) : '—'}
            nilaiTone={jual > 0 ? 'default' : 'muted'}
            status={
              stok <= 0 ? <Badge variant="destructive">Habis</Badge> : <PillMargin nilai={marginBarang(beli, jual)} />
            }
            meta={`Nilai stok ${formatNumber(stok * beli)}`}
            aksi={
              canAdjustPrice ? (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Ubah harga jual ${row.name}`}
                  className="hover:text-accent"
                  onClick={() => onAdjustPrice(row)}
                >
                  <Tag strokeWidth={1.8} aria-hidden />
                </Button>
              ) : null
            }
          />
        );
      })}
    </RecordCardList>
  );
}

export default ItemCardList;
