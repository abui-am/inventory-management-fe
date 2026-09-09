import Link from 'next/link';
import { useRouter } from 'next/router';

import MENU_LIST, { MENU_GROUPS, MenuItem } from '@/constants/menu';
import { PermissionList, usePermission } from '@/context/permission-context';
import useFetchTransactions from '@/hooks/query/useFetchStockIn';
import { cn } from '@/lib/cn';

/**
 * Halaman aktif ditentukan dari rute, bukan dari indeks di MENU_LIST.
 *
 * Sebelumnya pemanggil mengirim `activePage` berupa indeks, padahal daftarnya disaring
 * hak akses saat render — jadi indeksnya harus tetap merujuk daftar penuh, dan setiap
 * penambahan menu punya peluang menggeser sorotan ke item yang salah. Mencocokkan slug
 * membuat kelas bug itu hilang.
 */
function useIsActive() {
  const { pathname } = useRouter();
  const segment = pathname.split('/')[1];
  return (slug: string) => slug.split('/')[1] === segment;
}

function MenuLink({ item, hideLabel, onNavigate }: { item: MenuItem; hideLabel: boolean; onNavigate: () => void }) {
  const isActive = useIsActive();
  const active = isActive(item.slug);
  const { displayName, icon, slug, id } = item;

  return (
    <Link href={slug}>
      {/* href diulang di <a>: Next menyuntikkannya saat render, tapi linter a11y hanya
          melihat sumbernya dan tanpa ini menganggap ini div yang bisa diklik. */}
      <a
        href={slug}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        title={hideLabel ? displayName : undefined}
        className={cn(
          'group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-base transition-colors duration-fast',
          hideLabel && 'justify-center px-0',
          active
            ? 'bg-accent-subtle font-semibold text-accent'
            : 'text-foreground-muted hover:bg-surface-raised hover:text-foreground'
        )}
      >
        {icon({ size: 16, strokeWidth: active ? 2.25 : 1.75, 'aria-hidden': true, className: 'shrink-0' })}
        {!hideLabel && <span className="truncate">{displayName}</span>}
        <Bubble id={id} hideLabel={hideLabel} />
      </a>
    </Link>
  );
}

const Menu: React.FC<{ hideLabel: boolean; onMenuClick: (menu: boolean) => void }> = ({ hideLabel, onMenuClick }) => {
  const { state } = usePermission();
  const allowed = (item: MenuItem) => !item.permission || state.permission.includes(item.permission as PermissionList);

  const loose = MENU_LIST.filter((item) => !item.group && allowed(item));
  const close = () => onMenuClick(false);

  return (
    <nav className="flex flex-col gap-4 px-2 pb-6" aria-label="Menu utama">
      {loose.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {loose.map((item) => (
            <MenuLink key={item.id} item={item} hideLabel={hideLabel} onNavigate={close} />
          ))}
        </div>
      )}

      {MENU_GROUPS.map(({ id, label }) => {
        const items = MENU_LIST.filter((item) => item.group === id && allowed(item));
        // Grup yang seluruh isinya tidak diizinkan tidak boleh menyisakan judul menggantung.
        if (items.length === 0) return null;

        return (
          <div key={id} className="flex flex-col gap-0.5">
            {hideLabel ? (
              // Saat label disembunyikan, judul grup diganti garis: teks 11px yang terpotong
              // jadi dua huruf tidak memberi tahu apa pun.
              <div className="mx-2 mb-1 border-t border-border-subtle" role="presentation" />
            ) : (
              <div className="px-2 pb-0.5 text-xs font-bold uppercase tracking-[0.07em] text-foreground-subtle">
                {label}
              </div>
            )}
            {items.map((item) => (
              <MenuLink key={item.id} item={item} hideLabel={hideLabel} onNavigate={close} />
            ))}
          </div>
        );
      })}
    </nav>
  );
};

/** Jumlah antrean yang menunggu tindakan, di samping menunya. */
function Bubble({ id, hideLabel }: { id: string; hideLabel: boolean }) {
  if (id === 'stock.confirmation') return <CountBadge status="pending" hideLabel={hideLabel} />;
  if (id === 'sellprice.adjustment') return <CountBadge status="on-review" hideLabel={hideLabel} />;
  return null;
}

function CountBadge({ status, hideLabel }: { status: string; hideLabel: boolean }) {
  const { data } = useFetchTransactions(
    { order_by: { created_at: 'desc' }, where: { status } },
    { refetchOnWindowFocus: true }
  );
  const total = data?.data?.transactions?.total ?? 0;

  // Nol bukan kabar. Lencana merah bertuliskan "0" menarik perhatian ke tempat yang
  // justru tidak butuh perhatian; yang lama selalu tampil, termasuk saat kosong.
  if (!total) return null;

  return (
    <span
      className={cn(
        'ml-auto rounded-full bg-destructive px-1.5 text-xs font-bold leading-[1.125rem] text-destructive-foreground',
        hideLabel && 'absolute right-1 top-0.5 ml-0'
      )}
    >
      {total}
    </span>
  );
}

export default Menu;
