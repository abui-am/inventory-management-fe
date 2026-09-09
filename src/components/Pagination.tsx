import { PropsWithChildren, useState } from 'react';

import { PER_PAGE_OPTIONS, PerPageOption } from '@/constants/options';
import { Link } from '@/typings/common';

import { Button } from './Button';
import { TextField, ThemedSelect } from './Form';

const PAGER_LABELS = ['&laquo; Previous', 'Next &raquo;'];

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

  const handleClick = () => {
    onClickGoToPage?.(goTo);
  };
  return (
    <div className="flex items-center justify-between border-t border-border pt-3">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          type="button"
          onClick={() => {
            if (onClickPrevious) onClickPrevious();
          }}
          className="inline-flex h-9 items-center rounded-md border border-border-strong bg-surface px-3 text-base font-semibold transition-colors duration-fast hover:bg-surface-raised"
        >
          Sebelumnya
        </button>
        <button
          type="button"
          onClick={() => {
            if (onClickNext) onClickNext();
          }}
          className="ml-3 inline-flex h-9 items-center rounded-md border border-border-strong bg-surface px-3 text-base font-semibold transition-colors duration-fast hover:bg-surface-raised"
        >
          Berikutnya
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          {/* Sebelumnya berbahasa Inggris ("Showing 1 to 10 of 50 results") di antarmuka
              yang seluruhnya berbahasa Indonesia. */}
          <p className="text-sm text-foreground-muted">
            Menampilkan <span className="font-semibold text-foreground">{stats.from}</span>–
            <span className="font-semibold text-foreground">{stats.to}</span> dari{' '}
            <span className="font-semibold text-foreground">{stats.total}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              tabIndex={0}
              type="button"
              onClick={() => {
                if (onClickPrevious) onClickPrevious();
              }}
              className="relative inline-flex items-center border border-border-strong bg-surface px-2 text-foreground-muted transition-colors duration-fast hover:bg-surface-raised hover:text-foreground h-8 rounded-l-md"
            >
              <span className="sr-only">Sebelumnya</span>

              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {navigableLinks.map(({ label, active, url }) => {
              return (
                <PageButton
                  key={label}
                  variant={active ? 'active' : 'inactive'}
                  onClickPageButton={() => {
                    onClickPageButton(url);
                  }}
                >
                  {label}
                </PageButton>
              );
            })}

            <button
              tabIndex={0}
              type="button"
              onClick={() => {
                if (onClickNext) onClickNext();
              }}
              className="relative inline-flex items-center border border-border-strong bg-surface px-2 text-foreground-muted transition-colors duration-fast hover:bg-surface-raised hover:text-foreground h-8 rounded-r-md"
            >
              <span className="sr-only">Berikutnya</span>

              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div>
              <div className="flex ml-2">
                <TextField
                  placeholder="Hal."
                  aria-label="Lompat ke halaman"
                  onChange={(e) => setGoTo(+e.target.value)}
                  className="w-16"
                  type="number"
                />
                <Button className="ml-2" onClick={handleClick}>
                  Pergi
                </Button>
                <div className="ml-2">
                  {/* ThemedSelect, bukan react-select polos: yang polos memakai gaya
                      bawaannya sendiri dan tetap putih di mode gelap. */}
                  <ThemedSelect
                    menuPlacement="top"
                    defaultValue={PER_PAGE_OPTIONS[1]}
                    onChange={(e) => {
                      if (onChangePerPage) {
                        // ThemedSelect mengetik option-nya longgar (bisa multi); di sini
                        // selalu single dan bentuknya PerPageOption.
                        onChangePerPage(e as PerPageOption | null);
                      }
                    }}
                    styles={{
                      control: (base) => ({ ...base, width: 150 }),
                    }}
                    options={PER_PAGE_OPTIONS}
                  />
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

const PageButton: React.FC<PropsWithChildren<{ variant: 'active' | 'inactive'; onClickPageButton: () => void }>> = ({
  variant,
  onClickPageButton,
  children,
}) => {
  const classes = {
    inactive:
      'relative inline-flex h-8 items-center border border-border-strong bg-surface px-3 text-base text-foreground-muted transition-colors duration-fast hover:bg-surface-raised hover:text-foreground',
    active:
      'relative z-10 inline-flex h-8 items-center border border-accent bg-accent-subtle px-3 text-base font-semibold text-accent',
  };

  return (
    // Dulu <a href="#">: tiap klik nomor halaman menambah "#" ke URL (merusak tombol Back)
    // dan melompat ke atas halaman, padahal ini tombol — bukan tautan.
    // aria-current juga dipasang di SEMUA tombol, jadi screen reader mengumumkan setiap
    // nomor sebagai "halaman saat ini". Sekarang hanya yang aktif.
    <button
      type="button"
      aria-current={variant === 'active' ? 'page' : undefined}
      className={classes[variant]}
      onClick={() => {
        if (onClickPageButton) {
          onClickPageButton();
        }
      }}
    >
      {children}
    </button>
  );
};

export default Pagination;
