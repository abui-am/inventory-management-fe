import { NextPage } from 'next';

import LedgerView from '@/components/ledger/LedgerView';
import { ThemeablePage } from '@/typings/page';

/**
 * Jurnal umum: seluruh akun, tanpa penyaring.
 *
 * Isinya satu komponen dengan Buku Besar (`/ledger/[nama]`) — bedanya cuma ada tidaknya
 * akun yang dibuka. Lihat `components/ledger/LedgerView.tsx`.
 */
const GeneralLedgerPage: NextPage & ThemeablePage = () => <LedgerView akun={null} />;

// Seluruh isinya sudah memakai token, jadi aman mengikuti tema pengguna.
GeneralLedgerPage.themeable = true;

export default GeneralLedgerPage;
