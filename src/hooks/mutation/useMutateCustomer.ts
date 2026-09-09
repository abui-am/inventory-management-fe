import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

import { CreateCustomerBody, CreateCustomerResponse } from '@/typings/customer';
import { BackendRes, BackendResError } from '@/typings/request';
import { apiInstanceAdmin, getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from '../query/useFetchEmployee';

export const useCreateCustomer = (): UseMutationResult<
  BackendRes<CreateCustomerResponse>,
  unknown,
  CreateCustomerBody
> => {
  const { data: dataSelf } = useFetchMyself();
  const query = useQueryClient();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const mutator = useMutation(
    [keys.customers, 'create'],
    async (data: CreateCustomerBody) => {
      const res = await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).put<
        CreateCustomerBody,
        AxiosResponse<BackendRes<CreateCustomerResponse>>
      >('/customers', data);
      return res.data;
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        query.invalidateQueries([keys.customers]);
        query.invalidateQueries([keys.ledgers]);
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};

export const useEditCustomer = (
  editId: string
): UseMutationResult<BackendRes<CreateCustomerResponse>, unknown, CreateCustomerBody, unknown> => {
  const query = useQueryClient();

  const mutator = useMutation(['editCustomer', editId], async (data: CreateCustomerBody) => {
    const res = await apiInstanceAdmin().patch(`/customers/${editId}`, data);
    query.invalidateQueries([keys.customers]);
    query.invalidateQueries([keys.ledgers]);
    query.invalidateQueries([keys.capitalReport]);

    return res.data;
  });

  return mutator;
};
