import axios, { AxiosInstance } from 'axios';

import { getCookie } from './cookies';

function apiInstance({ token }: { token?: string } = {}): AxiosInstance {
  return axios.create({
    baseURL: process.env.BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    params: {
      key: token || getCookie('INVT_TOKEN'),
    },
  });
}

export default apiInstance;
