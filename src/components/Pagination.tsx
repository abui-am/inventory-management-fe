import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { PropsWithChildren } from 'react';

import { PER_PAGE_OPTIONS, PerPageOption } from '@/constants/options';
import { cn } from '@/lib/cn';
import { Link } from '@/typings/common';

import { ThemedSelect } from './Form';

const PAGER_LABELS = ['&laquo; Previous', 'Next &raquo;'];

/**
 * Jendela halaman disusun ulang di sini, tidak diambil mentah dari Laravel.
 *
 * `links` bawaan paginator panjangnya berubah-ubah mengikuti posisi halaman — di awal
 * ia mengirim belasan nomor sekaligus, dan pada beberapa posisi menyisipkan dua "..."
 * berurutan sehingga pitanya terbaca rusak. Yang dipakai dari `links` cuma dua hal yang
 * memang hanya diketahui backend: nomor halaman terakhir dan bentuk URL-nya.
 */
function jendelaHalaman(links: Link[]): {
  pages: number[];
  current: number;
  last: number;
  urlFor: (page: number) => string;
} {
  const numeric = links.filter(({ label }) => /^\d+$/.test(label));
  const last = Number(numeric[numeric.length - 1]?.label ?? 0);
  const current = Number(numeric.find(({ active }) => active)?.label ?? 1);
  const template = numeric.find(({ url }) => !!url)?.url ?? '';

  // Paling banyak lima nomor: halaman pertama, tiga di sekitar yang aktif, halaman
  // terakhir. Elipsisnya dihitung dari lompatan nomor saat dirender, bukan dari entri
  // "..." kiriman backend.
  const pages: number[] = [];
  for (let page = 1; page <= last; page += 1) {
    if (page === 1 || page === last || Math.abs(page - current) <= 1) pages.push(page);
  }

  return { pages, current, last, urlFor: (page) => template.replace(/([?&]page=)\d+/, `$1${page}`) };
}

type PaginationProps = {
  onClickNext: () => void;
  onClickPrevious: () => void;
  onClickPageButton: (url: string) => void;
  links: Link[] | [];
  stats: PaginationStats;
  onChangePerPage?: (option: PerPageOption | null) => void;
};

type PaginationStats = {
  from: string;
  to: string;
  total: string;
};

/**
 * SPEC-40..48. Pita ini duduk DI DALAM kartu tabel, di bawah baris terakhir:
 * latarnya `surface-raised` dan ia sengaja tidak punya border-atas — garis pemisahnya
 * datang dari `border-bottom` sel baris terakhir, persis seperti di berkas desain.
 */
// SPEC-45: 28px, min-width 28px, padding 0 7px, radius 6px, 12px.
const pagerButton =
  'inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-1.75 text-sm transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';
const pagerNeutral = 'border-border bg-surface text-foreground-muted hover:bg-surface-raised hover:text-foreground';

const Pagination: React.FC<PropsWithChildren<PaginationProps>> = ({
  onClickNext,
  onClickPrevious,
  onClickPageButton,
  links,
  stats,
  onChangePerPage,
}) => {
  // Laravel menyertakan tombol "Previous"/"Next" di dalam `links`. Komponen ini sudah
  // punya tombol panah sendiri, jadi keduanya disaring di sini — sebelumnya tiap halaman
  // menyalin filter yang sama.
  const { pages, current, last, urlFor } = jendelaHalaman(links.filter(({ label }) => !PAGER_LABELS.includes(label)));

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-raised px-3 py-2.25">
      {/* SPEC-41: 12px muted; angkanya mono, kata "dari" tidak. */}
      <span className="text-sm text-foreground-muted">
        <span className="font-mono tabular-nums text-foreground">
          {stats.from}–{stats.to}
        </span>{' '}
        dari <span className="font-mono tabular-nums text-foreground">{stats.total}</span>
      </span>

      {/* SPEC-42: gap 5px */}
      <div className="flex items-center gap-1.25">
        {onChangePerPage && (
          // Disembunyikan di layar sempit: di HP orang menggulir, bukan mengatur berapa
          // baris per halaman — dan kotaknya memakan hampir sepertiga lebar pita.
          // SPEC-43: 28px, 12px, gap 7px. Tingginya diatur lewat additionalStyle —
          // BUKAN lewat prop `styles`, yang akan membuang seluruh tema select.
          <div className="hidden sm:block">
            <ThemedSelect
              menuPlacement="top"
              aria-label="Baris per halaman"
              defaultValue={PER_PAGE_OPTIONS[1]}
              onChange={(e) => onChangePerPage(e as PerPageOption | null)}
              options={PER_PAGE_OPTIONS}
              // `...base` WAJIB disebar. getThemedSelectStyle merantai fungsi style —
              // `base` yang diterima di sini adalah hasil tema, bukan bawaan react-select —
              // jadi fungsi yang mengabaikan argumennya membuang seluruh tema dan
              // menyisakan kotak tanpa garis maupun latar.
              additionalStyle={{
                // fontSize/lineHeight disetel di CONTROL, bukan hanya di singleValue:
                // react-select merender `dummyInput` yang mewarisi keduanya dari sini, dan
                // kotak barisnya (24px dari line-height bawaan) yang menentukan tinggi grid
                // valueContainer — itulah yang menggeser teks 1px ke bawah dari titik tengah.
                control: (base) => ({
                  ...base,
                  minHeight: 28,
                  height: 28,
                  // Diukur terhadap label TERLEBAR ("50" = 17px), bukan terhadap "10".
                  // 76 = 17 teks + 4 margin singleValue + 16 padding valueContainer
                  // + 26 indikator + 2 border, plus sisa 11px. Pada 64px sisanya hanya 2px
                  // untuk "10" dan MINUS 1px untuk "50" — cukup bagi perbedaan rendering
                  // huruf antar mesin untuk memunculkan elipsis "1…".
                  width: 76,
                  borderRadius: 7,
                  fontSize: 12,
                  lineHeight: '16px',
                }),
                // height 100% + align-items center: tanpa ini valueContainer hanya setinggi
                // isinya (16px) lalu di-center oleh flex kontrol terhadap kotak KONTEN
                // (28px dikurangi 2px border), sehingga jatuhnya 1px di bawah titik tengah
                // kotak border. Dengan mengisi penuh, pemusatannya terjadi di dalamnya.
                valueContainer: (base) => ({ ...base, padding: '0 8px', height: '100%', alignItems: 'center' }),
                singleValue: (base) => ({ ...base, fontSize: 12, lineHeight: '16px' }),
                // Input tersembunyi milik react-select ikut mengisi grid valueContainer;
                // line-height bawaannya (13px) membuat baris grid lebih tinggi dari teksnya
                // dan nilainya turun 1px dari titik tengah.
                input: (base) => ({ ...base, margin: 0, padding: 0, fontSize: 12, lineHeight: '16px' }),
                // padding 3, bukan 4: ikon react-select 20px + padding 2x4 = 28px, sedangkan
                // kotak KONTEN kontrol hanya 26px (28 dikurangi dua border). Anak yang lebih
                // tinggi dari kotak konten membuat baris flex meluap dan mendorong seluruh
                // isi turun 1px — itulah teks yang tidak center.
                dropdownIndicator: (base) => ({ ...base, padding: 3 }),
                menu: (base) => ({ ...base, fontSize: 12 }),
              }}
            />
          </div>
        )}

        {/* SPEC-44: jarak eksplisit 4px antara pemilih dan nomor halaman */}
        <div className="w-1" aria-hidden />

        <nav className="flex items-center gap-1.25" aria-label="Pagination">
          {/* Panah tidak ada di berkas desain; dipertahankan atas permintaan. Dimatikan di
              ujung rentang — sebelumnya keduanya selalu bisa diklik, dan di halaman satu
              tombol kiri mengirim request ke URL kosong. */}
          <button
            type="button"
            onClick={onClickPrevious}
            disabled={current <= 1}
            className={cn(pagerButton, pagerNeutral, 'disabled:pointer-events-none disabled:opacity-40')}
          >
            <span className="sr-only">Previous</span>
            <ChevronLeft size={14} aria-hidden />
          </button>

          {pages.map((page, i) => (
            <React.Fragment key={page}>
              {/* Elipsis ditulis dari lompatan nomornya sendiri, bukan dari entri "..."
                  kiriman backend — dua elipsis berdempetan jadi mustahil. */}
              {i > 0 && page - pages[i - 1] > 1 && (
                <span className="px-1 text-sm text-foreground-subtle" aria-hidden>
                  …
                </span>
              )}
              <button
                type="button"
                aria-current={page === current ? 'page' : undefined}
                onClick={() => onClickPageButton(urlFor(page))}
                className={cn(
                  pagerButton,
                  page === current ? 'border-accent bg-accent font-semibold text-accent-foreground' : pagerNeutral
                )}
              >
                {page}
              </button>
            </React.Fragment>
          ))}

          <button
            type="button"
            onClick={onClickNext}
            disabled={current >= last}
            className={cn(pagerButton, pagerNeutral, 'disabled:pointer-events-none disabled:opacity-40')}
          >
            <span className="sr-only">Next</span>
            <ChevronRight size={14} aria-hidden />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Pagination;
