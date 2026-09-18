import dayjs from 'dayjs';
import { Search } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';

import EmptyState from '@/components/dashboard/EmptyState';
import { ThemedSelect } from '@/components/Form';
import AccountBalancesCard from '@/components/ledger/AccountBalancesCard';
import { HALAMAN_SUMBER } from '@/components/ledger/accounts';
import JournalEntrySheet from '@/components/ledger/JournalEntrySheet';
import JournalTable from '@/components/ledger/JournalTable';
import Pagination from '@/components/Pagination';
import TransactionDetailSheet from '@/components/transaction/TransactionDetailSheet';
import { Badge } from '@/components/ui/badge';
import DateRangeFilter, { DateRange } from '@/components/ui/date-range-filter';
import { Input } from '@/components/ui/input';
import Skeleton from '@/components/ui/skeleton';
import { useFetchUnpaginatedLedgerAccounts } from '@/hooks/query/useFetchLedgerAccount';
import { useFetchLedgers, useFetchUnpaginatedLedgers } from '@/hooks/query/useFetchLedgers';
import { useFetchSaleById } from '@/hooks/query/useFetchSale';
import { cn } from '@/lib/cn';
import { LedgerSource } from '@/typings/ledgers';
import { useDebounceValue } from '@/utils/debounce';
import { formatDateYYYYMMDDHHmmss, formatNumber } from '@/utils/format';
import { controlStyle } from '@/utils/style';

/** Sama seperti halaman lama: setahun terakhir. */
const rentangAwal = (): DateRange => [dayjs().subtract(1, 'year').toDate(), new Date()];

/** Rute buku besar satu akun. Nama akun mengandung spasi, jadi wajib di-encode. */
export const rutaAkun = (nama: string): string => `/ledger/${encodeURIComponent(nama)}`;

/**
 * Satu tampilan untuk Jurnal Umum DAN Buku Besar.
 *
 * Keduanya memakai endpoint, kolom, dan ringkasan yang sama; bedanya cuma satu akun
 * disaring atau tidak. Karena itu tidak ada dua implementasi — hanya dua rute yang
 * merender komponen ini: `/general-ledger` (tanpa akun) dan `/ledger/[nama]` (satu akun).
 * Rute dipertahankan, bukan diganti query string, supaya sorotan menu dan breadcrumb
 * tetap tahu halaman mana yang sedang dibuka, dan tautan `/ledger/Kas` yang lama tetap hidup.
 */
export function LedgerView({ akun }: { akun: string | null }): JSX.Element {
  const router = useRouter();
  const [range, setRange] = useState<DateRange>(rentangAwal);
  const [draft, setDraft] = useState<DateRange>(range);
  const [search, setSearch] = useState('');
  const [paginationUrl, setPaginationUrl] = useState('');
  // Dua state, bukan satu: kalau idnya dibuang saat menutup, sheet-nya lepas seketika
  // dan animasi keluarnya tidak pernah sempat berjalan.
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Ayat jurnal yang sedang dibuka. Idem: dua state supaya animasi keluarnya sempat jalan.
  const [ayat, setAyat] = useState<LedgerSource | null>(null);
  const [ayatOpen, setAyatOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  // 500 ms: tanpa ini tiap ketikan mengirim satu request.
  const debouncedSearch = useDebounceValue(search, 500);

  /**
   * Menyaring berarti kembali ke halaman satu.
   *
   * `forceUrl` milik paginasi menyimpan URL halaman ke-N lengkap dengan filternya saat
   * itu. Kalau filternya berganti sementara URL-nya tidak dibuang, backend menjawab
   * halaman ke-N dari penyaringan yang lama — dan tabelnya menampilkan data yang tidak
   * cocok dengan penyaring yang menyala. Halaman lama punya lubang ini; di sana tidak
   * terlihat karena satu-satunya filternya cuma tanggal.
   *
   * Pergantian AKUN tidak lewat sini: ia berpindah rute, dan `key` di halamannya
   * memasang ulang komponen ini sehingga seluruh state ikut bersih.
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
  } = resLedgers?.data?.ledgers ?? {};

  // Satu request untuk dua kebutuhan: isi dropdown penyaring DAN kartu saldo di kanan.
  // Daftarnya datang dari backend, jadi ia selalu persis akun yang benar-benar ada —
  // tidak ada daftar hardcoded yang bisa menyimpang dari `LedgerAccount::$types`.
  const { data: resAkun } = useFetchUnpaginatedLedgerAccounts();
  const akunList = resAkun?.data?.ledger_accounts;
  const akunAktif = akun ? akunList?.find((a) => a.name === akun) : undefined;

  const opsiAkun = useMemo(
    () => [
      { value: '', label: 'Semua akun' },
      ...[...(akunList ?? [])]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((a) => ({ value: a.name, label: a.name })),
    ],
    [akunList]
  );

  /** Memilih akun = berpindah ke buku besarnya; "Semua akun" = kembali ke jurnal umum. */
  const pindahAkun = (nama: string | null) => router.push(nama ? rutaAkun(nama) : '/general-ledger');

  /**
   * Tombol "Buka" di sheet ayat.
   *
   * Transaksi dibuka sebagai sheet DI HALAMAN INI — daftar jurnalnya tetap di belakang.
   * Jenis lain belum punya sheet rinciannya sendiri, jadi ia berpindah ke halaman
   * daftarnya; yang tidak punya halaman sama sekali tidak diberi tombol.
   */
  const bukaSumber = (sumber: LedgerSource) => {
    if (sumber.type === 'transactions') {
      return () => {
        setTransactionId(sumber.id);
        setSheetOpen(true);
      };
    }
    const halaman = HALAMAN_SUMBER[sumber.type];
    return halaman ? () => router.push(halaman) : undefined;
  };

  // Seluruh baris satu ayat jurnal — semuanya berbagi `ledgerable_id`. Diambil terpisah
  // karena satu ayat bisa terbelah halaman: empat barisnya tidak selalu tampil bersama
  // di tabel, jadi mengumpulkannya dari baris yang kebetulan ada di layar akan bohong.
  const { data: resAyat } = useFetchUnpaginatedLedgers(
    { order_by: { sequence: 'asc' }, where: { ledgerable_id: ayat?.id ?? '' } },
    { enabled: !!ayat }
  );

  // Rincian transaksi hanya diambil setelah penandanya ditekan — `enabled` menahan
  // request sampai ada id, jadi membuka Jurnal Umum tidak ikut memanggil endpoint ini.
  const { data: resTransaksi } = useFetchSaleById(transactionId ?? '', { enabled: !!transactionId });
  const transaksi = resTransaksi?.data?.transaction;

  const total = resLedgers?.data?.total;

  /**
   * Ringkasan berganti bentuk saat satu akun dibuka: tiga kartu jadi empat.
   *
   * Selisih debit-kredit cuma bermakna untuk jurnal UTUH: tiap ayat menulis kedua sisi,
   * jadi totalnya wajib sama. Begitu disaring ke satu akun, yang tersisa hanya satu sisi
   * per ayat — "Kas" nyaris selalu debit — jadi selisihnya pasti besar dan lencananya
   * berteriak "Selisih" untuk keadaan yang justru normal.
   *
   * Penggantinya dua kartu yang dulu hanya ada di halaman Buku Besar: penambahan saldo
   * sepanjang periode, dan saldo akhir akunnya. Yang pertama dihitung dari `total`
   * (seluruh hasil filter, bukan halaman yang tampil) dengan arah mengikuti tipe akun;
   * yang kedua dibaca dari `ledger_accounts.balance`, jadi ia posisi TERAKHIR dan
   * sengaja tidak ikut berubah saat rentang tanggalnya diganti.
   */
  const penambahan = ((): number | undefined => {
    if (!total || !akunAktif) return undefined;
    // Akun bertipe kredit (Penjualan, Utang, Modal) BERTAMBAH di sisi kredit, jadi
    // arahnya dibalik. Tanpa ini penjualan sebulan tampil sebagai penurunan saldo.
    return akunAktif.type === 'debit' ? total.debit - total.credit : total.credit - total.debit;
  })();
  const balance = akun || !total ? undefined : total.difference === 0;

  const angka = (n?: number) => (n === undefined ? undefined : formatNumber(n));

  return (
    // SPEC-01
    <div className="flex flex-col gap-3">
      {/* SPEC-02 */}
      <div className={cn('grid grid-cols-1 gap-2.5', akun ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3')}>
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
          <>
            <KartuTotal
              label="Penambahan saldo"
              // Tandanya ditulis tegas: tanpa "+", angka naik dan angka turun terlihat
              // sama persis, dan yang membedakan cuma warna — tidak cukup untuk sesuatu
              // yang jadi kesimpulan utama halaman ini.
              value={penambahan === undefined ? undefined : (penambahan > 0 ? '+' : '') + formatNumber(penambahan)}
              valueClassName={warnaPenambahan(penambahan)}
              note={`Debit dikurangi kredit ${akun} sepanjang periode`}
            />
            <KartuTotal
              label={`Saldo ${akun}`}
              value={angka(akunAktif?.balance)}
              note="Posisi terakhir akun ini, di luar periode yang dipilih"
              badge={
                akunAktif && (
                  <Badge variant="neutral" className="ml-auto">
                    Akun {akunAktif.type === 'debit' ? 'debit' : 'kredit'}
                  </Badge>
                )
              }
            />
          </>
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
            // Tanpa ini react-select memakai penghitung global untuk id-nya, dan nomornya
            // berbeda antara render di server dan di klien — React 18 menanggapi
            // ketidakcocokan itu dengan membuang seluruh pohon SSR halaman ini.
            instanceId="saring-akun"
            aria-label="Pilih akun"
            value={opsiAkun.find((o) => o.value === (akun ?? '')) ?? opsiAkun[0]}
            options={opsiAkun}
            onChange={(opsi) => pindahAkun((opsi as { value: string } | null)?.value || null)}
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
      {/* `items-start`: tiap kartu setinggi isinya sendiri. Dengan perataan bawaan
          (`stretch`), kartu yang lebih pendek diregangkan mengikuti yang lebih tinggi —
          jadi kartu saldo ikut memanjang tiap kali tabelnya panjang, menyisakan ruang
          kosong di bawah daftar akunnya. */}
      <div className="grid grid-cols-1 items-start gap-2.5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* SPEC-12..26 */}
        <JournalTable
          rows={rows}
          loading={isLoading}
          perPage={pageSize}
          // Satu akun dibuka berarti tiap baris memuat lencana yang sama persis. Kolomnya
          // berhenti membedakan apa pun dan hanya memakan lebar yang dibutuhkan Sumber.
          hideAccount={!!akun}
          selectedSourceId={ayat?.id}
          onSelect={(row) => {
            if (!row.source) return;
            setAyat(row.source);
            setAyatOpen(true);
          }}
          empty={
            // SPEC-36 vs SPEC-37: kalimatnya dibedakan supaya jelas APA yang menyaring —
            // akun, kata kunci, atau memang periodenya yang kosong.
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
              onChangePerPage={(page) => {
                setPaginationUrl('');
                setPageSize(page?.value ?? 0);
              }}
            />
          }
        />

        {/* Panel saldo merangkap navigasi antar buku besar: daftar akunnya sudah ada di
            sini, jadi memaksa pengguna kembali ke dropdown untuk berpindah hanya
            menambah satu langkah tanpa menambah informasi. */}
        <AccountBalancesCard accounts={akunList} selected={akun} onSelect={(nama) => pindahAkun(nama)} />
      </div>

      {ayat && (
        <JournalEntrySheet
          source={ayat}
          rows={resAyat?.data?.ledgers}
          total={resAyat?.data?.total}
          open={ayatOpen}
          onClose={() => setAyatOpen(false)}
          onClosed={() => setAyat(null)}
          onOpenSource={bukaSumber(ayat)}
        />
      )}

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
}

/** Nol dibiarkan netral: ia bukan kabar baik maupun buruk. */
function warnaPenambahan(nilai?: number): string | undefined {
  if (nilai === undefined || nilai === 0) return undefined;
  return nilai > 0 ? 'text-success' : 'text-destructive';
}

/** SPEC-03..06 */
function KartuTotal({
  label,
  value,
  note,
  badge,
  valueClassName,
}: {
  label: string;
  value?: string;
  note: string;
  badge?: React.ReactNode;
  valueClassName?: string;
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
        <span
          className={cn('truncate font-mono text-xl font-semibold tabular-nums tracking-[-0.02em]', valueClassName)}
        >
          {value}
        </span>
      )}
      <span className="text-xs text-foreground-subtle">{note}</span>
    </div>
  );
}

export default LedgerView;
