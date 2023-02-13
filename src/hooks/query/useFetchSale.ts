import { UseQueryOptions, UseQueryResult } from 'react-query';

import { BackendRes } from '@/typings/request';
import { SalesResponse } from '@/typings/sale';
import { apiInstanceAdmin, apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

const useFetchSales = <T, TQueryFnData = unknown, TError = unknown>(
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    order_by: Record<string, string>;
    where: Record<string, unknown>;
    [key: string]: any;
  }> = {},
  options?: UseQueryOptions<TQueryFnData, TError, BackendRes<T & SalesResponse>>,
  config?: any
): UseQueryResult<BackendRes<T & SalesResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(
    [keys.sales, data, roles],
    async () => {
      const res = data.forceUrl
        ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, {
            ...data,
            where: {
              ...data.where,
              transactionable_type: 'customers',
            },
          })
        : await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).post(
            '/transactions',
            {
              ...data,
              where: {
                ...data.where,
                transactionable_type: 'customers',
              },
            },
            config
          );
      return res.data;
    },
    {
      ...options,
      enabled: (roles?.length ?? 0) > 0,
    }
  );

  return fetcher;
};

export const useFetchSaleById = <TQueryFnData = unknown, TError = unknown>(
  id: string,
  options?: UseQueryOptions<TQueryFnData, TError, BackendRes<SalesResponse>>
): UseQueryResult<BackendRes<SalesResponse>> => {
  const fetcher = useMyQuery(
    [keys.sales, 'byId', id],
    async () => {
      const res = await apiInstanceAdmin().get(`/transactions/${id}`);
      return res.data;
    },
    options
  );

  return fetcher;
};

export default useFetchSales;
