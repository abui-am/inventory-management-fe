import { cn } from '@/lib/cn';

export type FilterTab = {
  value: string;
  label: string;
  /** `undefined` selama jumlahnya belum datang — bukan 0, supaya tidak sempat berbohong. */
  count?: number;
};

/**
 * Penyaring status berbentuk tab, dengan jumlah di sebelah labelnya.
 *
 * Jumlahnya ikut ditampilkan karena tanpa itu tab hanya memberi tahu penyaringnya ada,
 * bukan apakah ada yang perlu dikerjakan — dan itulah pertanyaan yang dibawa orang saat
 * membuka halaman daftar.
 */
export function FilterTabs({
  tabs,
  value,
  onChange,
  'aria-label': ariaLabel,
}: {
  tabs: FilterTab[];
  value: string;
  onChange: (value: string) => void;
  'aria-label': string;
}): JSX.Element {
  return (
    <div
      className="flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-surface-raised p-0.5"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-base transition-colors duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              active
                ? 'bg-surface font-semibold text-foreground shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn('text-sm tabular-nums', active ? 'text-foreground-muted' : 'text-foreground-subtle')}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default FilterTabs;
