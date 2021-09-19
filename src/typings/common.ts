export interface Link {
  url: string;
  label: string;
  active: boolean;
}

export type Option<T = unknown> = {
  label: string;
  value: string;
  data?: T;
};
