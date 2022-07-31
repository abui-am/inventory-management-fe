/* eslint-disable camelcase */
import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient, UseQueryOptions, UseQueryResult } from 'react-query';

import {
  CreateEmployeePutBody,
  EmployeeDetailRes,
  EmployeeRes,
  EmployeeUnpaginatedRes,
  UserRes,
} from '@/typings/employee';
import { BackendRes, BackendResError } from '@/typings/request';
import { apiInstanceAdmin, apiInstanceGeneral, apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import useMyQuery from './useMyQuery';

const useFetchEmployee = (
  data: Partial<{
    forceUrl: string;
    per_page: number;
    search: string;
    order_by: Record<string, string>;
    where: Record<string, string>;
  }> = {}
): UseQueryResult<BackendRes<EmployeeRes>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name) ?? [];
  const fetcher = useMyQuery(['employee', data, roles], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, data)
      : await getApiBasedOnRoles(roles, ['superadmin', 'admin']).post('/employees', data);
    return res.data;
  });

  return fetcher;
};

const useFetchUnpaginatedEmployee = (
  data: Partial<{
    forceUrl: string;
    per_page: number;
    search: string;
    order_by: Record<string, string>;
    where: Record<string, string>;
  }> = {}
): UseQueryResult<BackendRes<EmployeeUnpaginatedRes>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name) ?? [];
  const fetcher = useMyQuery(['employee', data, roles], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, { ...data, paginated: false })
      : await getApiBasedOnRoles(roles, ['superadmin', 'admin']).post('/employees', { ...data, paginated: false });
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
  const mutator = useMutation(
    ['createEmployee'],
    async (data: CreateEmployeePutBody) => {
      try {
        const res = await apiInstanceAdmin().put<CreateEmployeePutBody, AxiosResponse<BackendRes<unknown>>>(
          '/employees',
          data
        );
        return res.data;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );

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

const useFetchMyself = (
  options?: UseQueryOptions<unknown, unknown, BackendRes<UserRes>>
): UseQueryResult<BackendRes<UserRes>> => {
  const fetcher = useMyQuery(
    ['myself'],
    async () => {
      const res = await apiInstanceGeneral().post('/auth/self');
      return res.data;
    },
    {
      staleTime: Infinity,
      ...options,
    }
  );

  return fetcher;
};

export default useFetchEmployee;
export { useCreateEmployee, useEditEmployee, useFetchEmployeeById, useFetchMyself, useFetchUnpaginatedEmployee };
