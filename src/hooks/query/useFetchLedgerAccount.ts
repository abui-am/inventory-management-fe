import { UseQueryResult } from 'react-query';

import { GetLedgerAccountsResponse } from '@/typings/ledger-accounts';
import { BackendRes } from '@/typings/request';
import { apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

export const useFetchLedgerAccounts = (
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    where_greater_equal: Record<string, string>;
    where_lower_equal: Record<string, string>;
  }> = {}
): UseQueryResult<BackendRes<GetLedgerAccountsResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name) ?? [];
  const fetcher = useMyQuery(['ledger-accounts', data, roles], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, data)
      : await getApiBasedOnRoles(roles, ['superadmin']).post('/ledger-accounts', data);
    return res.data;
  });

  return fetcher;
};
