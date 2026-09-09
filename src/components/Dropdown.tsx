import { Placement } from '@popperjs/core';
import React, { LegacyRef, PropsWithChildren } from 'react';
import { usePopper } from 'react-popper';

import useOnClickOutside from '@/hooks/useOnClickOutside';

interface PopupProps {
  anchorRef: Element | null;
  onClickOutside: () => void;
  open: boolean;
  placement?: Placement;
}

function Popup({
  anchorRef,
  onClickOutside,
  open,
  children,
  placement = 'left-start',
}: PropsWithChildren<PopupProps>): JSX.Element | null {
  const [popperElement, setPopperElement] = React.useState(null);
  const [arrowElement, setArrowElement] = React.useState(null);
  const closeRef = React.useRef<HTMLDivElement>(null);
  useOnClickOutside(closeRef, onClickOutside);

  const { styles: stylesPopper, attributes } = usePopper(anchorRef, popperElement, {
    modifiers: [{ name: 'arrow', options: { element: arrowElement } }],
    placement,
  });
  if (!open) return null;

  return (
    <div
      ref={setPopperElement as LegacyRef<HTMLDivElement> | undefined}
      style={{
        ...stylesPopper.popper,
        zIndex: 999,
      }}
      {...attributes.popper}
    >
      <div style={stylesPopper.arrow} ref={setArrowElement as LegacyRef<HTMLDivElement> | undefined} id="arrow" />
      <div ref={closeRef} className="shadow-lg bg-white rounded-md" style={{ transform: 'translate(10px,8px)' }}>
        {children}
      </div>
    </div>
  );
}

export default Popup;
