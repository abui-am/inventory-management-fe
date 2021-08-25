import clsx from 'clsx';
import React, { KeyboardEvent } from 'react';

const Tabs: React.FC<{
  menus: string[];
  activeIndex: number;
  onClickTab: (index: number) => void;
}> = ({ menus, activeIndex = 0, onClickTab }) => {
  function keyHandler(event: KeyboardEvent<HTMLDivElement>, index: number): void {
    switch (event.key) {
      case 'Enter':
        onClickTab(index);
        break;
      default:
    }
  }
  return (
    <div className="flex">
      {menus.map((text: string, index: number) => {
        return (
          <div
            role="button"
            onKeyUp={(e) => keyHandler(e, index)}
            key={text}
            tabIndex={0}
            onClick={() => onClickTab(index)}
            className={clsx(
              'px-8 pb-3 pt-3 border-b-2 font-bold',
              activeIndex !== index ? 'border-blueGray-100 text-blueGray-600' : 'border-blue-600 text-blue-600'
            )}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
};

Tabs.propTypes = {};

export default Tabs;
