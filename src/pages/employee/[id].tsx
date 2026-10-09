import dayjs from 'dayjs';
import { Check, ChevronRight, Info, Key, Pencil, Power, RotateCcw } from 'lucide-react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import CreateAccountDialog from '@/components/employee/CreateAccountDialog';
import DeactivateEmployeeDialog from '@/components/employee/DeactivateEmployeeDialog';
import { inisialKaryawan } from '@/components/employee/EmployeeCardList';
import ReactivateEmployeeDialog from '@/components/employee/ReactivateEmployeeDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { usePermission } from '@/context/permission-context';
import { useFetchEmployeeById, useFetchMyself } from '@/hooks/query/useFetchEmployee';
import { useFetchUserById } from '@/hooks/query/useFetchUser';
import { usePageCrumb } from '@/layouts/crumb';
import { cn } from '@/lib/cn';
import { ThemeablePage } from '@/typings/page';
import { formatNumber } from '@/utils/format';

/**
 * SPEC-13 — satu baris data di dalam panel. Label berlebar tetap supaya nilainya rata
 * antar baris; baris panjang (alamat, peran) membentang dua kolom.
 */
function Baris({
  label,
  children,
  mono,
  penuh,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  penuh?: boolean;
}): JSX.Element {
  return (
    <div className={cn('flex min-w-0 items-baseline gap-2.5', penuh && 'sm:col-span-2')}>
      <span className="w-[118px] shrink-0 text-sm text-foreground-subtle">{label}</span>
      <span className={cn('min-w-0 flex-1 text-base', mono && 'font-mono tabular-nums')}>{children}</span>
    </div>
  );
}

/**
 * SPEC-11/12 — satu seksi panel. Judulnya 11px redup: penanda seksi, bukan judul yang
 * bersaing dengan nama orangnya. Dipisah garis tipis dari seksi berikutnya.
 *
 * Mengembalikan `null` kalau tidak ada satu pun baris terisi — seksi kosong dibuang,
 * tidak dirender sebagai deretan em dash.
 */
function Seksi({
  judul,
  kanan,
  baris,
  terakhir,
}: {
  judul: string;
  kanan?: React.ReactNode;
  baris: React.ReactNode[];
  terakhir?: boolean;
}): JSX.Element | null {
  const isi = baris.filter(Boolean);
  if (isi.length === 0) return null;

  return (
    <div className={cn('px-4 pb-3 pt-2.75', !terakhir && 'border-b border-border-subtle')}>
      <div className="mb-1.75 flex items-baseline justify-between gap-2.5">
        <span className="text-xs font-bold text-foreground-subtle">{judul}</span>
        {kanan}
      </div>
      <div className="grid grid-cols-1 gap-y-0.75 sm:grid-cols-2 sm:gap-x-[22px]">{isi}</div>
    </div>
  );
}

/**
 * Tautan pelengkap, bukan aksi: seredup judul seksinya, menguat saat disentuh. Warna
 * aksen disimpan untuk tombol yang mengubah sesuatu — kalau tautan ini ikut beraksen, ia
 * terbaca sederajat Ubah dan Nonaktifkan padahal cuma jalan keluar.
 */
function TautanTenang({ href, children }: { href: string; children: React.ReactNode }): JSX.Element {
  return (
    <Link href={href}>
      {/* `foreground-muted`, bukan `foreground-subtle`: subtle dinilai 3:1 di
          `check:contrast` — cukup untuk meta, tidak untuk teks yang bisa diklik. */}
      <a className="inline-flex items-center gap-0.75 text-sm text-foreground-muted underline-offset-2 transition-colors duration-fast hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25">
        {children}
        <ChevronRight size={11} strokeWidth={2} aria-hidden />
      </a>
    </Link>
  );
}

/**
 * Detail karyawan.
 *
 * Bentuknya satu panel dengan seksi dipisah garis tipis, bukan empat kartu terpisah:
 * kartu membuat tiap kelompok terbaca sama penting, padahal yang dicari orang saat
 * membuka halaman ini cuma tiga — gaji, status, dan akun loginnya. Ketiganya karena itu
 * naik ke strip kepala halaman, dan sisa datanya mengalir di bawahnya.
 *
 * Yang berubah dari layar lama, semuanya karena alasannya ada di layar itu sendiri:
 *
 * - Foto `/images/employee.png` 240x240 dibuang. Gambar stok yang sama persis untuk
 *   setiap orang memakan sepertiga layar tanpa memberi tahu apa pun; penggantinya
 *   lingkaran inisial, sama dengan yang dipakai daftar dan topbar.
 * - Dua tab dilebur. Tab "Akun Dashboard" hanya berisi tiga baris, jadi memberinya tab
 *   sendiri menyembunyikan informasi tanpa menghemat ruang.
 * - "Deactivate" jadi "Nonaktifkan", dan dialognya menyebut nama orangnya.
 * - "Akun belum diaktifkan, Aktifkan sekarang" — sebuah `<span>` biru yang berperan
 *   sebagai tombol — jadi ajakan sebaris dengan tombol sebenarnya.
 * - Baris tanpa nilai tidak dirender, dan seksi yang seluruh barisnya kosong hilang.
 *   Layar lama menulis "Invalid Date" untuk karyawan yang tidak punya tanggal lahir.
 * - Baris "Pegawai Aktif: Iya/Tidak" dibuang: lencana di kepala sudah mengatakannya.
 */
const EmployeeDetailPage: NextPage & ThemeablePage = () => {
  const { query = {}, push } = useRouter();
  const id = query.id as string;

  const { data, isLoading } = useFetchEmployeeById(id);
  const { data: dataSaya } = useFetchMyself();
  const { state } = usePermission();

  const [menonaktifkan, setMenonaktifkan] = useState(false);
  const [mengaktifkan, setMengaktifkan] = useState(false);
  const [membuatAkun, setMembuatAkun] = useState(false);

  const employee = data?.data?.employee;
  const {
    first_name: depan,
    last_name: belakang,
    position: jabatan,
    nik,
    birth_date: lahir,
    gender,
    email,
    phone_number: hp,
    addresses,
    salary,
    active,
    has_dashboard_account: punyaAkun,
    user,
    created_at: bergabung,
  } = employee ?? {};

  const nama = `${depan ?? ''} ${belakang ?? ''}`.trim();
  const nonaktif = active === false;
  const gaji = +(salary ?? 0);

  // Breadcrumb "Karyawan / Budi Santoso". Kosong selama namanya belum datang, supaya
  // tidak sempat menulis ruas kosong.
  usePageCrumb(nama || undefined);

  const { data: dataUser } = useFetchUserById(user?.id ?? '', { enabled: !!user?.id });
  const akun = dataUser?.data?.user;

  const alamat = addresses?.find((val) => val.title === 'Alamat Rumah') ?? addresses?.[0];
  const kelurahan = alamat?.village;
  const kecamatan = kelurahan?.subdistrict;
  const kota = kecamatan?.city;
  const provinsi = kota?.province;
  const wilayah = [
    kelurahan?.name && `Kelurahan ${kelurahan.name}`,
    kecamatan?.name && `Kecamatan ${kecamatan.name}`,
    kota?.name,
    provinsi?.name,
  ]
    .filter(Boolean)
    .join(', ');

  const sayaSendiri = !!employee?.id && employee.id === dataSaya?.data?.user?.employee?.id;
  const bolehMengubah = state.permission.includes('control:profile') || sayaSendiri;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.75">
          <Skeleton className="size-[42px] rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <Skeleton className="h-[380px] rounded-card" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* SPEC-02..08 — satu strip: siapa, statusnya, dan tiga fakta yang paling dicari */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className={cn('flex min-w-0 items-center gap-2.75', nonaktif && 'opacity-60')}>
          <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-accent-subtle text-2xs font-bold tracking-[-0.02em] text-accent">
            {inisialKaryawan(depan, belakang)}
          </span>

          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-bold">{nama || 'Karyawan'}</h1>
              {nonaktif ? (
                <Badge variant="neutral">Nonaktif</Badge>
              ) : (
                <Badge variant="success">
                  <Check strokeWidth={2} aria-hidden /> Aktif
                </Badge>
              )}
            </div>

            <span className="truncate text-sm text-foreground-muted">
              {jabatan || 'Tanpa jabatan'}
              {bergabung ? ` · bergabung ${dayjs(bergabung).format('D MMM YYYY')}` : ''}
            </span>

            {/* Gaji, akun, dan peran. Di versi kartu ketiganya tersebar di dua kartu
                berbeda di kolom kanan. Gaji tidak ditampilkan untuk yang nonaktif: ia
                tidak ikut dibuatkan baris gaji, jadi angkanya akan terbaca seperti
                tagihan yang masih berjalan. */}
            <span className="flex flex-wrap items-center gap-1.5 text-sm text-foreground-muted">
              {!nonaktif && gaji > 0 && (
                <>
                  <span className="font-mono font-semibold tabular-nums text-foreground">{formatNumber(gaji)}</span>
                  <span className="text-foreground-subtle">/bln</span>
                  <span aria-hidden>·</span>
                </>
              )}
              {punyaAkun ? (
                <>
                  akun <span className="font-mono text-foreground">{akun?.username ?? '…'}</span>
                  {akun?.roles?.map((peran) => (
                    <Badge key={peran.id} variant="accent">
                      {peran.name.replace(/-/g, ' ')}
                    </Badge>
                  ))}
                </>
              ) : (
                <span className="text-foreground-subtle">belum punya akun login</span>
              )}
            </span>
          </div>
        </div>

        {bolehMengubah && (
          <div className="flex w-full shrink-0 items-center gap-1.75 sm:w-auto">
            {nonaktif ? (
              <Button size="sm" className="flex-1 sm:flex-none" onClick={() => setMengaktifkan(true)}>
                <RotateCcw strokeWidth={1.9} aria-hidden /> Aktifkan lagi
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => push(`/employee/${id}/edit`)}
                >
                  <Pencil strokeWidth={1.8} aria-hidden /> Ubah
                </Button>
                <Button
                  size="sm"
                  variant="destructive-outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => setMenonaktifkan(true)}
                >
                  <Power strokeWidth={1.9} aria-hidden /> Nonaktifkan
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* SPEC-10 — satu panel; hierarkinya dari garis tipis antar seksi, bukan dari kotak */}
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        {/* SPEC-09 — hanya untuk yang nonaktif: akibatnya, dan apa yang TIDAK berubah */}
        {nonaktif && (
          <div className="flex items-start gap-2.25 border-b border-border-subtle bg-surface-raised px-4 py-2.5">
            <Info size={13} strokeWidth={1.9} aria-hidden className="mt-px shrink-0 text-foreground-subtle" />
            <span className="text-sm leading-[1.45] text-foreground-muted">
              Ia tidak ikut dibuatkan baris gaji bulan berikutnya, dan tidak bisa masuk ke aplikasi. Daftar gaji bulan
              yang sudah jadi tidak berubah.
            </span>
          </div>
        )}

        <Seksi
          judul="Identitas"
          baris={[
            nik && (
              <Baris key="nik" label="Nomor KTP" mono>
                {nik}
              </Baris>
            ),
            lahir && (
              <Baris key="lahir" label="Tanggal lahir">
                {dayjs(lahir).format('D MMMM YYYY')}
              </Baris>
            ),
            gender && (
              <Baris key="gender" label="Jenis kelamin">
                {jenisKelamin(gender)}
              </Baris>
            ),
          ]}
        />

        <Seksi
          judul="Kontak"
          baris={[
            email && (
              <Baris key="email" label="Email">
                <span className="break-all">{email}</span>
              </Baris>
            ),
            hp && (
              <Baris key="hp" label="Nomor HP" mono>
                {hp}
              </Baris>
            ),
          ]}
        />

        <Seksi
          judul="Tempat tinggal"
          baris={[
            alamat?.complete_address && (
              <Baris key="alamat" label="Alamat" penuh>
                {alamat.complete_address}
              </Baris>
            ),
            wilayah && (
              <Baris key="wilayah" label="Wilayah" penuh>
                {wilayah}
              </Baris>
            ),
          ]}
        />

        <Seksi
          judul="Kepegawaian"
          kanan={<TautanTenang href="/monthly-salary">Gaji Karyawan</TautanTenang>}
          baris={[
            gaji > 0 && (
              <Baris key="gaji" label="Gaji per bulan" mono>
                <span className="font-semibold">{formatNumber(gaji)}</span>
              </Baris>
            ),
            jabatan && (
              <Baris key="jabatan" label="Jabatan">
                {jabatan}
              </Baris>
            ),
            bergabung && (
              <Baris key="bergabung" label="Bergabung">
                {dayjs(bergabung).format('D MMM YYYY')}
              </Baris>
            ),
          ]}
        />

        {/* SPEC-17/18 — punya akun: tiga baris. Belum punya: satu kalimat dan satu tombol,
            sebaris di dalam seksinya, bukan kartu kosong setinggi 120px. */}
        <Seksi
          judul="Akun login"
          terakhir
          baris={
            punyaAkun
              ? [
                  <Baris key="username" label="Username" mono>
                    {akun?.username ?? '…'}
                  </Baris>,
                  akun?.created_at && (
                    <Baris key="dibuat" label="Dibuat">
                      {dayjs(akun.created_at).format('D MMM YYYY')}
                    </Baris>
                  ),
                  !!akun?.roles?.length && (
                    <Baris key="peran" label="Peran" penuh>
                      <span className="flex flex-wrap gap-1">
                        {akun.roles.map((peran) => (
                          <Badge key={peran.id} variant="accent">
                            {peran.name.replace(/-/g, ' ')}
                          </Badge>
                        ))}
                      </span>
                    </Baris>
                  ),
                ]
              : [
                  <div key="ajakan" className="flex flex-wrap items-center gap-2.5 sm:col-span-2">
                    <span className="text-base text-foreground-muted">
                      Belum punya akun, jadi ia belum bisa masuk ke aplikasi ini.
                    </span>
                    {bolehMengubah && !nonaktif && (
                      <Button size="sm" onClick={() => setMembuatAkun(true)}>
                        <Key strokeWidth={1.8} aria-hidden /> Buat akun login
                      </Button>
                    )}
                  </div>,
                ]
          }
        />
      </div>

      <DeactivateEmployeeDialog
        employeeId={id}
        nama={nama}
        isOpen={menonaktifkan}
        onClose={() => setMenonaktifkan(false)}
      />
      <ReactivateEmployeeDialog
        employeeId={id}
        nama={nama}
        isOpen={mengaktifkan}
        onClose={() => setMengaktifkan(false)}
      />
      <CreateAccountDialog
        employeeId={id}
        nama={nama}
        isOpen={membuatAkun}
        onClose={() => setMembuatAkun(false)}
        onSuccess={() => setMembuatAkun(false)}
      />
    </div>
  );
};

/** Backend menyimpan `male`/`female`; yang bukan keduanya ditampilkan apa adanya. */
function jenisKelamin(gender?: string): string {
  if (gender === 'male') return 'Laki-laki';
  if (gender === 'female') return 'Perempuan';
  return gender ?? '';
}

EmployeeDetailPage.themeable = true;

export default EmployeeDetailPage;
