import Tippy from '@tippyjs/react';
import dayjs from 'dayjs';
import { Banknote, ChevronDown, ChevronUp, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import DebtCardList, { keteranganTagihan, statusTagihan } from '@/components/debt/DebtCardList';
import PayDebtDialog from '@/components/debt/PayDebtDialog';
import { ThemedSelect } from '@/components/Form';
import Pagination from '@/components/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DateRangeFilter, { DateRange } from '@/components/ui/date-range-filter';
import FilterTabs from '@/components/ui/filter-tabs';
import { Input } from '@/components/ui/input';
import Kpi from '@/components/ui/kpi';
import Skeleton from '@/components/ui/skeleton';
import { useFetchDebt } from '@/hooks/query/useFetchDebt';
import { cn } from '@/lib/cn';
import { Datum } from '@/typings/debts';
import { useDebounceValue } from '@/utils/debounce';
import { formatDateYYYYMMDDHHmmss } from '@/utils/format';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

// Disalin PERSIS dari /transaction — empat daftar di aplikasi yang sama tidak boleh punya
// ritme yang berbeda.
const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

export type Varian = 'receivable' | 'debt' | 'current_account';

/**
 * Tiga halaman, satu komponen.
 *
 * `/account-receivable`, `/debt`, dan `/debt-giro` dulu tiga berkas hasil salin-tempel —
 * dan salinannya sudah menyimpang: halaman giro kehilangan kotak carinya, dan rentang
 * tanggal bawaannya HARI INI, jadi ia hampir selalu tampil kosong tanpa penjelasan.
 * Yang benar-benar berbeda cuma yang ada di tabel ini.
 */
const KATA = {
  receivable: {
    judul: 'Piutang',
    grup: 'Penjualan',
    sisa: 'Sisa piutang',
    dibayar: 'Diterima',
    pihak: 'Atas nama',
    kosongSemua: 'Belum ada piutang',
    kosongPesan: 'Piutang lahir dari transaksi yang dibayar Utang atau Giro.',
    kosongLunas: 'Belum ada piutang yang lunas',
    kosongLunasPesan: 'Piutang yang sudah diterima muncul di sini.',
    kosongBerjalan: 'Tidak ada piutang berjalan',
    kosongBerjalanPesan: 'Semua tagihan sudah diterima.',
    kosongRentang: 'Tidak ada piutang di periode ini',
    aksi: 'Terima piutang',
  },
  debt: {
    judul: 'Utang',
    grup: 'Pembelian',
    sisa: 'Sisa utang',
    dibayar: 'Dibayar',
    pihak: 'Ke supplier',
    kosongSemua: 'Belum ada utang',
    kosongPesan: 'Utang lahir dari barang masuk yang dibayar Utang.',
    kosongLunas: 'Belum ada utang yang lunas',
    kosongLunasPesan: 'Utang yang sudah dibayar muncul di sini.',
    kosongBerjalan: 'Tidak ada utang berjalan',
    kosongBerjalanPesan: 'Semua tagihan sudah dibayar.',
    kosongRentang: 'Tidak ada utang di periode ini',
    aksi: 'Bayar utang',
  },
  current_account: {
    judul: 'Utang giro',
    grup: 'Pembelian',
    sisa: 'Sisa utang giro',
    dibayar: 'Dibayar',
    pihak: 'Ke supplier',
    kosongSemua: 'Belum ada utang giro',
    kosongPesan: 'Utang giro lahir dari barang masuk yang dibayar Giro.',
    kosongLunas: 'Belum ada utang giro yang lunas',
    kosongLunasPesan: 'Giro yang sudah dicairkan muncul di sini.',
    kosongBerjalan: 'Tidak ada utang giro berjalan',
    kosongBerjalanPesan: 'Semua giro sudah dicairkan.',
    kosongRentang: 'Tidak ada utang giro di periode ini',
    aksi: 'Bayar utang giro',
  },
} as const;

/**
 * Kolom yang benar-benar bisa disortir server.
 *
 * `sisa` tidak ada: ia selisih dua kolom, bukan kolom — `order_by` padanya melempar.
 */
const SORTABLE: Record<string, string> = {
  tempo: 'due_date',
  dibuat: 'created_at',
  jumlah: 'amount',
};

const SORT_OPTIONS = [
  { label: 'Jatuh tempo terdekat', value: 'tempo:asc' },
  { label: 'Jatuh tempo terjauh', value: 'tempo:desc' },
  { label: 'Terbaru', value: 'dibuat:desc' },
  { label: 'Nominal terbesar', value: 'jumlah:desc' },
];

type Kolom = { key: string; label: string; align?: 'right'; width?: string; className?: string };

const COLUMNS: Kolom[] = [
  { key: 'tempo', label: 'Jatuh tempo', width: '124px' },
  { key: 'keterangan', label: 'Keterangan', width: '22%', className: 'hidden md:table-cell' },
  { key: 'nama', label: 'Atas nama' }, // labelnya ditimpa `kata.pihak` saat render
  { key: 'jumlah', label: 'Jumlah', align: 'right', width: '124px' },
  { key: 'diterima', label: 'Diterima', align: 'right', width: '124px', className: 'hidden lg:table-cell' },
  { key: 'sisa', label: 'Sisa', align: 'right', width: '128px' },
  { key: 'status', label: 'Status', width: '116px' },
  { key: 'aksi', label: 'Aksi', align: 'right', width: '80px' },
];

const ariaSort = (aktif: boolean, dir: 'asc' | 'desc'): 'ascending' | 'descending' | undefined => {
  if (!aktif) return undefined;
  return dir === 'asc' ? 'ascending' : 'descending';
};

/** Tab menentukan penyaring; "lewat" butuh dua syarat sekaligus. */
const TAB_WHERE: Record<string, Record<string, unknown>> = {
  all: {},
  unpaid: { is_paid: false },
  overdue: { is_paid: false },
  paid: { is_paid: true },
};

export function DebtPage({ variant }: { variant: Varian }): JSX.Element {
  const kata = KATA[variant];
  const [tab, setTab] = useState('unpaid');
  const [search, setSearch] = useState('');
  // Bawaannya SEMUA tanggal. Yang paling perlu dilihat di halaman ini justru tagihan lama;
  // rentang setahun terakhir yang dulu dipasang diam-diam menyembunyikannya.
  const [range, setRange] = useState<DateRange>([null, null]);
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'tempo', dir: 'asc' });
  const [pageSize, setPageSize] = useState(10);
  const [paginationUrl, setPaginationUrl] = useState('');

  const [dibayar, setDibayar] = useState<Datum | null>(null);
  const [bayarOpen, setBayarOpen] = useState(false);

  const debouncedSearch = useDebounceValue(search, 500);

  const saring =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      setPaginationUrl('');
      set(value);
    };

  const [dari, sampai] = range;

  const rentang = useMemo(() => {
    if (!dari || !sampai) return {};
    return {
      where_greater_equal: { created_at: formatDateYYYYMMDDHHmmss(dayjs(dari).startOf('day')) },
      where_lower_equal: { created_at: formatDateYYYYMMDDHHmmss(dayjs(sampai).endOf('day')) },
    };
  }, [dari, sampai]);

  const { data, isLoading } = useFetchDebt({
    paginated: true,
    per_page: pageSize,
    search: debouncedSearch,
    order_by: { [SORTABLE[sort.key] ?? 'due_date']: sort.dir },
    forceUrl: paginationUrl || undefined,
    where: { type: variant, ...TAB_WHERE[tab] },
    ...rentang,
    // Tab "Lewat tempo" menambah satu syarat lagi: jatuh temponya sudah lewat.
    ...(tab === 'overdue' ? { where_lower: { due_date: formatDateYYYYMMDDHHmmss(dayjs()) } } : {}),
  });

  const {
    data: rows,
    from,
    to,
    total,
    links,
    next_page_url: berikutnya,
    prev_page_url: sebelumnya,
  } = data?.data?.debts ?? {};

  // Ringkasan seluruh buku piutang — dihitung backend, tidak terpengaruh tab maupun
  // halaman yang sedang tampil.
  const totals = data?.data?.totals;

  // Jumlah untuk tab "Semua" dan "Lunas": satu permintaan kecil, sisanya diturunkan dari
  // ringkasan yang sudah ada.
  const { data: dataSemua } = useFetchDebt({ paginated: true, per_page: 1, where: { type: variant } });
  const jumlahSemua = dataSemua?.data?.debts?.total;
  const jumlahLunas =
    jumlahSemua !== undefined && totals ? Math.max(jumlahSemua - totals.remaining_count, 0) : undefined;

  const toggleSort = (key: string) => {
    if (!SORTABLE[key]) return;
    saring(setSort)(sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const bayar = (row: Datum) => {
    setDibayar(row);
    setBayarOpen(true);
  };

  // Dua kolom yang katanya berbeda per halaman: lawan transaksinya (customer vs supplier)
  // dan arah uangnya (diterima vs dibayar).
  const judulKolom = (col: Kolom) => {
    if (col.key === 'nama') return kata.pihak;
    if (col.key === 'diterima') return kata.dibayar;
    return col.label;
  };

  const kelas = (key: string) => COLUMNS.find((c) => c.key === key)?.className;
  const signature = `${paginationUrl}|${tab}|${debouncedSearch}|${sort.key}${sort.dir}|${pageSize}`;

  const kosong = useMemo(() => {
    if (debouncedSearch) {
      return {
        judul: `Tidak ada hasil untuk "${debouncedSearch}"`,
        pesan: 'Pencarian membaca keterangan tagihan.',
      };
    }
    if (dari && sampai) {
      return { judul: kata.kosongRentang, pesan: 'Coba pilih tanggal yang lain.' };
    }
    if (tab === 'overdue')
      return { judul: 'Tidak ada yang lewat jatuh tempo', pesan: 'Semua tagihan masih dalam tenggat.' };
    if (tab === 'paid') return { judul: kata.kosongLunas, pesan: kata.kosongLunasPesan };
    if (tab === 'unpaid') return { judul: kata.kosongBerjalan, pesan: kata.kosongBerjalanPesan };
    return { judul: kata.kosongSemua, pesan: kata.kosongPesan };
  }, [debouncedSearch, dari, sampai, tab, kata]);

  return (
    <div className="flex flex-col gap-2.5">
      {/* SPEC-01: tiga angka yang jadi alasan halaman ini dibuka */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Kpi
          label={kata.sisa}
          nilai={totals?.remaining}
          tone="warning"
          ket={totals ? `dari ${totals.remaining_count} tagihan belum lunas` : ''}
        />
        <Kpi
          label="Lewat jatuh tempo"
          nilai={totals?.overdue}
          tone="destructive"
          ketTone="destructive"
          ket={
            totals && totals.overdue_count > 0
              ? `${totals.overdue_count} tagihan, terlama ${totals.overdue_days} hari`
              : 'Tidak ada yang lewat tenggat'
          }
        />
        <Kpi
          label={kata.dibayar}
          nilai={totals?.received}
          tone="success"
          ket={
            dari && sampai ? `${dayjs(dari).format('D MMM')} – ${dayjs(sampai).format('D MMM YYYY')}` : 'Semua waktu'
          }
        />
      </div>

      {/* SPEC-02 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          aria-label={`Filter status ${kata.judul.toLowerCase()}`}
          value={tab}
          onChange={saring(setTab)}
          tabs={[
            { value: 'all', label: 'Semua', count: jumlahSemua },
            { value: 'unpaid', label: 'Belum lunas', count: totals?.remaining_count },
            { value: 'overdue', label: 'Lewat tempo', count: totals?.overdue_count },
            { value: 'paid', label: 'Lunas', count: jumlahLunas },
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
              placeholder="Cari keterangan…"
              aria-label={`Cari ${kata.judul.toLowerCase()}`}
              value={search}
              onChange={(e) => saring(setSearch)(e.target.value)}
            />
          </div>

          <DateRangeFilter value={range} onChange={saring(setRange)} />

          {/* Hanya di layar sempit: di tabel, sortirnya ada di header kolom. */}
          <div className="min-w-0 flex-1 md:hidden">
            <ThemedSelect
              name="sortir"
              instanceId={`sortir-${variant}`}
              aria-label={`Urutkan ${kata.judul.toLowerCase()}`}
              value={SORT_OPTIONS.find((o) => o.value === `${sort.key}:${sort.dir}`) ?? SORT_OPTIONS[0]}
              options={SORT_OPTIONS}
              onChange={(val) => {
                const [key, dir] = `${(val as { value?: string })?.value ?? 'tempo:asc'}`.split(':');
                saring(setSort)({ key, dir: dir as 'asc' | 'desc' });
              }}
            />
          </div>
        </div>
      </div>

      {/* Di bawah md tiap baris jadi kartu. */}
      <div className="md:hidden">
        <DebtCardList rows={rows} loading={isLoading} perPage={pageSize} empty={kosong} onPay={bayar} />

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
                          {judulKolom(col)}
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
                        judulKolom(col)
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
                  const jumlah = +(row.amount ?? 0);
                  const diterima = +(row.paid_amount ?? 0);
                  const sisa = jumlah - diterima;
                  const status = statusTagihan(row);

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'transition-colors duration-fast hover:bg-surface-raised',
                        // Yang lunas diredupkan, bukan disembunyikan.
                        row.is_paid && 'opacity-55'
                      )}
                    >
                      {/* Yang lewat tenggat cukup ditandai warnanya; berapa harinya baru
                          muncul saat ditunjuk. Satu baris keterangan di TIAP baris tabel
                          menggandakan tinggi barisnya demi angka yang jarang dibaca. */}
                      <td className={cn(TD, 'whitespace-nowrap font-mono')}>
                        {status.lewat > 0 ? (
                          <Tippy content={`Lewat ${status.lewat} hari`} placement="top" delay={[350, 0]}>
                            <span className="cursor-help text-destructive">
                              {dayjs(row.due_date).format('DD MMM YYYY')}
                            </span>
                          </Tippy>
                        ) : (
                          dayjs(row.due_date).format('DD MMM YYYY')
                        )}
                      </td>

                      <td className={cn(TD, kelas('keterangan'), 'max-w-0 truncate')} title={row.description}>
                        {keteranganTagihan(row.description)}
                      </td>

                      <td className={cn(TD, 'max-w-0 truncate')} title={row.related_model?.name}>
                        {row.related_model?.name ?? '—'}
                      </td>

                      <td
                        className={cn(TD, 'whitespace-nowrap text-right font-mono tabular-nums text-foreground-muted')}
                      >
                        {formatNumber(jumlah)}
                      </td>

                      <td
                        className={cn(
                          TD,
                          kelas('diterima'),
                          'whitespace-nowrap text-right font-mono tabular-nums text-foreground-muted'
                        )}
                      >
                        {diterima > 0 ? formatNumber(diterima) : '—'}
                      </td>

                      <td className={cn(TD, 'whitespace-nowrap text-right font-mono font-semibold tabular-nums')}>
                        {sisa > 0 ? (
                          <span className={status.lewat > 0 ? 'text-destructive' : 'text-warning'}>
                            {formatNumber(sisa)}
                          </span>
                        ) : (
                          <span className="text-foreground-subtle">—</span>
                        )}
                      </td>

                      <td className={TD}>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>

                      {/* Yang sudah lunas tidak menampilkan tombolnya sama sekali, bukan
                          menampilkannya lalu mematikannya. */}
                      <td className={TD}>
                        <div className="flex items-center justify-end gap-1">
                          {sisa > 0 && (
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label={`${kata.aksi} ${row.related_model?.name ?? ''}`}
                              tooltip={kata.aksi}
                              className="hover:text-success"
                              onClick={() => bayar(row)}
                            >
                              <Banknote strokeWidth={1.8} aria-hidden />
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

      <PayDebtDialog variant={variant} debt={dibayar} isOpen={bayarOpen} onClose={() => setBayarOpen(false)} />
    </div>
  );
}

/** Satu angka ringkasan. Kerangkanya setinggi angkanya supaya kartunya tidak melompat. */
export default DebtPage;
