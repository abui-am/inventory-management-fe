import clsx from 'clsx';
import React from 'react';

type AvatarProps = React.ButtonHTMLAttributes<HTMLDivElement> & { url: string };
const Avatar: React.FC<AvatarProps> = ({ url, className, ...props }) => {
  return (
    <div {...props} className={clsx('w-11 h-11 rounded-full overflow-hidden bg-blueGray-900', className)}>
      <img src={url} alt="profile" className="object-cover w-full h-full" />
    </div>
  );
};

export default Avatar;
