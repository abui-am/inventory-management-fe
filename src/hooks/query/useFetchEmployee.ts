/* eslint-disable camelcase */
import { useMutation, UseMutationResult, UseQueryResult } from 'react-query';

import { EmployeeDetailRes, EmployeeRes } from '@/typings/employee';
import { BackendRes } from '@/typings/request';
import apiInstance, { apiInstanceAdmin } from '@/utils/api';

import useMyQuery from './useMyQuery';

const useFetchEmployee = (
  data: Partial<{ paginated: boolean; per_page: number }> = {}
): UseQueryResult<BackendRes<EmployeeRes>> => {
  const fetcher = useMyQuery(['employee', data], async () => {
    const res = await apiInstanceAdmin().post('/employees', data);
    return res.data;
  });

  return fetcher;
};

const useFetchEmployeeById = (id: string): UseQueryResult<BackendRes<EmployeeDetailRes>> => {
  const fetcher = useMyQuery(['employee', id], async () => {
    const res = await apiInstanceAdmin().get(`/employees/${id}`);
    return res.data;
  });

  return fetcher;
};

const useCreateEmployee = (): UseMutationResult<
  Omit<BackendRes<unknown>, 'data'>,
  unknown,
  Record<string, unknown>,
  unknown
> => {
  const mutator = useMutation<>(['createEmplotee'], async (data: Record<string, unknown>) => {
    const res = await apiInstance().put('/employees', data);
    return res.data;
  });

  return mutator;
};

export default useFetchEmployee;
export { useCreateEmployee, useFetchEmployeeById };
