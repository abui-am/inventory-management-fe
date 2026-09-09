/**
 * Halaman yang isinya sudah seluruhnya memakai token menandai dirinya `themeable`,
 * dan _app melepas `forcedTheme` untuknya. Selama halaman masih memakai warna literal
 * Tailwind, memaksanya terang adalah satu-satunya cara membuat teksnya tetap terbaca.
 */
export type ThemeablePage = { themeable?: boolean };
