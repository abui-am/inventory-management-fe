import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { Check, Key } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { date, number, object, string } from 'yup';

import { inisialKaryawan } from '@/components/employee/EmployeeCardList';
import {
  CurrencyTextField,
  DatePickerComponent,
  SelectCity,
  SelectProvince,
  SelectSubdistrict,
  SelectVillage,
  TextArea,
  ThemedSelect,
} from '@/components/Form';
import { PhoneNumberTextField } from '@/components/TextField';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Segmented } from '@/components/ui/segmented';
import Skeleton from '@/components/ui/skeleton';
import { genderOptions } from '@/constants/options';
import {
  useCreateEmployee,
  useEditEmployee,
  useFetchEmployeeById,
  useFetchMyself,
} from '@/hooks/query/useFetchEmployee';
import { useFetchUserById } from '@/hooks/query/useFetchUser';
import { usePageCrumb } from '@/layouts/crumb';
import { cn } from '@/lib/cn';
import { CreateEmployeePutBody } from '@/typings/employee';
import { formatNumber } from '@/utils/format';
import { createOption, getOptionByValue } from '@/utils/options';
import reportError from '@/utils/reportError';
import { controlStyle } from '@/utils/style';

type Pilihan = { label: string; value: string | number } | undefined;

/** Keterangan di bawah isian: 11px, jarak 5px, lh 1.45 — destructive hanya saat error. */
const pesan = (error: boolean) =>
  cn('mt-1.25 text-xs leading-[1.45]', error ? 'text-destructive' : 'text-foreground-subtle');

/** SPEC F-04 — satu isian: label, kontrol, lalu keterangan ATAU pesan error di tempat yang sama. */
function Isian({
  label,
  htmlFor,
  wajib,
  opsional,
  ket,
  error,
  penuh,
  children,
}: {
  label: string;
  htmlFor: string;
  wajib?: boolean;
  opsional?: boolean;
  ket?: string;
  error?: string;
  penuh?: boolean;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className={cn('min-w-0', penuh && 'sm:col-span-2')}>
      <Label htmlFor={htmlFor} required={wajib} className="mb-1.25">
        {label}
        {/* 11px, bukan ikut 12px label: penanda, bukan bagian dari nama kolomnya. */}
        {opsional && <span className="ml-1.25 text-xs font-normal text-foreground-subtle">opsional</span>}
      </Label>
      {children}
      {(error || ket) && (
        <p className={pesan(!!error)} id={error ? `${htmlFor}-error` : undefined} role={error ? 'alert' : undefined}>
          {error || ket}
        </p>
      )}
    </div>
  );
}

/** SPEC F-03 — seksi di dalam kartu formulir: judul, keterangan, lalu grid dua kolom. */
function Seksi({ judul, ket, children }: { judul: string; ket: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-2.25">
      <div>
        <div className="text-base font-bold">{judul}</div>
        <div className="mt-px text-xs text-foreground-subtle">{ket}</div>
      </div>
      <div className="grid grid-cols-1 gap-2.75 sm:grid-cols-2 sm:gap-x-3">{children}</div>
    </div>
  );
}

/** Kartu di kolom kanan: judul, keterangan opsional, isi. */
function Kartu({
  judul,
  ket,
  aksi,
  children,
}: {
  judul?: string;
  ket?: string;
  aksi?: React.ReactNode;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2.25 rounded-card border border-border bg-surface px-4 py-3.5 shadow-sm">
      {judul && (
        <div className="flex items-baseline justify-between gap-2.5">
          <div>
            <div className="text-base font-bold">{judul}</div>
            {ket && <div className="mt-px text-xs text-foreground-subtle">{ket}</div>}
          </div>
          {aksi}
        </div>
      )}
      {children}
    </div>
  );
}

/** Petunjuk tuts: tombolnya sendiri sudah ada, ini yang memberitahu jalan pintasnya. */
function Petunjuk({ tuts, ket }: { tuts: string; ket: string }): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1.25">
      <kbd className="rounded border border-border bg-surface-raised px-1 font-mono text-2xs text-foreground-muted">
        {tuts}
      </kbd>
      <span className="text-foreground-subtle">{ket}</span>
    </span>
  );
}

/**
 * Formulir tambah dan ubah karyawan (`/employee/add`, `/employee/[id]/edit`).
 *
 * Yang diperbaiki dari versi lama, semuanya terbaca di berkas sebelumnya:
 *
 * 1. Dua jenis label bercampur — `<Label required>` untuk yang wajib dan `<label
 *    className="mb-1 inline-block">` mentah untuk sisanya. Yang kedua `inline-block`,
 *    jadi kontrol di bawahnya turun ±4px dan dua kolom bersebelahan tidak pernah sejajar.
 *    Sekarang semuanya `Label` dari components/ui, yang selalu `block`.
 * 2. Jenis kelamin memakai `react-select` MENTAH — tidak ikut token, tinggi 44px, dan
 *    putih di mode gelap. Sekarang `ThemedSelect` + `controlStyle` seperti select lain.
 * 3. Pesan error memakai `text-red-500` mentah, bukan token destructive.
 * 4. Tanggal lahir bawaannya `new Date()`, jadi setiap karyawan baru lahir hari ini.
 *    Sekarang kosong, dan kolomnya opsional (backend: `nullable`).
 * 5. `active: true` DIPAKU di badan submit, sehingga menyimpan perubahan atas karyawan
 *    nonaktif diam-diam mengaktifkannya lagi. Mode ubah sekarang punya kendali status.
 * 6. `nik` dan `email` unik di database tapi layarnya tidak pernah menyebutkannya, dan
 *    pesan bentroknya datang mentah dari backend.
 * 7. State memuat saat mengubah data: harfiah `<div>Loading...</div>`.
 */
const CreateEmployeeForm: React.FC<{ isEdit?: boolean; editId?: string }> = ({ editId, isEdit = false }) => {
  const { back } = useRouter();
  const { mutateAsync: buatKaryawan, isLoading: sedangMembuat } = useCreateEmployee();
  const { mutateAsync: ubahKaryawan, isLoading: sedangMengubah } = useEditEmployee(editId ?? '');
  const { data, isLoading } = useFetchEmployeeById(editId ?? '', { enabled: isEdit });
  const myself = useFetchMyself();

  const editingEmployee = data?.data?.employee;
  const homeAddress = editingEmployee?.addresses?.filter((val) => val.title === 'Alamat Rumah')[0];
  const village = homeAddress?.village;
  const subdistrict = village?.subdistrict;
  const city = subdistrict?.city;
  const province = city?.province;

  const { data: dataUser } = useFetchUserById(editingEmployee?.user?.id ?? '', {
    enabled: isEdit && !!editingEmployee?.user?.id,
  });
  const akun = dataUser?.data?.user;

  // Sebelumnya objek ini dibuat ulang tiap render, jadi useMemo di bawah (yang bergantung
  // padanya) tidak pernah benar-benar memo dan skema yup dibangun ulang setiap render.
  const initialValues = useMemo(
    () =>
      isEdit && !isLoading
        ? {
            salary: editingEmployee?.salary ?? 0,
            firstName: editingEmployee?.first_name ?? '',
            lastName: editingEmployee?.last_name ?? '',
            nik: editingEmployee?.nik ?? '',
            // `null`, bukan hari ini: tanggal lahir yang tidak tercatat harus terbaca
            // sebagai tidak tercatat.
            birthday: editingEmployee?.birth_date ? dayjs(editingEmployee.birth_date).toDate() : null,
            gender: editingEmployee?.gender
              ? (getOptionByValue(genderOptions, editingEmployee.gender) as Pilihan)
              : undefined,
            email: editingEmployee?.email ?? '',
            handphoneNumber: editingEmployee?.phone_number ?? '',
            address: homeAddress?.complete_address ?? '',
            position: editingEmployee?.position ?? '',
            aktif: editingEmployee?.active !== false,
            province: province
              ? (createOption(province.name ?? '', province.id?.toString() ?? '') as Pilihan)
              : undefined,
            city: city ? (createOption(city.name ?? '', city.id?.toString() ?? '') as Pilihan) : undefined,
            subdistrict: subdistrict
              ? (createOption(subdistrict.name ?? '', subdistrict.id?.toString() ?? '') as Pilihan)
              : undefined,
            village: village ? (createOption(village.name ?? '', village.id?.toString() ?? '') as Pilihan) : undefined,
          }
        : {
            salary: 0,
            firstName: '',
            lastName: '',
            nik: '',
            birthday: null as Date | null,
            gender: undefined as Pilihan,
            email: '',
            handphoneNumber: '',
            address: '',
            position: '',
            aktif: true,
            province: undefined as Pilihan,
            city: undefined as Pilihan,
            subdistrict: undefined as Pilihan,
            village: undefined as Pilihan,
          },
    [isEdit, isLoading, editingEmployee, homeAddress, province, city, subdistrict, village]
  );

  const isOwner = myself.data?.data?.user?.roles.map(({ name }) => name).includes('superadmin');

  /**
   * Skema ditulis tegas di sini, tidak lagi diturunkan dari nama field lewat
   * `createSchema`: pemetaan itu mewajibkan `birthday` dan `gender` (padahal backend
   * `nullable`) dan TIDAK mewajibkan `email` (padahal backend `required` saat tambah).
   * Pesannya juga menyebut angkanya, bukan "Wajib diisi" yang sama untuk semua.
   */
  const validationSchema = useMemo(
    () =>
      object().shape({
        firstName: string().trim().required('Nama depan wajib diisi.'),
        lastName: string().trim().required('Nama belakang wajib diisi.'),
        nik: string()
          .required('Nomor KTP wajib diisi.')
          .test(
            'panjang',
            ({ value }) => `Nomor KTP harus 16 digit — yang diisi baru ${`${value ?? ''}`.length}.`,
            (v) => /^\d{16}$/.test(`${v ?? ''}`)
          ),
        email: string().trim().email('Email tidak terbaca sebagai alamat email.').required('Email wajib diisi.'),
        handphoneNumber: string()
          .required('Nomor HP wajib diisi.')
          .min(9, 'Minimal 9 angka.')
          .max(16, 'Maksimal 16 angka.'),
        address: string().trim().required('Alamat lengkap wajib diisi.'),
        birthday: date().nullable().max(new Date(), 'Tanggal lahir tidak boleh di masa depan.'),
        salary: number().min(0, 'Gaji tidak boleh negatif.'),
      }),
    []
  );

  const { values, handleChange, handleBlur, handleSubmit, setFieldValue, submitForm, errors, touched } = useFormik({
    validationSchema,
    initialValues,
    enableReinitialize: isEdit,
    onSubmit: async (nilai) => {
      const jsonBody: CreateEmployeePutBody = {
        first_name: nilai.firstName,
        last_name: nilai.lastName,
        nik: nilai.nik,
        // Kolom opsional yang kosong TIDAK dikirim: backend mematikan
        // `ConvertEmptyStringsToNull`, jadi `''` lolos ke validator dan ditolak
        // `before_or_equal:now` serta `in:male,female`.
        ...(nilai.birthday ? { birth_date: dayjs(nilai.birthday).format('YYYY-MM-DD') } : {}),
        ...(nilai.gender?.value ? { gender: `${nilai.gender.value}` } : {}),
        email: nilai.email,
        phone_number: nilai.handphoneNumber,
        position: nilai.position,
        salary: nilai.salary,
        // Mode tambah selalu aktif; mode ubah mengirim apa yang dipilih di kartu Status.
        active: isEdit ? nilai.aktif : true,
        addresses: [
          {
            village_id: nilai.village?.value ? +nilai.village.value : undefined,
            title: 'Alamat Rumah',
            complete_address: nilai.address ?? '',
          },
        ],
      };

      try {
        const res = isEdit ? await ubahKaryawan(jsonBody) : await buatKaryawan(jsonBody);
        toast.success(res.message);
        back();
      } catch (e) {
        reportError(e, { form: isEdit ? 'employee/edit' : 'employee/add' });
      }
    },
  });

  const nama = `${values.firstName} ${values.lastName}`.trim();
  usePageCrumb(isEdit ? nama || undefined : undefined);

  // Jalan pintas yang petunjuknya terlihat di kaki halaman.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        submitForm();
      }
      if (e.key === 'Escape') back();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [submitForm, back]);

  const sedangMenyimpan = sedangMembuat || sedangMengubah;
  const salah = (nama: keyof typeof values) => (touched[nama] && errors[nama] ? (errors[nama] as string) : undefined);

  if (isEdit && isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-72" />
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <Skeleton className="h-[520px] flex-[1.6] rounded-card" />
          <Skeleton className="h-[320px] flex-1 rounded-card" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2.75">
      {/* SPEC F-01 / E-01 — judul dan dua aksi; mode ubah menyebut siapa yang diubah */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {isEdit ? (
          <div className="flex min-w-0 items-center gap-2.75">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-2xs font-bold tracking-[-0.02em] text-accent">
              {inisialKaryawan(values.firstName, values.lastName)}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="truncate text-base font-bold">Ubah {nama || 'karyawan'}</h1>
              <span className="truncate text-sm text-foreground-subtle">
                {values.position || 'Tanpa jabatan'}
                {editingEmployee?.created_at
                  ? ` · bergabung ${dayjs(editingEmployee.created_at).format('D MMM YYYY')}`
                  : ''}
                {values.nik ? ' · KTP ' : ''}
                {values.nik && <span className="font-mono">{values.nik}</span>}
              </span>
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            <h1 className="text-base font-bold">Tambah karyawan</h1>
            <p className="mt-0.5 text-sm text-foreground-subtle">
              Data ini dipakai untuk menyusun daftar gaji tiap bulan, dan untuk membuat akun loginnya nanti.
            </p>
          </div>
        )}

        <div className="flex w-full shrink-0 items-center gap-1.75 sm:w-auto">
          <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => back()}>
            Batal
          </Button>
          <Button size="sm" type="submit" className="flex-1 sm:flex-none" loading={sedangMenyimpan}>
            <Check strokeWidth={2.2} aria-hidden /> {isEdit ? 'Simpan perubahan' : 'Simpan karyawan'}
          </Button>
        </div>
      </div>

      {/* SPEC F-02 — kartu formulir di kiri, kartu pendukung di kanan */}
      <div className="flex flex-col gap-2.5 md:flex-row md:items-start md:gap-3">
        <div className="flex min-w-0 flex-col gap-4 rounded-card border border-border bg-surface px-4.5 py-4 shadow-sm md:flex-[1.6]">
          <Seksi judul="Identitas" ket="nama dan nomor KTP dipakai untuk mencari orangnya di seluruh aplikasi">
            <Isian label="Nama depan" htmlFor="firstName" wajib error={salah('firstName')}>
              <Input
                size="sm"
                id="firstName"
                name="firstName"
                placeholder="Budi"
                value={values.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!salah('firstName') || undefined}
                aria-describedby={salah('firstName') ? 'firstName-error' : undefined}
              />
            </Isian>

            <Isian label="Nama belakang" htmlFor="lastName" wajib error={salah('lastName')}>
              <Input
                size="sm"
                id="lastName"
                name="lastName"
                placeholder="Santoso"
                value={values.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!salah('lastName') || undefined}
                aria-describedby={salah('lastName') ? 'lastName-error' : undefined}
              />
            </Isian>

            <Isian
              label="Nomor KTP"
              htmlFor="nik"
              wajib
              ket="16 digit. Tidak boleh sama dengan karyawan lain."
              error={salah('nik')}
            >
              <Input
                size="sm"
                id="nik"
                name="nik"
                inputMode="numeric"
                placeholder="3374091205920003"
                value={values.nik}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!salah('nik') || undefined}
                aria-describedby={salah('nik') ? 'nik-error' : undefined}
              />
            </Isian>

            <Isian label="Tanggal lahir" htmlFor="birthday" opsional error={salah('birthday')}>
              <DatePickerComponent
                size="sm"
                id="birthday"
                name="birthday"
                placeholderText="Pilih tanggal"
                selected={values.birthday}
                maxDate={new Date()}
                showYearDropdown
                dropdownMode="select"
                onChange={(val) => setFieldValue('birthday', val)}
              />
            </Isian>

            <Isian label="Jenis kelamin" htmlFor="gender" opsional>
              <ThemedSelect
                inputId="gender"
                instanceId="gender"
                name="gender"
                placeholder="Pilih jenis kelamin"
                options={genderOptions}
                value={values.gender ?? null}
                isClearable
                additionalStyle={controlStyle}
                onChange={(val) => setFieldValue('gender', val ?? undefined)}
              />
            </Isian>

            <Isian label="Jabatan" htmlFor="position" opsional ket="Ikut tersalin ke daftar gaji bulan berjalan.">
              <Input
                size="sm"
                id="position"
                name="position"
                placeholder="Kepala Gudang"
                value={values.position}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Isian>
          </Seksi>

          <div className="h-px bg-border-subtle" />

          <Seksi judul="Kontak" ket="dipakai kalau akun loginnya perlu dipulihkan">
            <Isian
              label="Email"
              htmlFor="email"
              wajib
              ket="Dipakai untuk reset kata sandi. Harus unik."
              error={salah('email')}
            >
              <Input
                size="sm"
                id="email"
                name="email"
                type="email"
                placeholder="budi.santoso@gmail.com"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!salah('email') || undefined}
                aria-describedby={salah('email') ? 'email-error' : undefined}
              />
            </Isian>

            <Isian label="Nomor HP" htmlFor="handphoneNumber" wajib error={salah('handphoneNumber')}>
              <PhoneNumberTextField
                ukuran="sm"
                name="handphoneNumber"
                placeholder="81210008007"
                value={values.handphoneNumber}
                hasError={!!salah('handphoneNumber')}
                onChange={(val) => setFieldValue('handphoneNumber', val)}
                onBlur={handleBlur}
              />
            </Isian>
          </Seksi>

          <div className="h-px bg-border-subtle" />

          <Seksi
            judul="Tempat tinggal"
            ket="wilayahnya dipilih berurutan — mengubah yang di atas mengosongkan yang di bawah"
          >
            <Isian label="Provinsi" htmlFor="province" opsional>
              <SelectProvince
                inputId="province"
                instanceId="province"
                name="province"
                placeholder="Pilih provinsi"
                value={values.province ?? null}
                additionalStyle={controlStyle}
                onChange={(val) => {
                  setFieldValue('province', val ?? undefined);
                  setFieldValue('city', undefined);
                  setFieldValue('subdistrict', undefined);
                  setFieldValue('village', undefined);
                }}
              />
            </Isian>

            <Isian label="Kota / Kabupaten" htmlFor="city" opsional>
              <SelectCity
                inputId="city"
                instanceId="city"
                name="city"
                placeholder="Pilih kota"
                provinceId={`${values.province?.value ?? ''}`}
                value={values.city ?? null}
                additionalStyle={controlStyle}
                onChange={(val) => {
                  setFieldValue('city', val ?? undefined);
                  setFieldValue('subdistrict', undefined);
                  setFieldValue('village', undefined);
                }}
              />
            </Isian>

            <Isian label="Kecamatan" htmlFor="subdistrict" opsional>
              <SelectSubdistrict
                inputId="subdistrict"
                instanceId="subdistrict"
                name="subdistrict"
                placeholder="Pilih kecamatan"
                cityId={`${values.city?.value ?? ''}`}
                value={values.subdistrict ?? null}
                additionalStyle={controlStyle}
                onChange={(val) => {
                  setFieldValue('subdistrict', val ?? undefined);
                  setFieldValue('village', undefined);
                }}
              />
            </Isian>

            <Isian label="Kelurahan" htmlFor="village" opsional>
              <SelectVillage
                inputId="village"
                instanceId="village"
                name="village"
                placeholder="Pilih kelurahan"
                subdistrictId={`${values.subdistrict?.value ?? ''}`}
                value={values.village ?? null}
                additionalStyle={controlStyle}
                onChange={(val) => setFieldValue('village', val ?? undefined)}
              />
            </Isian>

            <Isian label="Alamat lengkap" htmlFor="address" wajib penuh error={salah('address')}>
              <TextArea
                name="address"
                rows={3}
                placeholder="Jl. Raya Kaligawe No. 45, RT 03 / RW 07"
                value={values.address}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!salah('address') || undefined}
                className="min-h-[84px]"
              />
            </Isian>
          </Seksi>
        </div>

        <div className="flex min-w-0 flex-col gap-2.5 md:flex-1">
          {/* SPEC E-02 — kendali yang hanya ada di mode ubah */}
          {isEdit && (
            <Kartu judul="Status karyawan" ket="menentukan ia ikut daftar gaji bulan berikutnya atau tidak">
              <Segmented
                // Kartunya flex-col, jadi anaknya diregangkan: tanpa ini kendali dua
                // pilihan melebar selebar kartu dan tombolnya jadi pulau kecil di kiri.
                className="self-start"
                aria-label="Status karyawan"
                options={[
                  { value: 'aktif', label: 'Aktif', tone: 'success' },
                  { value: 'nonaktif', label: 'Nonaktif', tone: 'destructive' },
                ]}
                value={values.aktif ? 'aktif' : 'nonaktif'}
                onChange={(val) => setFieldValue('aktif', val === 'aktif')}
              />
              <p className={pesan(false)}>
                Nonaktif juga menutup aksesnya masuk ke aplikasi. Daftar gaji bulan yang sudah jadi tidak berubah.
              </p>
            </Kartu>
          )}

          {/* SPEC F-08 — gaji hanya bisa diisi pemilik, sama seperti sebelumnya */}
          {isOwner && (
            <Kartu judul="Kepegawaian" ket="yang dipakai daftar gaji tiap bulan">
              <div>
                <Label htmlFor="salary" className="mb-1.25">
                  Gaji per bulan
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-foreground-subtle">
                    Rp
                  </span>
                  <CurrencyTextField
                    prefix=""
                    id="salary"
                    name="salary"
                    placeholder="0"
                    value={values.salary}
                    onChange={(val) => setFieldValue('salary', val ?? 0)}
                    className="h-8 rounded-control pl-8 text-right font-mono tabular-nums"
                  />
                </div>
                <p className={pesan(!!salah('salary'))}>
                  {salah('salary') ??
                    'Hanya pemilik yang bisa mengisi kolom ini. Gaji yang diubah sesudah daftar gaji bulan ini dibuat tidak mengubah daftar yang sudah jadi.'}
                </p>
              </div>
            </Kartu>
          )}

          {/* SPEC F-09 — pratinjau baris daftar, memakai nilai yang sedang diketik */}
          <Kartu judul={isEdit ? 'Tampilannya di daftar sesudah disimpan' : 'Tampilannya nanti di daftar'}>
            <div className="flex items-center gap-2.5 rounded-group bg-surface-raised px-2.75 py-2.25">
              <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-accent-subtle text-2xs font-bold text-accent">
                {inisialKaryawan(values.firstName, values.lastName)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="truncate text-base font-semibold">{nama || 'Nama karyawan'}</span>
                <span className="truncate text-xs text-foreground-muted">{values.position || 'Tanpa jabatan'}</span>
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {values.salary ? formatNumber(values.salary) : '—'}
              </span>
            </div>
            <p className={pesan(false)}>
              {isEdit
                ? 'Daftar gaji bulan yang sudah jadi tidak ikut berubah — perubahan di sini terbawa ke daftar bulan berikutnya.'
                : 'Karyawan baru langsung berstatus aktif, jadi ia ikut masuk daftar gaji bulan berikutnya.'}
            </p>
          </Kartu>

          {/* SPEC F-10 / E-04 — akun login: catatan saat menambah, ringkasan saat mengubah */}
          {isEdit && editingEmployee?.has_dashboard_account ? (
            <Kartu judul="Akun login" aksi={<Badge variant="success">Sudah punya</Badge>}>
              <div className="flex flex-col gap-0.75">
                <div className="flex items-baseline gap-2.5">
                  <span className="w-[76px] shrink-0 text-sm text-foreground-subtle">Username</span>
                  <span className="min-w-0 flex-1 font-mono text-base">{akun?.username ?? '…'}</span>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="w-[76px] shrink-0 text-sm text-foreground-subtle">Peran</span>
                  <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                    {akun?.roles?.length
                      ? akun.roles.map((peran) => (
                          <Badge key={peran.id} variant="accent">
                            {peran.name.replace(/-/g, ' ')}
                          </Badge>
                        ))
                      : '…'}
                  </span>
                </div>
              </div>
              <p className={cn(pesan(false), 'border-t border-border-subtle pt-2.25')}>
                Username dan peran diubah dari halaman detail, bukan dari sini. Email di kolom Kontak yang dipakai untuk
                reset kata sandinya.
              </p>
            </Kartu>
          ) : (
            !isEdit && (
              <Kartu>
                <div className="flex items-start gap-2.25">
                  <Key size={13} strokeWidth={1.8} aria-hidden className="mt-px shrink-0 text-foreground-muted" />
                  <p className="text-xs leading-[1.5] text-foreground-subtle">
                    <b className="text-sm text-foreground">Akun login dibuat terpisah.</b>
                    <br />
                    Menyimpan halaman ini belum memberi orangnya akses masuk. Akunnya dibuat dari halaman detail
                    karyawan, sesudah datanya tersimpan.
                  </p>
                </div>
              </Kartu>
            )
          )}
        </div>
      </div>

      {/* SPEC F-11 — petunjuk tuts */}
      <div className="flex flex-wrap items-center gap-3.5 px-0.5 text-sm">
        <Petunjuk tuts="⌘↵" ket="simpan" />
        <Petunjuk tuts="Esc" ket="batal" />
        <Petunjuk tuts="⌘K" ket="pindah halaman" />
      </div>
    </form>
  );
};

export default CreateEmployeeForm;
