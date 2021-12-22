import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient, UseQueryOptions, UseQueryResult } from 'react-query';

import { BackendRes, BackendResError } from '@/typings/request';
import {
  CreateSupplierBody,
  CreateSupplierResponse,
  SupplierDetailResponse,
  SuppliersResponse,
} from '@/typings/supplier';
import { apiInstanceAdmin, apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import { useFetchMyself } from './useFetchEmployee';
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
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(['suppliers', data, roles], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl)
      : await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).post('/suppliers', data);
    return res.data;
  });

  return fetcher;
};

const useFetchSupplierById = (
  id: string,
  options?: UseQueryOptions<unknown, unknown, BackendRes<SupplierDetailResponse>>
): UseQueryResult<BackendRes<SupplierDetailResponse>> => {
  const fetcher = useMyQuery(
    ['suppliers', id],
    async () => {
      const res = await apiInstanceAdmin().get(`/suppliers/${id}`);
      return res.data;
    },
    options
  );

  return fetcher;
};

const useEditSupplier = (
  editId: string
): UseMutationResult<BackendRes<CreateSupplierResponse>, unknown, CreateSupplierBody, unknown> => {
  const query = useQueryClient();

  const mutator = useMutation(
    ['editSupplier', editId],
    async (data: CreateSupplierBody) => {
      const res = await apiInstanceAdmin().patch(`/suppliers/${editId}`, data);
      query.invalidateQueries(['suppliers']);
      return res.data;
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

const useCreateSupplier = (): UseMutationResult<
  BackendRes<CreateSupplierResponse>,
  unknown,
  CreateSupplierBody,
  unknown
> => {
  const mutator = useMutation(
    ['createEmployee'],
    async (data: CreateSupplierBody) => {
      try {
        const res = await apiInstanceAdmin().put<CreateSupplierBody, AxiosResponse<BackendRes<CreateSupplierResponse>>>(
          '/suppliers',
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

export { useCreateSupplier, useEditSupplier, useFetchSupplierById, useFetchSuppliers };
