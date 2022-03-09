import { useState } from 'react';
import Select from 'react-select';

import { PER_PAGE_OPTIONS } from '@/constants/options';
import { Link } from '@/typings/common';

import { Button } from './Button';
import { TextField } from './Form';

type PaginationProps = {
  onClickNext: () => void;
  onClickPrevious: () => void;
  onClickPageButton: (url: string) => void;
  links: Link[] | [];
  stats: PaginationStats;
  onClickGoToPage?: (page: number) => void;
  onChangePerPage?: (option: { label: string; value: number } | null) => void;
};

type PaginationStats = {
  from: string;
  to: string;
  total: string;
};

const Pagination: React.FC<PaginationProps> = ({
  onClickNext,
  onClickPrevious,
  onClickPageButton,
  links,
  stats,
  onClickGoToPage,
  onChangePerPage,
}) => {
  const [goTo, setGoTo] = useState(0);

  const handleClick = () => {
    onClickGoToPage?.(goTo);
  };
  return (
    <div className="bg-white px-4 pt-6 flex items-center justify-between border-t border-gray-200">
      <div className="flex-1 flex justify-between sm:hidden">
        <a
          href="#"
          onClick={() => {
            if (onClickPrevious) onClickPrevious();
          }}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Previous
        </a>
        <a
          href="#"
          onClick={() => {
            if (onClickNext) onClickNext();
          }}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Next
        </a>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{stats.from}</span> to <span className="font-medium">{stats.to}</span>{' '}
            of <span className="font-medium">{stats.total}</span> results
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
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <span className="sr-only">Previous</span>

              <svg
                className="h-5 w-5"
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

            {links.map(({ label, active, url }) => {
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
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <span className="sr-only">Next</span>

              <svg
                className="h-5 w-5"
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
                <TextField placeholder="10" onChange={(e) => setGoTo(+e.target.value)} className="w-20" type="number" />
                <Button className="ml-2" onClick={handleClick}>
                  Pergi
                </Button>
                <div className="ml-2">
                  <Select
                    menuPlacement="top"
                    defaultValue={PER_PAGE_OPTIONS[1]}
                    onChange={(e) => {
                      console.log(onChangePerPage);

                      if (onChangePerPage) {
                        console.log('nayal');
                        onChangePerPage(e);
                      }
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        height: 44,
                        width: 180,
                      }),
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

const PageButton: React.FC<{ variant: 'active' | 'inactive'; onClickPageButton: () => void }> = ({
  variant,
  onClickPageButton,
  children,
}) => {
  const classes = {
    inactive:
      'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium',
    active:
      'z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium',
  };

  return (
    <a
      href="#"
      aria-current="page"
      className={classes[variant]}
      onClick={() => {
        if (onClickPageButton) {
          onClickPageButton();
        }
      }}
    >
      {children}
    </a>
  );
};

export default Pagination;
