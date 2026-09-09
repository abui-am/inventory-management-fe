import React, { PropsWithChildren } from 'react';

import { Label as UILabel } from '@/components/ui/label';

// Adapter ke components/ui/label. `htmlFor` menghubungkan label ke input: screen
// reader menyebutkan nama field, dan mengklik teks label memfokuskan input-nya
// (target sentuh jadi lebih besar di mobile).
const Label: React.FC<PropsWithChildren<{ required?: boolean; htmlFor?: string }>> = ({
  required,
  htmlFor,
  children,
}) => (
  <div>
    <UILabel className="mb-1" required={required} htmlFor={htmlFor}>
      {children}
    </UILabel>
  </div>
);

export default Label;
