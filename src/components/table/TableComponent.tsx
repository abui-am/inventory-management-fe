import { Form, Formik } from 'formik';
import React, { useMemo } from 'react';

import { useUpdateStockIn } from '@/hooks/mutation/useMutateStockIn';
import { useFetchMyself } from '@/hooks/query/useFetchEmployee';
import { useFetchTransactionById } from '@/hooks/query/useFetchStockIn';
import { useDetailSaleAdaptor } from '@/hooks/table/useDetailSale';
import { useDetailStockInAdaptor } from '@/hooks/table/useDetailStockin';
import { Status } from '@/typings/common';
import { SaleTransactionsData } from '@/typings/sale';
import { TransactionData } from '@/typings/stock-in';
import { formatDate, formatToIDR } from '@/utils/format';

import { Button } from '../Button';
import Modal from '../Modal';
import ResponsiveTable from '../Table';
import Tag from '../Tag';

export const DetailStockIn: React.FC<{ transactions: TransactionData | null; onClose: () => void }> = ({
  transactions,
  onClose,
}) => {
  const {
    created_at = new Date(),
    invoice_number = '',
    transaction_code = '',
    supplier,
    pic,
    status,
    items = [],
    discount,
    payments,
  } = transactions ?? {};
  const { data: dataMyself } = useFetchMyself();

  const isAdmin = dataMyself?.data.user.roles.map((role) => role.id).includes(1);

  const { columns, data } = useDetailStockInAdaptor(items, false);

  return (
    <>
      <Modal ariaHideApp={false} isOpen={!!transactions} onRequestClose={onClose} variant="large">
        <h2 className="text-2xl font-bold mb-6 mt-2 max">Detail Transaksi Barang Masuk</h2>
        <div className="flex">
          <div className="flex-1">
            {payments && (
              <ItemInfo
                info={{
                  payments,
                  created_at,
                  invoice_number,
                  transaction_code,
                  items,
                  discount: discount ?? 0,
                }}
              />
            )}
          </div>
          <section className="ml-10 flex-1 p-6 rounded-lg border drop-shadow-lg bg-white" style={{ maxWidth: 228 }}>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Supplier:</span>
              <div>{supplier?.name}</div>
            </div>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Kasir:</span>
              {isAdmin ? (
                <div>
                  <a
                    href={`/employee/${pic?.id}`}
                    className="block font-bold hover:text-blue-600"
                  >{`${pic?.employee?.first_name} ${pic?.employee?.last_name}`}</a>
                </div>
              ) : (
                <div>{`${pic?.employee?.first_name} ${pic?.employee?.last_name}`}</div>
              )}
            </div>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Status:</span>
              <div>
                <Tag variant={status === 'accepted' ? 'primary' : 'secondary'}>{getTagValue(status ?? 'pending')}</Tag>
              </div>
            </div>
          </section>
        </div>
        <div className="mt-8">
          <ResponsiveTable columns={columns} data={data} />
        </div>
      </Modal>
    </>
  );
};

export const DetailSale: React.FC<{
  transactions: SaleTransactionsData;
  open: boolean;
  onClose: () => void;
}> = ({ transactions, open, onClose }) => {
  const { data: dataMyself } = useFetchMyself();

  const isAdmin = dataMyself?.data.user.roles.map((role) => role.id).includes(1);

  const {
    created_at,
    invoice_number,
    transaction_code,
    sender,
    customer,
    pic,
    items = [],
    discount,
    payments,
  } = transactions ?? {};

  const { columns, data } = useDetailSaleAdaptor(items);

  return (
    <>
      <Modal isOpen={open} onRequestClose={onClose} variant="large">
        <h2 className="text-2xl font-bold mb-6 mt-2 max">Detail Transaksi Penjualan</h2>
        <div className="flex">
          <div className="flex-1">
            <ItemInfo info={{ payments, created_at, invoice_number, transaction_code, items, discount }} />
          </div>
          <section className="ml-10 flex-1 p-6 rounded-lg border drop-shadow-lg bg-white" style={{ maxWidth: 228 }}>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Customer:</span>
              <div>{customer?.full_name}</div>
            </div>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Pengirim:</span>
              <div>
                {isAdmin ? (
                  <div>
                    <a
                      href={`/employee/${sender.id}`}
                      className="block font-bold hover:text-blue-600"
                    >{`${sender?.first_name} ${sender?.last_name}`}</a>
                  </div>
                ) : (
                  <div>{`${sender?.first_name} ${sender?.last_name}`}</div>
                )}
              </div>
            </div>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Kasir:</span>
              {isAdmin ? (
                <div>
                  <a
                    href={`/employee/${pic.id}`}
                    className="block font-bold hover:text-blue-600"
                  >{`${pic?.employee?.first_name} ${pic?.employee?.last_name}`}</a>
                </div>
              ) : (
                <div>{`${pic?.employee?.first_name} ${pic?.employee?.last_name}`}</div>
              )}
            </div>
          </section>
        </div>
        <div className="mt-8">
          <ResponsiveTable columns={columns} data={data} />
        </div>
      </Modal>
    </>
  );
};

const ItemInfo: React.FC<{
  info: Pick<TransactionData, 'created_at' | 'transaction_code' | 'payments' | 'invoice_number' | 'items' | 'discount'>;
}> = ({ info }) => {
  const { created_at, payments, transaction_code, invoice_number, discount } = info;
  return (
    <>
      <div className="flex justify-between mb-4">
        <h6 className="text-blueGray-600">Tanggal</h6>
        <span>{formatDate(created_at ?? new Date(), { withHour: true })}</span>
      </div>
      <div className="flex justify-between mb-4">
        <h6 className="text-blueGray-600">Kode Transaksi</h6>
        <span>{transaction_code}</span>
      </div>

      <div className="flex justify-between mb-4">
        <h6 className="text-blueGray-600">Nomor Faktur</h6>
        <span>{invoice_number}</span>
      </div>
      <div className="flex justify-between mb-4">
        <h6 className="text-blueGray-600">Discount:</h6>
        <span>{formatToIDR(discount)}</span>
      </div>
      <div className="flex justify-between mb-4">
        <h6 className="text-blueGray-600">Pembayaran (metode):</h6>
        <div>
          {payments?.map((payment) => (
            <p key={payment.payment_method + payment.cash}>{`${formatToIDR(payment?.payment_price)} (${
              payment?.payment_method
            })`}</p>
          ))}
        </div>
      </div>
    </>
  );
};

export const SellPriceAdjustment: React.FC<{ transactionId: string; onClose: () => void }> = ({
  transactionId,
  onClose,
}) => {
  const { data: dataTrans, isFetching } = useFetchTransactionById(transactionId, { enabled: !!transactionId });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { items = [] } = useMemo(() => dataTrans?.data.transaction ?? { items: [] }, [isFetching]);
  const { columns, data, initialValues } = useDetailStockInAdaptor(items, true);
  const { mutateAsync, isLoading } = useUpdateStockIn();
  return (
    <>
      <Modal isOpen={!!transactionId} onRequestClose={onClose} variant="large">
        <h2 className="text-2xl font-bold mt-2 max">Tentukan Harga Jual</h2>
        <Formik
          initialValues={initialValues}
          enableReinitialize
          onSubmit={(values) => {
            mutateAsync({
              transactionId: transactionId ?? '',
              data: {
                status: 'accepted',
                items: values.data,
              },
            });
            onClose();
          }}
        >
          <Form>
            <ResponsiveTable columns={columns} data={data} />
            <div className="mt-4 flex justify-end">
              <Button disabled={isLoading} variant="primary" type="submit">
                Simpan Harga
              </Button>
            </div>
          </Form>
        </Formik>
      </Modal>
    </>
  );
};

export const getTagValue = (status: Status) => {
  if (status === 'pending') {
    return 'Menunggu';
  }
  if (status === 'on-review') {
    return 'Sedang ditinjau';
  }
  if (status === 'declined') {
    return 'Ditolak';
  }
  return 'Diterima';
};
