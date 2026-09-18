export type Income = {
  sales: number;
  hpp: number;
  discounts: number;
  /** Ongkir yang DITAGIH ke customer — sudah ikut terhitung di `sales`. */
  shipping_cost: number;
};

/**
 * Pembelian dari supplier pada rentang yang sama.
 *
 * Sudah dikirim `IncomeReportController::index` sejak awal tapi tidak pernah ditampilkan.
 * Sengaja di luar laba rugi: uangnya jadi Persediaan, dan baru masuk laporan sebagai HPP
 * ketika barangnya terjual.
 */
export type StockIn = {
  /** Sudah BERSIH dari retur — `IncomeReportController::index` mengurangkannya. */
  purchases: number;
  shipping_cost: number;
  /** Nilai barang yang dikembalikan ke supplier di rentang ini. */
  returns: number;
};

export type Expense = {
  id: string;
  name: string;
  amount: number;
};

export type IncomeReport = {
  income_report: {
    incomes: Income;
    stock_ins: StockIn;
    expenses: Expense[];
    total_income: number;
    total_expense: number;
    total_profit: number;
  };
};

export type IncomeUserReport = {
  income_report: IncomeUserReportChild[];
};

export interface IncomeUserReportChild {
  name: string;
  income: Transaction & {
    total_income: number;
  };
  stock_in: Transaction & {
    total_purchase: number;
    /** Nilai barang yang dikembalikan ke supplier. `payment_methods` TIDAK ikut dikurangi. */
    returns: number;
  };
  expense: ExpensePerUser;
  balance: Balance;
}

export interface Transaction {
  sales?: number;
  purchases?: number;
  discount?: number;
  shipping_cost: number;
  payment_methods: PaymentMethods;
}

export interface PaymentMethods {
  cash: number;
  bank: number;
  debt?: number;
  current_account?: number;
}

export interface ExpensePerUser {
  expenses: ExpenseItem[];
  total_expense: number;
  payment_methods: PaymentMethods;
}

export interface ExpenseItem {
  name: string;
  amount: number;
}

/**
 * Sisa uang yang dipegang seseorang: penjualan − pembelian − beban.
 *
 * `payment_methods` di sini TIDAK sama bentuknya dengan yang lain: piutang dan utang
 * dipisah (`receivable` dan `payable`) karena mengurangkan yang satu dari yang lain
 * menghasilkan angka yang tidak menjawab pertanyaan apa pun.
 */
export interface Balance {
  total_balance: number;
  payment_methods: {
    cash: number;
    bank: number;
    /** Piutang penjualan — belum diterima dari customer. */
    receivable: number;
    /** Utang pembelian — belum dibayar ke supplier. */
    payable: number;
    current_account: number;
  };
}
