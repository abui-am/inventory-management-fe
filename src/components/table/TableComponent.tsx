import { Form, Formik } from 'formik';
import React, { PropsWithChildren, useMemo } from 'react';
import { Download } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

import { useUpdateItem } from '@/hooks/mutation/useMutateItems';
import { useUpdateStockIn } from '@/hooks/mutation/useMutateStockIn';
import { useFetchMyself } from '@/hooks/query/useFetchEmployee';
import useFetchInvoice from '@/hooks/query/useFetchInvoice';
import { useFetchItemById } from '@/hooks/query/useFetchItem';
import { useFetchTransactionById } from '@/hooks/query/useFetchStockIn';
import { useDetailSaleAdaptor } from '@/hooks/table/useDetailSale';
import { useDetailStockInAdaptor } from '@/hooks/table/useDetailStockin';
import useItemPriceAdjustment from '@/hooks/table/useItemPriceAdjustment';
import { Status } from '@/typings/common';
import { SaleTransactionsData } from '@/typings/sale';
import { TransactionData } from '@/typings/stock-in';
import { formatDate, formatPaymentMethod, formatToIDR } from '@/utils/format';
import printInvoice from '@/utils/printInvoice';
import reportError from '@/utils/reportError';

import { Button } from '../Button';
import Modal from '../Modal';
import ResponsiveTable from '../Table';
import Tag from '../Tag';

export const DetailStockIn: React.FC<
  PropsWithChildren<{ transactions: TransactionData | null; onClose: () => void }>
> = ({ transactions, onClose }) => {
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
    id,
  } = transactions ?? {};
  const { data: dataMyself } = useFetchMyself();

  const isAdmin = dataMyself?.data.user.roles.map((role) => role.id).includes(1);

  const { columns, data } = useDetailStockInAdaptor(items, false);

  return (
    <Modal isOpen={!!transactions} onRequestClose={onClose} variant="large">
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
                id,
              }}
            />
          )}
        </div>
        <section
          className="ml-10 flex-1 rounded-lg border border-border bg-surface p-4 shadow-sm"
          style={{ maxWidth: 228 }}
        >
          <div className="mb-2">
            <span className="mb-1 block text-sm text-foreground-muted">Supplier:</span>
            <div>{supplier?.name}</div>
          </div>
          <div className="mb-2">
            <span className="mb-1 block text-sm text-foreground-muted">Kasir:</span>
            {isAdmin ? (
              <div>
                <a
                  href={`/employee/${pic?.id}`}
                  className="block font-semibold hover:text-accent"
                >{`${pic?.employee?.first_name} ${pic?.employee?.last_name}`}</a>
              </div>
            ) : (
              <div>{`${pic?.employee?.first_name} ${pic?.employee?.last_name}`}</div>
            )}
          </div>
          <div className="mb-2">
            <span className="mb-1 block text-sm text-foreground-muted">Status:</span>
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
  );
};

export const DetailSale: React.FC<
  PropsWithChildren<{
    transactions: SaleTransactionsData;
    open: boolean;
    onClose: () => void;
  }>
> = ({ transactions, open, onClose }) => {
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
    id,
  } = transactions ?? {};

  const { columns, data } = useDetailSaleAdaptor(items);

  return (
    <Modal isOpen={open} onRequestClose={onClose} variant="large">
      <h2 className="text-2xl font-bold mb-6 mt-2 max">Detail Transaksi Penjualan</h2>
      <div className="flex">
        <div className="flex-1">
          <ItemInfo info={{ payments, created_at, invoice_number, transaction_code, items, discount, id }} />
        </div>
        <section
          className="ml-10 flex-1 rounded-lg border border-border bg-surface p-4 shadow-sm"
          style={{ maxWidth: 228 }}
        >
          <div className="mb-2">
            <span className="mb-1 block text-sm text-foreground-muted">Customer:</span>
            <div>{customer?.full_name}</div>
          </div>
          <div className="mb-2">
            <span className="mb-1 block text-sm text-foreground-muted">Pengirim:</span>
            <div>
              {isAdmin ? (
                <div>
                  <a
                    href={`/employee/${sender.id}`}
                    className="block font-semibold hover:text-accent"
                  >{`${sender?.first_name} ${sender?.last_name}`}</a>
                </div>
              ) : (
                <div>{`${sender?.first_name} ${sender?.last_name}`}</div>
              )}
            </div>
          </div>
          <div className="mb-2">
            <span className="mb-1 block text-sm text-foreground-muted">Kasir:</span>
            {isAdmin ? (
              <div>
                <a
                  href={`/employee/${pic.id}`}
                  className="block font-semibold hover:text-accent"
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
  );
};

const ItemInfo: React.FC<
  PropsWithChildren<{
    info: Pick<
      TransactionData,
      'created_at' | 'transaction_code' | 'payments' | 'invoice_number' | 'items' | 'discount'
    > & {
      id?: string;
    };
  }>
> = ({ info }) => {
  const { created_at, payments, transaction_code, invoice_number, discount, id } = info;
  return (
    <>
      <div className="flex justify-between mb-4">
        <h6 className="text-sm text-foreground-muted">Tanggal</h6>
        <span>{formatDate(created_at ?? new Date(), { withHour: true })}</span>
      </div>
      <div className="flex justify-between mb-4">
        <h6 className="text-sm text-foreground-muted">Kode Transaksi</h6>
        <span>{transaction_code}</span>
      </div>

      <div className="flex justify-between mb-4">
        <h6 className="text-sm text-foreground-muted">Nomor Faktur</h6>
        <span>{invoice_number}</span>
      </div>
      <div className="flex justify-between mb-4">
        <h6 className="text-sm text-foreground-muted">Discount:</h6>
        <span>{formatToIDR(discount)}</span>
      </div>
      <div className="flex justify-between mb-4">
        <h6 className="text-sm text-foreground-muted">Pembayaran (metode):</h6>
        <div>
          {payments?.map((payment) => (
            // Tanpa formatPaymentMethod, nilai mentah dari backend bocor ke layar:
            // "debt", "current_account", bukan "Utang", "Giro".
            <p key={payment.payment_method + payment.cash}>{`${formatToIDR(
              payment?.payment_price
            )} (${formatPaymentMethod(payment?.payment_method ?? '')})`}</p>
          ))}
        </div>
      </div>
      {id && (
        <div className="mb-4">
          <ButtonDownload transactionId={id} />
        </div>
      )}
    </>
  );
};

export const SellPriceAdjustment: React.FC<PropsWithChildren<{ transactionId: string; onClose: () => void }>> = ({
  transactionId,
  onClose,
}) => {
  const { data: dataTrans, isFetching } = useFetchTransactionById(transactionId, { enabled: !!transactionId });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { items = [] } = useMemo(() => dataTrans?.data.transaction ?? { items: [] }, [isFetching]);
  const { columns, data, initialValues } = useDetailStockInAdaptor(items, true);
  const { mutateAsync, isLoading } = useUpdateStockIn();
  return (
    <Modal isOpen={!!transactionId} onRequestClose={onClose} variant="screen">
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
  );
};

export const SellPriceAdjustmentItem: React.FC<PropsWithChildren<{ itemId: string; onClose: () => void }>> = ({
  itemId,
  onClose,
}) => {
  const { data: dataItem } = useFetchItemById(itemId);
  const { columns, data } = useItemPriceAdjustment({ item: dataItem?.data.item });
  const { mutateAsync: mutateAsyncItem, isLoading: isLoadingItem } = useUpdateItem();
  const initialValues = {
    sellPrice: dataItem?.data.item?.sell_price,
  };
  return (
    <Modal isOpen={!!itemId} onRequestClose={onClose} variant="screen">
      <h2 className="text-2xl font-bold mt-2 max">Tentukan Harga Jual</h2>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        onSubmit={(values) => {
          try {
            mutateAsyncItem({
              id: itemId,
              data: {
                sell_price: values.sellPrice,
              },
            });
            onClose();
          } catch (error) {
            reportError(error, { action: 'updateSellPrice' });
            toast.error('Gagal mengubah harga jual');
          }
        }}
      >
        <Form>
          <ResponsiveTable columns={columns} data={data} />
          <div className="mt-4 flex justify-end">
            <Button disabled={isLoadingItem} variant="primary" type="submit">
              Simpan Harga
            </Button>
          </div>
        </Form>
      </Formik>
    </Modal>
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

function ButtonDownload({ transactionId }: { transactionId: string }) {
  // isFetching, bukan isLoading: di react-query v4 query dengan `enabled: false`
  // berstatus 'loading' selamanya karena belum pernah punya data, jadi isLoading
  // tidak pernah false dan tombolnya disabled permanen.
  const { refetch: refetchDownload, isFetching } = useFetchInvoice(transactionId, {
    enabled: false,
  });
  const handleDownload = async () => {
    // download invoice

    const { data } = await refetchDownload();

    if (data) {
      printInvoice(data);
    }
  };

  return (
    <Button loading={isFetching} onClick={handleDownload} Icon={<Download width={24} height={24} />}>
      Download Invoice
    </Button>
  );
}
