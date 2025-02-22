import { NextPage } from 'next';
import React, { useState } from 'react';
import { Eye, Pencil, Search } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { SelectSortBy, SelectSortType, TextField } from '@/components/Form';
import CreateCustomerForm from '@/components/form/CreateCustomerForm';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { CUSTOMER_SORT_BY_OPTIONS, PER_PAGE_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import { useFetchCustomerById, useFetchCustomers } from '@/hooks/query/useFetchCustomer';
import { Option } from '@/typings/common';
import formatCurrency from '@/utils/formatCurrency';

const Customer: NextPage<unknown> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paginationUrl, setPaginationUrl] = useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(CUSTOMER_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[0]);
  const [perPage, setPerPage] = useState<Option | null>(PER_PAGE_OPTIONS[1]);

  const { data: dataCustomer } = useFetchCustomers({
    search: searchQuery,
    order_by: sortBy?.data?.reduce((previousValue, currentValue) => {
      return { ...previousValue, [currentValue]: sortType?.value };
    }, {}),
    paginated: true,
    per_page: +(perPage?.value || PER_PAGE_OPTIONS[1].value),
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
  } = dataCustomer?.data?.customers ?? {};
  const [id, setId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const data = dataRes.map(({ address, phone_number, total_debt, full_name, id }) => ({
    name: `${full_name ?? ''}`,
    phoneNumber: phone_number && `+${phone_number}`,
    totalCompanyReceivable: total_debt ? formatCurrency({ value: total_debt }) : '-',
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
        <Button
          size="small"
          variant="secondary"
          onClick={() => {
            setEditId(id);
          }}
          className="ml-2"
        >
          <Pencil width={24} height={24} />
        </Button>
      </div>
    ),
  }));

  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama Customer',
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
        Header: 'Total piutang',
        accessor: 'totalCompanyReceivable', // accessor is the "key" in the data
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
        customerId={id ?? ''}
        handleClose={() => {
          setId(null);
        }}
      />

      {editId && (
        <EditCustomerModal
          editId={editId}
          handleClose={() => {
            setEditId(null);
          }}
        />
      )}
      <div className="mt-2 mb-4 justify-between sm:flex">
        <h2 className="text-2xl font-bold mb-6 sm:mb-0">Daftar Customer</h2>
        <div className="flex flex-col items-end">
          <div className="flex">
            <div className="mb-4">
              <TextField
                Icon={<Search />}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="contained"
                placeholder="Cari nama Customer"
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-end -mr-4 -mb-4">
            <SelectSortBy
              options={CUSTOMER_SORT_BY_OPTIONS}
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
        onChangePerPage={(val) => {
          setPerPage(val);
        }}
      />
    </CardDashboard>
  );
};

const ShowModal = ({ customerId, handleClose }: { customerId: string; handleClose: () => void }) => {
  const isOpen = !!customerId;
  const { data } = useFetchCustomerById(customerId, {
    enabled: isOpen,
  });
  const customer = data?.data?.customer;

  return (
    <>
      <Modal isOpen={isOpen} onRequestClose={handleClose}>
        <h2 className="text-2xl font-bold mb-6 mt-2 max">Detail Customer</h2>
        <div className="mb-2">
          <span className="text-blueGray-600 mb-1 block">Customer:</span>
          <div>{customer?.full_name}</div>
        </div>
        <div className="mb-2">
          <span className="text-blueGray-600 mb-1 block">Nomor HP:</span>
          <div>{customer?.phone_number}</div>
        </div>
        <div className="mb-2">
          <span className="text-blueGray-600 mb-1 block">Alamat:</span>
          <div>{customer?.address}</div>
        </div>
      </Modal>
    </>
  );
};

const EditCustomerModal = ({ editId, handleClose }: { editId: string; handleClose: () => void }) => {
  const { data, isLoading } = useFetchCustomerById(editId);
  const customer = data?.data?.customer;
  return (
    <Modal isOpen={!!editId} onRequestClose={handleClose}>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <CreateCustomerForm
          initialValues={{
            address: customer?.address ?? '',
            fullName: customer?.full_name ?? '',
            phoneNumber: customer?.phone_number ?? '',
          }}
          onClose={handleClose}
          onSave={handleClose}
          customerId={editId}
        />
      )}
    </Modal>
  );
};
export default Customer;
