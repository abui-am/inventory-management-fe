import Tippy from '@tippyjs/react';
import React, { useMemo } from 'react';
import { Calculator, Eye } from 'react-bootstrap-icons';

import { useUpdateStockIn } from '@/hooks/mutation/useMutateStockIn';
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

export const DetailStockIn: React.FC<{ transactions: TransactionData }> = ({ transactions }) => {
  const [open, setOpen] = React.useState(false);

  const {
    created_at,
    invoice_number,
    transaction_code,
    payment_method,
    supplier,
    pic,
    status,
    items = [],
  } = transactions ?? {};

  const { columns, data } = useDetailStockInAdaptor(items, false);

  return (
    <>
      <Button size="small" onClick={() => setOpen((open) => !open)}>
        <Eye width={24} height={24} />
      </Button>

      <Modal isOpen={open} onRequestClose={() => setOpen((open) => !open)} variant="large">
        <h2 className="text-2xl font-bold mb-6 mt-2 max">Detail Transaksi Barang Masuk</h2>
        <div className="flex">
          <div className="flex-1">
            <ItemInfo info={{ created_at, invoice_number, transaction_code, payment_method, items }} />
          </div>
          <section className="ml-10 flex-1 p-6 rounded-lg border drop-shadow-lg bg-white" style={{ maxWidth: 228 }}>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Supplier:</span>
              <div>{supplier?.name}</div>
            </div>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Kasir:</span>
              <div>{`${pic?.employee.first_name} ${pic?.employee.last_name}`}</div>
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

export const DetailSale: React.FC<{ transactions: SaleTransactionsData }> = ({ transactions }) => {
  const [open, setOpen] = React.useState(false);

  const {
    created_at,
    invoice_number,
    transaction_code,
    payment_method,
    sender,
    customer,
    pic,
    items = [],
  } = transactions ?? {};

  const { columns, data } = useDetailSaleAdaptor(items);

  return (
    <>
      <Tippy content="Lihat detail">
        <Button size="small" onClick={() => setOpen((open) => !open)}>
          <Eye width={24} height={24} />
        </Button>
      </Tippy>

      <Modal isOpen={open} onRequestClose={() => setOpen((open) => !open)} variant="large">
        <h2 className="text-2xl font-bold mb-6 mt-2 max">Detail Transaksi Barang Masuk</h2>
        <div className="flex">
          <div className="flex-1">
            <ItemInfo info={{ created_at, invoice_number, transaction_code, payment_method, items }} />
          </div>
          <section className="ml-10 flex-1 p-6 rounded-lg border drop-shadow-lg bg-white" style={{ maxWidth: 228 }}>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Customer:</span>
              <div>{customer?.full_name}</div>
            </div>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Pengirim:</span>
              <div>{`${sender?.first_name} ${sender?.last_name}`}</div>
            </div>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Kasir:</span>
              <div>{`${pic?.employee?.first_name} ${pic?.employee?.last_name}`}</div>
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
  info: Pick<TransactionData, 'created_at' | 'transaction_code' | 'invoice_number' | 'payment_method' | 'items'>;
}> = ({ info }) => {
  const { created_at, transaction_code, invoice_number, payment_method, items } = info;
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
        <h6 className="text-blueGray-600">Metode Pembayaran</h6>
        <span>{payment_method}</span>
      </div>
      <div className="flex justify-between mb-4">
        <h6 className="text-blueGray-600">Pembayaran:</h6>
        <span>{formatToIDR(items.reduce((prev, next) => prev + next.pivot.total_price, 0))}</span>
      </div>
    </>
  );
};

export const SellPriceAdjustment: React.FC<{ transactionId: string }> = ({ transactionId }) => {
  const [open, setOpen] = React.useState(false);
  const { data: dataTrans, isFetching } = useFetchTransactionById(transactionId, { enabled: open });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { items = [] } = useMemo(() => dataTrans?.data.transaction ?? { items: [] }, [isFetching]);
  const { columns, data, dataSellPrice } = useDetailStockInAdaptor(items, true);
  const { mutateAsync } = useUpdateStockIn();
  return (
    <>
      <Button size="small" onClick={() => setOpen((open) => !open)}>
        <Calculator width={24} height={24} />
      </Button>

      <Modal isOpen={open} onRequestClose={() => setOpen((open) => !open)} variant="large">
        <h2 className="text-2xl font-bold mt-2 max">Tentukan Harga Jual</h2>

        <ResponsiveTable columns={columns} data={data} />

        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            onClick={() => {
              mutateAsync({
                transactionId: transactionId ?? '',
                data: {
                  status: 'accepted',
                  items: dataSellPrice,
                },
              });
              setOpen(false);
            }}
          >
            Simpan Harga
          </Button>
        </div>
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
