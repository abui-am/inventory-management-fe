import dayjs from 'dayjs';
import { Search } from 'lucide-react';
import { NextPage } from 'next';
import React, { useMemo, useState } from 'react';

import EmptyState from '@/components/dashboard/EmptyState';
import { ThemedSelect } from '@/components/Form';
import AccountBalancesCard from '@/components/ledger/AccountBalancesCard';
import JournalTable from '@/components/ledger/JournalTable';
import Pagination from '@/components/Pagination';
import TransactionDetailSheet from '@/components/transaction/TransactionDetailSheet';
import { Badge } from '@/components/ui/badge';
import DateRangeFilter, { DateRange } from '@/components/ui/date-range-filter';
import { Input } from '@/components/ui/input';
import Skeleton from '@/components/ui/skeleton';
import { useFetchUnpaginatedLedgerAccounts } from '@/hooks/query/useFetchLedgerAccount';
import { useFetchLedgers } from '@/hooks/query/useFetchLedgers';
import { useFetchSaleById } from '@/hooks/query/useFetchSale';
import { ThemeablePage } from '@/typings/page';
import { useDebounceValue } from '@/utils/debounce';
import { formatDateYYYYMMDDHHmmss, formatNumber } from '@/utils/format';
import { controlStyle } from '@/utils/style';

/** Sama seperti halaman lama: setahun terakhir. */
const rentangAwal = (): DateRange => [dayjs().subtract(1, 'year').toDate(), new Date()];

const GeneralLedgerPage: NextPage & ThemeablePage = () => {
  const [range, setRange] = useState<DateRange>(rentangAwal);
  const [draft, setDraft] = useState<DateRange>(range);
  const [akun, setAkun] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [paginationUrl, setPaginationUrl] = useState('');
  // Dua state, bukan satu: kalau idnya dibuang saat menutup, sheet-nya lepas seketika
  // dan animasi keluarnya tidak pernah sempat berjalan.
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  // 500 ms: tanpa ini tiap ketikan mengirim satu request.
  const debouncedSearch = useDebounceValue(search, 500);

  /**
   * Menyaring berarti kembali ke halaman satu.
   *
   * `forceUrl` milik paginasi menyimpan URL halaman ke-N lengkap dengan filternya saat
   * itu. Kalau filternya berganti sementara URL-nya tidak dibuang, backend menjawab
   * halaman ke-N dari penyaringan yang lama — dan tabelnya menampilkan data yang tidak
   * cocok dengan chip yang menyala. Halaman lama punya lubang ini; di sana tidak
   * terlihat karena satu-satunya filternya cuma tanggal.
   */
  const saring =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      setPaginationUrl('');
      set(value);
    };

  const [from, to] = range;
  const { data: resLedgers, isLoading } = useFetchLedgers({
    order_by: { sequence: 'desc' },
    ...(akun ? { where: { description: akun } } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    where_greater_equal: { created_at: formatDateYYYYMMDDHHmmss(dayjs(from ?? new Date()).startOf('day')) ?? '' },
    where_lower_equal: { created_at: formatDateYYYYMMDDHHmmss(dayjs(to ?? new Date()).endOf('day')) ?? '' },
    forceUrl: paginationUrl,
    per_page: pageSize,
  });

  const {
    data: rows,
    from: dariBaris,
    to: sampaiBaris,
    total: jumlahBaris,
    links,
    next_page_url: berikutnya,
    prev_page_url: sebelumnya,
    last_page_url: halamanTerakhir,
  } = resLedgers?.data?.ledgers ?? {};

  // Satu request untuk dua kebutuhan: isi dropdown penyaring DAN kartu saldo di kanan.
  // Daftarnya datang dari backend, jadi ia selalu persis akun yang benar-benar ada —
  // tidak ada daftar hardcoded yang bisa menyimpang dari `LedgerAccount::$types`.
  const { data: resAkun } = useFetchUnpaginatedLedgerAccounts();
  const akunList = resAkun?.data?.ledger_accounts;

  const opsiAkun = useMemo(
    () => [
      { value: '', label: 'Semua akun' },
      ...[...(akunList ?? [])]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((a) => ({ value: a.name, label: a.name })),
    ],
    [akunList]
  );

  // Rincian transaksi hanya diambil setelah penandanya ditekan — `enabled` menahan
  // request sampai ada id, jadi membuka Jurnal Umum tidak ikut memanggil endpoint ini.
  const { data: resTransaksi } = useFetchSaleById(transactionId ?? '', { enabled: !!transactionId });
  const transaksi = resTransaksi?.data?.transaction;

  const total = resLedgers?.data?.total;

  /**
   * Kartu ketiga berganti arti saat satu akun disaring.
   *
   * Selisih debit-kredit cuma bermakna untuk jurnal UTUH: tiap ayat menulis kedua sisi,
   * jadi totalnya wajib sama. Begitu disaring ke satu akun, yang tersisa hanya satu sisi
   * per ayat — "Kas" nyaris selalu debit — jadi selisihnya pasti besar dan lencananya
   * berteriak "Selisih" untuk keadaan yang justru normal.
   *
   * Yang berguna di keadaan itu adalah SALDO akunnya, dan itu dibaca dari daftar
   * ledger_accounts, bukan dihitung dari baris yang kebetulan tampil.
   */
  const saldoAkun = akun ? akunList?.find((a) => a.name === akun)?.balance : undefined;
  const balance = akun || !total ? undefined : total.difference === 0;

  const angka = (n?: number) => (n === undefined ? undefined : formatNumber(n));

  return (
    // SPEC-01
    <div className="flex flex-col gap-3">
      {/* SPEC-02 */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <KartuTotal
          label="Total debit"
          value={angka(total?.debit)}
          note={akun ? `Sisi debit ${akun} pada periode ini` : 'Bertambahnya harta dan beban'}
        />
        <KartuTotal
          label="Total kredit"
          value={angka(total?.credit)}
          note={akun ? `Sisi kredit ${akun} pada periode ini` : 'Bertambahnya kewajiban dan pendapatan'}
        />
        {akun ? (
          <KartuTotal
            label={`Saldo ${akun}`}
            value={angka(saldoAkun)}
            note="Posisi terakhir akun ini, di luar rentang tanggal"
          />
        ) : (
          <KartuTotal
            label="Selisih"
            value={angka(total?.difference)}
            note={balance ? 'Debit dan kredit sudah sama besar' : 'Ada selisih yang perlu diperiksa'}
            badge={
              balance === undefined ? undefined : (
                // SPEC-07
                <Badge variant={balance ? 'success' : 'warning'} className="ml-auto">
                  {balance ? 'Balance' : 'Selisih'}
                </Badge>
              )
            }
          />
        )}
      </div>

      {/* SPEC-08 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* SPEC-09: satu dropdown, bukan deretan chip. Enam belas akun tidak muat
            sebagai chip tanpa membungkus jadi tiga baris, dan chip yang sebagian saja
            selalu menyembunyikan akun yang justru sedang dicari. */}
        {/* Lebarnya diatur lewat pembungkus, bukan lewat `additionalStyle.control` —
            react-select mengisi wadahnya, dan `controlStyle` tetap utuh apa adanya
            (tingginya satu sumber, lihat aturan 7 di CLAUDE.md). */}
        <div className="w-[210px]">
          <ThemedSelect
            aria-label="Saring akun"
            value={opsiAkun.find((o) => o.value === (akun ?? '')) ?? opsiAkun[0]}
            options={opsiAkun}
            onChange={(opsi) => saring(setAkun)((opsi as { value: string } | null)?.value || null)}
            additionalStyle={controlStyle}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* SPEC-10 */}
          <div className="relative">
            <Search
              size={14}
              strokeWidth={1.9}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-subtle"
              aria-hidden
            />
            <Input
              size="sm"
              // Referensi menulis 210px, tapi placeholder-nya butuh 231px: teksnya 187px
              // + 32px ruang ikon + 10px padding kanan. Di berkas desain teks itu
              // <span> yang meluber diam-diam; di dalam <input> ia terpotong jadi
              // "Cari keterangan atau nomin". Dilebarkan secukupnya, bukan teksnya yang
              // dipotong — toolbar-nya rata kanan dan masih longgar.
              className="w-[232px] pl-8"
              placeholder="Cari keterangan atau nominal…"
              aria-label="Cari jurnal"
              value={search}
              onChange={(e) => saring(setSearch)(e.target.value)}
            />
          </div>

          {/* SPEC-11 */}
          <DateRangeFilter
            value={draft}
            onChange={(next) => {
              setDraft(next);
              const [a, b] = next;
              if (a && b) saring(setRange)(next);
            }}
          />
        </div>
      </div>

      {/* Tabel di kiri, saldo seluruh akun di kanan. Kolom Sumber sekarang hanya memuat
          kode, jadi tabelnya tidak lagi butuh selebar halaman — ruang yang tadinya
          kosong dipakai untuk sesuatu yang dibaca. */}
      <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* SPEC-12..26 */}
        <JournalTable
          rows={rows}
          loading={isLoading}
          perPage={pageSize}
          onSelect={() => undefined}
          onOpenSource={(row) => {
            if (row.source?.type === 'transactions') {
              setTransactionId(row.source.id);
              setSheetOpen(true);
            }
          }}
          empty={
            // SPEC-36 vs SPEC-37: kalimatnya dibedakan supaya jelas APA yang menyaring —
            // chip akun, kata kunci, atau memang periodenya yang kosong.
            akun || debouncedSearch ? (
              <EmptyState>
                {akun ? `Tidak ada jurnal untuk akun ${akun}` : `Tidak ada jurnal untuk pencarian "${debouncedSearch}"`}
                {' pada periode ini.'}
              </EmptyState>
            ) : (
              <EmptyState
                actionLabel="Lihat 1 tahun terakhir"
                onAction={() => {
                  const awal = rentangAwal();
                  setDraft(awal);
                  saring(setRange)(awal);
                }}
              >
                Tidak ada jurnal pada periode ini.
              </EmptyState>
            )
          }
          pagination={
            // SPEC-25: pita yang sama dengan /transaction, perilaku forceUrl tetap sama.
            <Pagination
              stats={{ from: `${dariBaris ?? '0'}`, to: `${sampaiBaris ?? '0'}`, total: `${jumlahBaris ?? '0'}` }}
              links={links ?? []}
              onClickPageButton={(url) => setPaginationUrl(url)}
              onClickNext={() => setPaginationUrl((berikutnya as string) ?? '')}
              onClickPrevious={() => setPaginationUrl((sebelumnya as string) ?? '')}
              onClickGoToPage={(val) => setPaginationUrl(`${(halamanTerakhir as string).split('?')[0]}?page=${val}`)}
              onChangePerPage={(page) => {
                setPaginationUrl('');
                setPageSize(page?.value ?? 0);
              }}
            />
          }
        />

        <AccountBalancesCard accounts={akunList} />
      </div>

      {/* Rincian transaksi dibuka DI HALAMAN INI, tanpa pindah rute — daftar jurnalnya
          tetap di belakang sheet dan posisi bacanya tidak hilang. */}
      {transaksi && (
        <TransactionDetailSheet
          transaction={transaksi}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onClosed={() => setTransactionId(null)}
        />
      )}
    </div>
  );
};

/** SPEC-03..06 */
function KartuTotal({
  label,
  value,
  note,
  badge,
}: {
  label: string;
  value?: string;
  note: string;
  badge?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-1.25 rounded-card border border-border bg-surface px-3.5 py-3 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-foreground-subtle">{label}</span>
        {badge}
      </div>
      {value === undefined ? (
        // Seukuran angkanya: 28px tinggi baris `text-xl`, 90px lebar angka 10 digit.
        <Skeleton className="h-7 w-[90px]" />
      ) : (
        <span className="truncate font-mono text-xl font-semibold tabular-nums tracking-[-0.02em]">{value}</span>
      )}
      <span className="text-xs text-foreground-subtle">{note}</span>
    </div>
  );
}

// Seluruh isinya sudah memakai token, jadi aman mengikuti tema pengguna.
GeneralLedgerPage.themeable = true;

export default GeneralLedgerPage;
