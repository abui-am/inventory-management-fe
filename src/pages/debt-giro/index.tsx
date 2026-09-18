import { NextPage } from 'next';

import DebtPage from '@/components/debt/DebtPage';
import { ThemeablePage } from '@/typings/page';

/** Utang giro: tagihan supplier yang dibayar dengan giro dan belum dicairkan. */
const DebtGiroPage: NextPage & ThemeablePage = () => <DebtPage variant="current_account" />;

DebtGiroPage.themeable = true;

export default DebtGiroPage;
