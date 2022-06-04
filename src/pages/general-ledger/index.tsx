import dayjs from 'dayjs';
import { useState } from 'react';

import { CardDashboard } from '@/components/Container';
import { DateRangePicker } from '@/components/Form';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { useFetchLedgers } from '@/hooks/query/useFetchLedgers';
import { useGeneralLedger } from '@/hooks/table/useGeneralLedger';
import { formatDateYYYYMMDDHHmmss } from '@/utils/format';

const AuditPage = () => {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [paginationUrl, setPaginationUrl] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const { data: resLedgers } = useFetchLedgers({
    order_by: {
      created_at: 'desc',
      type: 'desc',
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

  const { columns, data = [] } = useGeneralLedger(dataLedger);

  return (
    <div>
      <section>
        <CardDashboard>
          <Table
            withoutStripe
            search={() => (
              <div className="mt-2 mb-4 flex justify-between">
                <h2 className="text-2xl font-bold">Jurnal Umum</h2>
                <div className="flex flex-col items-end">
                  <div className="flex flex-wrap mb-4">
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
