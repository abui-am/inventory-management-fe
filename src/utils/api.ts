import axios, { AxiosInstance } from 'axios';

import { getCookie } from './cookies';

function apiInstance({ token }: { token?: string } = {}): AxiosInstance {
  console.log(process.env);
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    params: {
      key: token || getCookie('INVT_TOKEN'),
    },
  });
}

export default apiInstance;
