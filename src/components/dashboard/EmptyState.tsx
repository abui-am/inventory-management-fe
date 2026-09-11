import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Keadaan kosong untuk kartu-kartu beranda.
 *
 * Di halaman ini penyebabnya SELALU sama: rentang tanggal yang sedang dipilih tidak
 * memuat apa-apa. Karena itu aksinya melebarkan rentang, bukan menyuruh "hapus filter"
 * — tidak ada filter lain untuk dihapus. Lihat aturan 8 di CLAUDE.md.
 */
export function EmptyState({
  children,
  actionLabel,
  onAction,
}: {
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <p className="max-w-[38ch] text-sm text-foreground-muted">{children}</p>
      {actionLabel && onAction && (
        <Button size="xs" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
