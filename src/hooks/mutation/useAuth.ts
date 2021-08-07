import cookie from 'js-cookie';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useMutation } from 'react-query';

import apiInstance from '@/utils/api';

interface UseAuthMutationMutateProps {
  email: string;
  password: string;
}

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
        throw new Error(e.response.data.message);
      }
    },
    {
      onSuccess: async ({ data, status_code, message }) => {
        if (type === 'login' && data.access_token && status_code === 200) {
          cookie.set('INVT-TOKEN', data.access_token, {
            expires: 30,
          });
          router.push('/');
          toast.success(message);
        }
      },
      onError: ({ message }) => {
        toast.error(message);
      },
    }
  );
};

export default useAuthMutation;
