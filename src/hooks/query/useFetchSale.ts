import { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';

import { BackendRes } from '@/typings/request';
import { SalesResponse, SaleTransactionsData } from '@/typings/sale';
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
    [key: string]: unknown;
  }> = {},
  options?: UseQueryOptions<TQueryFnData, TError, BackendRes<T & SalesResponse>>,
  config?: AxiosRequestConfig
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
      enabled: (options?.enabled ?? true) && (roles?.length ?? 0) > 0,
    }
  );

  return fetcher;
};

/**
 * Satu transaksi, lengkap dengan barang dan pembayarannya.
 *
 * Bentuk responsnya `{ transaction }` — SATU transaksi — bukan `{ transactions }` yang
 * berhalaman seperti endpoint daftarnya. Tipe lamanya menjanjikan yang kedua, jadi tiap
 * pemakai harus meng-cast dan kehilangan pemeriksaan tipe di titik yang paling butuh.
 */
export const useFetchSaleById = <TQueryFnData = unknown, TError = unknown>(
  id: string,
  options?: UseQueryOptions<TQueryFnData, TError, BackendRes<{ transaction: SaleTransactionsData }>>
): UseQueryResult<BackendRes<{ transaction: SaleTransactionsData }>> => {
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
