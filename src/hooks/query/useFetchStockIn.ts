import { UseQueryOptions, UseQueryResult } from 'react-query';

import { BackendRes } from '@/typings/request';
import { TransactionResponse, TransactionsResponse } from '@/typings/stock-in';
import { apiInstanceAdmin, apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import { useFetchMyself } from './useFetchEmployee';
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
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(
    ['transactions', data, roles],
    async () => {
      const res = data.forceUrl
        ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, {
            ...data,
            where: {
              ...data.where,
              transactionable_type: 'suppliers',
            },
          })
        : await getApiBasedOnRoles(roles ?? [], ['superadmin', 'warehouse-admin']).post('/transactions', {
            ...data,
            where: {
              ...data.where,
              transactionable_type: 'suppliers',
            },
          });
      return res.data;
    },
    options
  );

  return fetcher;
};

export const useFetchTransactionById = <TQueryFnData = unknown, TError = unknown>(
  id: string,
  options?: UseQueryOptions<TQueryFnData, TError, BackendRes<TransactionResponse>>
): UseQueryResult<BackendRes<TransactionResponse>> => {
  const fetcher = useMyQuery(
    ['transaction', id],
    async () => {
      const res = await apiInstanceAdmin().get(`/transactions/${id}`);
      return res.data;
    },
    options
  );

  return fetcher;
};

export default useFetchTransactions;
