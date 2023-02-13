import { UseQueryOptions, UseQueryResult } from 'react-query';

import { ItemResponse, ItemsResponse } from '@/typings/item';
import { BackendRes } from '@/typings/request';
import { apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

const useFetchItemById = (id: string): UseQueryResult<BackendRes<ItemResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(
    [keys.items, 'byId', id, roles],
    async () => {
      const res = await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin', 'warehouse-admin']).get(`/items/${id}`);
      return res.data;
    },
    {
      enabled: !!id,
    }
  );

  return fetcher;
};

const useFetchItems = <TQueryFnData = unknown, TError = unknown>(
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    trashed: string;
    order_by: Record<string, string>;
    where: Record<string, unknown>;
    where_greater_equal: Record<string, unknown>;
  }> = {},
  options?: UseQueryOptions<TQueryFnData, TError, BackendRes<ItemsResponse>>
): UseQueryResult<BackendRes<ItemsResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(
    [keys.items, data, roles],
    async () => {
      const res = data.forceUrl
        ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, data)
        : await getApiBasedOnRoles(roles ?? [], ['superadmin', 'warehouse-admin', 'admin']).post('/items', data);
      return res.data;
    },
    options
  );

  return fetcher;
};

export { useFetchItemById, useFetchItems };
