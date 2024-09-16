import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Eye, Pencil, PlusLg, Search } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { SelectSortBy, SelectSortType, TextField } from '@/components/Form';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { SORT_TYPE_OPTIONS, SUPPLIER_SORT_BY_OPTIONS } from '@/constants/options';
import { useFetchSupplierById, useFetchSuppliers } from '@/hooks/query/useFetchSupplier';
import { Option } from '@/typings/common';
import formatCurrency from '@/utils/formatCurrency';

const Supplier: NextPage<unknown> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paginationUrl, setPaginationUrl] = useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(SUPPLIER_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[0]);

  const { data: dataSupplier } = useFetchSuppliers({
    search: searchQuery,
    order_by: sortBy?.data?.reduce((previousValue, currentValue) => {
      return { ...previousValue, [currentValue]: sortType?.value };
    }, {}),
    paginated: true,
    forceUrl: paginationUrl || undefined,
  });

  const {
    data: dataRes = [],
    prev_page_url,
    next_page_url,
    links,
    from,
    to,
    total,
  } = dataSupplier?.data?.suppliers ?? {};
  const { push } = useRouter();
  const [id, setId] = useState<string | null>(null);
  const data = dataRes.map(({ address, phone_number, name, total_receivable, id }) => ({
    name: `${name ?? ''}`,
    phoneNumber: phone_number && `+${phone_number}`,
    totalCompanyDebt: total_receivable ? formatCurrency({ value: total_receivable }) : '-',
    address,
    action: (
      <div className="flex">
        <Button
          size="small"
          onClick={() => {
            setId(id);
          }}
        >
          <Eye width={24} height={24} />
        </Button>
        <Button size="small" variant="secondary" className="ml-2" onClick={() => push(`/supplier/${id}/edit`)}>
          <Pencil width={24} height={24} />
        </Button>
      </div>
    ),
  }));

  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama Supplier',
        accessor: 'name', // accessor is the "key" in the data
      },
      {
        Header: 'Address',
        accessor: 'address', // accessor is the "key" in the data
      },
      {
        Header: 'Nomor HP',
        accessor: 'phoneNumber', // accessor is the "key" in the data
      },
      {
        Header: 'Total utang',
        accessor: 'totalCompanyDebt', // accessor is the "key" in the data
      },
      {
        Header: 'Aksi',
        accessor: 'action',
      },
    ],
    []
  );
  return (
    <CardDashboard>
      <ShowModal
        supplierId={id ?? ''}
        handleClose={() => {
          setId(null);
        }}
      />

      <div className="mt-2 mb-4 justify-between sm:flex">
        <h2 className="text-2xl font-bold mb-6 sm:mb-0">Daftar Supplier</h2>
        <div className="flex flex-col items-end">
          <div className="flex">
            <div className="mr-4 mb-4">
              <TextField
                Icon={<Search />}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="contained"
                placeholder="Cari nama supplier"
              />
            </div>
            <Link href="/supplier/add">
              <span>
                <Button className="mb-4" Icon={<PlusLg className="w-4" />}>
                  Tambah
                </Button>
              </span>
            </Link>
          </div>
          <div className="flex flex-wrap justify-end -mr-4 -mb-4">
            <SelectSortBy
              options={SUPPLIER_SORT_BY_OPTIONS}
              value={sortBy}
              onChange={(val) => {
                setSortBy(val as Option<string[]>);
              }}
            />
            <SelectSortType
              value={sortType}
              onChange={(val) => {
                setSortType(val as Option);
              }}
            />
          </div>
        </div>
      </div>

      <Table columns={columns} data={data} />
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
    </CardDashboard>
  );
};

const ShowModal = ({ supplierId, handleClose }: { supplierId: string; handleClose: () => void }) => {
  const isOpen = !!supplierId;
  const { data } = useFetchSupplierById(supplierId, {
    enabled: isOpen,
  });
  const supplier = data?.data?.supplier;

  return (
    <>
      <Modal isOpen={isOpen} onRequestClose={handleClose}>
        <h2 className="text-2xl font-bold mb-6 mt-2 max">Detail Supplier</h2>
        <div className="mb-2">
          <span className="text-blueGray-600 mb-1 block">Supplier:</span>
          <div>{supplier?.name}</div>
        </div>
        <div className="mb-2">
          <span className="text-blueGray-600 mb-1 block">Nomor HP:</span>
          <div>{supplier?.phone_number}</div>
        </div>
        <div className="mb-2">
          <span className="text-blueGray-600 mb-1 block">Alamat:</span>
          <div>{supplier?.address}</div>
        </div>
      </Modal>
    </>
  );
};
export default Supplier;
