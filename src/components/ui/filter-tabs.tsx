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
      // SPEC-12: gap 3px, padding 3px, radius 9px, TANPA border.
      className="flex flex-wrap items-center gap-0.75 rounded-group bg-surface-raised p-0.75"
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
              // SPEC-13: 28px, padding 0 10px, radius 7px, 12px, gap 6px.
              'inline-flex h-7 items-center gap-1.5 rounded-control px-2.5 text-sm transition-colors duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              // SPEC-15: border transparan pada tab nonaktif — bukan tanpa border, supaya
              // lebarnya tidak bergeser 2px saat tab berpindah.
              active
                ? 'border border-border bg-surface font-semibold text-foreground shadow-sm'
                : 'border border-transparent bg-transparent font-medium text-foreground-muted hover:text-foreground'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              // SPEC-16: 10px mono, foreground-subtle untuk tab aktif MAUPUN nonaktif.
              // Karena hurufnya lebih kecil dari labelnya sementara kotaknya di-center,
              // garis dasarnya duduk lebih tinggi — itulah kesan "agak ke atas".
              <span className="font-mono text-2xs tabular-nums text-foreground-subtle">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default FilterTabs;
