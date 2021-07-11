import clsx from 'clsx';
import React from 'react';

type AvatarProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { url: string };
const Avatar: React.FC<AvatarProps> = ({ url, className, ...props }) => {
  return (
    <button
      {...props}
      type="button"
      tabIndex={0}
      className={clsx('w-11 h-11 rounded-full overflow-hidden bg-blueGray-900', className)}
    >
      <img src={url} alt="profile" className="hover:opacity-75" />
    </button>
  );
};

export default Avatar;
