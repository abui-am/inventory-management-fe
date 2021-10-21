import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient } from 'react-query';

import { BackendRes, BackendResError } from '@/typings/request';
import { CreateStockInBody, TransactionData } from '@/typings/stock-in';
import { apiInstanceAdmin } from '@/utils/api';

export const useCreateStockIn = (): UseMutationResult<
  Omit<BackendRes<unknown>, 'data'>,
  unknown,
  CreateStockInBody,
  unknown
> => {
  const mutator = useMutation(
    ['createStockin'],
    async (data: CreateStockInBody) => {
      try {
        const res = await apiInstanceAdmin().put<CreateStockInBody, AxiosResponse<BackendRes<unknown>>>(
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
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};

export const useUpdateStockIn = (): UseMutationResult<
  Omit<BackendRes<unknown>, 'data'>,
  unknown,
  {
    transactionId: string;
    data: Partial<
      Pick<TransactionData, 'status'> & {
        items?: { id: string; sell_price: number }[];
      }
    >;
  },
  unknown
> => {
  const queryClient = useQueryClient();
  const mutator = useMutation(
    ['createStockin'],
    async (data: {
      transactionId: string;
      data: Partial<
        Pick<TransactionData, 'status'> & {
          items?: { id: string; sell_price: number }[];
        }
      >;
    }) => {
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
        queryClient.invalidateQueries('transcations');
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};
