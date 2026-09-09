import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PropsWithChildren, useState } from 'react';

import { PER_PAGE_OPTIONS, PerPageOption } from '@/constants/options';
import { cn } from '@/lib/cn';
import { Link } from '@/typings/common';

import { Button } from './Button';
import { TextField, ThemedSelect } from './Form';

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

const pagerButton =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-base transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

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
    <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Sebelumnya berbahasa Inggris ("Showing 1 to 10 of 50 results") di antarmuka
          yang seluruhnya berbahasa Indonesia. */}
      <p className="text-sm text-foreground-muted">
        <span className="font-semibold text-foreground">
          {stats.from}–{stats.to}
        </span>{' '}
        dari <span className="font-semibold text-foreground">{stats.total}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {showGoTo && (
          <div className="flex items-center gap-1.5">
            <TextField
              placeholder="Hal."
              aria-label="Lompat ke halaman"
              onChange={(e) => setGoTo(+e.target.value)}
              className="w-16"
              type="number"
            />
            <Button size="small" variant="outlined" onClick={() => onClickGoToPage?.(goTo)}>
              Pergi
            </Button>
          </div>
        )}

        {onChangePerPage && (
          <ThemedSelect
            menuPlacement="top"
            aria-label="Jumlah baris per halaman"
            defaultValue={PER_PAGE_OPTIONS[1]}
            // ThemedSelect mengetik option-nya longgar (bisa multi); di sini selalu single.
            onChange={(e) => onChangePerPage(e as PerPageOption | null)}
            options={PER_PAGE_OPTIONS}
            styles={{ control: (base) => ({ ...base, width: 118 }) }}
          />
        )}

        <nav className="flex items-center gap-1" aria-label="Navigasi halaman">
          <button
            type="button"
            onClick={onClickPrevious}
            className={cn(pagerButton, 'border-border-strong bg-surface text-foreground-muted hover:bg-surface-raised')}
          >
            <span className="sr-only">Sebelumnya</span>
            <ChevronLeft size={16} aria-hidden />
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
                  active
                    ? 'border-accent bg-accent text-accent-foreground font-semibold'
                    : 'border-border-strong bg-surface text-foreground-muted hover:bg-surface-raised hover:text-foreground'
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

          <button
            type="button"
            onClick={onClickNext}
            className={cn(pagerButton, 'border-border-strong bg-surface text-foreground-muted hover:bg-surface-raised')}
          >
            <span className="sr-only">Berikutnya</span>
            <ChevronRight size={16} aria-hidden />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Pagination;
