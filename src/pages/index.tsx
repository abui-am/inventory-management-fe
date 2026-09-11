import dayjs, { Dayjs } from 'dayjs';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';

import ActionNeededCard from '@/components/dashboard/ActionNeededCard';
import CashFlowCard, { bucketByDay } from '@/components/dashboard/CashFlowCard';
import LowStockCard from '@/components/dashboard/LowStockCard';
import RecentTransactionsCard from '@/components/dashboard/RecentTransactionsCard';
import StatCard, { Comparison } from '@/components/dashboard/StatCard';
import TopItemsCard, { TopItem } from '@/components/dashboard/TopItemsCard';
import TransactionDetailSheet from '@/components/transaction/TransactionDetailSheet';
import DateRangeFilter, { DateRange } from '@/components/ui/date-range-filter';
import { HomeProvider, useHome } from '@/context/home-context';
import { usePermission } from '@/context/permission-context';
import { useFetchDebt } from '@/hooks/query/useFetchDebt';
import { useFetchItems } from '@/hooks/query/useFetchItem';
import { useFetchLedgers, useFetchUnpaginatedLedgers } from '@/hooks/query/useFetchLedgers';
import useFetchSales from '@/hooks/query/useFetchSale';
import useFetchTransactions from '@/hooks/query/useFetchStockIn';
import { ThemeablePage } from '@/typings/page';
import { SalesResponseUnpaginated, SaleTransactionsData } from '@/typings/sale';
import { formatDateYYYYMMDDHHmmss, formatNumber } from '@/utils/format';

const HomeWithWrapper: NextPage & ThemeablePage = () => {
  const permiss = usePermission();
  const isHavingPermission = permiss.state.permission.includes('view:home');

  const router = useRouter();
  if (!isHavingPermission) {
    const roleIds = permiss.state.roles.map(({ id }) => id);
    if (roleIds.includes(4)) {
      router.push('/stock-in-confirmation');
    }

    if (roleIds.includes(2)) {
      router.push('/transaction');
    }
  }
  return (
    <HomeProvider>
      <Home />
    </HomeProvider>
  );
};

/**
 * Periode pembanding: rentang dengan panjang yang SAMA, persis sebelum yang dipilih.
 *
 * Bukan "bulan lalu" atau "pekan lalu" — kalau pengguna memilih 3 hari, pembandingnya
 * harus 3 hari juga, kalau tidak persentasenya membandingkan dua ukuran yang berbeda.
 */
function previousPeriod(start: Date, end: Date): { start: Dayjs; end: Dayjs } {
  const days = dayjs(end).startOf('day').diff(dayjs(start).startOf('day'), 'day') + 1;
  const prevEnd = dayjs(start).subtract(1, 'day').endOf('day');
  return { start: prevEnd.subtract(days - 1, 'day').startOf('day'), end: prevEnd };
}

/**
 * Nama akun buku besar, dieja persis seperti backend menulisnya
 * (`LedgerAccount::$types['HARGA_POKOK_PENJUALAN']`). Salah satu huruf saja dan
 * filternya cocok dengan nol baris tanpa error apa pun.
 */
const HPP = 'Harga Pokok Penjualan';

/** Filter rentang untuk endpoint buku besar — dipakai enam kali, jadi disatukan. */
function ledgerTotals(description: string, start: Dayjs, end: Dayjs) {
  return {
    where: { description },
    where_greater_equal: { created_at: formatDateYYYYMMDDHHmmss(start) },
    where_lower_equal: { created_at: formatDateYYYYMMDDHHmmss(end) },
    paginated: true,
    per_page: 1,
  };
}

/**
 * Saldo akun, BUKAN satu sisinya saja.
 *
 * Penjualan yang dibatalkan atau diretur menulis baris debit di akun Penjualan, dan
 * membaca `credit` saja membuat pemasukan tampak lebih besar daripada yang benar-benar
 * masuk. Di rentang yang sedang diuji selisihnya 410.000. Akun bersaldo kredit
 * (Penjualan) dihitung kredit dikurangi debit; akun bersaldo debit (Harga Pokok
 * Penjualan) kebalikannya.
 */
function saldoKredit(total?: { debit: number; credit: number }): number | undefined {
  return total === undefined ? undefined : total.credit - total.debit;
}

function saldoDebit(total?: { debit: number; credit: number }): number | undefined {
  return total === undefined ? undefined : total.debit - total.credit;
}

/**
 * Barang paling menyumbang omzet dalam rentang, diambil dari rincian tiap transaksi.
 *
 * Dijumlahkan berdasarkan `item_id`, bukan nama: dua barang boleh bernama mirip, dan
 * nama barang bisa berubah setelah transaksinya tersimpan sementara `pivot.item_name`
 * menyimpan nama saat itu. Nama yang ditampilkan diambil dari kemunculan terakhir.
 */
function topItems(transactions: SaleTransactionsData[] | undefined, limit: number): TopItem[] | undefined {
  if (!transactions) return undefined;

  const byItem = new Map<string, TopItem>();
  transactions.forEach(({ items }) => {
    (items ?? []).forEach(({ pivot }) => {
      const current = byItem.get(pivot.item_id);
      byItem.set(pivot.item_id, {
        id: pivot.item_id,
        name: pivot.item_name,
        value: (current?.value ?? 0) + pivot.total_price,
        qty: (current?.qty ?? 0) + Number(pivot.quantity),
        unit: pivot.item_unit,
      });
    });
  });

  return Array.from(byItem.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

const Home: NextPage = () => {
  const { state, dispatch } = useHome();

  // Dua state untuk satu rentang: kalender meneruskan pembaruan sejak ujung pertama
  // dipilih, dan menembakkan seluruh query dashboard ke rentang setengah jadi membuat
  // semua angkanya berkedip ke satu hari lalu kembali. Yang dipakai query adalah yang
  // di context; draft hanya yang sedang ditunjuk di kalender.
  const [draft, setDraft] = useState<DateRange>([state.startDate, state.endDate]);

  // Dua state, bukan satu: kalau datanya dibuang saat menutup, sheet-nya lepas seketika
  // dan animasi keluarnya tidak pernah sempat berjalan.
  const [selected, setSelected] = useState<SaleTransactionsData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const start = dayjs(state.startDate).startOf('day');
  const end = dayjs(state.endDate).endOf('day');
  const prev = useMemo(() => previousPeriod(state.startDate, state.endDate), [state.startDate, state.endDate]);

  // Enam query kecil: semuanya berhalaman dengan per_page 1, karena yang dipakai cuma
  // `total` — backend tetap mengirimnya di respons berhalaman. Meminta versi tanpa
  // halaman berarti mengunduh seluruh baris buku besar hanya untuk satu angka.
  const { data: resPenjualan } = useFetchLedgers(ledgerTotals('Penjualan', start, end));
  const { data: resHpp } = useFetchLedgers(ledgerTotals(HPP, start, end));
  const { data: resPenjualanPrev } = useFetchLedgers(ledgerTotals('Penjualan', prev.start, prev.end));
  const { data: resHppPrev } = useFetchLedgers(ledgerTotals(HPP, prev.start, prev.end));

  const { data: resTransaksi } = useFetchSales({
    start_date: formatDateYYYYMMDDHHmmss(start),
    end_date: formatDateYYYYMMDDHHmmss(end),
    paginated: true,
    per_page: 1,
  });
  // Dua query "berat" halaman ini, dan keduanya memang butuh seluruh barisnya:
  // grafik arus kas menjumlah per hari, barang terlaris menjumlah per barang.
  const { data: resKas } = useFetchUnpaginatedLedgers({
    where: { description: 'Kas' },
    where_greater_equal: { created_at: formatDateYYYYMMDDHHmmss(start) },
    where_lower_equal: { created_at: formatDateYYYYMMDDHHmmss(end) },
    order_by: { created_at: 'asc' },
  });

  const { data: resRincian } = useFetchSales<SalesResponseUnpaginated>({
    start_date: formatDateYYYYMMDDHHmmss(start),
    end_date: formatDateYYYYMMDDHHmmss(end),
    paginated: false,
    order_by: { created_at: 'asc' },
  });

  const { data: resTransaksiPrev } = useFetchSales({
    start_date: formatDateYYYYMMDDHHmmss(prev.start),
    end_date: formatDateYYYYMMDDHHmmss(prev.end),
    paginated: true,
    per_page: 1,
  });

  const pemasukan = saldoKredit(resPenjualan?.data?.total);
  const hargaPokok = saldoDebit(resHpp?.data?.total);
  const labaKotor = pemasukan === undefined || hargaPokok === undefined ? undefined : pemasukan - hargaPokok;
  const jumlahTransaksi = resTransaksi?.data?.transactions?.total;

  const pemasukanPrev = saldoKredit(resPenjualanPrev?.data?.total);
  const hargaPokokPrev = saldoDebit(resHppPrev?.data?.total);
  const labaKotorPrev =
    pemasukanPrev === undefined || hargaPokokPrev === undefined ? undefined : pemasukanPrev - hargaPokokPrev;
  const jumlahTransaksiPrev = resTransaksiPrev?.data?.transactions?.total;

  // — kartu bagian bawah —
  // Sengaja TIDAK ikut rentang tanggal: judulnya "Transaksi terakhir", bukan "transaksi
  // dalam rentang ini". Rentangnya sudah dijawab keempat KPI di atas.
  const { data: resTerakhir } = useFetchSales({ per_page: 5, order_by: { created_at: 'desc' } });

  const { data: resKonfirmasi } = useFetchTransactions({
    per_page: 1,
    paginated: true,
    where: { status: 'pending' },
  });

  // Jatuh tempo = belum lunas DAN tanggal jatuh temponya sudah lewat atau hari ini.
  const hariIni = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss');
  const { data: resPiutang } = useFetchDebt({
    per_page: 1,
    paginated: true,
    where: { type: 'receivable', is_paid: false },
    where_lower_equal: { due_date: hariIni },
  });
  const { data: resUtang } = useFetchDebt({
    per_page: 1,
    paginated: true,
    where: { type: 'debt', is_paid: false },
    where_lower_equal: { due_date: hariIni },
  });

  const { data: resStok } = useFetchItems({ per_page: 5, paginated: true, order_by: { quantity: 'asc' } });

  const arusKas = useMemo(() => bucketByDay(resKas?.data?.ledgers, start, end), [resKas, start, end]);
  const barangTerlaris = useMemo(() => topItems(resRincian?.data?.transactions, 4), [resRincian]);

  const angka = (n?: number) => (n === undefined ? undefined : formatNumber(n));

  // Rentang pembanding ditulis sekali dan dipakai keempat kartu — ia muncul di tooltip
  // tiap lencana, jadi pengguna tahu angka persennya dibandingkan dengan APA.
  const periodePembanding = `${prev.start.format('D MMM')} — ${prev.end.format('D MMM')}`;
  const banding = (previous?: number): Comparison => ({
    previous,
    previousText: previous === undefined ? '' : formatNumber(previous),
    period: periodePembanding,
  });

  return (
    // SPEC-01: kolom isi, gap 12px. Padding halaman datang dari DashboardLayout.
    <div className="flex flex-col gap-3">
      {/* SPEC-26: pemilih rentang milik halaman, bukan topbar — lihat catatan H.1 */}
      <div className="flex items-center justify-end">
        <DateRangeFilter
          value={draft}
          onChange={(range) => {
            setDraft(range);
            const [from, to] = range;
            if (from && to) {
              dispatch({ type: 'setStartDate', payload: from });
              dispatch({ type: 'setEndDate', payload: to });
            }
          }}
        />
      </div>

      {/* SPEC-02: empat kartu sama lebar, gap 10px */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Pemasukan" value={angka(pemasukan)} current={pemasukan} comparison={banding(pemasukanPrev)} />
        {/* Dieja seperti nama akunnya di Buku Besar: Harga Pokok Penjualan.
            "Pengeluaran" (nama di berkas desain) sempat dipakai lalu ditolak maintainer —
            ia menjanjikan total uang keluar, padahal pembelian tunai dan beban tidak ikut
            di sini, jadi angkanya diam saat toko belanja stok. "Modal barang" dan "Beban
            pokok" lebih akrab tapi menabrak nama akun Modal dan Beban.
            Yang mengunci pilihannya adalah kartu di sebelah kanan: laba kotor = pemasukan
            dikurangi kartu ini, dan hanya harga pokok yang benar untuk pengurangan itu.
            Jangan "perbaiki" jadi Persediaan debit: itu sisi barang MASUK, dan nilainya
            nol di rentang penjualan mana pun — persis bug yang halaman ini dulu punya. */}
        <StatCard
          label="Harga pokok"
          value={angka(hargaPokok)}
          current={hargaPokok}
          comparison={banding(hargaPokokPrev)}
        />
        <StatCard label="Laba kotor" value={angka(labaKotor)} current={labaKotor} comparison={banding(labaKotorPrev)} />
        <StatCard
          label="Transaksi"
          value={angka(jumlahTransaksi)}
          current={jumlahTransaksi}
          comparison={banding(jumlahTransaksiPrev)}
        />
      </div>

      {/* SPEC-08: grafik dua pertiga, barang terlaris sepertiga */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CashFlowCard buckets={arusKas} />
        </div>
        <TopItemsCard items={barangTerlaris} />
      </div>

      {/* SPEC-33: tabel dua pertiga, dua kartu tindakan menumpuk di sepertiga sisanya */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactionsCard
            transactions={resTerakhir?.data?.transactions?.data}
            onSelect={(transaction) => {
              setSelected(transaction);
              setSheetOpen(true);
            }}
          />
        </div>
        <div className="flex flex-col gap-2.5">
          <ActionNeededCard
            pendingStockIn={resKonfirmasi?.data?.transactions?.total}
            receivableDue={resPiutang?.data?.debts?.total}
            debtDue={resUtang?.data?.debts?.total}
          />
          <LowStockCard items={resStok?.data?.items?.data} />
        </div>
      </div>

      {selected && (
        <TransactionDetailSheet
          transaction={selected}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onClosed={() => setSelected(null)}
        />
      )}
    </div>
  );
};

// Seluruh isinya sudah memakai token, jadi aman mengikuti tema pengguna.
HomeWithWrapper.themeable = true;

export default HomeWithWrapper;
