const { withSentryConfig } = require('@sentry/nextjs');

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  typescript: {
    // Typecheck bersih (0 error) — gate ini dinyalakan supaya build gagal kalau tipe rusak.
    ignoreBuildErrors: false,
  },
  eslint: {
    // TODO: masih 387 lint error (mayoritas autofixable: prettier, function-component-definition,
    // import sort). Nyalakan gate ini setelah lint dibersihkan.
    ignoreDuringBuilds: true,
  },
};

// Source map hanya diunggah kalau SENTRY_AUTH_TOKEN tersedia (mis. di Vercel);
// tanpa itu build tetap jalan dan stack trace di Sentry tinggal versi minified.
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
});
