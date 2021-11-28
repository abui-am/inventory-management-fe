import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient } from 'react-query';

import { BackendRes, BackendResError } from '@/typings/request';
import { CreateSaleBody, CreateSaleResponse } from '@/typings/sale';
import { CreateStockInBody } from '@/typings/stock-in';
import { apiInstanceAdmin } from '@/utils/api';

export const useCreateSale = (): UseMutationResult<
  BackendRes<CreateSaleResponse>,
  unknown,
  CreateSaleBody,
  unknown
> => {
  const query = useQueryClient();
  const mutator = useMutation(
    ['createSale'],
    async (data: CreateSaleBody) => {
      try {
        const res = await apiInstanceAdmin().put<CreateSaleBody, AxiosResponse<BackendRes<CreateSaleResponse>>>(
          '/transactions',
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
        query.invalidateQueries('transactions');
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};

export const useUpdateStockIn = (): UseMutationResult<
  Omit<BackendRes<CreateSaleResponse>, 'data'>,
  unknown,
  {
    transactionId: string;
    data: unknown;
  },
  unknown
> => {
  const queryClient = useQueryClient();

  const mutator = useMutation(
    ['editSale'],
    async (data: { transactionId: string; data: unknown }) => {
      try {
        const res = await apiInstanceAdmin().patch<CreateStockInBody, AxiosResponse<BackendRes<unknown>>>(
          `/transactions/${data.transactionId}`,
          data.data
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
        queryClient.invalidateQueries('transactions');
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};
