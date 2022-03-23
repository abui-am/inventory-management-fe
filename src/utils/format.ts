import dayjs from 'dayjs';

export function formatToIDR(number: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
}

export function formatDate(date: Date, { withHour = false }: { withHour?: boolean } = {}) {
  return dayjs(date).format(withHour ? 'DD MMM YYYY HH:mm' : 'DD MMM YYYY');
}

export function formatDateYYYYMMDD(date: Date) {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatDateYYYYMM(date: Date) {
  return dayjs(date).format('YYYY-MM');
}
