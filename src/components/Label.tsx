import React, { PropsWithChildren } from 'react';

// `htmlFor` menghubungkan label ke input: screen reader menyebutkan nama field, dan
// mengklik teks label memfokuskan input-nya (target sentuh jadi lebih besar di mobile).
// Bintang wajib sebelumnya juga <label> — elemen yang salah untuk dekorasi, dan membuat
// setiap field punya dua label. Sekarang <span aria-hidden>, teksnya sudah diwakili
// aria-required pada input.
const Label: React.FC<PropsWithChildren<{ required?: boolean; htmlFor?: string }>> = ({
  required,
  htmlFor,
  children,
}) => {
  return (
    <div>
      <label className="mb-1 inline-block" htmlFor={htmlFor}>
        {children}
      </label>
      {required && (
        <span className="mb-1 text-red-600" aria-hidden="true">
          *
        </span>
      )}
    </div>
  );
};

export default Label;
