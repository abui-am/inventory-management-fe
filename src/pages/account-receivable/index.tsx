import { NextPage } from 'next';

import DebtPage from '@/components/debt/DebtPage';
import { ThemeablePage } from '@/typings/page';

/** Piutang: tagihan yang belum diterima dari customer. */
const AccountReceivablePage: NextPage & ThemeablePage = () => <DebtPage variant="receivable" />;

AccountReceivablePage.themeable = true;

export default AccountReceivablePage;
