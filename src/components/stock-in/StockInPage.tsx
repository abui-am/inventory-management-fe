import dayjs from 'dayjs';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { ThemedSelect } from '@/components/Form';
import JournalEntrySheet from '@/components/ledger/JournalEntrySheet';
import CancelStockInDialog from '@/components/stock-in/CancelStockInDialog';
import ReceiveStockInDialog from '@/components/stock-in/ReceiveStockInDialog';
import ReturnStockInDialog from '@/components/stock-in/ReturnStockInDialog';
import ReviewStockInDialog from '@/components/stock-in/ReviewStockInDialog';
import StockInCardList from '@/components/stock-in/StockInCardList';
import StockInDetailSheet from '@/components/stock-in/StockInDetailSheet';
import StockInTable, {
  AksiBatal,
  AksiKonfirmasi,
  AksiRetur,
  Kolom,
  SORTABLE,
  STATUS,
  StockInStatus,
} from '@/components/stock-in/StockInTable';
import { Button } from '@/components/ui/button';
import DateRangeFilter, { DateRange } from '@/components/ui/date-range-filter';
import FilterTabs from '@/components/ui/filter-tabs';
import { Input } from '@/components/ui/input';
import { usePermission } from '@/context/permission-context';
import { useUpdateStockIn } from '@/hooks/mutation/useMutateStockIn';
import { useFetchMyself } from '@/hooks/query/useFetchEmployee';
import { useFetchUnpaginatedLedgers } from '@/hooks/query/useFetchLedgers';
import useFetchTransactions from '@/hooks/query/useFetchStockIn';
import { LedgerSource } from '@/typings/ledgers';
import { TransactionData } from '@/typings/stock-in';
import { useDebounceValue } from '@/utils/debounce';
import { controlStyle } from '@/utils/style';

import Pagination from '../Pagination';

/**
 * Jumlah per tab. Backend tidak mengembalikan hitungan per status dalam satu response,
 * jadi tiap tab meminta satu baris dan hanya membaca `total`-nya. Sama dengan /transaction.
 */
function useStatusCount(status: string | undefined, filter: { search: string; between?: BetweenFilter }) {
  const { data } = useFetchTransactions({
    per_page: 1,
    // Pencarian dan rentang tanggal ikut dihitung: tanpa itu tab menulis "Semua 50" tepat
    // di sebelah tabel kosong, dan angkanya menjawab pertanyaan yang tidak sedang ditanya.
    search: filter.search,
    ...(status ? { where: { status } } : {}),
    ...(filter.between ? { where_between: filter.between } : {}),
  });
  return data?.data?.transactions?.total;
}

type BetweenFilter = Record<string, [string, string]>;

/**
 * Sortir untuk layar sempit.
 *
 * Di tabel, sortir menempel pada header kolom — dan di tampilan kartu header itu tidak
 * ada. Isinya persis kolom yang memang bisa disortir server (lihat SORTABLE).
 */
const SORT_OPTIONS = [
  { label: 'Terbaru', value: 'waktu:desc' },
  { label: 'Terlama', value: 'waktu:asc' },
  { label: 'Kode A–Z', value: 'kode:asc' },
  { label: 'Status', value: 'status:asc' },
];

/** Urutan tab mengikuti perjalanan status, bukan abjad. */
const STATUS_ORDER: StockInStatus[] = ['pending', 'on-review', 'accepted', 'declined'];

/**
 * Kolom tabel. Lebarnya dibiarkan otomatis seperti di /transaction — hanya Aksi yang
 * dipatok. Memasang lebar pada lima kolom membuat seluruh sisa ruang jatuh ke satu kolom
 * yang tidak dipatok (Detail), dan tabelnya jadi berisi satu ladang kosong selebar layar.
 *
 * `Kasir` dan `Waktu` disembunyikan di bawah md.
 */
const COLUMNS: Kolom[] = [
  { key: 'waktu', label: 'Waktu', className: 'hidden md:table-cell' },
  { key: 'kode', label: 'Kode' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'pembayaran', label: 'Pembayaran' },
  { key: 'kasir', label: 'Kasir', className: 'hidden md:table-cell' },
  { key: 'jumlah', label: 'Jumlah', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi', align: 'right', width: '112px' },
];

/**
 * Satu halaman untuk tiga rute barang masuk.
 *
 * `/stock-in` (semua), `/stock-in-confirmation` (menunggu), dan `/sell-price-adjustment`
 * (ditinjau) sebelumnya memakai `TableStockIn` dengan prop `variant`. Yang membedakan
 * ketiganya cuma penyaring status awalnya, jadi di sini ia jadi satu prop — dan tab
 * status hanya muncul di halaman yang memang boleh berpindah status.
 */
export function StockInPage({
  fixedStatus,
  withCreateButton,
}: {
  /** Halaman khusus satu status; tab status tidak ditampilkan. */
  fixedStatus?: StockInStatus;
  withCreateButton?: boolean;
}): JSX.Element {
  const [status, setStatus] = useState<string>(fixedStatus ?? 'all');
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<DateRange>([null, null]);
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'waktu', dir: 'desc' });
  const [pageSize, setPageSize] = useState(10);
  const [paginationUrl, setPaginationUrl] = useState('');

  // Dua state, bukan satu: kalau datanya dibuang saat menutup, sheet-nya lepas seketika
  // dan animasi keluarnya tidak pernah sempat berjalan.
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Ayat jurnal transaksi yang sedang dibuka. Idem.
  const [ayat, setAyat] = useState<LedgerSource | null>(null);
  const [ayatOpen, setAyatOpen] = useState(false);

  /**
   * Barang masuk yang sedang diterima. Layar ini yang menentukan harga jual sekaligus
   * menaikkan status ke Diterima — backend menolak `accepted` tanpa `items[].sell_price`.
   */
  const [hargaJualId, setHargaJualId] = useState('');

  // Barang masuk yang sedang ditanyakan pembatalannya. Sekali dibatalkan, statusnya tidak
  // punya jalan kembali, jadi ia tidak boleh berangkat dari satu klik ikon.
  const [membatalkan, setMembatalkan] = useState<TransactionData | null>(null);
  const [sedangMembatalkan, setSedangMembatalkan] = useState(false);

  // Barang masuk yang sedang diretur. Dua state, sama seperti sheet: dialognya membaca
  // transaksinya sampai animasi tutupnya selesai.
  const [meretur, setMeretur] = useState<TransactionData | null>(null);

  // Barang masuk yang sedang ditanyakan konfirmasinya. Kenaikannya ke Ditinjau menulis
  // seluruh jurnal dan membuat utang — terlalu berat untuk berangkat dari satu klik ikon.
  const [meninjau, setMeninjau] = useState<TransactionData | null>(null);
  const [sedangMeninjau, setSedangMeninjau] = useState(false);

  const { mutateAsync: updateStockIn } = useUpdateStockIn();
  const { state } = usePermission();
  const bolehKonfirmasi = state.permission.includes('control:stock.confirmation');
  const bolehAturHargaJual = state.permission.includes('control:stock.adjust-sell-price');
  const bolehRetur = state.permission.includes('control:stock.return');

  const { data: dataMyself } = useFetchMyself();
  const isAdmin = (dataMyself?.data.user.roles ?? []).some(({ name }) => name === 'superadmin');

  // 500 ms: tanpa ini tiap ketikan mengirim satu request.
  const debouncedSearch = useDebounceValue(search, 500);

  /** Menyaring berarti kembali ke halaman satu — `forceUrl` menyimpan filter yang lama. */
  const saring =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      setPaginationUrl('');
      set(value);
    };

  const between = useMemo(() => {
    const [from, to] = range;
    if (!from || !to) return undefined;
    return {
      created_at: [
        dayjs(from).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        dayjs(to).endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      ] as [string, string],
    };
  }, [range]);

  const { data: dataTransaction, isLoading } = useFetchTransactions({
    order_by: { [SORTABLE[sort.key] ?? 'created_at']: sort.dir },
    search: debouncedSearch,
    per_page: pageSize,
    forceUrl: paginationUrl,
    ...(status === 'all' ? {} : { where: { status } }),
    ...(between ? { where_between: between } : {}),
  });

  const countFilter = { search: debouncedSearch, between };
  const counts = {
    all: useStatusCount(undefined, countFilter),
    pending: useStatusCount('pending', countFilter),
    'on-review': useStatusCount('on-review', countFilter),
    accepted: useStatusCount('accepted', countFilter),
    declined: useStatusCount('declined', countFilter),
  };

  const {
    data: rows,
    from,
    to,
    total,
    links,
    next_page_url: berikutnya,
    prev_page_url: sebelumnya,
  } = dataTransaction?.data?.transactions ?? {};

  // Baris ayat jurnal diambil terpisah: satu ayat bisa terbelah halaman di buku besar,
  // jadi mengumpulkannya dari tabel ini akan bohong.
  const { data: resAyat } = useFetchUnpaginatedLedgers(
    { order_by: { sequence: 'asc' }, where: { ledgerable_id: ayat?.id ?? '' } },
    { enabled: !!ayat }
  );

  const naikkanStatus = async (row: TransactionData, next: StockInStatus) => {
    await updateStockIn({ transactionId: row.id, data: { status: next } });
    setSheetOpen(false);
  };

  const toggleSort = (key: string) => {
    if (!SORTABLE[key]) return;
    saring(setSort)(sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  };

  /**
   * SPEC-23/24: aksi ditentukan status DAN izin.
   *
   * Dari Ditinjau ke Diterima HANYA lewat penetapan harga jual. Backend menolak
   * PATCH berisi `status: accepted` tanpa `items[].sell_price`
   * (`TransactionRequest`: `required_if:status,accepted`), jadi tombol centang yang
   * langsung mengirim status di sini selalu gagal — dan itulah yang terjadi sebelum
   * ini. Sekarang centangnya membuka penetapan harga jual, yang menyimpan harga DAN
   * menaikkan statusnya dalam satu permintaan.
   */
  const aksi = (row: TransactionData) => {
    const s = (row.status ?? 'pending') as StockInStatus;
    return (
      <>
        {s === 'pending' && bolehKonfirmasi && (
          <>
            <AksiKonfirmasi label="Konfirmasi barang masuk" onClick={() => setMeninjau(row)} />
            <AksiBatal onClick={() => setMembatalkan(row)} />
          </>
        )}
        {s === 'on-review' && bolehAturHargaJual && (
          <AksiKonfirmasi label="Terima barang & tentukan harga jual" onClick={() => setHargaJualId(row.id)} />
        )}
        {/* Retur baru mungkin SESUDAH barangnya diterima — sebelum itu yang berlaku
            pembatalan, bukan pengembalian. */}
        {s === 'accepted' && bolehRetur && <AksiRetur onClick={() => setMeretur(row)} />}
      </>
    );
  };

  // Berubah hanya saat isi tabel benar-benar berganti — halaman, penyaring, urutan.
  const signature = `${paginationUrl}|${status}|${debouncedSearch}|${sort.key}${sort.dir}|${pageSize}`;

  /**
   * Pesan kosong diturunkan dari penyaring yang BENAR-BENAR aktif. Menyuruh mengubah
   * filter kepada orang yang tidak sedang memakai filter hanya membingungkan.
   */
  const [dari, sampai] = range;
  const kosong = (() => {
    if (debouncedSearch) {
      return {
        judul: `Tidak ada hasil untuk "${debouncedSearch}"`,
        pesan: 'Pencarian hanya membaca kode transaksi dan nomor faktur.',
      };
    }
    if (dari && sampai) {
      return { judul: 'Tidak ada barang masuk di periode ini', pesan: 'Coba pilih tanggal yang lain.' };
    }
    if (status !== 'all') {
      const nama = STATUS[status as StockInStatus]?.label.toLowerCase() ?? status;
      return { judul: `Belum ada barang masuk ${nama}`, pesan: 'Semuanya berada di status lain.' };
    }
    return { judul: 'Belum ada barang masuk', pesan: 'Barang masuk yang dibuat akan muncul di sini.' };
  })();

  return (
    // Gap 10px, sama dengan /transaction — bukan 12px.
    <div className="flex flex-col gap-2.5">
      {/* SPEC-02 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {fixedStatus ? (
          <span className="text-base font-semibold">
            {STATUS[fixedStatus].label}
            <span className="ml-1.5 font-mono text-sm text-foreground-subtle">{total ?? 0}</span>
          </span>
        ) : (
          // SPEC-03..05
          <FilterTabs
            aria-label="Filter status"
            value={status}
            onChange={saring(setStatus)}
            tabs={[
              { value: 'all', label: 'Semua', count: counts.all },
              ...STATUS_ORDER.map((key) => ({ value: key, label: STATUS[key].label, count: counts[key] })),
            ]}
          />
        )}

        {/* Gap 7px, sama dengan /transaction. */}
        <div className="flex w-full flex-wrap items-center gap-1.75 md:w-auto">
          {/* 220px, tinggi 32px, ikon 14px stroke 1.9, teks mulai di 31px — semuanya
              disalin dari /transaction. */}
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
              placeholder="Cari kode atau faktur…"
              aria-label="Cari barang masuk"
              value={search}
              onChange={(e) => saring(setSearch)(e.target.value)}
            />
          </div>

          {/* SPEC-07 */}
          <DateRangeFilter value={range} onChange={saring(setRange)} />

          {/* Hanya di layar sempit: di tabel, sortirnya ada di header kolom. */}
          <div className="min-w-0 flex-1 md:hidden">
            <ThemedSelect
              name="sortir"
              instanceId="sortir-barang-masuk"
              aria-label="Urutkan barang masuk"
              value={SORT_OPTIONS.find((o) => o.value === `${sort.key}:${sort.dir}`) ?? SORT_OPTIONS[0]}
              options={SORT_OPTIONS}
              additionalStyle={controlStyle}
              onChange={(val) => {
                const [key, dir] = `${(val as { value?: string })?.value ?? 'waktu:desc'}`.split(':');
                saring(setSort)({ key, dir: dir as 'asc' | 'desc' });
              }}
            />
          </div>

          {/* SPEC-08 */}
          {withCreateButton && (
            <Link href="/stock-in/add">
              <a>
                <Button size="sm">
                  <Plus strokeWidth={2.2} aria-hidden /> Barang masuk
                </Button>
              </a>
            </Link>
          )}
        </div>
      </div>

      {/* Di bawah md tiap baris jadi kartu; tombol aksinya persis yang sama. */}
      <div className="md:hidden">
        <StockInCardList
          rows={rows}
          loading={isLoading}
          perPage={pageSize}
          empty={kosong}
          onOpen={(row) => {
            setTransaction(row);
            setSheetOpen(true);
          }}
          aksi={aksi}
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

      <div className="hidden md:block">
        <StockInTable
          rows={rows}
          loading={isLoading}
          perPage={pageSize}
          columns={COLUMNS}
          sort={sort}
          onSort={toggleSort}
          aksi={aksi}
          isAdmin={isAdmin}
          onOpen={(row) => {
            setTransaction(row);
            setSheetOpen(true);
          }}
          empty={kosong}
          signature={signature}
          pagination={
            <Pagination
              stats={{ from: `${from ?? '0'}`, to: `${to ?? '0'}`, total: `${total ?? '0'}` }}
              links={links ?? []}
              onClickPageButton={(url) => setPaginationUrl(url)}
              onClickNext={() => setPaginationUrl((berikutnya as string) ?? '')}
              onClickPrevious={() => setPaginationUrl((sebelumnya as string) ?? '')}
              onChangePerPage={(page) => {
                setPaginationUrl('');
                setPageSize(page?.value ?? 0);
              }}
            />
          }
        />
      </div>

      {transaction && (
        <StockInDetailSheet
          transaction={transaction}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onClosed={() => setTransaction(null)}
          canConfirm={bolehKonfirmasi}
          canAdjustPrice={bolehAturHargaJual}
          canReturn={bolehRetur}
          onReturn={() => setMeretur(transaction)}
          onConfirm={() => setMeninjau(transaction)}
          onReceive={() => setHargaJualId(transaction.id)}
          onCancel={() => setMembatalkan(transaction)}
          // Jurnal barang masuk baru lahir saat status MASUK ke Ditinjau; sebelum itu
          // tidak ada yang bisa dibuka, jadi tombolnya memang tidak diberikan.
          onOpenJournal={
            transaction.status === 'pending'
              ? undefined
              : () => {
                  setAyat({
                    type: 'transactions',
                    id: transaction.id,
                    code: transaction.transaction_code,
                    label: transaction.supplier?.name
                      ? `Barang masuk dari ${transaction.supplier.name}`
                      : 'Barang masuk',
                  });
                  setAyatOpen(true);
                }
          }
        />
      )}

      {ayat && (
        <JournalEntrySheet
          source={ayat}
          rows={resAyat?.data?.ledgers}
          total={resAyat?.data?.total}
          open={ayatOpen}
          onClose={() => setAyatOpen(false)}
          onClosed={() => setAyat(null)}
          explanation="Barang masuk menambah Persediaan sebesar harga belinya, dan sisi lawannya adalah cara membayarnya — Kas, Bank, Utang, atau Giro. Ongkos kirim tidak masuk Persediaan; ia dicatat sebagai beban tersendiri."
        />
      )}

      <ReviewStockInDialog
        transaction={meninjau}
        isOpen={!!meninjau}
        onClose={() => setMeninjau(null)}
        saving={sedangMeninjau}
        onConfirm={async () => {
          if (!meninjau) return;
          setSedangMeninjau(true);
          try {
            await naikkanStatus(meninjau, 'on-review');
            setMeninjau(null);
          } finally {
            setSedangMeninjau(false);
          }
        }}
      />

      <ReturnStockInDialog transaction={meretur} isOpen={!!meretur} onClose={() => setMeretur(null)} />

      <CancelStockInDialog
        transaction={membatalkan}
        isOpen={!!membatalkan}
        onClose={() => setMembatalkan(null)}
        saving={sedangMembatalkan}
        onConfirm={async () => {
          if (!membatalkan) return;
          setSedangMembatalkan(true);
          try {
            await naikkanStatus(membatalkan, 'declined');
            setMembatalkan(null);
          } finally {
            setSedangMembatalkan(false);
          }
        }}
      />

      {hargaJualId && <ReceiveStockInDialog transactionId={hargaJualId} onClose={() => setHargaJualId('')} />}
    </div>
  );
}

export default StockInPage;
