import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

export type FilterTab = {
  value: string;
  label: string;
  /** `undefined` selama jumlahnya belum datang — bukan 0, supaya tidak sempat berbohong. */
  count?: number;
  /**
   * Kelas latar untuk titik warna, mis. `bg-success`. Harus string utuh, bukan
   * dirangkai saat runtime — Tailwind memindai sumber, jadi `bg-${x}` tidak pernah
   * ter-generate. Tab yang bukan status (mis. "Semua") tidak diberi titik.
   */
  dot?: string;
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
  const wadahRef = useRef<HTMLDivElement>(null);
  const tombolRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const [penanda, setPenanda] = useState<{ x: number; w: number } | null>(null);

  // Geseran pertama tidak dianimasikan: tanpa ini penanda akan meluncur dari tepi kiri
  // saat halaman baru dibuka, seolah tab-nya baru saja berpindah.
  const [siap, setSiap] = useState(false);

  const ukur = useCallback(() => {
    const el = tombolRef.current[value];
    const wadah = wadahRef.current;
    if (!el || !wadah) return;
    const a = el.getBoundingClientRect();
    const b = wadah.getBoundingClientRect();
    setPenanda({ x: a.left - b.left, w: a.width });
  }, [value]);

  // Lebar tab berubah saat angkanya datang dari server — "Semua" tanpa angka lebih
  // sempit daripada "Semua 50". Tanpa memantau ukuran, penanda akan tertinggal di
  // posisi lama begitu angkanya muncul.
  useLayoutEffect(() => {
    ukur();
    const wadah = wadahRef.current;
    if (!wadah || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(ukur);
    ro.observe(wadah);
    Object.values(tombolRef.current).forEach((t) => t && ro.observe(t));
    return () => ro.disconnect();
  }, [ukur, tabs]);

  useEffect(() => {
    if (penanda && !siap) setSiap(true);
  }, [penanda, siap]);

  return (
    // SPEC-12: gap 3px, padding 3px, radius 9px, TANPA border.
    <div
      ref={wadahRef}
      className="relative flex flex-wrap items-center gap-0.75 rounded-group bg-surface-raised p-0.75"
      role="tablist"
      aria-label={ariaLabel}
    >
      {penanda && (
        <span
          aria-hidden
          // Yang bergerak hanya transform; `width` ikut beranimasi tapi elemen ini
          // absolut, jadi perubahannya tidak menggeser apa pun di sekitarnya.
          className={cn(
            'pointer-events-none absolute left-0 top-0.75 h-7 rounded-control border border-border bg-surface shadow-sm',
            siap && 'transition-[transform,width] duration-200 ease-out'
          )}
          style={{ transform: `translateX(${penanda.x}px)`, width: penanda.w }}
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
              tombolRef.current[tab.value] = el;
            }}
            onClick={() => onChange(tab.value)}
            className={cn(
              // SPEC-13: 28px, padding 0 10px, radius 7px, 12px, gap 6px.
              // Border transparan di SEMUA tab — bukan hanya yang nonaktif — supaya
              // lebarnya tidak pernah berubah dan penanda tidak perlu ikut menyesuaikan.
              'relative z-10 inline-flex h-7 items-center gap-1.5 rounded-control border border-transparent px-2.5',
              'text-sm transition-colors duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              active ? 'font-semibold text-foreground' : 'font-medium text-foreground-muted hover:text-foreground'
            )}
          >
            {tab.dot && (
              // 6px: cukup untuk dipindai warnanya, terlalu kecil untuk bersaing dengan
              // labelnya. Sama seperti titik metode bayar di sheet detail.
              <span aria-hidden className={cn('size-1.5 flex-shrink-0 rounded-full', tab.dot)} />
            )}
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
