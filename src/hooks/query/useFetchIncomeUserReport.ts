import { UseQueryOptions, UseQueryResult } from 'react-query';

import { IncomeUserReport } from '@/typings/income-report';
import { BackendRes } from '@/typings/request';
import { getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

export const useFetchIncomeUserReport = <TQueryFnData = unknown, TError = unknown>(
  data: Partial<{
    date_start: string;
    date_end: string;
    type: 'income' | 'expense' | 'stock_in';
    user_ids: string[];
  }> = {},
  options?: UseQueryOptions<TQueryFnData, TError, BackendRes<IncomeUserReport>>
): UseQueryResult<BackendRes<IncomeUserReport>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(
    [keys.incomeReport, 'user-report', data, roles],
    async () => {
      const res = await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).post(
        '/income-report/user-report',
        data
      );
      return res.data;
    },
    { ...options, enabled: !!roles }
  );

  return fetcher;
};
