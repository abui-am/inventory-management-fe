import { RefObject, useEffect } from 'react';

type OutsideEvent = MouseEvent | TouchEvent;

// Panggil `handler` ketika klik/tap terjadi di luar elemen `ref`.
function useOnClickOutside(ref: RefObject<Node | null>, handler: (event: OutsideEvent) => void): void {
  useEffect(() => {
    const listener = (event: OutsideEvent) => {
      // Abaikan klik pada elemen ref itu sendiri maupun turunannya.
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
    // `handler` biasanya fungsi baru tiap render, sehingga efek ini ikut dipasang ulang.
    // Bungkus handler di useCallback pada pemanggil bila ingin menghindarinya.
  }, [ref, handler]);
}

export default useOnClickOutside;
