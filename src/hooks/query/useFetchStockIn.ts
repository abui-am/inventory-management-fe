import { UseQueryOptions, UseQueryResult } from 'react-query';

import { BackendRes } from '@/typings/request';
import { TransactionsResponse } from '@/typings/stock-in';
import { apiInstanceAdmin, apiInstanceWithoutBaseUrl } from '@/utils/api';

import useMyQuery from './useMyQuery';

const useFetchTransactions = <TQueryFnData = unknown, TError = unknown>(
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    order_by: Record<string, string>;
    where: Record<string, unknown>;
  }> = {},
  options?: UseQueryOptions<TQueryFnData, TError, BackendRes<TransactionsResponse>>
): UseQueryResult<BackendRes<TransactionsResponse>> => {
  const fetcher = useMyQuery(
    ['transactions', data],
    async () => {
      const res = data.forceUrl
        ? await apiInstanceWithoutBaseUrl().post(data.forceUrl)
        : await apiInstanceAdmin().post('/transactions', data);
      return res.data;
    },
    options
  );

  return fetcher;
};

export default useFetchTransactions;
