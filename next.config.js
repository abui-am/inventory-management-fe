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
    // Lint bersih (0 error, sisa 33 warning `no-explicit-any` yang tidak menggagalkan build),
    // jadi gate ini dinyalakan supaya build gagal kalau ada error baru masuk.
    ignoreDuringBuilds: false,
  },
};

// Source map hanya diunggah kalau SENTRY_AUTH_TOKEN tersedia (mis. di Vercel);
// tanpa itu build tetap jalan dan stack trace di Sentry tinggal versi minified.
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
});
