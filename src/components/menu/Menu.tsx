import Link from 'next/link';
import { useRouter } from 'next/router';

import { Counter } from '@/components/ui/counter';
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
          // Jarak ikon–label diatur lewat margin label, bukan `gap`: saat label menyusut
          // jadi nol, gap tetap menyisakan ruang dan ikonnya terlihat meleset dari tengah.
          'group relative flex items-center rounded-md px-2 py-1.5 text-base',
          'transition-[background-color,color,padding] duration-fast',
          hideLabel && 'justify-center px-0',
          active
            ? 'bg-accent-subtle font-semibold text-accent'
            : 'text-foreground-muted hover:bg-surface-raised hover:text-foreground'
        )}
      >
        {icon({ size: 16, strokeWidth: active ? 2.25 : 1.75, 'aria-hidden': true, className: 'shrink-0' })}
        {/* Label tetap ada di DOM saat menu diciutkan — yang berubah lebarnya. Melepasnya
            dari DOM membuat penciutan tidak bisa dianimasikan sama sekali. */}
        <span
          className={cn(
            'overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-slow ease-out',
            hideLabel ? 'ml-0 max-w-0 opacity-0' : 'ml-2.5 max-w-[150px] opacity-100'
          )}
        >
          {displayName}
        </span>
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
            {/* Saat menu diciutkan, judul grup diganti garis: teks 11px yang terpotong jadi
                dua huruf tidak memberi tahu apa pun. Keduanya menempati petak yang sama
                supaya pergantiannya memudar di tempat, bukan mendorong isi menu naik-turun. */}
            <div className="relative mb-1 h-4">
              <div
                role="presentation"
                className={cn(
                  'absolute inset-x-2 top-1/2 border-t border-border-subtle transition-opacity duration-slow',
                  hideLabel ? 'opacity-100' : 'opacity-0'
                )}
              />
              <div
                className={cn(
                  'absolute inset-x-2 top-0 truncate text-xs font-bold tracking-[0.04em] text-foreground-subtle',
                  'transition-opacity duration-slow',
                  hideLabel ? 'opacity-0' : 'opacity-100'
                )}
              >
                {label}
              </div>
            </div>
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

  // Nol bukan kabar. Angka "0" menarik perhatian ke tempat yang justru tidak butuh
  // perhatian; yang lama selalu tampil, termasuk saat kosong.
  if (!total) return null;

  // Angka dan ukurannya sama dengan penghitung di halaman mana pun; yang membedakan
  // hanya latarnya — angka ini antrean yang menunggu dikerjakan, bukan sekadar
  // keterangan seperti jumlah baris tabel.
  //
  // Latar redup, bukan merah pekat seperti lencana lama: merah pekat di menu terbaca
  // sebagai "ada yang salah", padahal isinya cuma pekerjaan yang menunggu giliran.
  // Bentuknya sama dengan pill metode bayar dan lencana "Stok habis" — satu idiom untuk
  // semua kotak berwarna redup di aplikasi ini.
  return (
    <Counter
      value={total}
      className={cn(
        'ml-auto rounded-md bg-destructive-subtle px-1.5 py-0.25 font-semibold text-destructive',
        hideLabel && 'absolute right-1 top-0.5 ml-0'
      )}
    />
  );
}

export default Menu;
