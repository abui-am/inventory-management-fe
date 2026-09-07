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

module.exports = nextConfig;
