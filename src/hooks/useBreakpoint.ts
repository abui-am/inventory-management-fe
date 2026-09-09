import { useEffect, useState } from 'react';

export const XS = 640;
export const SM = 1024;
export const MD = 1280;
export const LG = 1440;
export const XL = 1920;

/**
 * True kalau lebar viewport >= `minWidth`.
 *
 * Menggantikan `useWindowSize()` yang menyimpan lebar viewport dalam piksel: hook itu
 * memanggil setState pada SETIAP event resize, jadi tiap piksel geseran memicu render ulang
 * seluruh halaman pemakainya — padahal ketujuh pemakainya hanya butuh satu boolean breakpoint.
 * Dengan matchMedia, state hanya berubah saat melewati breakpoint.
 *
 * Nilai awalnya sengaja `false` dan baru dihitung di dalam useEffect, sama seperti perilaku
 * lama (`useState(0)`): halaman ini dirender sebagai HTML statis, jadi menghitung matchMedia
 * saat render pertama akan berbeda dari HTML server dan memicu hydration mismatch.
 */
const useBreakpoint = (minWidth: number): boolean => {
  const [isAbove, setIsAbove] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
    const handleChange = (event: MediaQueryList | MediaQueryListEvent) => setIsAbove(event.matches);

    handleChange(mql);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [minWidth]);

  return isAbove;
};

export default useBreakpoint;
