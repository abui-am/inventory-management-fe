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
/** Jumlah akun di `LedgerAccount::$types` — dipakai untuk menakar skeleton. */
const JUMLAH_AKUN = 16;

export function AccountBalancesCard({
  accounts,
  selected,
  onSelect,
}: {
  accounts?: LedgerAccountData[];
  /** Nama akun yang buku besarnya sedang dibuka. */
  selected?: string | null;
  onSelect: (name: string) => void;
}): JSX.Element {
  const urut = accounts ? [...accounts].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)) : undefined;
  const terbesar = urut?.length ? Math.abs(urut[0].balance) : 0;

  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-card border border-border bg-surface px-4 py-3.5 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-semibold">Saldo akun</span>
        <span className="text-xs text-foreground-subtle">Pilih satu akun untuk membuka buku besarnya.</span>
      </div>

      {urut === undefined && (
        // Sebanyak akun yang benar-benar ada, bukan angka bulat yang enak dilihat:
        // `LedgerAccount::$types` berisi 16 akun dan seluruhnya selalu dikirim. Dengan
        // delapan baris, kartunya melonjak 280px begitu datanya datang.
        <div className="flex flex-col gap-1.25">
          {Array.from({ length: JUMLAH_AKUN }, (_, i) => (
            // 19 + 3 + 5 = 27px, tinggi baris terisi yang sebenarnya. Baris namanya 19px,
            // bukan 18: nominalnya memakai JetBrains Mono, yang tinggi barisnya 1px lebih
            // tinggi dari huruf teksnya, dan barisnya rata garis dasar.
            // Padding baris sungguhan ikut ditakar di sini: tanpa itu kartunya melonjak
            // beberapa piksel per baris begitu datanya datang.
            <div key={i} className="flex flex-col gap-0.75 px-1.5 pb-2 pt-1">
              <Skeleton className="h-[19px] w-full" />
              <Skeleton className="h-1.25 w-full rounded-full" />
            </div>
          ))}
        </div>
      )}

      {urut && (
        <div className="flex flex-col gap-1.25">
          {urut.map((akun) => {
            const golongan = golonganAkun(akun.name);
            // Lebar batang dari NILAI MUTLAK: saldo minus tetap punya besaran, dan
            // batang sepanjang nol akan menyembunyikan akun yang justru perlu dilihat.
            const lebar = terbesar === 0 ? 0 : (Math.abs(akun.balance) / terbesar) * 100;

            const aktif = akun.name === selected;

            return (
              // Tombol, bukan div: barisnya berpindah halaman, jadi ia harus bisa
              // dijangkau keyboard dan terbaca sebagai kendali oleh pembaca layar.
              <button
                key={akun.id}
                type="button"
                aria-current={aktif ? 'page' : undefined}
                onClick={() => onSelect(akun.name)}
                className={cn(
                  // pb lebih besar dari pt: batang saldonya hanya 5px dan duduk di dasar
                  // baris, jadi dengan padding simetris latar barisnya berhenti tepat di
                  // ujung batang dan terbaca seperti terpotong. Selisih 4px itu diambil
                  // kembali dari `gap` daftarnya, jadi jarak ke baris berikutnya — dan
                  // tinggi kartunya — tidak berubah sama sekali.
                  'flex flex-col gap-0.75 rounded-control px-1.5 pb-2 pt-1 text-left transition-colors duration-fast',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25',
                  aktif ? 'bg-accent-subtle' : 'hover:bg-surface-raised'
                )}
              >
                <div className="flex w-full items-baseline gap-2">
                  <span className={cn('min-w-0 flex-1 truncate text-sm', aktif && 'font-semibold')} title={akun.name}>
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
                <div className="h-1.25 w-full overflow-hidden rounded-full bg-surface-raised">
                  <div
                    // Warnanya TIDAK diredupkan saat satu akun dibuka. Sempat begitu, dan
                    // akibatnya panel yang sama tampil dengan dua palet berbeda antara
                    // Jurnal Umum dan Buku Besar — terbaca seperti dua komponen berbeda.
                    // Yang sedang dibuka sudah ditandai latar dan nama tebalnya.
                    className={cn('h-full rounded-full', akun.balance < 0 ? 'bg-destructive' : GOLONGAN[golongan].dot)}
                    style={{ width: `${lebar}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AccountBalancesCard;
