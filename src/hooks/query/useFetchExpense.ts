import { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

import { ExpenseNamesResponse, ExpensesResponse } from '@/typings/expense';
import { BackendRes } from '@/typings/request';
import { apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

export const useFetchExpense = <TQueryFnData = unknown, TError = unknown>(
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    trashed: string;
    order_by: Record<string, string>;
    where: Record<string, unknown>;
  }> = {},
  options?: UseQueryOptions<TQueryFnData, TError, BackendRes<ExpensesResponse>>
): UseQueryResult<BackendRes<ExpensesResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(
    [keys.expenses, data, roles],
    async () => {
      const res = data.forceUrl
        ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, data)
        : await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).post('/expenses', data);
      return res.data;
    },
    { ...options, enabled: (options?.enabled ?? true) && (roles?.length ?? 0) > 0 }
  );

  return fetcher;
};

/**
 * Nama beban yang pernah dipakai — `POST /expenses/names` mengembalikan daftar nama
 * unik. Dipakai sebagai saran di dialog "Catat beban" supaya nama yang sama tidak
 * ditulis dengan tiga ejaan berbeda dan pengelompokannya di laporan pecah.
 */
export const useFetchExpenseNames = (): UseQueryResult<BackendRes<ExpenseNamesResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);

  return useMyQuery(
    [keys.expenses, 'names', roles],
    async () => {
      const res = await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).post('/expenses/names', {
        paginated: false,
      });
      return res.data;
    },
    { enabled: (roles?.length ?? 0) > 0 }
  );
};
