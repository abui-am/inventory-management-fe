import { UseQueryOptions, UseQueryResult } from 'react-query';

import { IncomeReport } from '@/typings/income-report';
import { BackendRes } from '@/typings/request';
import { apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

export const useFetchIncomeReport = <TQueryFnData = unknown, TError = unknown>(
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    trashed: string;
    order_by: Record<string, string>;
    date_start: string;
    date_end: string;
    where: Record<string, unknown>;
  }> = {},
  options?: UseQueryOptions<TQueryFnData, TError, BackendRes<IncomeReport>>
): UseQueryResult<BackendRes<IncomeReport>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(
    [keys.incomeReport, data, roles],
    async () => {
      const res = data.forceUrl
        ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, data)
        : await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).post('/income-report', data);
      return res.data;
    },
    { ...options, enabled: !!roles }
  );

  return fetcher;
};
