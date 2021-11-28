import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient } from 'react-query';

import { CreateCustomerBody, CreateCustomerResponse } from '@/typings/customer';
import { BackendRes, BackendResError } from '@/typings/request';
import { apiInstanceAdmin } from '@/utils/api';

export const useCreateCustomer = (): UseMutationResult<
  BackendRes<CreateCustomerResponse>,
  unknown,
  CreateCustomerBody
> => {
  const mutator = useMutation(
    ['createCustomer'],
    async (data: CreateCustomerBody) => {
      try {
        const res = await apiInstanceAdmin().put<CreateCustomerBody, AxiosResponse<BackendRes<CreateCustomerResponse>>>(
          '/customers',
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

export const useEditCustomer = (
  editId: string
): UseMutationResult<BackendRes<CreateCustomerResponse>, unknown, CreateCustomerBody, unknown> => {
  const query = useQueryClient();

  const mutator = useMutation(['editCustomer', editId], async (data: CreateCustomerBody) => {
    const res = await apiInstanceAdmin().patch(`/customers/${editId}`, data);
    query.invalidateQueries(['customers']);
    return res.data;
  });

  return mutator;
};
