import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` di browser, `useEffect` di server.
 *
 * React memperingatkan setiap kali `useLayoutEffect` ikut dirender saat SSR: efeknya
 * tidak bisa dijalankan di sana, jadi HTML server selalu berbeda dari hasil render
 * pertama di client. Peringatannya benar, tapi tidak semua pemakaian salah — mengukur
 * DOM memang HARUS terjadi sebelum paint, dan di server tidak ada DOM untuk diukur.
 *
 * Yang keliru hanyalah memanggilnya di kedua sisi. `useEffect` di server tidak pernah
 * jalan sama sekali, jadi peringatannya hilang tanpa mengubah apa pun di browser.
 *
 * Pemeriksaannya dilakukan sekali saat modul dimuat, bukan tiap render — hook tidak
 * boleh berganti identitas di antara render.
 */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
