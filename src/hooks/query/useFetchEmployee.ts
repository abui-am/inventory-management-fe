/* eslint-disable camelcase */
import { useMutation, UseMutationResult, useQueryClient, UseQueryOptions, UseQueryResult } from 'react-query';

import { CreateEmployeePutBody, EmployeeDetailRes, EmployeeRes } from '@/typings/employee';
import { BackendRes } from '@/typings/request';
import { apiInstanceAdmin } from '@/utils/api';

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

const useFetchEmployeeById = (
  id: string,
  options?: UseQueryOptions<unknown, unknown, BackendRes<EmployeeDetailRes>>
): UseQueryResult<BackendRes<EmployeeDetailRes>> => {
  const fetcher = useMyQuery(
    ['employee', id],
    async () => {
      const res = await apiInstanceAdmin().get(`/employees/${id}`);
      return res.data;
    },
    options
  );

  return fetcher;
};

const useCreateEmployee = (): UseMutationResult<
  Omit<BackendRes<unknown>, 'data'>,
  unknown,
  CreateEmployeePutBody,
  unknown
> => {
  const mutator = useMutation(['createEmployee'], async (data: CreateEmployeePutBody) => {
    const res = await apiInstanceAdmin().put('/employees', data);
    return res.data;
  });

  return mutator;
};

const useEditEmployee = (
  editId: string
): UseMutationResult<Omit<BackendRes<unknown>, 'data'>, unknown, CreateEmployeePutBody, unknown> => {
  const query = useQueryClient();

  const mutator = useMutation(['editEmployee', editId], async (data: CreateEmployeePutBody) => {
    const res = await apiInstanceAdmin().patch(`/employees/${editId}`, data);
    query.invalidateQueries(['employee']);
    return res.data;
  });

  return mutator;
};

export default useFetchEmployee;
export { useCreateEmployee, useEditEmployee, useFetchEmployeeById };
