import dayjs from 'dayjs';
import { Key, Pencil, Power, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import CreateAccountDialog from '@/components/employee/CreateAccountDialog';
import DeactivateEmployeeDialog from '@/components/employee/DeactivateEmployeeDialog';
import { inisialKaryawan } from '@/components/employee/EmployeeCardList';
import ReactivateEmployeeDialog from '@/components/employee/ReactivateEmployeeDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Sheet from '@/components/ui/sheet';
import { BarisNilai, Seksi } from '@/components/ui/sheet-section';
import Skeleton from '@/components/ui/skeleton';
import { usePermission } from '@/context/permission-context';
import { useFetchEmployeeById, useFetchMyself } from '@/hooks/query/useFetchEmployee';
import { useFetchUserById } from '@/hooks/query/useFetchUser';
import { cn } from '@/lib/cn';
import { EmployeeData } from '@/typings/employee';
import { formatNumber, formatPhoneNumber } from '@/utils/format';

const KOSONG = '—';

/** "2 tahun 7 bulan" — keterangan yang tidak ada di baris mana pun selain di sini. */
function masaKerja(sejak?: string): string {
  if (!sejak) return KOSONG;
  const mulai = dayjs(sejak);
  const bulan = dayjs().diff(mulai, 'month');
  if (bulan < 1) return `${dayjs().diff(mulai, 'day')} hari`;
  if (bulan < 12) return `${bulan} bulan`;
  const tahun = Math.floor(bulan / 12);
  const sisa = bulan % 12;
  return sisa ? `${tahun} th ${sisa} bln` : `${tahun} tahun`;
}

/**
 * Rincian karyawan sebagai sheet kanan — bentuk yang sama dengan rincian penjualan,
 * barang masuk, customer, dan supplier.
 *
 * Menggantikan halaman `/employee/[id]`: isinya tidak sampai satu layar penuh, dan
 * membuka halaman berarti kehilangan tempat di daftar — padahal yang dilakukan orang di
 * sini memeriksa beberapa orang berturut-turut. Daftarnya tetap terlihat di belakang.
 *
 * Baris daftar hanya membawa nama, jabatan, gaji, dan status akun; KTP, alamat, dan peran
 * akun baru datang dari `GET /employees/{id}` — diminta hanya saat sheet-nya terbuka.
 */
export function EmployeeDetailSheet({
  employee,
  open,
  onClose,
  onClosed,
}: {
  employee: EmployeeData;
  open: boolean;
  /** Dipanggil saat pengguna menutup — sheet mulai menggeser keluar. */
  onClose: () => void;
  /** Dipanggil setelah animasi keluar selesai; di sinilah datanya baru boleh dibuang. */
  onClosed?: () => void;
}): JSX.Element {
  const { push } = useRouter();
  const { state } = usePermission();
  const { data: dataSaya } = useFetchMyself();

  const [menonaktifkan, setMenonaktifkan] = useState(false);
  const [mengaktifkan, setMengaktifkan] = useState(false);
  const [membuatAkun, setMembuatAkun] = useState(false);

  const { data, isLoading } = useFetchEmployeeById(employee.id, { enabled: open });
  const detail = data?.data?.employee;

  const { data: dataUser } = useFetchUserById(detail?.user?.id ?? '', {
    enabled: open && !!detail?.user?.id,
  });
  const akun = dataUser?.data?.user;

  // Nama, jabatan, gaji, dan status sudah ada di baris daftarnya — dipakai lebih dulu
  // supaya kepala sheet terisi seketika, lalu ditimpa data lengkapnya begitu datang.
  const nama = `${detail?.first_name ?? employee.first_name ?? ''} ${
    detail?.last_name ?? employee.last_name ?? ''
  }`.trim();
  const jabatan = detail?.position ?? employee.position;
  const nonaktif = (detail?.active ?? employee.active) === false;
  const punyaAkun = detail?.has_dashboard_account ?? employee.has_dashboard_account;
  const gaji = +(detail?.salary ?? employee.salary ?? 0);
  const bergabung = detail?.created_at ?? (employee.created_at as unknown as string | undefined);

  const alamat = detail?.addresses?.find((val) => val.title === 'Alamat Rumah') ?? detail?.addresses?.[0];
  const kelurahan = alamat?.village;
  const kecamatan = kelurahan?.subdistrict;
  const kota = kecamatan?.city;
  const wilayah = [
    kelurahan?.name && `Kelurahan ${kelurahan.name}`,
    kecamatan?.name && `Kecamatan ${kecamatan.name}`,
    kota?.name,
    kota?.province?.name,
  ]
    .filter(Boolean)
    .join(', ');

  const sayaSendiri = !!detail?.id && detail.id === dataSaya?.data?.user?.employee?.id;
  const bolehMengubah = state.permission.includes('control:profile') || sayaSendiri;

  const jenisKelamin = () => {
    if (detail?.gender === 'male') return 'Laki-laki';
    if (detail?.gender === 'female') return 'Perempuan';
    return detail?.gender || KOSONG;
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        onClosed={onClosed}
        width="w-[420px]"
        title={
          <span className="flex min-w-0 items-center gap-2.25">
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-xs font-bold text-accent',
                nonaktif && 'opacity-60'
              )}
            >
              {inisialKaryawan(detail?.first_name ?? employee.first_name, detail?.last_name ?? employee.last_name)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="flex items-center gap-2">
                <span className="truncate text-lg font-semibold leading-tight">{nama || 'Karyawan'}</span>
                {nonaktif ? <Badge variant="neutral">Nonaktif</Badge> : <Badge variant="success">Aktif</Badge>}
              </span>
              <span className="truncate text-xs leading-tight text-foreground-subtle">
                {jabatan || 'Tanpa jabatan'}
                {bergabung ? ` · bergabung ${dayjs(bergabung).format('DD MMM YYYY')}` : ''}
              </span>
            </span>
          </span>
        }
        actions={
          bolehMengubah ? (
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={`Ubah ${nama}`}
              tooltip="Ubah"
              onClick={() => push(`/employee/${employee.id}/edit`)}
            >
              <Pencil strokeWidth={1.8} aria-hidden />
            </Button>
          ) : undefined
        }
        // Pita aksi khusus yang MENGUBAH keadaan — aturan yang sudah ditulis di Sheet.
        toolbar={
          bolehMengubah ? (
            <>
              {nonaktif ? (
                <Button size="xs" variant="outline" onClick={() => setMengaktifkan(true)}>
                  <RotateCcw strokeWidth={1.9} aria-hidden /> Aktifkan lagi
                </Button>
              ) : (
                <Button size="xs" variant="destructive-outline" onClick={() => setMenonaktifkan(true)}>
                  <Power strokeWidth={1.9} aria-hidden /> Nonaktifkan
                </Button>
              )}
              <span className="text-xs text-foreground-subtle">
                {nonaktif ? 'tidak ikut daftar gaji bulan berikutnya' : 'ikut daftar gaji bulan berikutnya'}
              </span>
            </>
          ) : undefined
        }
        footer={
          detail?.updated_at ? (
            <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-surface-raised px-4 py-2 text-xs text-foreground-subtle">
              <span>Terakhir diubah</span>
              <span className="font-mono">{dayjs(detail.updated_at).format('DD/MM/YYYY')}</span>
            </div>
          ) : undefined
        }
      >
        {/* Angka yang dibawa orang ke layar ini: gaji sebulan. Nonaktif tidak menampilkannya —
            ia tidak ikut dibuatkan baris gaji, jadi angkanya akan terbaca seperti tagihan
            yang masih berjalan. */}
        <div className="border-b border-border-subtle px-4 py-3.25">
          <div className="text-xs text-foreground-subtle">Gaji per bulan</div>
          <div
            className={cn(
              'mt-0.5 font-mono text-xl font-bold tracking-[-0.02em]',
              nonaktif ? 'text-foreground-subtle' : 'text-foreground'
            )}
          >
            {nonaktif || !gaji ? KOSONG : `Rp ${formatNumber(gaji)}`}
          </div>

          {/* Satu angka pendamping saja. Username tidak ikut di sini: seksi Akun login di
              bawah sudah menyebutnya, dan dua kali di satu layar membuat yang kedua
              terbaca seperti nilai yang berbeda. */}
          <div className="mt-2.25">
            <div className="text-xs text-foreground-subtle">Masa kerja</div>
            <div className="font-mono font-semibold tabular-nums">{masaKerja(bergabung)}</div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2.5 px-4 py-3">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ) : (
          <>
            <Seksi title="Akun login">
              {punyaAkun ? (
                <div className="flex flex-col gap-0.75">
                  <BarisNilai label="Username" value={akun?.username ?? '…'} />
                  <BarisNilai
                    label="Dibuat"
                    value={akun?.created_at ? dayjs(akun.created_at).format('DD MMM YYYY') : '…'}
                  />
                  <BarisNilai
                    label="Peran"
                    mono={false}
                    value={
                      akun?.roles?.length ? (
                        <span className="flex flex-wrap justify-end gap-1">
                          {akun.roles.map((peran) => (
                            <Badge key={peran.id} variant="accent">
                              {peran.name.replace(/-/g, ' ')}
                            </Badge>
                          ))}
                        </span>
                      ) : (
                        '…'
                      )
                    }
                  />
                </div>
              ) : (
                <div className="flex flex-col items-start gap-1.75">
                  <p className="text-sm text-foreground-subtle">
                    Belum punya akun, jadi ia belum bisa masuk ke aplikasi ini.
                  </p>
                  {bolehMengubah && !nonaktif && (
                    <Button size="xs" variant="outline" onClick={() => setMembuatAkun(true)}>
                      <Key strokeWidth={1.8} aria-hidden /> Buat akun login
                    </Button>
                  )}
                </div>
              )}
            </Seksi>

            <Seksi title="Data pribadi">
              <div className="flex flex-col gap-0.75">
                <BarisNilai label="Nomor KTP" value={detail?.nik || KOSONG} />
                <BarisNilai
                  label="Tanggal lahir"
                  mono={false}
                  value={detail?.birth_date ? dayjs(detail.birth_date).format('DD MMM YYYY') : KOSONG}
                />
                <BarisNilai label="Jenis kelamin" mono={false} value={jenisKelamin()} />
                <BarisNilai label="Email" mono={false} value={detail?.email || KOSONG} />
                <BarisNilai label="Nomor HP" value={formatPhoneNumber(detail?.phone_number) || KOSONG} />
              </div>
            </Seksi>

            <Seksi title="Tempat tinggal">
              <div className="flex flex-col gap-0.75">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="shrink-0 text-foreground-muted">Alamat</span>
                  <span className="text-right">{alamat?.complete_address || KOSONG}</span>
                </div>
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="shrink-0 text-foreground-muted">Wilayah</span>
                  <span className="text-right">{wilayah || KOSONG}</span>
                </div>
              </div>
            </Seksi>
          </>
        )}
      </Sheet>

      {/* Di luar <Sheet>: dialog yang dirender DI DALAMNYA ikut hilang begitu sheet-nya
          menutup — dan menutup sheet persis yang terjadi sesudah aksinya berhasil. */}
      <DeactivateEmployeeDialog
        employeeId={employee.id}
        nama={nama}
        isOpen={menonaktifkan}
        onClose={() => setMenonaktifkan(false)}
      />
      <ReactivateEmployeeDialog
        employeeId={employee.id}
        nama={nama}
        isOpen={mengaktifkan}
        onClose={() => setMengaktifkan(false)}
      />
      <CreateAccountDialog
        employeeId={employee.id}
        nama={nama}
        isOpen={membuatAkun}
        onClose={() => setMembuatAkun(false)}
        onSuccess={() => setMembuatAkun(false)}
      />
    </>
  );
}

export default EmployeeDetailSheet;
