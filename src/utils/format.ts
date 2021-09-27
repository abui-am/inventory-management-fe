import dayjs from 'dayjs';

export function formatToIDR(number: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
}

export function formatDate(date: Date) {
  return dayjs(date).format('DD MMM YYYY');
}
