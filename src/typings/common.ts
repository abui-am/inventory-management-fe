export interface Link {
  url: string;
  label: string;
  active: boolean;
}

export type Option<T = any> = {
  label: string;
  value: string;
  data?: T;
};

export type Status = 'pending' | 'on-review' | 'declined' | 'accepted';
