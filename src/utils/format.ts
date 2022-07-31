import dayjs, { Dayjs } from 'dayjs';

export function formatToIDR(number: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
}

export function formatDate(date: Date | string, { withHour = false }: { withHour?: boolean } = {}) {
  return dayjs(date).format(withHour ? 'DD MMM YYYY HH:mm' : 'DD MMM YYYY');
}

export function formatDateYYYYMMDD(date: Date) {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatDateYYYYMMDDHHmmss(date: Date | Dayjs) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDateYYYYMM(date: Date) {
  return dayjs(date).format('YYYY-MM');
}

export function formatPaymentMethod(payment: string) {
  if (payment === 'current_account') {
    return 'Giro';
  }
  if (payment === 'debt') {
    return 'Utang';
  }

  if (payment === 'bank') {
    return 'Bank';
  }

  return 'Kas';
}
