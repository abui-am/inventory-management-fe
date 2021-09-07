/* eslint-disable camelcase */
export type BackendRes<T> = {
  status_code: number;
  message: string;
  data: T;
};
