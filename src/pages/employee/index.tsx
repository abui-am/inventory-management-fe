import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Eye, Pencil, PlusLg, Search, SortAlphaDownAlt, SortDown } from 'react-bootstrap-icons';
import { CommonProps, components, GroupTypeBase, OptionTypeBase } from 'react-select';
import { Option } from 'react-select/src/filters';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { TextField, ThemedSelect } from '@/components/Form';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { EMPLOYEE_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import useFetchEmployee from '@/hooks/query/useFetchEmployee';

const ValueContainer: React.FC<CommonProps<OptionTypeBase, boolean, GroupTypeBase<OptionTypeBase>>> = ({
  children,
  ...props
}) => {
  return (
    components.ValueContainer && (
      <components.ValueContainer {...props}>
        {!!children && <SortDown className="absolute left-3 opacity-80" />}
        {children}
      </components.ValueContainer>
    )
  );
};

const ValueContainerSortBy: React.FC<CommonProps<OptionTypeBase, boolean, GroupTypeBase<OptionTypeBase>>> = ({
  children,
  ...props
}) => {
  return (
    components.ValueContainer && (
      <components.ValueContainer {...props}>
        {!!children && <SortAlphaDownAlt className="absolute left-3 opacity-80" />}
        {children}
      </components.ValueContainer>
    )
  );
};

const Home: NextPage<unknown> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paginationUrl, setPaginationUrl] = useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(EMPLOYEE_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[0]);

  const { data: dataEmployee } = useFetchEmployee({
    search: searchQuery,
    order_by: sortBy?.data?.reduce((previousValue, currentValue) => {
      return { ...previousValue, [currentValue]: sortType?.value };
    }, {}),
    paginated: true,
    forceUrl: paginationUrl || undefined,
  });

  const styles = {
    valueContainer: (base: Record<string, unknown>) => ({
      ...base,
      paddingLeft: 32,
    }),
  };

  const {
    data: dataRes = [],
    prev_page_url,
    next_page_url,
    links,
    from,
    to,
    total,
  } = dataEmployee?.data?.employees ?? {};
  const { push } = useRouter();
  const data = dataRes.map(({ first_name, last_name, position, id, has_dashboard_account }) => ({
    col1: `${first_name ?? ''} ${last_name ?? ''}`,
    col2: position,
    col3: has_dashboard_account ? (
      <span className="text-blue-600 bold">Aktif</span>
    ) : (
      <span className="bold">Tidak Aktif</span>
    ),
    col4: (
      <div className="flex">
        <Link href={`/employee/${id}`}>
          <a>
            <Button>
              <Eye width={24} height={24} />
            </Button>
          </a>
        </Link>
        <Button variant="secondary" onClick={() => push(`/employee/${id}/edit`)}>
          <Pencil width={24} height={24} />
        </Button>
      </div>
    ),
  }));

  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama Karyawan',
        accessor: 'col1', // accessor is the "key" in the data
      },
      {
        Header: 'Jabatan',
        accessor: 'col2',
      },
      {
        Header: 'Akun Dashboard',
        accessor: 'col3',
      },
      {
        Header: 'Aksi',
        accessor: 'col4',
      },
    ],
    []
  );
  return (
    <CardDashboard>
      <div className="mt-2 mb-6 justify-between sm:flex">
        <h2 className="text-2xl font-bold mb-6 sm:mb-0">Daftar Karyawan</h2>
        <div className="flex sm:flex-row flex-col-reverse">
          <div className="flex flex-wrap">
            <ThemedSelect
              variant="outlined"
              additionalStyle={styles}
              components={{ ValueContainer }}
              className="w-full sm:w-72 sm:mr-4 mb-4"
              options={EMPLOYEE_SORT_BY_OPTIONS}
              value={sortBy}
              onChange={(val) => {
                setSortBy(val as Option<string[]>);
              }}
            />
            <ThemedSelect
              variant="outlined"
              additionalStyle={styles}
              components={{ ValueContainer: ValueContainerSortBy }}
              className="w-full sm:w-48 sm:mr-4 mb-4"
              value={sortType}
              options={SORT_TYPE_OPTIONS}
              onChange={(val) => {
                setSortType(val as Option);
              }}
            />
          </div>

          <div className="flex">
            <div className="mr-4 mb-4">
              <TextField
                Icon={<Search />}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="contained"
                placeholder="Cari nama karyawan"
              />
            </div>
            <Link href="/employee/add">
              <a>
                <Button className="mb-4" Icon={<PlusLg className="w-4" />}>
                  Tambah
                </Button>
              </a>
            </Link>
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

export default Home;
