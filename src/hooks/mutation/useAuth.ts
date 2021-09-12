import { AxiosError } from 'axios';
import cookie from 'js-cookie';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useMutation } from 'react-query';

import { BackendResError } from '@/typings/request';
import apiInstance, { apiInstanceAdmin } from '@/utils/api';

interface UseAuthMutationMutateProps {
  email: string;
  password: string;
}

export type CreateAccountReqBody = {
  employee_id: string;
  username: string;
  password: string;
  password_confirmation: string;
};

const useAuthMutation = (type: 'login' | 'register') => {
  const mutationKey = type === 'login' ? 'loginUser' : 'registerUser';
  const router = useRouter();

  return useMutation(
    [mutationKey],
    async (formik: UseAuthMutationMutateProps) => {
      try {
        const { data } = await apiInstance().post(`auth/login`, formik);
        return data;
      } catch (e) {
        return e;
      }
    },
    {
      onSuccess: async ({ data, status_code, message }) => {
        if (type === 'login' && data.access_token && status_code === 200) {
          cookie.set('INVT-TOKEN', data.access_token, {
            expires: 30,
          });
          cookie.set('INVT-USERID', data.user.id, {
            expires: 30,
          });
          cookie.set('INVT-USERNAME', data.user.username, {
            expires: 30,
          });
          router.push('/');
          toast.success(message);
        }
      },
      onError: (e: AxiosError<BackendResError<unknown>>) => {
        toast.error(e.response?.data.message ?? '');
      },
    }
  );
};

const useCreateAccount = () => {
  return useMutation(
    ['createUser'],
    async (formik: CreateAccountReqBody) => {
      try {
        const { data } = await apiInstanceAdmin().put(`users`, formik);
        return data;
      } catch (e) {
        return e;
      }
    },
    {
      onSuccess: async ({ message }) => {
        toast.success(message);
      },
      onError: (e: AxiosError<BackendResError<unknown>>) => {
        toast.error(e.response?.data.message ?? '');
      },
    }
  );
};

export { useCreateAccount };
export default useAuthMutation;
