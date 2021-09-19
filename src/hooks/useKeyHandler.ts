import { KeyboardEvent } from 'react';

const useKeyPressEnter = (onPressEnter: () => void) => {
  function keyHandler(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Enter') {
      if (onPressEnter) onPressEnter();
    }
  }
  return keyHandler;
};

export { useKeyPressEnter };
