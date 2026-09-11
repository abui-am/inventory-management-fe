import { useCallback, useEffect, useRef, useState } from 'react';

import { Counter } from '@/components/ui/counter';
import useIsomorphicLayoutEffect from '@/hooks/useIsomorphicLayoutEffect';
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
 *
 * Penanda tab aktif adalah SATU elemen yang menggeser posisinya, bukan latar yang
 * berpindah dari tombol ke tombol. Kalau tiap tombol punya latarnya sendiri, yang
 * terjadi saat berpindah adalah satu memudar dan satu muncul — mata membacanya sebagai
 * kedip, bukan perpindahan.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);

  // Geseran pertama tidak dianimasikan: tanpa ini penandanya akan meluncur dari tepi kiri
  // saat halaman baru dibuka, seolah tab-nya baru saja berpindah.
  const [ready, setReady] = useState(false);

  const measure = useCallback(() => {
    const el = buttonRefs.current[value];
    const container = containerRef.current;
    if (!el || !container) return;
    const a = el.getBoundingClientRect();
    const b = container.getBoundingClientRect();
    setIndicator({ x: a.left - b.left, w: a.width });
  }, [value]);

  // Lebar tab berubah saat angkanya datang dari server — "Semua" tanpa angka lebih
  // sempit daripada "Semua 50". Tanpa memantau ukuran, penandanya akan tertinggal di
  // posisi lama begitu angkanya muncul.
  useIsomorphicLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    Object.values(buttonRefs.current).forEach((t) => t && ro.observe(t));
    return () => ro.disconnect();
  }, [measure, tabs]);

  useEffect(() => {
    if (indicator && !ready) setReady(true);
  }, [indicator, ready]);

  return (
    // SPEC-12: gap 3px, padding 3px, radius 9px, TANPA border.
    <div
      ref={containerRef}
      className="relative flex flex-wrap items-center gap-0.75 rounded-group bg-surface-raised p-0.75"
      role="tablist"
      aria-label={ariaLabel}
    >
      {indicator && (
        <span
          aria-hidden
          // Yang bergerak hanya transform; `width` ikut beranimasi tapi elemen ini
          // absolut, jadi perubahannya tidak menggeser apa pun di sekitarnya.
          className={cn(
            'pointer-events-none absolute left-0 top-0.75 h-7 rounded-control border border-border bg-surface shadow-sm',
            ready && 'transition-[transform,width] duration-200 ease-out'
          )}
          style={{ transform: `translateX(${indicator.x}px)`, width: indicator.w }}
        />
      )}

      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            ref={(el) => {
              buttonRefs.current[tab.value] = el;
            }}
            onClick={() => onChange(tab.value)}
            className={cn(
              // SPEC-13: 28px, padding 0 10px, radius 7px, 12px, gap 6px.
              // Border transparan di SEMUA tab — bukan hanya yang nonaktif — supaya
              // lebarnya tidak pernah berubah dan penandanya tidak perlu ikut menyesuaikan.
              'relative z-10 inline-flex h-7 items-center gap-1.5 rounded-control border border-transparent px-2.5',
              'text-sm transition-colors duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              active ? 'font-semibold text-foreground' : 'font-medium text-foreground-muted hover:text-foreground'
            )}
          >
            {tab.label}
            <Counter value={tab.count} />
          </button>
        );
      })}
    </div>
  );
}

export default FilterTabs;
