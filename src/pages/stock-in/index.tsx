import { NextPage } from 'next';

import StockInPage from '@/components/stock-in/StockInPage';
import { ThemeablePage } from '@/typings/page';

/** Seluruh barang masuk, dengan tab status. */
const StockInIndexPage: NextPage & ThemeablePage = () => <StockInPage withCreateButton />;

StockInIndexPage.themeable = true;

export default StockInIndexPage;
