import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PropsWithChildren, useState } from 'react';

import { PER_PAGE_OPTIONS, PerPageOption } from '@/constants/options';
import { cn } from '@/lib/cn';
import { Link } from '@/typings/common';

import { TextField, ThemedSelect } from './Form';
import { Button } from './ui/button';

const PAGER_LABELS = ['&laquo; Previous', 'Next &raquo;'];

/** Di atas ini, mengklik nomor satu per satu jadi menyiksa, jadi kotak lompat dimunculkan. */
const MANY_PAGES = 9;

type PaginationProps = {
  onClickNext: () => void;
  onClickPrevious: () => void;
  onClickPageButton: (url: string) => void;
  links: Link[] | [];
  stats: PaginationStats;
  onClickGoToPage?: (page: number) => void;
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
  onClickGoToPage,
  onChangePerPage,
}) => {
  const [goTo, setGoTo] = useState(0);

  // Laravel menyertakan tombol "Previous"/"Next" di dalam `links`. Komponen ini sudah
  // punya tombol panah sendiri, jadi keduanya disaring di sini — sebelumnya tiap halaman
  // menyalin filter yang sama.
  const navigableLinks = links.filter(({ label }) => !PAGER_LABELS.includes(label));
  const showGoTo = !!onClickGoToPage && navigableLinks.length > MANY_PAGES;

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
        {showGoTo && (
          <>
            <TextField
              placeholder="Hal."
              aria-label="Lompat ke halaman"
              onChange={(e) => setGoTo(+e.target.value)}
              className="h-7 w-14 rounded-md px-2 text-sm"
              type="number"
            />
            <Button size="xs" variant="outline" onClick={() => onClickGoToPage?.(goTo)}>
              Pergi
            </Button>
          </>
        )}

        {onChangePerPage && (
          // SPEC-43: 28px, 12px, gap 7px. Tingginya diatur lewat additionalStyle —
          // BUKAN lewat prop `styles`, yang akan membuang seluruh tema select.
          <ThemedSelect
            menuPlacement="top"
            aria-label="Jumlah baris per halaman"
            defaultValue={PER_PAGE_OPTIONS[1]}
            onChange={(e) => onChangePerPage(e as PerPageOption | null)}
            options={PER_PAGE_OPTIONS}
            // Hanya selisihnya, TANPA `...base`. Menyebar `base` di sini mengembalikan
            // nilai bawaan react-select DI ATAS tema — itu yang membuat radius menu
            // kembali ke 4px padahal tema menyetelnya 8px.
            additionalStyle={{
              // fontSize/lineHeight disetel di CONTROL, bukan hanya di singleValue:
              // react-select merender `dummyInput` yang mewarisi keduanya dari sini, dan
              // kotak barisnya (24px dari line-height bawaan) yang menentukan tinggi grid
              // valueContainer — itulah yang menggeser teks 1px ke bawah dari titik tengah.
              control: () => ({
                minHeight: 28,
                height: 28,
                width: 94,
                borderRadius: 7,
                fontSize: 12,
                lineHeight: '16px',
              }),
              // height 100% + align-items center: tanpa ini valueContainer hanya setinggi
              // isinya (16px) lalu di-center oleh flex kontrol terhadap kotak KONTEN
              // (28px dikurangi 2px border), sehingga jatuhnya 1px di bawah titik tengah
              // kotak border. Dengan mengisi penuh, pemusatannya terjadi di dalamnya.
              valueContainer: () => ({ padding: '0 8px', height: '100%', alignItems: 'center' }),
              singleValue: () => ({ fontSize: 12, lineHeight: '16px' }),
              // Input tersembunyi milik react-select ikut mengisi grid valueContainer;
              // line-height bawaannya (13px) membuat baris grid lebih tinggi dari teksnya
              // dan nilainya turun 1px dari titik tengah.
              input: () => ({ margin: 0, padding: 0, fontSize: 12, lineHeight: '16px' }),
              // padding 3, bukan 4: ikon react-select 20px + padding 2x4 = 28px, sedangkan
              // kotak KONTEN kontrol hanya 26px (28 dikurangi dua border). Anak yang lebih
              // tinggi dari kotak konten membuat baris flex meluap dan mendorong seluruh
              // isi turun 1px — itulah teks yang tidak center.
              dropdownIndicator: () => ({ padding: 3 }),
              menu: () => ({ fontSize: 12 }),
            }}
          />
        )}

        {/* SPEC-44: jarak eksplisit 4px antara pemilih dan nomor halaman */}
        <div className="w-1" aria-hidden />

        <nav className="flex items-center gap-1.25" aria-label="Navigasi halaman">
          {/* Panah tidak ada di berkas desain; dipertahankan atas permintaan. */}
          <button type="button" onClick={onClickPrevious} className={cn(pagerButton, pagerNeutral)}>
            <span className="sr-only">Sebelumnya</span>
            <ChevronLeft size={14} aria-hidden />
          </button>

          {navigableLinks.map(({ label, active, url }) =>
            // Laravel menyisipkan "..." sebagai link tanpa url. Merendernya sebagai tombol
            // memberi target klik yang tidak melakukan apa-apa.
            url ? (
              <button
                key={label}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onClickPageButton(url)}
                className={cn(
                  pagerButton,
                  active ? 'border-accent bg-accent font-semibold text-accent-foreground' : pagerNeutral
                )}
              >
                {label}
              </button>
            ) : (
              <span key={label} className="px-1 text-sm text-foreground-subtle" aria-hidden>
                …
              </span>
            )
          )}

          <button type="button" onClick={onClickNext} className={cn(pagerButton, pagerNeutral)}>
            <span className="sr-only">Berikutnya</span>
            <ChevronRight size={14} aria-hidden />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Pagination;
