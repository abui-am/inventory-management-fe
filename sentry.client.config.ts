// Dijalankan di browser kasir. Tanpa NEXT_PUBLIC_SENTRY_DSN, init tidak mengirim apa pun.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE) || 0,
  // Cookie INVT-TOKEN adalah token Passport — jangan pernah ikut terkirim ke Sentry.
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.request?.cookies) delete event.request.cookies;
    if (event.request?.headers) delete event.request.headers.Authorization;
    return event;
  },
});
