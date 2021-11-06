import { UseQueryResult } from 'react-query';

import { ItemResponse, ItemsResponse } from '@/typings/item';
import { BackendRes } from '@/typings/request';
import { apiInstanceAdmin, apiInstanceWithoutBaseUrl } from '@/utils/api';

import useMyQuery from './useMyQuery';

const useFetchItemById = (id: string): UseQueryResult<BackendRes<ItemResponse>> => {
  const fetcher = useMyQuery(['itemById', id], async () => {
    const res = await apiInstanceAdmin().get(`/items/${id}`);
    return res.data;
  });

  return fetcher;
};

const useFetchItems = (
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    order_by: Record<string, string>;
  }> = {}
): UseQueryResult<BackendRes<ItemsResponse>> => {
  const fetcher = useMyQuery(['employee', data], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl)
      : await apiInstanceAdmin().post('/items', data);
    return res.data;
  });

  return fetcher;
};

export { useFetchItemById, useFetchItems };
