import { UseQueryResult } from 'react-query';

import { DebtResponse } from '@/typings/debts';
import { BackendRes } from '@/typings/request';
import { apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

export const useFetchDebt = (
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    order_by: Record<string, string>;
    where: Record<string, string>;
    where_greater_equal: Record<string, string>;
    where_lower_equal: Record<string, string>;
  }> = {}
): UseQueryResult<BackendRes<DebtResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name) ?? [];

  const fetcher = useMyQuery([keys.debts, data, roles], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, data)
      : await getApiBasedOnRoles(roles, ['superadmin']).post('/debts', data);
    return res.data;
  });

  return fetcher;
};
