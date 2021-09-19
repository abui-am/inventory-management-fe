import { UseQueryResult } from 'react-query';

import { BackendRes } from '@/typings/request';
import { SuppliersResponse } from '@/typings/supplier';
import { apiInstanceAdmin, apiInstanceWithoutBaseUrl } from '@/utils/api';

import useMyQuery from './useMyQuery';

const useFetchSuppliers = (
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    order_by: Record<string, string>;
  }> = {}
): UseQueryResult<BackendRes<SuppliersResponse>> => {
  const fetcher = useMyQuery(['suppliers', data], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl)
      : await apiInstanceAdmin().post('/suppliers', data);
    return res.data;
  });

  return fetcher;
};

export { useFetchSuppliers };
