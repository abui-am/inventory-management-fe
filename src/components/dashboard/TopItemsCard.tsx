import EmptyState from '@/components/dashboard/EmptyState';
import Skeleton from '@/components/ui/skeleton';
import { formatNumber } from '@/utils/format';

export type TopItem = { id: string; name: string; value: number; qty: number; unit: string };

/**
 * Empat warna berurut, lalu netral untuk sisanya. Warnanya di sini BUKAN arti — tidak ada
 * "hijau berarti bagus" — melainkan pembeda antar batang, sama seperti di berkas desain.
 * Karena itu urutannya tetap: batang teratas selalu accent, di halaman mana pun.
 */
const BAR_COLORS = ['bg-accent', 'bg-info', 'bg-success', 'bg-warning'];

/** SPEC-14..17. Nilainya rupiah, bukan jumlah potong — yang dicari "menyumbang omzet terbesar". */
export function TopItemsCard({ items }: { items?: TopItem[] }): JSX.Element {
  const max = items && items.length > 0 ? Math.max(...items.map((i) => i.value)) : 0;

  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-card border border-border bg-surface px-4 py-3.5 shadow-sm">
      {/* SPEC-15 */}
      <span className="text-base font-semibold">Barang terlaris</span>

      {items === undefined && (
        // Ukurannya menyalin baris sungguhan: nama 18px (tinggi baris `text-sm`), batang
        // 5px, jarak antar keduanya 3px, jarak antar barang 9px. Jadi kartu tidak
        // berubah tinggi saat datanya datang.
        <div className="flex flex-col gap-2.25">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-0.75">
              <Skeleton className="h-[18px] w-full" />
              <Skeleton className="h-1.25 w-full rounded-full" />
            </div>
          ))}
        </div>
      )}

      {items?.length === 0 && <EmptyState>Belum ada barang terjual dalam rentang ini.</EmptyState>}

      {items && items.length > 0 && (
        // SPEC-16: antar barang 9px, nama ke batangnya 3px
        <div className="flex flex-col gap-2.25">
          {items.map(({ id, name, value, qty, unit }, i) => (
            <div key={id} className="flex flex-col gap-0.75">
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium" title={name}>
                  {name}
                </span>
                {/* Jumlah terjual, bukan cuma rupiahnya: dua barang bisa menyumbang omzet
                    yang mirip dari jumlah potong yang sama sekali berbeda. Dibuat lebih
                    redup dari nominalnya supaya urutan bacanya tetap nama → nilai.

                    Lebarnya dipatok dan isinya rata kiri supaya angkanya sejajar antar
                    baris — satuannya berbeda panjang ("kg" vs "karung"), jadi kalau blok
                    ini rata kanan, angkanya yang jadi bergeser-geser. 80px = 11 karakter
                    JetBrains Mono 12px, cukup untuk "222 renceng". */}
                <span className="w-20 shrink-0 truncate font-mono text-sm tabular-nums text-foreground-subtle">
                  {formatNumber(qty)} {unit}
                </span>
                <span className="shrink-0 font-mono text-sm tabular-nums text-foreground-muted">
                  {formatNumber(value)}
                </span>
              </div>
              {/* SPEC-17: tinggi 5px. Pada tinggi itu radius penuh dan radius 3px
                  terlihat sama, jadi dipakai token rounded-full — lihat Fase 0 poin 2. */}
              <div className="h-1.25 overflow-hidden rounded-full bg-surface-raised">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[i] ?? 'bg-foreground-subtle'}`}
                  style={{ width: `${max === 0 ? 0 : (value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TopItemsCard;
