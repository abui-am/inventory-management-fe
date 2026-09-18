import dayjs from 'dayjs';
import { Check, ClipboardList, Info, Search } from 'lucide-react';
import { NextPage } from 'next';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import ApproveAuditDialog from '@/components/audit/ApproveAuditDialog';
import { selisihAudit, sudahDihitung } from '@/components/audit/audit-shared';
import AuditReportCardList, { ChipSelisih, statusLaporan } from '@/components/audit/AuditReportCardList';
import { DatePickerComponent } from '@/components/Form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FilterTabs from '@/components/ui/filter-tabs';
import { Input } from '@/components/ui/input';
import Kpi from '@/components/ui/kpi';
import Skeleton from '@/components/ui/skeleton';
import { useFetchUnpaginatedAudits } from '@/hooks/query/useFetchAudit';
import { cn } from '@/lib/cn';
import { AuditsData } from '@/typings/audit';
import { ThemeablePage } from '@/typings/page';
import { useDebounceValue } from '@/utils/debounce';
import { formatDateYYYYMMDD } from '@/utils/format';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-1 align-middle text-base';

/** Nilai selisih satu baris: |selisih| x harga beli rata-rata. */
const nilaiSelisih = (row: AuditsData) => Math.abs(selisihAudit(row) ?? 0) * +(row.buy_price ?? 0);

const perluTindakan = (row: AuditsData) => sudahDihitung(row) && !row.is_valid && !row.is_approved;

/**
 * Laporan audit harian — layar pemilik.
 *
 * Di sinilah stok bisa berubah tanpa transaksi: menyetujui satu baris membuat
 * `ItemAuditObserver` menyamakan stok barang dengan hasil audit, lalu
 * `ItemAuditController` menulis beban penyusutan (audit kurang) atau jurnal
 * pendapatan lain-lain (audit lebih). Karena itu halaman ini dibangun di sekitar satu
 * pertanyaan: apa yang terjadi kalau tombol ini ditekan.
 */
const AuditReportPage: NextPage & ThemeablePage = () => {
  const [tanggal, setTanggal] = useState(new Date());
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, 300);
  const [setuju, setSetuju] = useState<AuditsData | null>(null);

  const { data, isLoading } = useFetchUnpaginatedAudits({
    where: { audit_date: formatDateYYYYMMDD(tanggal) },
    per_page: 10000,
  });

  const semua = useMemo<AuditsData[]>(() => data?.data?.item_audits ?? [], [data]);

  const menunggu = semua.filter(perluTindakan);
  const cocok = semua.filter((row) => sudahDihitung(row) && row.is_valid && !row.is_approved).length;
  const disetujui = semua.filter((row) => row.is_approved).length;

  const kurang = menunggu.filter((row) => (selisihAudit(row) ?? 0) < 0);
  const lebih = menunggu.filter((row) => (selisihAudit(row) ?? 0) > 0);
  const unitKurang = kurang.reduce((total, row) => total + Math.abs(selisihAudit(row) ?? 0), 0);
  const unitLebih = lebih.reduce((total, row) => total + (selisihAudit(row) ?? 0), 0);
  const nilaiKurang = kurang.reduce((total, row) => total + nilaiSelisih(row), 0);
  const nilaiLebih = lebih.reduce((total, row) => total + nilaiSelisih(row), 0);

  const rows = useMemo(() => {
    const cari = debouncedSearch.trim().toLowerCase();
    return (
      semua
        .filter((row) => {
          if (tab === 'pending') return perluTindakan(row);
          if (tab === 'matched') return sudahDihitung(row) && row.is_valid && !row.is_approved;
          if (tab === 'approved') return row.is_approved;
          return true;
        })
        .filter((row) => (cari ? `${row.item_name ?? ''}`.toLowerCase().includes(cari) : true))
        // Sama seperti layar hitung: backend tidak mengurutkan apa pun, dan baris yang
        // baru di-UPDATE pindah ke belakang urutan fisik Postgres.
        .sort((a, b) => `${a.item_name ?? ''}`.localeCompare(`${b.item_name ?? ''}`, 'id'))
    );
  }, [semua, tab, debouncedSearch]);

  const kosong = useMemo(() => {
    if (debouncedSearch)
      return { judul: `Tidak ada hasil untuk "${debouncedSearch}"`, pesan: 'Pencarian membaca nama barang.' };
    if (tab === 'pending')
      return {
        judul: 'Tidak ada yang menunggu persetujuan',
        pesan: 'Semua hitungan tanggal ini cocok dengan stok sistem — tidak ada stok yang perlu disesuaikan.',
      };
    if (tab === 'matched') return { judul: 'Belum ada yang cocok', pesan: 'Hitungan yang cocok akan muncul di sini.' };
    if (tab === 'approved')
      return { judul: 'Belum ada yang disetujui', pesan: 'Selisih yang kamu setujui akan tercatat di sini.' };
    return { judul: 'Audit tanggal ini belum dibuat', pesan: 'Audit dimulai dari halaman Audit Barang.' };
  }, [debouncedSearch, tab]);

  const total = semua.length;
  const adaAudit = isLoading || total > 0;
  const hari = dayjs(tanggal).format('DD MMM YYYY');

  return (
    <div className="flex flex-col gap-2.5 md:h-[calc(100vh-78px)] md:overflow-hidden">
      {/* SPEC-01 — tanggal yang sedang diperiksa dan akibat dari halaman ini */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">Laporan audit {hari}</h1>
            {!isLoading && total > 0 && (
              <Badge variant={menunggu.length > 0 ? 'warning' : 'success'}>
                {menunggu.length > 0 ? `${menunggu.length} menunggu persetujuan` : 'Tidak ada selisih'}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-foreground-subtle">
            Menyetujui akan menyesuaikan stok dan menulis jurnalnya — dan itu tidak bisa dibatalkan.
          </p>
        </div>

        <DatePickerComponent
          selected={tanggal}
          onChange={(value) => {
            if (value) setTanggal(value as Date);
          }}
        />
      </div>

      {adaAudit && (
        <>
          {/* SPEC-02 */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Kpi
              label="Menunggu persetujuan"
              nilai={isLoading ? undefined : menunggu.length}
              tone={menunggu.length > 0 ? 'warning' : 'default'}
              ket={isLoading ? '' : `dari ${total} barang yang dicatat`}
            />
            <Kpi
              label="Stok akan berkurang"
              nilai={isLoading ? undefined : `-${formatNumber(unitKurang)}`}
              tone={unitKurang > 0 ? 'destructive' : 'default'}
              ketTone={unitKurang > 0 ? 'destructive' : 'default'}
              ket={isLoading ? '' : `beban penyusutan ${formatNumber(nilaiKurang)}`}
            />
            <Kpi
              label="Stok akan bertambah"
              nilai={isLoading ? undefined : `+${formatNumber(unitLebih)}`}
              ket={isLoading ? '' : `pendapatan lain-lain ${formatNumber(nilaiLebih)}`}
            />
          </div>

          {/* SPEC-03 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              aria-label="Filter laporan audit"
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'pending', label: 'Menunggu', count: isLoading ? undefined : menunggu.length },
                { value: 'matched', label: 'Cocok', count: isLoading ? undefined : cocok },
                { value: 'approved', label: 'Disetujui', count: isLoading ? undefined : disetujui },
                { value: 'all', label: 'Semua', count: isLoading ? undefined : total },
              ]}
            />

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
                placeholder="Cari nama barang…"
                aria-label="Cari barang"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Di bawah md tiap baris jadi kartu. */}
          <div className="md:hidden">
            <AuditReportCardList rows={rows} loading={isLoading} empty={kosong} onApprove={setSetuju} />
          </div>

          {/* SPEC-04 */}
          <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm md:flex">
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-surface-raised">
                  <tr>
                    <th scope="col" className={cn(TH, 'text-left')}>
                      Barang
                    </th>
                    <th scope="col" className={cn(TH, 'w-[104px] text-right')}>
                      Stok sistem
                    </th>
                    <th scope="col" className={cn(TH, 'w-[104px] text-right')}>
                      Hasil audit
                    </th>
                    <th scope="col" className={cn(TH, 'w-[92px] text-right')}>
                      Selisih
                    </th>
                    <th scope="col" className={cn(TH, 'w-[116px] text-right')}>
                      Nilai
                    </th>
                    <th scope="col" className={cn(TH, 'hidden w-[140px] text-left lg:table-cell')}>
                      Petugas
                    </th>
                    <th scope="col" className={cn(TH, 'w-[112px] text-left')}>
                      Status
                    </th>
                    <th scope="col" className={cn(TH, 'w-[112px] text-right')}>
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading &&
                    Array.from({ length: 8 }, (_, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <tr key={i}>
                        {Array.from({ length: 8 }, (_, j) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <td key={j} className={cn(TD, j === 5 && 'hidden lg:table-cell')}>
                            <div className="flex h-8 items-center">
                              <Skeleton className="h-3.5 w-full" />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}

                  {!isLoading && rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-2.5 py-12 text-center">
                        <p className="text-base font-medium">{kosong.judul}</p>
                        <p className="mt-1 text-sm text-foreground-muted">{kosong.pesan}</p>
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    rows.map((row) => {
                      const status = statusLaporan(row);
                      const beda = selisihAudit(row);

                      return (
                        <tr key={row.id} className="transition-colors duration-fast hover:bg-surface-raised">
                          <td className={cn(TD, 'max-w-0')}>
                            <div className="truncate font-medium" title={row.item_name}>
                              {row.item_name}
                            </div>
                            <div className="truncate text-2xs text-foreground-subtle">{row.item_unit}</div>
                          </td>
                          <td
                            className={cn(
                              TD,
                              'whitespace-nowrap text-right font-mono tabular-nums text-foreground-muted'
                            )}
                          >
                            {row.item_quantity ?? '—'}
                          </td>
                          <td className={cn(TD, 'whitespace-nowrap text-right font-mono font-semibold tabular-nums')}>
                            {sudahDihitung(row) ? row.audit_quantity : '—'}
                          </td>
                          <td className={cn(TD, 'whitespace-nowrap text-right')}>
                            {sudahDihitung(row) ? (
                              <ChipSelisih beda={beda} />
                            ) : (
                              <span className="text-foreground-subtle">—</span>
                            )}
                          </td>
                          <td
                            className={cn(
                              TD,
                              'whitespace-nowrap text-right font-mono tabular-nums text-foreground-muted'
                            )}
                          >
                            {beda ? formatNumber(nilaiSelisih(row)) : '—'}
                          </td>
                          <td
                            className={cn(TD, 'hidden truncate whitespace-nowrap text-foreground-muted lg:table-cell')}
                          >
                            {row.user_name || '—'}
                          </td>
                          <td className={cn(TD, 'whitespace-nowrap')}>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className={cn(TD, 'whitespace-nowrap text-right')}>
                            {status.perluTindakan ? (
                              <Button size="xs" onClick={() => setSetuju(row)}>
                                <Check strokeWidth={2.4} aria-hidden />
                                Setujui
                              </Button>
                            ) : (
                              <span className="text-sm text-foreground-subtle">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {!isLoading && (
              <div className="flex items-center justify-between border-t border-border bg-surface-raised px-3.25 py-2 text-sm text-foreground-muted">
                <span>
                  <span className="font-mono text-foreground">{rows.length}</span> barang ditampilkan
                </span>
                <span>Nilai dihitung dari harga beli rata-rata</span>
              </div>
            )}
          </div>
        </>
      )}

      {!isLoading && total === 0 && (
        <div className="rounded-card border border-border bg-surface px-6 py-12 text-center shadow-sm">
          <span className="mx-auto flex size-9 items-center justify-center rounded-lg bg-accent-subtle text-accent">
            <ClipboardList size={19} strokeWidth={1.8} aria-hidden />
          </span>
          <p className="mt-2 text-base font-semibold">Audit {hari} belum dibuat</p>
          <p className="mx-auto mt-1 max-w-[420px] text-sm leading-[19px] text-foreground-muted">
            Belum ada hitungan yang bisa diperiksa untuk tanggal ini. Audit dimulai oleh petugas di halaman Audit
            Barang.
          </p>
          <Link href="/inventory/audit">
            <a className="mt-3 inline-block">
              <Button size="sm" variant="outline">
                <ClipboardList strokeWidth={1.9} aria-hidden />
                Buka Audit Barang
              </Button>
            </a>
          </Link>
        </div>
      )}

      <p className="flex items-start gap-1.5 rounded-lg bg-info-subtle px-3.25 py-2 text-sm leading-[17px] text-info">
        <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Angka yang disetujui yang berlaku — mengubahnya di dialog menimpa hitungan petugas. Selisih kurang menjadi
          beban penyusutan persediaan, selisih lebih menjadi pendapatan lain-lain.
        </span>
      </p>

      <ApproveAuditDialog row={setuju} isOpen={!!setuju} onClose={() => setSetuju(null)} />
    </div>
  );
};

AuditReportPage.themeable = true;

export default AuditReportPage;
