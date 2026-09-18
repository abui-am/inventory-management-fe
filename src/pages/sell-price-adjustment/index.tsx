import { NextPage } from 'next';

import StockInPage from '@/components/stock-in/StockInPage';
import { ThemeablePage } from '@/typings/page';

/** Barang masuk berstatus Ditinjau — tahap menentukan harga jual sebelum diterima. */
const SellPriceAdjustmentPage: NextPage & ThemeablePage = () => <StockInPage fixedStatus="on-review" />;

SellPriceAdjustmentPage.themeable = true;

export default SellPriceAdjustmentPage;
