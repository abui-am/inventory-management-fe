import { Banknote, ClipboardCheck, Wallet } from 'lucide-react';
import Link from 'next/link';

import Counter from '@/components/ui/counter';
import Skeleton from '@/components/ui/skeleton';

type Row = {
  icon: typeof ClipboardCheck;
  label: string;
  href: string;
  count?: number;
};

/**
 * Tiga hal yang menunggu dikerjakan hari ini, dikumpulkan dari tiga halaman berbeda.
 *
 * Sebelumnya tidak ada tempat yang menampilkan ini sekaligus: barang masuk yang belum
 * dikonfirmasi baru terlihat setelah membuka menunya, dan piutang yang jatuh tempo baru
 * terlihat setelah menyortir tabelnya. Baris bernilai nol tetap ditampilkan — kalau
 * disembunyikan, posisi baris lain berpindah-pindah tiap kali datanya berubah.
 *
 * Yang ditampilkan hanya JUMLAH, bukan nominalnya: endpoint /debts tidak mengirim
 * agregat seperti /ledgers, jadi satu-satunya cara mendapatkan totalnya adalah mengunduh
 * seluruh barisnya. Angka yang dijumlah dari satu halaman saja akan lebih kecil dari
 * yang sebenarnya tanpa ada tandanya — lebih baik tidak ditulis daripada salah.
 */
export function ActionNeededCard({
  pendingStockIn,
  receivableDue,
  debtDue,
}: {
  pendingStockIn?: number;
  receivableDue?: number;
  debtDue?: number;
}): JSX.Element {
  const rows: Row[] = [
    {
      icon: ClipboardCheck,
      label: 'Barang masuk perlu konfirmasi',
      href: '/stock-in-confirmation',
      count: pendingStockIn,
    },
    {
      icon: Banknote,
      label: 'Piutang jatuh tempo',
      href: '/account-receivable',
      count: receivableDue,
    },
    {
      icon: Wallet,
      label: 'Utang jatuh tempo',
      href: '/debt',
      count: debtDue,
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-card border border-border bg-surface px-4 py-3.5 shadow-sm">
      <span className="text-base font-semibold">Perlu tindakan</span>

      <div className="flex flex-col gap-0.75">
        {rows.map(({ icon: Icon, label, href, count }) => (
          <Link key={href} href={href}>
            <a className="-mx-1.5 flex items-center gap-2 rounded-control px-1.5 py-1.25 transition-colors duration-fast hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Icon
                size={14}
                strokeWidth={1.8}
                aria-hidden
                className={count ? 'shrink-0 text-warning' : 'shrink-0 text-foreground-subtle'}
              />
              <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
              {/* 14px = tinggi baris `text-2xs` milik Counter; 12px kira-kira dua angka. */}
              {count === undefined ? <Skeleton className="h-[14px] w-3" /> : <Counter value={count} />}
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default ActionNeededCard;
