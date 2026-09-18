import dayjs from 'dayjs';
import { ChevronDown, ChevronUp, Info, Search, Tag } from 'lucide-react';
import { NextPage } from 'next';
import React, { useMemo, useState } from 'react';

import { ThemedSelect } from '@/components/Form';
import ItemCardList, { marginBarang, PillMargin } from '@/components/item/ItemCardList';
import SellPriceDialog from '@/components/item/SellPriceDialog';
import Pagination from '@/components/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FilterTabs from '@/components/ui/filter-tabs';
import { Input } from '@/components/ui/input';
import Kpi from '@/components/ui/kpi';
import Skeleton from '@/components/ui/skeleton';
import { usePermission } from '@/context/permission-context';
import { useFetchItems } from '@/hooks/query/useFetchItem';
import { cn } from '@/lib/cn';
import { ItemData } from '@/typings/item';
import { ThemeablePage } from '@/typings/page';
import { useDebounceValue } from '@/utils/debounce';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

// Disalin PERSIS dari /transaction — daftar-daftar di aplikasi ini tidak boleh punya
// ritme yang berbeda.
const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
// py-1: nama + kode menempati dua baris (20 + 14 = 34px), jadi tinggi barisnya
// tetap 43px seperti waktu kode masih punya kolom sendiri.
const TD = 'border-b border-border px-2.5 py-1 align-middle text-base';

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

/**
 * Kolom yang benar-benar bisa disortir server.
 *
 * `margin` dan `nilai` tidak ada: keduanya dihitung dari dua kolom lain, bukan kolom.
 */
const SORTABLE: Record<string, string> = {
  barang: 'name',
  stok: 'quantity',
  beli: 'buy_price',
  jual: 'sell_price',
  diubah: 'updated_at',
};

const SORT_OPTIONS = [
  { label: 'Nama A–Z', value: 'barang:asc' },
  { label: 'Stok paling sedikit', value: 'stok:asc' },
  { label: 'Stok paling banyak', value: 'stok:desc' },
  { label: 'Terakhir diubah', value: 'diubah:desc' },
];

type Kolom = { key: string; label: string; align?: 'right' | 'center'; width?: string; className?: string };

const COLUMNS: Kolom[] = [
  { key: 'barang', label: 'Barang' },
  { key: 'stok', label: 'Stok', align: 'center', width: '120px' },
  { key: 'beli', label: 'Harga beli', align: 'right', width: '124px' },
  { key: 'jual', label: 'Harga jual', align: 'right', width: '124px' },
  { key: 'margin', label: 'Margin', align: 'right', width: '96px' },
  { key: 'nilai', label: 'Nilai stok', align: 'right', width: '132px', className: 'hidden lg:table-cell' },
  { key: 'diubah', label: 'Terakhir diubah', width: '124px', className: 'hidden md:table-cell' },
  { key: 'aksi', label: 'Aksi', align: 'right', width: '72px' },
];

const ariaSort = (aktif: boolean, dir: 'asc' | 'desc'): 'ascending' | 'descending' | undefined => {
  if (!aktif) return undefined;
  return dir === 'asc' ? 'ascending' : 'descending';
};

const ItemsPage: NextPage & ThemeablePage = () => {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'barang', dir: 'asc' });
  const [pageSize, setPageSize] = useState(10);
  const [paginationUrl, setPaginationUrl] = useState('');

  const [hargaItem, setHargaItem] = useState<ItemData | null>(null);
  const [hargaOpen, setHargaOpen] = useState(false);

  const { state } = usePermission();
  // Izin yang sama dengan layar "Terima barang", bukan pemeriksaan peran mentah di
  // komponen: aturannya satu tempat, dan artinya persis sama.
  const bolehAturHarga = state.permission.includes('control:stock.adjust-sell-price');

  const debouncedSearch = useDebounceValue(search, 500);

  const saring =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      setPaginationUrl('');
      set(value);
    };

  const { data, isLoading } = useFetchItems({
    paginated: true,
    per_page: pageSize,
    search: debouncedSearch,
    order_by: { [SORTABLE[sort.key] ?? 'name']: sort.dir },
    forceUrl: paginationUrl || undefined,
    ...(tab === 'empty' ? { where: { quantity: 0 } } : {}),
    ...(tab === 'unpriced' ? { where_null: ['sell_price'] } : {}),
  });

  const {
    data: rows,
    from,
    to,
    total,
    links,
    next_page_url: berikutnya,
    prev_page_url: sebelumnya,
  } = data?.data?.items ?? {};

  const totals = data?.data?.totals;

  const toggleSort = (key: string) => {
    if (!SORTABLE[key]) return;
    saring(setSort)(sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const bukaHarga = (row: ItemData) => {
    setHargaItem(row);
    setHargaOpen(true);
  };

  const kelas = (key: string) => COLUMNS.find((c) => c.key === key)?.className;
  const signature = `${paginationUrl}|${tab}|${debouncedSearch}|${sort.key}${sort.dir}|${pageSize}`;

  const kosong = useMemo(() => {
    if (debouncedSearch) {
      return {
        judul: `Tidak ada hasil untuk "${debouncedSearch}"`,
        pesan: 'Pencarian membaca nama dan kode barang.',
      };
    }
    if (tab === 'empty') return { judul: 'Tidak ada barang yang habis', pesan: 'Semua barang masih punya stok.' };
    if (tab === 'unpriced')
      return { judul: 'Semua barang sudah punya harga jual', pesan: 'Tidak ada yang menunggu ditentukan harganya.' };
    return { judul: 'Belum ada barang', pesan: 'Barang muncul saat barang masuk dicatat.' };
  }, [debouncedSearch, tab]);

  return (
    <div className="flex flex-col gap-2.5">
      {/* SPEC-01 */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Kpi label="Nilai persediaan" nilai={totals?.value} ket="dihitung dari harga beli rata-rata" />
        <Kpi
          label="Stok habis"
          nilai={totals?.out_of_stock}
          tone={totals && totals.out_of_stock > 0 ? 'destructive' : 'default'}
          ketTone={totals && totals.out_of_stock > 0 ? 'destructive' : undefined}
          ket={
            totals && totals.out_of_stock > 0 ? 'barang tidak bisa dijual hari ini' : 'semua barang masih punya stok'
          }
        />
        <Kpi
          label="Belum ada harga jual"
          nilai={totals?.unpriced}
          tone={totals && totals.unpriced > 0 ? 'warning' : 'default'}
          ketTone={totals && totals.unpriced > 0 ? 'warning' : undefined}
          ket={totals && totals.unpriced > 0 ? 'kasir tidak bisa menjualnya' : 'semua barang sudah punya harga jual'}
        />
      </div>

      {/* SPEC-02 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          aria-label="Filter barang"
          value={tab}
          onChange={saring(setTab)}
          tabs={[
            { value: 'all', label: 'Semua', count: totals?.count },
            { value: 'empty', label: 'Stok habis', count: totals?.out_of_stock },
            { value: 'unpriced', label: 'Belum ada harga jual', count: totals?.unpriced },
          ]}
        />

        <div className="flex w-full flex-wrap items-center gap-1.75 md:w-auto">
          <div className="relative w-full md:w-[220px]">
            <Search
              size={14}
              strokeWidth={1.9}
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-2.5 z-10 my-auto text-foreground-subtle"
            />
            <Input
              size="sm"
              className="rounded-control pl-[31px] pr-2.5"
              placeholder="Cari nama atau kode barang…"
              aria-label="Cari barang"
              value={search}
              onChange={(e) => saring(setSearch)(e.target.value)}
            />
          </div>

          {/* Hanya di layar sempit: di tabel, sortirnya ada di header kolom. */}
          <div className="min-w-0 flex-1 md:hidden">
            <ThemedSelect
              name="sortir"
              instanceId="sortir-barang"
              aria-label="Urutkan barang"
              value={SORT_OPTIONS.find((o) => o.value === `${sort.key}:${sort.dir}`) ?? SORT_OPTIONS[0]}
              options={SORT_OPTIONS}
              onChange={(val) => {
                const [key, dir] = `${(val as { value?: string })?.value ?? 'barang:asc'}`.split(':');
                saring(setSort)({ key, dir: dir as 'asc' | 'desc' });
              }}
            />
          </div>
        </div>
      </div>

      {/* Di bawah md tiap baris jadi kartu. */}
      <div className="md:hidden">
        <ItemCardList
          rows={rows}
          loading={isLoading}
          perPage={pageSize}
          empty={kosong}
          canAdjustPrice={bolehAturHarga}
          onAdjustPrice={bukaHarga}
        />

        <div className="mt-2 overflow-hidden rounded-card border border-border bg-surface shadow-sm">
          <Pagination
            stats={{ from: `${from ?? '0'}`, to: `${to ?? '0'}`, total: `${total ?? '0'}` }}
            links={links ?? []}
            onClickPageButton={(url) => setPaginationUrl(url)}
            onClickNext={() => setPaginationUrl((berikutnya as string) ?? '')}
            onClickPrevious={() => setPaginationUrl((sebelumnya as string) ?? '')}
          />
        </div>
      </div>

      {/* SPEC-03 */}
      <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-raised">
                {COLUMNS.map((col) => {
                  const aktif = sort.key === col.key;
                  const bisaUrut = SORTABLE[col.key];
                  const Arrow = sort.dir === 'asc' ? ChevronUp : ChevronDown;

                  return (
                    <th
                      key={col.key}
                      scope="col"
                      style={col.width ? { width: col.width } : undefined}
                      className={cn(TH, ALIGN[col.align ?? 'left'], col.className)}
                      aria-sort={ariaSort(aktif, sort.dir)}
                    >
                      {bisaUrut ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className={cn(
                            'group inline-flex items-center gap-1 transition-colors duration-fast hover:text-foreground',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25',
                            aktif && 'text-foreground'
                          )}
                        >
                          {col.label}
                          {aktif ? (
                            <Arrow size={11} aria-hidden />
                          ) : (
                            <ChevronDown
                              size={11}
                              aria-hidden
                              className="opacity-0 transition-opacity duration-fast group-hover:opacity-60"
                            />
                          )}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody key={signature} className="animate-in fade-in duration-200">
              {isLoading &&
                Array.from({ length: pageSize }, (_, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={i}>
                    {COLUMNS.map((col) => (
                      <td key={col.key} className={cn(TD, kelas(col.key))}>
                        <div className="flex h-[34px] items-center">
                          <Skeleton className="h-3.5 w-full" />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && rows?.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-2.5 py-12 text-center">
                    <p className="text-base font-medium">{kosong.judul}</p>
                    <p className="mt-1 text-sm text-foreground-muted">{kosong.pesan}</p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                rows?.map((row) => {
                  const stok = +(row.quantity ?? 0);
                  const beli = +(row.buy_price ?? 0);
                  const jual = +(row.sell_price ?? 0);

                  return (
                    <tr key={row.id} className="transition-colors duration-fast hover:bg-surface-raised">
                      <td className={cn(TD, 'max-w-0')}>
                        <div className="truncate font-medium" title={row.name}>
                          {row.name}
                        </div>
                        {/* Kode di bawah nama, bukan di sampingnya: di samping nama ia
                            berpindah-pindah mengikuti panjang namanya dan tidak pernah
                            sejajar antar baris. */}
                        <div className="truncate font-mono text-2xs text-foreground-subtle">{row.item_id || '—'}</div>
                      </td>

                      {/*
                        Stok habis ditandai lencana, bukan angka nol di antara angka lain.

                        Angka dan satuan punya lebar tetap masing-masing, lalu pasangannya
                        ditaruh di tengah kolom: rata kanan membuat satuan yang panjangnya
                        beda-beda menggeser angkanya, sedangkan lebar tetap yang dirata-kanankan
                        menyisakan ruang kosong di bawah judul kolom.
                      */}
                      <td className={cn(TD, 'whitespace-nowrap')}>
                        <div className="flex justify-center">
                          {stok <= 0 ? (
                            <Badge variant="destructive">Habis</Badge>
                          ) : (
                            <div className="flex items-baseline gap-1.5">
                              <span className="w-[38px] shrink-0 text-right font-mono font-semibold tabular-nums">
                                {stok}
                              </span>
                              {/* Lebarnya dipatok supaya angkanya tidak bergeser mengikuti
                                  panjang satuan — "dus" dan "tabung" harus berhenti di garis
                                  yang sama. */}
                              <span className="w-[44px] shrink-0 truncate text-left text-xs text-foreground-subtle">
                                {row.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td
                        className={cn(TD, 'whitespace-nowrap text-right font-mono tabular-nums text-foreground-muted')}
                      >
                        {beli > 0 ? formatNumber(beli) : '—'}
                      </td>

                      <td className={cn(TD, 'whitespace-nowrap text-right font-mono font-semibold tabular-nums')}>
                        {jual > 0 ? formatNumber(jual) : '—'}
                      </td>

                      <td className={cn(TD, 'text-right')}>
                        <PillMargin nilai={marginBarang(beli, jual)} />
                      </td>

                      <td
                        className={cn(
                          TD,
                          kelas('nilai'),
                          'whitespace-nowrap text-right font-mono tabular-nums text-foreground-muted'
                        )}
                      >
                        {stok * beli > 0 ? formatNumber(stok * beli) : '—'}
                      </td>

                      <td className={cn(TD, kelas('diubah'), 'whitespace-nowrap font-mono text-foreground-subtle')}>
                        {dayjs(row.updated_at).format('DD MMM YYYY')}
                      </td>

                      <td className={TD}>
                        <div className="flex items-center justify-end gap-1">
                          {bolehAturHarga && (
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label={`Ubah harga jual ${row.name}`}
                              tooltip="Ubah harga jual"
                              className="hover:text-accent"
                              onClick={() => bukaHarga(row)}
                            >
                              <Tag strokeWidth={1.8} aria-hidden />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <Pagination
          stats={{ from: `${from ?? '0'}`, to: `${to ?? '0'}`, total: `${total ?? '0'}` }}
          links={links ?? []}
          onClickPageButton={(url) => setPaginationUrl(url)}
          onClickNext={() => setPaginationUrl((berikutnya as string) ?? '')}
          onClickPrevious={() => setPaginationUrl((sebelumnya as string) ?? '')}
          onChangePerPage={(page) => {
            setPaginationUrl('');
            setPageSize(page?.value ?? 10);
          }}
        />
      </div>

      {/* Menyatakan aturan yang selama ini hanya diketahui dari mencoba. */}
      <p className="flex items-start gap-1.5 rounded-lg bg-info-subtle px-3.25 py-2 text-sm leading-[17px] text-info">
        <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Barang tidak dibuat dari halaman ini — dibuat saat barang masuk dicatat. Stok juga tidak bisa ditambah
          langsung; bergerak lewat transaksi dan audit barang.
        </span>
      </p>

      <SellPriceDialog item={hargaItem} isOpen={hargaOpen} onClose={() => setHargaOpen(false)} />
    </div>
  );
};

ItemsPage.themeable = true;

export default ItemsPage;
