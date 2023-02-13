import { UseQueryResult } from 'react-query';

import { GetLedgersResponse, GetLedgersResponseUnpaginated } from '@/typings/ledgers';
import { BackendRes } from '@/typings/request';
import { apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

export type UseFetchLedgerProps = {
  forceUrl: string;
  paginated: boolean;
  per_page: number;
  search: string;
  order_by: Record<string, string>;
  where: Record<string, string>;
  where_greater_equal: Record<string, any>;
  where_lower_equal: Record<string, any>;
};

export const useFetchLedgers = (
  data: Partial<UseFetchLedgerProps> = {}
): UseQueryResult<BackendRes<GetLedgersResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name) ?? [];
  const fetcher = useMyQuery([keys.ledgers, data, roles], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, data)
      : await getApiBasedOnRoles(roles, ['superadmin']).post('/ledgers', data);
    return res.data;
  });

  return fetcher;
};

export const useFetchUnpaginatedLedgers = (
  data: Partial<UseFetchLedgerProps> = {}
): UseQueryResult<BackendRes<GetLedgersResponseUnpaginated>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name) ?? [];
  const fetcher = useMyQuery([keys.ledgers, 'unpaginated', data, roles], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, data)
      : await getApiBasedOnRoles(roles, ['superadmin']).post('/ledgers', { ...data, paginated: false });
    return res.data;
  });

  return fetcher;
};
