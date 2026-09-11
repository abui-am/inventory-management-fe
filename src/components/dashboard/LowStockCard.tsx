import Link from 'next/link';

import EmptyState from '@/components/dashboard/EmptyState';
import { Badge } from '@/components/ui/badge';
import Skeleton from '@/components/ui/skeleton';
import { ItemData } from '@/typings/item';
import { formatNumber } from '@/utils/format';

/**
 * Lima barang dengan stok paling sedikit.
 *
 * Bukan "di bawah stok minimum": backend tidak menyimpan ambang batas per barang, jadi
 * satu-satunya yang bisa dijawab jujur adalah urutan terendah. Judulnya ditulis apa
 * adanya supaya tidak terbaca sebagai peringatan yang tidak pernah dihitung.
 */
export function LowStockCard({ items }: { items?: ItemData[] }): JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-card border border-border bg-surface px-4 py-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold">Stok paling menipis</span>
        <Link href="/items">
          <a className="text-sm text-accent hover:underline">Lihat semua</a>
        </Link>
      </div>

      {items === undefined && (
        // 20px = tinggi baris sungguhan (badge `Habis` yang menentukan, bukan teksnya),
        // jarak 7px sama dengan daftar terisinya.
        <div className="flex flex-col gap-1.75">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      )}

      {items?.length === 0 && <EmptyState>Belum ada barang terdaftar.</EmptyState>}

      {items && items.length > 0 && (
        <div className="flex flex-col gap-1.75">
          {items.map(({ id, name, quantity, unit }) => (
            <div key={id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 flex-1 truncate text-sm" title={name}>
                {name}
              </span>
              {quantity <= 0 ? (
                <Badge variant="destructive">Habis</Badge>
              ) : (
                <span className="shrink-0 font-mono text-sm tabular-nums text-foreground-muted">
                  {formatNumber(quantity)} <span className="text-foreground-subtle">{unit}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LowStockCard;
