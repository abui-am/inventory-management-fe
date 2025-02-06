// Use window size

import { useEffect, useState } from 'react';

const useWindowSize = (): number => {
  const [size, setSize] = useState(0);
  useEffect(() => {
    function handleResize() {
      setSize(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
};

export const XS = 640;
export const SM = 1024;
export const MD = 1280;
export const LG = 1440;
export const XL = 1920;

export default useWindowSize;
