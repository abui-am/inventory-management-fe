import { useEffect, useState } from 'react';

function debounce<T extends unknown[], U>(callback: (...args: T) => PromiseLike<U> | U, wait: number) {
  let timer: number;

  return (...args: T): Promise<U> => {
    clearTimeout(timer);
    return new Promise((resolve) => {
      timer = setTimeout(() => resolve(callback(...args)), wait) as unknown as number;
    });
  };
}

export const useDebounceValue = <T>(value: T, wait: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), wait);
    return () => clearTimeout(handler);
  }, [value, wait]);

  return debouncedValue;
};

export default debounce;
