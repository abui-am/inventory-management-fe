import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Ruas ketiga breadcrumb yang hanya halamannya sendiri tahu isinya.
 *
 * `DashboardLayout` menurunkan breadcrumb dari rute, dan itu cukup untuk hampir semua
 * halaman: `/transaction/add` jadi "Baru". Yang tidak tertolong adalah rute berisi id —
 * `/employee/[id]` dan `/employee/[id]/edit` ruas keduanya `[id]`, jadi breadcrumb-nya
 * berhenti di "Karyawan" dan nama orang yang sedang dibuka tidak pernah muncul.
 *
 * Nilainya dikirim dari dalam halaman karena namanya baru diketahui sesudah datanya
 * datang. Memasangnya sebagai prop berarti Layout harus meneruskan sesuatu yang belum
 * ada saat ia dirender.
 */
const CrumbContext = createContext<{ crumb?: string; setCrumb: (value?: string) => void }>({
  setCrumb: () => undefined,
});

export function CrumbProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [crumb, setCrumb] = useState<string>();
  const value = useMemo(() => ({ crumb, setCrumb }), [crumb]);
  return <CrumbContext.Provider value={value}>{children}</CrumbContext.Provider>;
}

/** Dibaca `DashboardLayout` saat menyusun breadcrumb. */
export function useCrumb(): string | undefined {
  return useContext(CrumbContext).crumb;
}

/**
 * Dipakai halaman: `usePageCrumb(nama)`. Kosong selama datanya belum datang, dan
 * dibersihkan saat halaman ditinggalkan supaya tidak terbawa ke halaman berikutnya.
 */
export function usePageCrumb(label?: string): void {
  const { setCrumb } = useContext(CrumbContext);
  useEffect(() => {
    setCrumb(label);
    return () => setCrumb(undefined);
  }, [label, setCrumb]);
}
