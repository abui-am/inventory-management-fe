import { NextPage } from 'next';

import DebtPage from '@/components/debt/DebtPage';
import { ThemeablePage } from '@/typings/page';

/** Utang: tagihan yang belum dibayar ke supplier. */
const DebtIndexPage: NextPage & ThemeablePage = () => <DebtPage variant="debt" />;

DebtIndexPage.themeable = true;

export default DebtIndexPage;
