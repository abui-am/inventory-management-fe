import { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

/**
 * Penanda tempat saat data belum datang. Bentuknya mengikuti konten yang akan mengisi,
 * supaya tata letak tidak melompat begitu data tiba.
 *
 * Kilaunya dari keyframe `shimmer` di tailwind.config — sudah didefinisikan sejak Fase 2
 * tapi belum pernah terpakai.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div className={cn('relative overflow-hidden rounded-md bg-surface-raised', className)} {...props}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent" />
    </div>
  );
}

export default Skeleton;
