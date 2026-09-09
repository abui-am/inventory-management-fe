import { useEffect, useState } from 'react';

/**
 * `false` pada render pertama — di server maupun di client — lalu `true` setelah efek jalan.
 *
 * Dipakai untuk menahan nilai yang bergantung waktu atau perangkat agar tidak ikut dirender
 * saat SSR/SSG. Sebagian besar halaman di aplikasi ini dibangkitkan sebagai HTML statis
 * saat build, jadi `new Date()` yang dirender di sana membeku pada tanggal build: besoknya
 * setiap pengunjung menerima tanggal kemarin, React 18 mendeteksi teksnya tidak cocok, lalu
 * membuang seluruh pohon SSR dan me-render ulang dari nol.
 *
 * Nilai awal sengaja `false` di kedua sisi supaya render pertama identik — itu yang membuat
 * hidrasinya bersih. Menghitung nilai sebenarnya saat render pertama justru mengembalikan
 * masalah yang sama.
 */
export default function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
