import { NextPage } from 'next';

import StockInPage from '@/components/stock-in/StockInPage';
import { ThemeablePage } from '@/typings/page';

/** Antrean konfirmasi: barang masuk yang masih berstatus Menunggu. */
const StockInConfirmationPage: NextPage & ThemeablePage = () => <StockInPage fixedStatus="pending" />;

StockInConfirmationPage.themeable = true;

export default StockInConfirmationPage;
