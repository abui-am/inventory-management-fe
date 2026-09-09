import * as Sentry from '@sentry/nextjs';

/**
 * Satu pintu untuk error yang sudah ditangani di UI (user sudah dapat toast) tapi tetap
 * perlu terlihat oleh developer.
 *
 * Sebelum ini pola yang dipakai adalah `catch (e) { toast.error('Gagal ...') }` — variabel
 * error-nya dibuang, jadi kegagalan di produksi tidak meninggalkan jejak apa pun meskipun
 * Sentry sudah terpasang. Pakai ini di setiap catch yang menampilkan toast.
 */
const reportError = (error: unknown, context?: Record<string, unknown>): void => {
  Sentry.captureException(error, context ? { extra: context } : undefined);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(error, context ?? '');
  }
};

export default reportError;
