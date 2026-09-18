import dayjs from 'dayjs';
import { ClipboardList, Info, RotateCcw, Search } from 'lucide-react';
import { NextPage } from 'next';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Kesempatan, statusAudit, sudahDihitung, terkunci } from '@/components/audit/audit-shared';
import AuditCardList from '@/components/audit/AuditCardList';
import CountField from '@/components/audit/CountField';
import LastChanceDialog from '@/components/audit/LastChanceDialog';
import StartAuditDialog from '@/components/audit/StartAuditDialog';
import { Konfirmasi } from '@/components/audit/useHitungan';
import { DatePickerComponent } from '@/components/Form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FilterTabs from '@/components/ui/filter-tabs';
import { Input } from '@/components/ui/input';
import Kpi from '@/components/ui/kpi';
import Skeleton from '@/components/ui/skeleton';
import { useAudit } from '@/hooks/mutation/useMutateAudit';
import { useFetchUnpaginatedAudits } from '@/hooks/query/useFetchAudit';
import { cn } from '@/lib/cn';
import { AuditsData } from '@/typings/audit';
import { ThemeablePage } from '@/typings/page';
import { useDebounceValue } from '@/utils/debounce';
import { formatDateYYYYMMDD } from '@/utils/format';

const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-1 align-middle text-base';

/**
 * Audit barang harian — stok opname.
 *
 * Tidak ada halaman berhalaman di sini, sengaja: opname dikerjakan dari atas ke bawah
 * sampai habis, dan memotongnya per 10 baris membuat orang kehilangan tempatnya setiap
 * kali satu hitungan dikirim. Penyaring dan pencarian yang mempersempit daftar, bukan
 * nomor halaman.
 */
const AuditPage: NextPage & ThemeablePage = () => {
  const [tanggal, setTanggal] = useState(new Date());
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, 300);

  const [mulaiOpen, setMulaiOpen] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState<Konfirmasi | null>(null);
  const [mengirim, setMengirim] = useState(false);

  const { mutateAsync: buatAudit, isLoading: membuat } = useAudit();

  const { data, isLoading } = useFetchUnpaginatedAudits({
    where: { audit_date: formatDateYYYYMMDD(tanggal) },
    per_page: 10000,
  });

  const semua = useMemo<AuditsData[]>(() => data?.data?.item_audits ?? [], [data]);

  const total = semua.length;
  const dihitung = semua.filter(sudahDihitung).length;
  const belum = total - dihitung;
  const selisih = semua.filter((row) => sudahDihitung(row) && !row.is_valid && !row.is_approved).length;
  const terkunciCount = semua.filter(terkunci).length;
  const persen = total > 0 ? Math.round((dihitung / total) * 100) : 0;

  /** Jam kiriman terakhir — baris yang belum pernah dikirim tidak ikut dihitung. */
  const kirimanTerakhir = semua.reduce<string | null>((akhir, row) => {
    if (!sudahDihitung(row)) return akhir;
    const waktu = `${row.updated_at}`;
    return !akhir || waktu > akhir ? waktu : akhir;
  }, null);

  const rows = useMemo(() => {
    const cari = debouncedSearch.trim().toLowerCase();
    return (
      semua
        .filter((row) => {
          if (tab === 'uncounted') return !sudahDihitung(row);
          if (tab === 'counted') return sudahDihitung(row);
          if (tab === 'locked') return terkunci(row);
          return true;
        })
        .filter((row) => (cari ? `${row.item_name ?? ''}`.toLowerCase().includes(cari) : true))
        // Urutannya dipaksa di sini karena backend tidak mengurutkan apa pun
        // (ItemAuditRepository::index hanya ->get()), dan Postgres mengembalikan baris
        // sesuai urutan fisiknya: baris yang baru di-UPDATE pindah ke belakang, jadi
        // barang yang baru dihitung melompat dari tempatnya di tengah menghitung.
        .sort((a, b) => `${a.item_name ?? ''}`.localeCompare(`${b.item_name ?? ''}`, 'id'))
    );
  }, [semua, tab, debouncedSearch]);

  // Lompat antar baris butuh dua hal yang tidak boleh ikut memicu render: kotak isian
  // tiap baris, dan urutan baris yang sedang terlihat.
  const kotak = useRef<Record<string, HTMLInputElement | null>>({});
  const urutan = useRef<string[]>([]);
  const peta = useRef<Record<string, AuditsData>>({});

  useEffect(() => {
    urutan.current = rows.map((row) => row.id);
    peta.current = rows.reduce<Record<string, AuditsData>>((acc, row) => {
      acc[row.id] = row;
      return acc;
    }, {});
  }, [rows]);

  const fokusKe = (id?: string) => {
    if (!id) return;
    const el = kotak.current[id];
    el?.focus();
    el?.select();
  };

  /** Barang berikutnya yang belum dihitung, dihitung melingkar dari baris yang baru dikirim. */
  const berikutnya = (dariId: string) => {
    const daftar = urutan.current;
    const mulai = daftar.indexOf(dariId) + 1;
    const putar = daftar.slice(mulai).concat(daftar.slice(0, mulai));
    return putar.find((id) => {
      const row = peta.current[id];
      return !!row && id !== dariId && !terkunci(row) && !sudahDihitung(row);
    });
  };

  const onSelesai = (id: string) => fokusKe(berikutnya(id));

  const kirimKonfirmasi = async () => {
    if (!konfirmasi) return;
    setMengirim(true);
    try {
      await konfirmasi.kirim();
      setKonfirmasi(null);
    } finally {
      setMengirim(false);
    }
  };

  const mulaiAudit = async () => {
    try {
      await buatAudit({ audit_date: formatDateYYYYMMDD(tanggal) });
      setMulaiOpen(false);
    } catch {
      // Pesannya sudah muncul sebagai toast di hook-nya.
    }
  };

  const kosong = useMemo(() => {
    if (debouncedSearch)
      return {
        judul: `Tidak ada hasil untuk "${debouncedSearch}"`,
        pesan: 'Pencarian membaca nama barang.',
      };
    if (tab === 'uncounted') return { judul: 'Semua barang sudah dihitung', pesan: 'Tidak ada yang tersisa hari ini.' };
    if (tab === 'counted')
      return { judul: 'Belum ada yang dihitung', pesan: 'Mulai dari barang mana pun di tab Semua.' };
    if (tab === 'locked')
      return { judul: 'Tidak ada barang yang terkunci', pesan: 'Semua barang masih punya kesempatan kirim.' };
    return { judul: 'Audit ini kosong', pesan: 'Tidak ada barang yang tercatat saat audit dibuat.' };
  }, [debouncedSearch, tab]);

  const ketBelum = belum > 0 ? 'sisa pekerjaan hari ini' : 'semua barang sudah dihitung';
  const ketSelisih = selisih > 0 ? 'menunggu persetujuan pemilik' : 'hitungan cocok dengan sistem';

  const adaAudit = isLoading || total > 0;
  const hari = dayjs(tanggal).format('DD MMM YYYY');

  return (
    // Tinggi halaman dipatok setinggi layar (50px topbar + 2×14px padding isi) supaya
    // yang menggulir hanya badan tabel — kepala halaman, KPI, dan tab tetap di tempat
    // selama menghitung. Di bawah md daftarnya berbentuk kartu dan menggulir biasa.
    <div className="flex flex-col gap-2.5 md:h-[calc(100vh-78px)] md:overflow-hidden">
      {/* SPEC-01 — kepala: tanggal yang sedang dibuka, keadaannya, dan dua aksinya */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">Audit {hari}</h1>
            {!isLoading && total > 0 && (
              <Badge variant={belum === 0 ? 'success' : 'accent'}>
                {belum === 0 ? 'Selesai dihitung' : 'Berjalan'}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-foreground-subtle">
            Stok menurut sistem sengaja tidak ditampilkan selama menghitung — cocok atau tidaknya baru muncul setelah
            hitungan dikirim.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.75 md:flex-nowrap">
          <DatePickerComponent
            selected={tanggal}
            onChange={(value) => {
              if (value) setTanggal(value as Date);
            }}
          />
          {!isLoading && total > 0 && (
            <Button size="sm" variant="outline" onClick={() => setMulaiOpen(true)}>
              <RotateCcw strokeWidth={1.9} aria-hidden />
              Buat ulang
            </Button>
          )}
        </div>
      </div>

      {adaAudit && (
        <>
          {/* SPEC-02 */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Kpi
              label="Sudah dihitung"
              nilai={isLoading ? undefined : dihitung}
              ket={isLoading ? '' : `dari ${total} barang`}
            >
              <div className="mt-1.75 h-1 overflow-hidden rounded-pill bg-surface-sunken">
                <div
                  className="h-full rounded-pill bg-accent transition-all duration-slow"
                  style={{ width: `${persen}%` }}
                />
              </div>
            </Kpi>
            <Kpi
              label="Belum dihitung"
              nilai={isLoading ? undefined : belum}
              tone={belum > 0 ? 'warning' : 'default'}
              ketTone={belum > 0 ? 'warning' : 'default'}
              ket={isLoading ? '' : ketBelum}
            />
            <Kpi
              label="Selisih ditemukan"
              nilai={isLoading ? undefined : selisih}
              tone={selisih > 0 ? 'destructive' : 'default'}
              ketTone={selisih > 0 ? 'destructive' : 'default'}
              ket={isLoading ? '' : ketSelisih}
            />
          </div>

          {/* SPEC-03 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              aria-label="Filter barang audit"
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'all', label: 'Semua', count: isLoading ? undefined : total },
                { value: 'uncounted', label: 'Belum dihitung', count: isLoading ? undefined : belum },
                { value: 'counted', label: 'Sudah dihitung', count: isLoading ? undefined : dihitung },
                { value: 'locked', label: 'Terkunci', count: isLoading ? undefined : terkunciCount },
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

          {/* SPEC-04 — aturan papan ketik ditulis, bukan ditebak */}
          <div className="flex flex-wrap items-center gap-3.25 px-0.5 text-xs text-foreground-subtle">
            <Tuts tombol="Enter" ket="simpan & lanjut ke barang berikutnya" />
            <Tuts tombol="Esc" ket="kembalikan isian" />
            <span>Tiap barang punya 3 kali kesempatan kirim per hari.</span>
          </div>

          {/* Di bawah md tiap baris jadi kartu — opname dikerjakan di depan rak. */}
          <div className="md:hidden">
            <AuditCardList
              rows={rows}
              loading={isLoading}
              empty={kosong}
              onSelesai={onSelesai}
              onKonfirmasi={setKonfirmasi}
            />
          </div>

          {/* SPEC-05 */}
          <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm md:flex">
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-surface-raised">
                  <tr>
                    <th scope="col" className={cn(TH, 'text-left')}>
                      Barang
                    </th>
                    <th scope="col" className={cn(TH, 'w-[168px] text-left')}>
                      Hitungan fisik
                    </th>
                    <th scope="col" className={cn(TH, 'w-[96px] text-left')}>
                      Satuan
                    </th>
                    <th scope="col" className={cn(TH, 'hidden w-[136px] text-left lg:table-cell')}>
                      Kesempatan
                    </th>
                    <th scope="col" className={cn(TH, 'w-[140px] text-left')}>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading &&
                    Array.from({ length: 8 }, (_, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <tr key={i}>
                        {Array.from({ length: 5 }, (_, j) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <td key={j} className={cn(TD, j === 3 && 'hidden lg:table-cell')}>
                            <div className="flex h-8 items-center">
                              <Skeleton className="h-3.5 w-full" />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}

                  {!isLoading && rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-2.5 py-12 text-center">
                        <p className="text-base font-medium">{kosong.judul}</p>
                        <p className="mt-1 text-sm text-foreground-muted">{kosong.pesan}</p>
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    rows.map((row) => {
                      const status = statusAudit(row);

                      return (
                        <tr key={row.id} className="transition-colors duration-fast hover:bg-surface-raised">
                          <td className={cn(TD, 'max-w-0 truncate font-medium')} title={row.item_name}>
                            {row.item_name}
                          </td>
                          <td className={TD}>
                            <CountField
                              row={row}
                              inputRef={(el) => {
                                kotak.current[row.id] = el;
                              }}
                              onSelesai={onSelesai}
                              onKonfirmasi={setKonfirmasi}
                            />
                          </td>
                          <td className={cn(TD, 'whitespace-nowrap text-foreground-muted')}>{row.item_unit}</td>
                          <td className={cn(TD, 'hidden whitespace-nowrap lg:table-cell')}>
                            <Kesempatan terpakai={row.update_count} />
                          </td>
                          <td className={cn(TD, 'whitespace-nowrap')}>
                            <Badge variant={status.variant}>{status.label}</Badge>
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
                <span>
                  {kirimanTerakhir
                    ? `Kiriman terakhir ${dayjs(kirimanTerakhir).format('HH.mm')}`
                    : 'Belum ada hitungan yang dikirim'}
                </span>
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
            Memulai audit memasukkan seluruh barang ke daftar hitung, berikut stok sistemnya saat ini sebagai
            pembanding. Barang yang masuk setelah audit dibuat tidak ikut terhitung.
          </p>
          <Button size="sm" className="mt-3" onClick={() => setMulaiOpen(true)}>
            <ClipboardList strokeWidth={1.9} aria-hidden />
            Mulai audit
          </Button>
        </div>
      )}

      <p className="flex items-start gap-1.5 rounded-lg bg-info-subtle px-3.25 py-2 text-sm leading-[17px] text-info">
        <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Stok barang tidak berubah dari halaman ini. Selisih baru disesuaikan setelah pemilik menyetujuinya di Laporan
          Audit — bersamaan dengan beban penyusutan atau pendapatan lain-lain yang menyertainya.
        </span>
      </p>

      <StartAuditDialog
        varian={total > 0 ? 'ulang' : 'mulai'}
        tanggal={tanggal}
        jumlahBarang={total > 0 ? total : undefined}
        sudahDihitung={dihitung}
        isOpen={mulaiOpen}
        onClose={() => setMulaiOpen(false)}
        onConfirm={mulaiAudit}
        saving={membuat}
      />

      <LastChanceDialog
        row={konfirmasi?.row ?? null}
        nilai={konfirmasi?.nilai ?? 0}
        isOpen={!!konfirmasi}
        onClose={() => setKonfirmasi(null)}
        onConfirm={kirimKonfirmasi}
        saving={mengirim}
      />
    </div>
  );
};

/** Tuts papan ketik ditulis seperti tuts — bergaris dan berlatar, bukan teks biasa. */
function Tuts({ tombol, ket }: { tombol: string; ket: string }): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1.5">
      <kbd className="rounded-md border border-border bg-surface-raised px-1.25 font-mono text-xs leading-4 text-foreground-muted">
        {tombol}
      </kbd>
      <span>{ket}</span>
    </span>
  );
}

AuditPage.themeable = true;

export default AuditPage;
