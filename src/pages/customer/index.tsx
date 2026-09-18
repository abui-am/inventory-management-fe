import dayjs from 'dayjs';
import { ChevronDown, ChevronUp, Eye, Pencil, Plus, Search } from 'lucide-react';
import { NextPage } from 'next';
import React, { useMemo, useState } from 'react';

import CustomerCardList from '@/components/customer/CustomerCardList';
import CustomerDetailSheet, { inisial } from '@/components/customer/CustomerDetailSheet';
import CustomerFormDialog from '@/components/customer/CustomerFormDialog';
import { ThemedSelect } from '@/components/Form';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Skeleton from '@/components/ui/skeleton';
import { useFetchCustomers } from '@/hooks/query/useFetchCustomer';
import { cn } from '@/lib/cn';
import { CustomerData } from '@/typings/customer';
import { ThemeablePage } from '@/typings/page';
import { useDebounceValue } from '@/utils/debounce';
import { formatPhoneNumber } from '@/utils/format';
import { controlStyle } from '@/utils/style';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

// Disalin PERSIS dari /transaction — tiga daftar di aplikasi yang sama tidak boleh punya
// ritme yang berbeda.
const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/**
 * Kolom yang benar-benar bisa disortir server.
 *
 * `total_debt` sengaja TIDAK ada: ia dijumlahkan dari utang yang belum lunas di
 * `Customer::simpleView()`, bukan kolom tabel — `order_by` padanya melempar.
 */
const SORTABLE: Record<string, string> = {
  nama: 'full_name',
  terdaftar: 'created_at',
};

type Kolom = { key: string; label: string; align?: 'right'; width?: string; className?: string };

/**
 * Sortir untuk layar sempit.
 *
 * Di tabel, sortir menempel pada header kolom — dan di tampilan kartu header itu tidak
 * ada. Tanpa kontrol ini daftar di HP tidak bisa diurutkan sama sekali. Isinya persis
 * kolom yang memang bisa disortir server, ditulis sebagai kalimat.
 */
const SORT_OPTIONS = [
  { label: 'Nama A–Z', value: 'nama:asc' },
  { label: 'Nama Z–A', value: 'nama:desc' },
  { label: 'Terbaru', value: 'terdaftar:desc' },
  { label: 'Terlama', value: 'terdaftar:asc' },
];

/**
 * Lebar kolom ditulis semuanya, dua di antaranya dalam persen.
 *
 * Tanpa itu kolom Nama menelan seluruh ruang sisa — isinya paling panjang — dan lima
 * kolom lain berdesakan di tepi kanan sementara di tengah tabel menganga kosong.
 */
const COLUMNS: Kolom[] = [
  { key: 'nama', label: 'Nama', width: '30%' },
  { key: 'hp', label: 'Nomor HP', width: '168px' },
  { key: 'alamat', label: 'Alamat', width: '28%', className: 'hidden md:table-cell' },
  { key: 'piutang', label: 'Piutang', align: 'right', width: '132px' },
  { key: 'terdaftar', label: 'Terdaftar', width: '124px', className: 'hidden md:table-cell' },
  { key: 'aksi', label: 'Aksi', align: 'right', width: '96px' },
];

const ariaSort = (aktif: boolean, dir: 'asc' | 'desc'): 'ascending' | 'descending' | undefined => {
  if (!aktif) return undefined;
  return dir === 'asc' ? 'ascending' : 'descending';
};

const CustomerPage: NextPage & ThemeablePage = () => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'nama', dir: 'asc' });
  const [pageSize, setPageSize] = useState(10);
  const [paginationUrl, setPaginationUrl] = useState('');

  // Dua state, bukan satu: kalau datanya dibuang saat menutup, sheet-nya lepas seketika
  // dan animasi keluarnya tidak pernah sempat berjalan.
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // `null` + dialog terbuka berarti membuat baru.
  const [mengubah, setMengubah] = useState<CustomerData | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // 500 ms: tanpa ini tiap ketikan mengirim satu request pencarian.
  const debouncedSearch = useDebounceValue(search, 500);

  /** Menyaring berarti kembali ke halaman satu — `forceUrl` menyimpan filter yang lama. */
  const saring =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      setPaginationUrl('');
      set(value);
    };

  const { data: dataCustomer, isLoading } = useFetchCustomers({
    search: debouncedSearch,
    order_by: { [SORTABLE[sort.key] ?? 'full_name']: sort.dir },
    paginated: true,
    per_page: pageSize,
    forceUrl: paginationUrl || undefined,
  });

  const {
    data: rows,
    from,
    to,
    total,
    links,
    next_page_url: berikutnya,
    prev_page_url: sebelumnya,
  } = dataCustomer?.data?.customers ?? {};

  const toggleSort = (key: string) => {
    if (!SORTABLE[key]) return;
    saring(setSort)(sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const bukaRincian = (row: CustomerData) => {
    setCustomer(row);
    setSheetOpen(true);
  };

  const bukaForm = (row: CustomerData | null) => {
    setMengubah(row);
    setFormOpen(true);
  };

  const kelas = (key: string) => COLUMNS.find((c) => c.key === key)?.className;

  const signature = `${paginationUrl}|${debouncedSearch}|${sort.key}${sort.dir}|${pageSize}`;

  /**
   * Pesan kosong diturunkan dari penyaring yang BENAR-BENAR aktif. Menyuruh mengubah
   * pencarian kepada orang yang tidak sedang mencari hanya membingungkan.
   */
  const kosong = useMemo(() => {
    if (debouncedSearch) {
      return {
        judul: `Tidak ada hasil untuk "${debouncedSearch}"`,
        pesan: 'Pencarian membaca nama dan nomor HP customer.',
      };
    }
    return { judul: 'Belum ada customer', pesan: 'Customer yang ditambahkan akan muncul di sini.' };
  }, [debouncedSearch]);

  return (
    // Gap 10px, sama dengan /transaction dan /stock-in.
    <div className="flex flex-col gap-2.5">
      {/* SPEC-01 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-base font-semibold">
          Semua customer
          <span className="ml-1.5 font-mono text-sm text-foreground-subtle">{total ?? 0}</span>
        </span>

        <div className="flex w-full flex-wrap items-center gap-1.75 md:w-auto">
          {/* Selebar layar di HP, 220px begitu tabelnya muncul. */}
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
              placeholder="Cari nama atau nomor HP…"
              aria-label="Cari customer"
              value={search}
              onChange={(e) => saring(setSearch)(e.target.value)}
            />
          </div>

          {/* Hanya di layar sempit: di tabel, sortirnya ada di header kolom. */}
          <div className="min-w-0 flex-1 md:hidden">
            <ThemedSelect
              name="sortir"
              instanceId="sortir-customer"
              aria-label="Urutkan customer"
              value={SORT_OPTIONS.find((o) => o.value === `${sort.key}:${sort.dir}`) ?? SORT_OPTIONS[0]}
              options={SORT_OPTIONS}
              additionalStyle={controlStyle}
              onChange={(val) => {
                const [key, dir] = `${(val as { value?: string })?.value ?? 'nama:asc'}`.split(':');
                saring(setSort)({ key, dir: dir as 'asc' | 'desc' });
              }}
            />
          </div>

          <Button size="sm" onClick={() => bukaForm(null)}>
            <Plus strokeWidth={2.2} aria-hidden /> Customer
          </Button>
        </div>
      </div>

      {/* SPEC-02: tabel mulai dari md. Di bawah itu tiap baris jadi kartu. */}
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
                      className={cn(TH, col.align === 'right' ? 'text-right' : 'text-left', col.className)}
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
                        <div className="flex h-[26px] items-center">
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
                  const piutang = +(row.total_debt ?? 0);

                  return (
                    <tr key={row.id} className="transition-colors duration-fast hover:bg-surface-raised">
                      {/* SPEC-02: avatar inisial — daftar nama panjang jadi bisa dipindai
                          tanpa membaca satu per satu. */}
                      <td className={cn(TD, 'max-w-0')}>
                        <div className="flex items-center gap-2.25">
                          <span
                            className={cn(
                              // 26px: skala spacing project ini tidak punya 6.5, dan kelas yang tidak
                              // dibangkitkan Tailwind membuat avatarnya tanpa ukuran sama sekali.
                              'flex size-[26px] shrink-0 items-center justify-center rounded-full text-2xs font-bold',
                              piutang > 0 ? 'bg-accent-subtle text-accent' : 'bg-surface-raised text-foreground-subtle'
                            )}
                          >
                            {inisial(row.full_name)}
                          </span>
                          <span className="truncate font-medium">{row.full_name}</span>
                        </div>
                      </td>

                      <td className={cn(TD, 'whitespace-nowrap font-mono text-foreground-muted')}>
                        {formatPhoneNumber(row.phone_number) || '—'}
                      </td>

                      <td
                        className={cn(TD, kelas('alamat'), 'max-w-0 truncate text-foreground-muted')}
                        title={row.address}
                      >
                        {row.address || '—'}
                      </td>

                      <td className={cn(TD, 'whitespace-nowrap text-right font-mono font-semibold tabular-nums')}>
                        {piutang > 0 ? (
                          <span className="text-warning">{formatNumber(piutang)}</span>
                        ) : (
                          <span className="text-foreground-subtle">—</span>
                        )}
                      </td>

                      <td className={cn(TD, kelas('terdaftar'), 'whitespace-nowrap font-mono text-foreground-subtle')}>
                        {dayjs(row.created_at).format('DD MMM YYYY')}
                      </td>

                      <td className={TD}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            aria-label={`Lihat ${row.full_name}`}
                            onClick={() => bukaRincian(row)}
                          >
                            <Eye strokeWidth={1.7} aria-hidden />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            aria-label={`Ubah ${row.full_name}`}
                            onClick={() => bukaForm(row)}
                          >
                            <Pencil strokeWidth={1.8} aria-hidden />
                          </Button>
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

      <div className="md:hidden">
        <CustomerCardList
          rows={rows}
          loading={isLoading}
          perPage={pageSize}
          empty={kosong}
          onOpen={bukaRincian}
          onEdit={bukaForm}
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

      {customer && (
        <CustomerDetailSheet
          customer={customer}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onClosed={() => setCustomer(null)}
          onEdit={() => {
            setSheetOpen(false);
            bukaForm(customer);
          }}
        />
      )}

      <CustomerFormDialog customer={mengubah} isOpen={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
};

CustomerPage.themeable = true;

export default CustomerPage;
