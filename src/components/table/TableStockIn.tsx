import Link from 'next/link';
import React from 'react';
import { Calculator, Check, Eye, Pencil, Search, X } from 'react-bootstrap-icons';

import Table from '@/components/Table';
import Tag from '@/components/Tag';
import { useUpdateStockIn } from '@/hooks/mutation/useMutateStockIn';
import useFetchTransactions from '@/hooks/query/useFetchStockIn';
import { Status } from '@/typings/common';
import { TransactionData } from '@/typings/stock-in';
import { formatDate, formatToIDR } from '@/utils/format';

import { Button } from '../Button';
import { TextField } from '../Form';
import Modal from '../Modal';
import Pagination from '../Pagination';

const TableStockIn: React.FC<{ variant: 'pending' | 'all'; withCreateButton?: boolean }> = ({
  variant = 'all',
  withCreateButton,
}) => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const { mutateAsync: updateStockIn } = useUpdateStockIn();

  const getAction = (transaction: TransactionData) => {
    switch (variant) {
      case 'all':
        return (
          <div className="flex">
            <Button variant="secondary" className="mr-2">
              <Pencil width={24} height={24} />
            </Button>
            <DetailStockIn transactions={transaction} />
          </div>
        );
      case 'pending':
        return (
          <div className="flex">
            <Button
              className="mr-2"
              onClick={() =>
                updateStockIn({
                  transactionId: transaction.id,
                  data: {
                    status: 'on-review',
                  },
                })
              }
            >
              <Check width={24} height={24} />
            </Button>
            <DetailStockIn transactions={transaction} />
            <Button variant="outlined" className="ml-2">
              <X
                onClick={() => {
                  updateStockIn({
                    transactionId: transaction.id,
                    data: {
                      status: 'declined',
                    },
                  });
                }}
                width={24}
                height={24}
              />
            </Button>
          </div>
        );
      default:
        return (
          <div className="flex">
            <Button variant="secondary" className="mr-2">
              <Pencil width={24} height={24} />
            </Button>
            <DetailStockIn transactions={transaction} />
          </div>
        );
    }
  };
  const queryVariant =
    variant === 'pending'
      ? {
          where: {
            status: 'pending',
          },
        }
      : {};
  const { data: dataTrasaction } = useFetchTransactions({
    order_by: { created_at: 'desc' },
    forceUrl: paginationUrl,
    ...queryVariant,
  });
  const getTagValue = (status: Status) => {
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
  const {
    data: dataRes = [],
    from,
    to,
    total,
    links,
    next_page_url,
    prev_page_url,
  } = dataTrasaction?.data.transactions ?? {};
  const data = dataRes.map(
    ({ transaction_code, created_at, supplier, payment_method, pic, items, id, status, ...props }) => ({
      col1: transaction_code,
      col2: formatDate(created_at, { withHour: true }),
      col3: supplier.name,
      col4: payment_method,
      col5: formatToIDR(items.reduce((prev, next) => prev + next.pivot.total_price, 0)),
      col6: `${pic.employee.first_name} ${pic.employee.last_name}`,
      col7: (
        <div>
          <Tag variant={status === 'accepted' ? 'primary' : 'secondary'}>{getTagValue(status)}</Tag>
        </div>
      ),
      col8: getAction({ transaction_code, created_at, supplier, payment_method, pic, items, id, status, ...props }),
    })
  );

  const columns = React.useMemo(
    () => [
      {
        Header: 'Kode Transaksi',
        accessor: 'col1', // accessor is the "key" in the data
      },
      {
        Header: 'Tanggal',
        accessor: 'col2',
      },
      {
        Header: 'Supplier',
        accessor: 'col3',
      },
      {
        Header: 'Metode Pembayaran',
        accessor: 'col4',
      },
      {
        Header: 'Pembayaran',
        accessor: 'col5',
      },
      {
        Header: 'Kasir',
        accessor: 'col6',
      },

      {
        Header: 'Status',
        accessor: 'col7',
      },
      {
        Header: 'Aksi',
        accessor: 'col8',
      },
    ],
    []
  );

  return (
    <>
      <Table
        columns={columns}
        data={data}
        search={({ setGlobalFilter }) => (
          <div className="mt-2 mb-6 flex justify-between">
            <h2 className="text-2xl font-bold">{variant === 'pending' ? 'Konfirmasi Stock In' : 'Riwayat Stock In'}</h2>

            {withCreateButton && (
              <>
                <div className="flex">
                  <TextField
                    Icon={<Search />}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    variant="contained"
                    placeholder="Cari nama barang"
                  />
                  <Link href="/stock-in/add">
                    <a>
                      <Button className="ml-3" Icon={<Calculator className="w-4" />}>
                        Tambah
                      </Button>
                    </a>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      />
      <Pagination
        stats={{
          from: `${from ?? '0'}`,
          to: `${to ?? '0'}`,
          total: `${total ?? '0'}`,
        }}
        onClickPageButton={(url) => {
          setPaginationUrl(url);
        }}
        links={links?.filter(({ label }) => !['&laquo; Previous', 'Next &raquo;'].includes(label)) ?? []}
        onClickNext={() => {
          setPaginationUrl(next_page_url ?? '');
        }}
        onClickPrevious={() => {
          setPaginationUrl(prev_page_url ?? '');
        }}
      />
    </>
  );
};

const DetailStockIn: React.FC<{ transactions: TransactionData }> = ({ transactions }) => {
  const [open, setOpen] = React.useState(false);
  const { created_at, invoice_number, transaction_code, payment_method, supplier, pic, status, items } = transactions;
  const data = items.map(({ name, unit, pivot }) => ({
    col1: name,
    col15: unit,
    col2: pivot.quantity,
    col3: pivot.purchase_price,
    col4: pivot.discount,
    col5: pivot.total_price,
  }));
  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama Barang',
        accessor: 'col1', // accessor is the "key" in the data
      },
      {
        Header: 'Unit',
        accessor: 'col15',
      },
      {
        Header: 'Jumlah',
        accessor: 'col2',
      },
      {
        Header: 'Harga',
        accessor: 'col3',
      },
      {
        Header: 'Diskon',
        accessor: 'col4',
      },
      {
        Header: 'Total Harga',
        accessor: 'col5',
      },
    ],
    []
  );
  return (
    <>
      <Button onClick={() => setOpen((open) => !open)}>
        <Eye width={24} height={24} />
      </Button>
      <Modal isOpen={open} onRequestClose={() => setOpen((open) => !open)} variant="big">
        <h2 className="text-2xl font-bold mb-6 mt-2 max">Detail Transaksi Stock In</h2>
        <div className="flex">
          <div className="flex-1">
            <div className="flex justify-between mb-4">
              <h6 className="text-blueGray-600">Tanggal</h6>
              <span>{formatDate(created_at, { withHour: true })}</span>
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
          </div>
          <section className="ml-10 flex-1 p-6 rounded-lg border drop-shadow-lg bg-white" style={{ maxWidth: 228 }}>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Supplier:</span>
              <div>{supplier.name}</div>
            </div>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Kasir:</span>
              <div>{`${pic.employee.first_name} ${pic.employee.last_name}`}</div>
            </div>
            <div className="mb-2">
              <span className="text-blueGray-600 mb-1 block">Status:</span>
              <div>
                <Tag variant={status === 'pending' ? 'secondary' : 'primary'}>
                  {status === 'pending' ? 'Menunggu' : 'Diterima'}
                </Tag>
              </div>
            </div>
          </section>
        </div>
        <div className="mt-8">
          <Table
            columns={columns}
            data={data}
            // search={({ setGlobalFilter }) => (
            //   <div className="mt-2 mb-6 flex justify-between">
            //     <h2 className="text-2xl font-bold">Riwayat Stock In</h2>
            //     <div className="flex">
            //       <TextField
            //         Icon={<Search />}
            //         onChange={(e) => setGlobalFilter(e.target.value)}
            //         variant="contained"
            //         placeholder="Cari nama barang"
            //       />
            //       <Link href="/stock-in/add">
            //         <a>
            //           <Button className="ml-3" Icon={<Calculator className="w-4" />}>
            //             Tambah
            //           </Button>
            //         </a>
            //       </Link>
            //     </div>
            //   </div>
            // )}
          />
        </div>
      </Modal>
    </>
  );
};

export default TableStockIn;
