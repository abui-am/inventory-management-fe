import { GOLONGAN, golonganAkun } from '@/components/ledger/accounts';
import Skeleton from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { LedgerAccountData } from '@/typings/ledger-accounts';
import { formatNumber } from '@/utils/format';

/**
 * Saldo seluruh akun buku besar, diurutkan dari yang terbesar.
 *
 * Angkanya `ledger_accounts.balance` — saldo berjalan yang dipelihara backend, bukan
 * hasil penjumlahan baris di halaman yang sedang tampil. Jadi ia TIDAK ikut berubah saat
 * rentang tanggal atau penyaring akun diganti, dan itu memang benar: saldo akun adalah
 * posisi terakhir, bukan ringkasan periode. Ringkasan periodenya ada di tiga kartu atas.
 */
export function AccountBalancesCard({ accounts }: { accounts?: LedgerAccountData[] }): JSX.Element {
  const urut = accounts ? [...accounts].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)) : undefined;
  const terbesar = urut?.length ? Math.abs(urut[0].balance) : 0;

  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-card border border-border bg-surface px-4 py-3.5 shadow-sm">
      <span className="text-base font-semibold">Saldo akun</span>

      {urut === undefined && (
        <div className="flex flex-col gap-2.25">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex flex-col gap-0.75">
              <Skeleton className="h-[18px] w-full" />
              <Skeleton className="h-1.25 w-full rounded-full" />
            </div>
          ))}
        </div>
      )}

      {urut && (
        <div className="flex flex-col gap-2.25">
          {urut.map((akun) => {
            const golongan = golonganAkun(akun.name);
            // Lebar batang dari NILAI MUTLAK: saldo minus tetap punya besaran, dan
            // batang sepanjang nol akan menyembunyikan akun yang justru perlu dilihat.
            const lebar = terbesar === 0 ? 0 : (Math.abs(akun.balance) / terbesar) * 100;

            return (
              <div key={akun.id} className="flex flex-col gap-0.75">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm" title={akun.name}>
                    {akun.name}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 font-mono text-sm tabular-nums',
                      // Hanya saldo MINUS yang diberi warna — itu keadaan yang tidak
                      // wajar dan perlu ditengok. Saldo normal dibiarkan netral supaya
                      // enam belas baris ini tidak berubah jadi papan warna.
                      akun.balance < 0 ? 'font-semibold text-destructive' : 'text-foreground-muted'
                    )}
                  >
                    {formatNumber(akun.balance)}
                  </span>
                </div>
                <div className="h-1.25 overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className={cn('h-full rounded-full', akun.balance < 0 ? 'bg-destructive' : GOLONGAN[golongan].dot)}
                    style={{ width: `${lebar}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AccountBalancesCard;
