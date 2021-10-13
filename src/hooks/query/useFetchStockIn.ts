import { UseQueryResult } from 'react-query';

import { BackendRes } from '@/typings/request';
import { TransactionsResponse } from '@/typings/stock-in';
import { apiInstanceAdmin, apiInstanceWithoutBaseUrl } from '@/utils/api';

import useMyQuery from './useMyQuery';

const useFetchTransactions = (
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    order_by: Record<string, string>;
  }> = {}
): UseQueryResult<BackendRes<TransactionsResponse>> => {
  const fetcher = useMyQuery(['transactions', data], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl)
      : await apiInstanceAdmin().post('/transactions', data);
    return res.data;
  });

  return fetcher;
};

export default useFetchTransactions;
