import { UseQueryResult } from 'react-query';

import { BackendRes, EmployeeRes } from '@/typings/request';
import apiInstance from '@/utils/api';

import useMyQuery from './useMyQuery';

const useFetchEmployee = (
  params: Partial<{ paginated: boolean; per_page: number }> = {}
): UseQueryResult<BackendRes<EmployeeRes>> => {
  const fetcher = useMyQuery(['employee', params], async () => {
    const res = await apiInstance().post('/employees', { params });
    return res.data;
  });

  return fetcher;
};

export default useFetchEmployee;
