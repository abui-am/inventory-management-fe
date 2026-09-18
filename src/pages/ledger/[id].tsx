import { NextPage } from 'next';
import { useRouter } from 'next/router';

import LedgerView from '@/components/ledger/LedgerView';
import useMounted from '@/hooks/useMounted';
import { ThemeablePage } from '@/typings/page';

/**
 * Buku besar satu akun, dikenali dari NAMA akunnya di rute (`/ledger/Kas`) — bentuk yang
 * sama dengan halaman lama, jadi tautan dan bookmark yang sudah ada tetap hidup.
 *
 * Namanya dibaca dari `router.query` KALAU ada, kalau tidak dari alamat di bilah alamat.
 * Cadangan itu bukan kehati-hatian berlebih: di aplikasi ini `router.query` tidak pernah
 * terisi ketika sebuah rute dinamis dibuka LANGSUNG (reload atau bookmark) — `isReady`
 * tetap `false` dan `asPath` berhenti di pola `/ledger/[id]`. Berlaku untuk semua rute
 * dinamis, bukan hanya halaman ini; halaman lama diam-diam memuat buku besar akun kosong
 * karena itu. `window.location` selalu tahu jawabannya.
 *
 * `key` sengaja dipasang: berpindah akun tidak melepas komponennya, padahal `forceUrl`
 * paginasi menyimpan URL halaman ke-N milik akun SEBELUMNYA. Dengan key, tiap akun
 * memulai dari state yang bersih.
 */
const LedgerPage: NextPage & ThemeablePage = () => {
  const { query } = useRouter();
  const mounted = useMounted();

  const dariQuery = typeof query.id === 'string' ? query.id : undefined;
  const dariAlamat = mounted ? window.location.pathname.split('/')[2] : undefined;
  const ruas = dariQuery ?? dariAlamat;

  // Render pertama (di server dan sebelum efek jalan) sengaja kosong: tanpa nama akun,
  // merender tampilannya akan menembakkan satu request jurnal umum yang langsung dibuang.
  if (!ruas) return null;

  const akun = decodeURIComponent(ruas);

  return <LedgerView key={akun} akun={akun} />;
};

LedgerPage.themeable = true;

export default LedgerPage;
