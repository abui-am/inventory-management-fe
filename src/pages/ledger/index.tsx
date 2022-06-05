import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

import { CardDashboard } from '@/components/Container';
import { DateRangePicker, ThemedSelect } from '@/components/Form';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { useFetchUnpaginatedLedgerAccounts } from '@/hooks/query/useFetchLedgerAccount';
import { useFetchLedgers } from '@/hooks/query/useFetchLedgers';
import { useLedger } from '@/hooks/table/useLedger';
import { Option } from '@/typings/common';
import { formatDateYYYYMMDDHHmmss, formatToIDR } from '@/utils/format';

const AuditPage = () => {
  const [fromDate, setFromDate] = React.useState(new Date());
  const [toDate, setToDate] = React.useState(new Date());
  const { data: dataResLedger, isFetching } = useFetchUnpaginatedLedgerAccounts();
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [pageSize, setPageSize] = useState(10);
  const [type, setType] = useState<Option<any> | null>();
  const typeOptions =
    dataResLedger?.data?.ledger_accounts.map?.(({ name, id, ...props }) => ({
      label: name,
      value: id,
      data: props,
    })) ?? [];

  const { data: resLedgers } = useFetchLedgers({
    order_by: {
      created_at: 'desc',
      type: 'desc',
    },
    where: {
      description: type?.label ?? '',
    },
    where_greater_equal: {
      created_at: formatDateYYYYMMDDHHmmss(dayjs(fromDate).startOf('day')) ?? '',
    },
    where_lower_equal: {
      created_at: formatDateYYYYMMDDHHmmss(dayjs(toDate).endOf('day')) ?? '',
    },
    forceUrl: paginationUrl,
    per_page: pageSize,
  });

  const {
    data: dataLedger = [],
    from,
    to,
    total,
    links,
    next_page_url,
    last_page_url,
    prev_page_url,
  } = resLedgers?.data?.ledgers ?? {};

  const { columns, data = [] } = useLedger(dataLedger);

  useEffect(() => {
    if (dataResLedger) {
      const defaultType = localStorage?.getItem('ledger-type');

      if (!defaultType) {
        setType(typeOptions[0]);
      } else {
        setType(typeOptions?.filter(({ value }) => defaultType === value)?.[0]);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetching]);

  useEffect(() => {
    if (type) {
      localStorage?.setItem('ledger-type', type?.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  return (
    <div>
      <section>
        <CardDashboard>
          <Table
            withoutStripe
            search={() => (
              <div className="mt-2 mb-4 flex justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Buku Besar</h2>
                  <span className="text-xl font-bold">Saldo : {formatToIDR(type?.data?.balance ?? 0)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex flex-wrap mb-4 gap-4">
                    {typeOptions?.length > 1 && (
                      <ThemedSelect
                        value={type}
                        onChange={(val: any) => {
                          setType(val);
                        }}
                        options={typeOptions}
                        className="w-52"
                      />
                    )}

                    <DateRangePicker
                      values={[fromDate, toDate]}
                      onChangeFrom={(date) => {
                        setFromDate(date);
                      }}
                      onChangeTo={(date) => {
                        setToDate(date);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            columns={columns}
            data={data}
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
            onClickGoToPage={(val) => {
              setPaginationUrl(`${(last_page_url as string).split('?')[0]}?page=${val}`);
            }}
            onChangePerPage={(page) => {
              setPaginationUrl('');
              setPageSize(page?.value ?? 0);
            }}
          />
        </CardDashboard>
      </section>
    </div>
  );
};

export default AuditPage;
