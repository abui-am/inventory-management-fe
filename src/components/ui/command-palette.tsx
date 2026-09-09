import { Command } from 'cmdk';
import { ArrowRight, Search } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import MENU_LIST from '@/constants/menu';
import { cn } from '@/lib/cn';

/**
 * Command palette (Cmd/Ctrl+K).
 *
 * Sumber datanya MENU_LIST yang sama dengan sidebar, jadi tidak ada daftar kedua
 * yang harus dijaga tetap sinkron. Penyaringan hak akses sengaja belum dipasang di
 * sini — itu perlu keputusan soal getPermission() yang masih menunggu persetujuan.
 */
export function CommandPalette(): JSX.Element {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const go = (slug: string) => {
    setOpen(false);
    router.push(slug);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex h-8 items-center gap-2 rounded-lg border border-border-strong bg-surface px-2.5',
          'text-sm text-foreground-subtle transition duration-fast hover:bg-surface-raised'
        )}
      >
        <Search size={14} strokeWidth={1.75} aria-hidden />
        Cari halaman
        <kbd className="rounded-sm border border-border bg-surface-raised px-1 font-mono text-xs">⌘K</kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Cari halaman"
        className={cn(
          'fixed left-1/2 top-[20%] z-50 w-[min(34rem,90vw)] -translate-x-1/2 overflow-hidden',
          'rounded-xl border border-border bg-surface shadow-md'
        )}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search size={16} strokeWidth={1.75} className="text-foreground-subtle" aria-hidden />
          <Command.Input
            placeholder="Ketik nama halaman…"
            className="h-11 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-foreground-subtle"
          />
        </div>
        <Command.List className="max-h-72 overflow-y-auto p-1.5">
          <Command.Empty className="px-3 py-6 text-center text-sm text-foreground-muted">
            Tidak ada halaman yang cocok.
          </Command.Empty>
          {MENU_LIST.map(({ id, slug, displayName }) => (
            <Command.Item
              key={id}
              value={displayName}
              onSelect={() => go(slug)}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-base',
                'text-foreground-muted aria-selected:bg-accent-subtle aria-selected:text-accent'
              )}
            >
              {displayName}
              <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
            </Command.Item>
          ))}
        </Command.List>
      </Command.Dialog>
    </>
  );
}

export default CommandPalette;
