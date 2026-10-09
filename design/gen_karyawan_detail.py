# Generator artboard "Tambah/Ubah Karyawan" (/employee/add, /employee/[id]/edit) dan
# "Detail Karyawan" (/employee/[id]).
#
# Yang dipecahkan di FORMULIR (CreateEmployeeForm, dipakai kedua route):
#  1. Dua jenis label bercampur dalam satu formulir: `<Label required>` untuk field wajib
#     dan `<label className="mb-1 inline-block">` mentah untuk sisanya. Yang kedua
#     inline-block, jadi kontrol di bawahnya turun ±4px — di grid dua kolom, field
#     bersebelahan jadi tidak pernah sejajar.
#  2. Jenis kelamin memakai `react-select` MENTAH, bukan ThemedSelect milik project: ia
#     tidak ikut token, tidak ikut tinggi 32px, dan di mode gelap tampil putih.
#  3. Pesan error memakai `text-red-500` mentah, bukan token destructive.
#  4. Tanggal lahir bawaannya `new Date()` — hari ini. Karyawan baru selalu lahir hari ini
#     sampai ada yang menggantinya.
#  5. State memuat saat mengubah data: harfiah `<div>Loading...</div>`.
#  6. `active: true` DIPAKU di badan submit. Menyimpan perubahan atas karyawan yang
#     nonaktif diam-diam mengaktifkannya kembali — tanpa ada kendali apa pun di layar.
#  7. `nik` dan `email` unik di database, tapi layarnya tidak pernah menyebutkannya; yang
#     muncul saat bentrok adalah pesan mentah dari backend.
#
# Yang dipecahkan di DETAIL:
#  8. Foto 240x240 dari `/images/employee.png` — gambar yang sama persis untuk semua orang,
#     memakan sepertiga layar tanpa memberi keterangan apa pun.
#  9. Tombolnya berbunyi "Deactivate" di antarmuka yang seluruhnya berbahasa Indonesia.
# 10. Isinya dipecah jadi dua tab padahal tab keduanya cuma berisi tiga baris.
# 11. "Akun belum diaktifkan, Aktifkan sekarang" — sebuah <span> biru yang berperan sebagai
#     tombol, tanpa bentuk tombol.
# 12. Halaman ini tahu gaji orangnya, tapi tidak pernah menautkannya ke Gaji Karyawan.
import _shell as S
import gen_audit as A
import gen_karyawan as K

RP = K.RP

ORANG = dict(
    nama='Budi Santoso',
    jabatan='Kepala Gudang',
    gaji=3_500_000,
    ktp='3374091205920003',
    lahir='12 Mei 1992',
    kelamin='Laki-laki',
    email='budi.santoso@gmail.com',
    hp='62 812-1000-8007',
    alamat='Jl. Raya Kaligawe No. 45, RT 03 / RW 07',
    wilayah='Kelurahan Kaligawe, Kecamatan Gayamsari, Kota Semarang, Jawa Tengah',
    bergabung='4 Mar 2024',
    username='budi_santoso',
    akun_dibuat='4 Mar 2024',
    peran=['admin'],
)


# ── Bagian formulir ──────────────────────────────────────────────────────────
def label(teks, wajib=False, opsional=False):
    bintang = '<span style="color:var(--destructive);margin-left:2px">*</span>' if wajib else ''
    tambahan = ('<span style="color:var(--foreground-subtle);font-weight:400;margin-left:5px">opsional</span>'
                if opsional else '')
    return (f'<div style="font-size:12px;font-weight:500;color:var(--foreground-muted);margin-bottom:5px">'
            f'{teks}{bintang}{tambahan}</div>')


def kotak(isi, ikon=None, kanan=None, error=False, fokus=False, kosong=True):
    """Satu kontrol setinggi 32px. Semua kontrol di halaman ini tingginya sama —
    formulir lama mencampur 44px (react-select mentah) dengan 36px (TextField)."""
    garis = 'var(--destructive)' if error else ('var(--accent)' if fokus else 'var(--border-strong)')
    ring = ''
    if fokus:
        ring = ';box-shadow:0 0 0 3px hsl(256 82% 70% / 0.18)'
    elif error:
        ring = ';box-shadow:0 0 0 3px hsl(2 80% 69% / 0.16)'
    warna = 'var(--foreground-subtle)' if kosong else 'var(--foreground)'
    ikon_html = (f'<span style="display:flex;color:var(--foreground-subtle);flex-shrink:0">{S.svg(ikon, 13, 1.8)}</span>'
                 if ikon else '')
    kanan_html = (f'<span style="display:flex;color:var(--foreground-subtle);flex-shrink:0">{kanan}</span>'
                  if kanan else '')
    return (f'<div class="field" style="width:100%;border-color:{garis}{ring}">'
            f'{ikon_html}<span style="flex:1;font-size:13px;color:{warna};overflow:hidden;'
            f'text-overflow:ellipsis;white-space:nowrap">{isi}</span>{kanan_html}</div>')


def pesan(teks, nada='var(--foreground-subtle)'):
    return f'<div style="font-size:11px;color:{nada};margin-top:5px;line-height:1.45">{teks}</div>'


def isian(teks, kontrol, ket='', wajib=False, opsional=False, error='', rentang=1):
    span = f'grid-column:span {rentang}' if rentang > 1 else ''
    bawah = pesan(error, 'var(--destructive)') if error else (pesan(ket) if ket else '')
    return f'''          <div style="{span}">
{label(teks, wajib, opsional)}
            {kontrol}
            {bawah}
          </div>'''


def seksi(judul, ket, isian_html, kolom=2):
    return f'''      <div style="display:flex;flex-direction:column;gap:9px">
        <div>
          <div style="font-size:13px;font-weight:700">{judul}</div>
          <div style="font-size:11px;color:var(--foreground-subtle);margin-top:1px">{ket}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat({kolom},minmax(0,1fr));gap:11px 12px">
{isian_html}
        </div>
      </div>'''


PILIH = S.svg('down2', 13, 1.9) if 'down2' in S.ICONS else S.svg('cal', 13, 1.8)
S.ICONS.setdefault('down2', '<path d="m6 9 6 6 6-6"/>')
S.ICONS.setdefault('link', '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/>'
                           '<path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>')
S.ICONS.setdefault('key', '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v4M15.5 12v3"/>')


def kartu_form(error=False):
    identitas = '\n'.join([
        isian('Nama depan', kotak('Budi', kosong=False), wajib=True),
        isian('Nama belakang', kotak('Santoso', kosong=False), wajib=True),
        isian('Nomor KTP', kotak('3374091205920003', kosong=False), wajib=True,
              ket='16 digit. Tidak boleh sama dengan karyawan lain.'),
        # Tanggal lahir TIDAK diisi hari ini: bawaan lama membuat tiap karyawan baru
        # lahir pada tanggal ia didaftarkan.
        isian('Tanggal lahir', kotak('Pilih tanggal', ikon='cal'), opsional=True),
        isian('Jenis kelamin', kotak('Laki-laki', kanan=S.svg('down2', 13, 1.9), kosong=False), opsional=True),
        isian('Jabatan', kotak('Kepala Gudang', kosong=False), opsional=True,
              ket='Ikut tersalin ke daftar gaji bulan berjalan.'),
    ])
    kontak = '\n'.join([
        isian('Email', kotak('budi.santoso@gmail.com', kosong=False), wajib=True,
              ket='Dipakai untuk reset kata sandi. Harus unik.'),
        isian('Nomor HP', kotak('62 812-1000-8007', kosong=False), wajib=True),
    ])
    tinggal = '\n'.join([
        isian('Provinsi', kotak('Jawa Tengah', kanan=S.svg('down2', 13, 1.9), kosong=False), opsional=True),
        isian('Kota / Kabupaten', kotak('Kota Semarang', kanan=S.svg('down2', 13, 1.9), kosong=False), opsional=True),
        isian('Kecamatan', kotak('Gayamsari', kanan=S.svg('down2', 13, 1.9), kosong=False), opsional=True),
        isian('Kelurahan', kotak('Kaligawe', kanan=S.svg('down2', 13, 1.9), kosong=False), opsional=True),
        isian('Alamat lengkap', f'''<div style="border:1px solid var(--border-strong);border-radius:7px;
            padding:8px 10px;min-height:56px;font-size:13px;background:var(--surface)">
            Jl. Raya Kaligawe No. 45, RT 03 / RW 07</div>''', wajib=True, rentang=2),
    ])

    return f'''    <div class="card" style="flex:1.6;min-width:0;padding:16px 18px;display:flex;flex-direction:column;gap:16px">
{seksi('Identitas', 'nama dan nomor KTP dipakai untuk mencari orangnya di seluruh aplikasi', identitas)}
      <div style="height:1px;background:var(--border-subtle)"></div>
{seksi('Kontak', 'dipakai kalau akun loginnya perlu dipulihkan', kontak)}
      <div style="height:1px;background:var(--border-subtle)"></div>
{seksi('Tempat tinggal', 'wilayahnya dipilih berurutan — mengubah yang di atas mengosongkan yang di bawah', tinggal)}
    </div>'''


def kartu_gaji():
    return f'''      <div class="card" style="padding:14px 16px;display:flex;flex-direction:column;gap:9px">
        <div>
          <div style="font-size:13px;font-weight:700">Kepegawaian</div>
          <div style="font-size:11px;color:var(--foreground-subtle);margin-top:1px">yang dipakai daftar gaji
            tiap bulan</div>
        </div>
{label('Gaji per bulan')}
        {kotak('3.500.000', ikon=None, kanan=None, kosong=False).replace(
            '<span style="flex:1;font-size:13px;color:var(--foreground);',
            '<span style="color:var(--foreground-subtle);font-size:12px;margin-right:2px">Rp</span>'
            '<span class="mono" style="flex:1;font-size:13px;text-align:right;color:var(--foreground);')}
{pesan('Hanya pemilik yang bisa mengisi kolom ini. Gaji yang diubah sesudah daftar gaji bulan ini dibuat '
       'tidak mengubah daftar yang sudah jadi.')}
      </div>'''


def kartu_pratinjau(mode='tambah'):
    judul = 'Tampilannya nanti di daftar' if mode == 'tambah' else 'Tampilannya di daftar sesudah disimpan'
    catatan = ('Karyawan baru langsung berstatus aktif, jadi ia ikut masuk daftar gaji bulan berikutnya.'
               if mode == 'tambah' else
               'Daftar gaji bulan yang sudah jadi tidak ikut berubah — perubahan di sini terbawa ke daftar '
               'bulan berikutnya.')
    return f'''      <div class="card" style="padding:14px 16px;display:flex;flex-direction:column;gap:9px">
        <div style="font-size:13px;font-weight:700">{judul}</div>
        <div style="display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;
          background:var(--surface-raised)">
          {K.inisial('Budi Santoso', 30)}
          <div style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1">
            <span style="font-size:13px;font-weight:600">Budi Santoso</span>
            <span style="font-size:11px;color:var(--foreground-muted)">Kepala Gudang</span>
          </div>
          <span class="mono" style="font-size:12px;font-weight:600">{RP(3_500_000)}</span>
        </div>
{pesan(catatan)}
      </div>'''


def kartu_akun():
    return f'''      <div class="card" style="padding:14px 16px;display:flex;gap:9px;align-items:flex-start">
        {K.ikon_tetap('key', 13, warna='var(--foreground-muted)')}
        <div style="font-size:11px;color:var(--foreground-subtle);line-height:1.5">
          <b style="color:var(--foreground);font-size:12px">Akun login dibuat terpisah.</b><br>
          Menyimpan halaman ini belum memberi orangnya akses masuk. Akunnya dibuat dari halaman detail
          karyawan, sesudah datanya tersimpan.
        </div>
      </div>'''


def kartu_status():
    """Kendali yang hanya ada di mode ubah. Badan submit lama memaku `active: true`,
    jadi menyimpan karyawan nonaktif mengaktifkannya lagi tanpa ada yang memintanya."""
    return f'''      <div class="card" style="padding:14px 16px;display:flex;flex-direction:column;gap:9px">
        <div>
          <div style="font-size:13px;font-weight:700">Status karyawan</div>
          <div style="font-size:11px;color:var(--foreground-subtle);margin-top:1px">menentukan ia ikut daftar
            gaji bulan berikutnya atau tidak</div>
        </div>
        {K.segmen(['Aktif', 'Nonaktif'], 'Aktif', {'Aktif': 'success', 'Nonaktif': 'destructive'})}
{pesan('Nonaktif juga menutup aksesnya masuk ke aplikasi. Daftar gaji bulan yang sudah jadi tidak berubah.')}
      </div>'''


def baris_kartu(label_teks, nilai, lebar=76):
    """Pasangan label-nilai di dalam kartu formulir: label kiri berlebar tetap."""
    return f'''        <div style="display:flex;gap:10px;align-items:baseline;min-width:0">
          <span style="width:{lebar}px;flex-shrink:0;font-size:12px;color:var(--foreground-subtle)">{label_teks}</span>
          <span style="flex:1;min-width:0;font-size:13px">{nilai}</span>
        </div>'''


def kartu_akun_ubah():
    peran = ''.join(A.pill(p, 'accent') for p in ORANG['peran'])
    return f'''      <div class="card" style="padding:14px 16px;display:flex;flex-direction:column;gap:9px">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px">
          <span style="font-size:13px;font-weight:700">Akun login</span>
          {A.pill('Sudah punya', 'success', 'check')}
        </div>
        <div style="display:flex;flex-direction:column">
{baris_kartu('Username', f'<span class="mono">{ORANG["username"]}</span>')}
{baris_kartu('Peran', peran)}
        </div>
        <div style="border-top:1px solid var(--border-subtle);padding-top:9px">
{pesan('Username dan peran diubah dari halaman detail, bukan dari sini. Email di kolom Kontak yang dipakai '
       'untuk reset kata sandinya.')}
        </div>
      </div>'''


def kepala_form(mode):
    """Judul halaman. Mode ubah menyebut siapa yang sedang diubah — formulir lama cuma
    berbunyi "Edit Karyawan" tanpa nama, jadi tidak ada cara memastikan orangnya benar."""
    if mode == 'tambah':
        return f'''          <div style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:15px;font-weight:700">Tambah karyawan</span>
            <span style="font-size:12px;color:var(--foreground-subtle)">Data ini dipakai untuk menyusun daftar
              gaji tiap bulan, dan untuk membuat akun loginnya nanti.</span>
          </div>'''
    return f'''          <div style="display:flex;align-items:center;gap:11px;min-width:0">
            {K.inisial(ORANG['nama'], 36)}
            <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span style="font-size:15px;font-weight:700">Ubah {ORANG['nama']}</span>
              <span style="font-size:12px;color:var(--foreground-subtle)">{ORANG['jabatan']} · bergabung
                {ORANG['bergabung']} · KTP <span class="mono">{ORANG['ktp']}</span></span>
            </div>
          </div>'''


def halaman_form(mode='tambah'):
    tambah = mode == 'tambah'
    judul_crumb = 'Tambah karyawan' if tambah else ORANG['nama']
    simpan = 'Simpan karyawan' if tambah else 'Simpan perubahan'
    kanan = (kartu_gaji() + '\n' + kartu_pratinjau(mode) + '\n' + kartu_akun() if tambah else
             kartu_status() + '\n' + kartu_gaji() + '\n' + kartu_pratinjau(mode) + '\n' + kartu_akun_ubah())
    return f'''  <div style="display:flex;height:100%">
{S.sidebar('Karyawan')}
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
{S.topbar('Karyawan', judul_crumb)}
      <div style="flex:1;min-height:0;padding:16px 20px;display:flex;flex-direction:column;gap:11px;overflow:hidden">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
{kepala_form(mode)}
          <div style="display:flex;align-items:center;gap:7px;flex-shrink:0">
            <span class="btn ghost sm">Batal</span>
            <span class="btn sm">{S.svg('check', 13, 2.2)}{simpan}</span>
          </div>
        </div>

        <div style="display:flex;gap:12px;align-items:flex-start;min-height:0;flex:1">
{kartu_form()}
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px">
{kanan}
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:14px;font-size:12px;padding:0 2px">
{A.petunjuk('⌘↵', 'simpan')}
{A.petunjuk('Esc', 'batal')}
{A.petunjuk('⌘K', 'pindah halaman')}
        </div>
      </div>
    </div>
  </div>'''


# ── Keadaan formulir ─────────────────────────────────────────────────────────
def blok_validasi():
    isi = '\n'.join([
        isian('Nama depan', kotak('Nama depan', error=True), wajib=True, error='Nama depan wajib diisi.'),
        isian('Nomor KTP', kotak('337409120592', error=True, kosong=False), wajib=True,
              error='Nomor KTP harus 16 digit — yang diisi baru 12.'),
        isian('Email', kotak('budi.santoso@gmail.com', error=True, kosong=False), wajib=True,
              error='Email ini sudah dipakai karyawan lain.'),
    ])
    return f'''      <div class="card" style="width:620px;padding:16px 18px">
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px 12px">
{isi}
        </div>
      </div>'''


def blok_ubah():
    return f'''      <div class="card" style="width:560px;padding:16px 18px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:10px">
          {K.inisial('Tono Prasetyo', 30)}
          <div style="display:flex;flex-direction:column;gap:1px;flex:1;min-width:0">
            <span style="font-size:13px;font-weight:600">Tono Prasetyo</span>
            <span style="font-size:11px;color:var(--foreground-muted)">Staf Gudang · nonaktif sejak 12 Jul 2026</span>
          </div>
        </div>
        <div>
{label('Status karyawan')}
          {K.segmen(['Aktif', 'Nonaktif'], 'Nonaktif', {'Aktif': 'success', 'Nonaktif': 'destructive'})}
{pesan('Nonaktif berarti tidak ikut dibuatkan baris gaji bulan berikutnya.')}
        </div>
        <div style="display:flex;gap:8px;align-items:flex-start;padding:9px 11px;border-radius:9px;
          background:var(--warning-subtle);color:var(--warning);font-size:12px;line-height:1.45">
          {K.ikon_tetap('warn2')}
          <span>Sekarang kendali ini belum ada sama sekali: badan submit memaku
          <span class="mono" style="font-size:11px">active: true</span>, jadi menyimpan perubahan atas karyawan
          nonaktif diam-diam mengaktifkannya lagi.</span>
        </div>
      </div>'''


def kolom_sempit():
    isi = '\n'.join([
        isian('Nama depan', kotak('Budi', kosong=False), wajib=True),
        isian('Nama belakang', kotak('Santoso', kosong=False), wajib=True),
        isian('Nomor KTP', kotak('3374091205920003', kosong=False), wajib=True),
        isian('Jabatan', kotak('Kepala Gudang', kosong=False), opsional=True),
    ])
    return f'''      <div style="width:360px;display:flex;flex-direction:column;gap:9px">
        <div class="card" style="padding:14px 16px">
          <div style="font-size:13px;font-weight:700;margin-bottom:9px">Identitas</div>
          <div style="display:grid;grid-template-columns:minmax(0,1fr);gap:11px">
{isi}
          </div>
        </div>
        <div style="display:flex;gap:7px">
          <span class="btn ghost sm" style="flex:1;justify-content:center">Batal</span>
          <span class="btn sm" style="flex:1;justify-content:center">Simpan</span>
        </div>
      </div>'''


def keadaan_form():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:22px">
    <div>
{A.judul_blok('Validasi yang menyebut angkanya', 'bukan "field ini wajib" yang sama untuk semua')}
{blok_validasi()}
    </div>
    <div>
{A.judul_blok('Mode ubah punya satu kendali tambahan', 'status karyawan — yang sekarang tidak ada di layar mana pun')}
{blok_ubah()}
    </div>
    <div>
{A.judul_blok('Layar sempit', 'dua kolom jadi satu, tombol jadi selebar layar')}
{kolom_sempit()}
    </div>
  </div>'''


# ── Detail karyawan: sheet kanan, bukan halaman sendiri ──────────────────────
# Rincian customer dan supplier di aplikasi ini SUDAH berupa sheet kanan
# (CustomerDetailSheet, SupplierDetailSheet) — keduanya dulu modal, dan modalnya dibuang
# karena cuma mengulang kolom yang sudah terlihat di tabel. Karyawan jenis data yang sama,
# jadi bentuknya mengikuti dua saudaranya: daftar tetap terlihat di belakang, satu baris
# bisa dibuka-tutup beruntun tanpa pindah halaman, dan isi sepanjang apa pun bergulir di
# dalam sheet tanpa mengubah ukurannya.
def seksi_sheet(judul, isi_html, kanan='', terakhir=False):
    garis = '' if terakhir else 'border-bottom:1px solid var(--border-subtle);'
    kanan_html = kanan or ''
    return f'''        <div style="{garis}padding:11px 16px">
          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:7px">
            <span class="eyebrow">{judul}</span>{kanan_html}
          </div>
          <div style="display:flex;flex-direction:column;gap:5px">
{isi_html}
          </div>
        </div>'''


def baris(label_teks, nilai, mono=False, tumpuk=False):
    """Label kiri redup, nilai kanan — pola `BarisNilai` milik sheet yang sudah ada.
    `tumpuk` untuk nilai panjang (alamat): nilainya turun ke baris sendiri, rata kiri,
    supaya tidak dipaksa muat di separuh lebar sheet."""
    kelas = ' class="mono"' if mono else ''
    if tumpuk:
        return f'''            <div style="display:flex;flex-direction:column;gap:2px;font-size:12px">
              <span style="color:var(--foreground-muted)">{label_teks}</span>
              <span{kelas} style="font-size:13px;line-height:1.45">{nilai}</span>
            </div>'''
    return f'''            <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;
              font-size:12px">
              <span style="color:var(--foreground-muted);flex-shrink:0">{label_teks}</span>
              <span{kelas} style="font-weight:500;text-align:right;min-width:0;overflow:hidden;
                text-overflow:ellipsis;white-space:nowrap">{nilai}</span>
            </div>'''


def tautan_gaji(bentuk='tenang'):
    if bentuk == 'ikon':
        return (f'<span class="ico" style="width:22px;height:22px;border:0;color:var(--foreground-muted)">'
                f'{S.svg("ext", 13, 1.8)}</span>')
    if bentuk == 'aksen':
        return (f'<a style="display:inline-flex;align-items:center;gap:5px;font-size:12px">'
                f'Lihat di Gaji Karyawan{S.svg("right", 12, 2)}</a>')
    return ('<a class="tautan-tenang" style="display:inline-flex;align-items:center;gap:3px;font-size:11px;'
            'color:var(--foreground-muted)">Gaji Karyawan' + S.svg('chev', 10, 2) + '</a>')


S.ICONS.setdefault('right', '<path d="M5 12h14M13 6l6 6-6 6"/>')
S.ICONS.setdefault('chev', '<path d="m9 6 6 6-6 6"/>')
S.ICONS.setdefault('ext', '<path d="M14 4h6v6"/><path d="M20 4 11 13"/>'
                          '<path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>')
S.ICONS.setdefault('x', '<path d="M18 6 6 18M6 6l12 12"/>')


def kepala_sheet(nonaktif=False):
    """Tinggi 48px, sama dengan sheet rincian lain. Nama + lencana di baris pertama,
    jabatan dan tanggal bergabung di baris kedua."""
    redup = 'opacity:.6;' if nonaktif else ''
    lencana = A.pill('Nonaktif', 'muted') if nonaktif else A.pill('Aktif', 'success', 'check')
    return f'''      <div style="height:48px;flex-shrink:0;border-bottom:1px solid var(--border);display:flex;
        align-items:center;justify-content:space-between;gap:12px;padding:0 16px">
        <div style="display:flex;align-items:center;gap:9px;{redup}min-width:0">
          {K.inisial(ORANG['nama'], 26)}
          <div style="display:flex;flex-direction:column;gap:1px;min-width:0">
            <div style="display:flex;align-items:center;gap:7px">
              <span style="font-size:13px;font-weight:700">{ORANG['nama']}</span>
              {lencana}
            </div>
            <span style="font-size:11px;color:var(--foreground-subtle)">{ORANG['jabatan']} ·
              bergabung {ORANG['bergabung']}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">
          <span class="ico" style="width:26px;height:26px">{S.svg('pencil', 13, 1.8)}</span>
          <span class="ico" style="width:26px;height:26px;border:0">{S.svg('x', 13, 2)}</span>
        </div>
      </div>'''


def toolbar_sheet(nonaktif=False):
    """Aksi yang BERGANTUNG KEADAAN tempatnya di toolbar, bukan di kepala — aturan yang
    sudah ditulis di komponen Sheet-nya sendiri."""
    tombol = ('<span class="btn sm">' + S.svg('redo', 13, 1.9) + 'Aktifkan lagi</span>' if nonaktif else
              '<span class="btn ghost sm" style="border-color:var(--destructive);color:var(--destructive)">'
              + S.svg('power', 13, 1.9) + 'Nonaktifkan</span>')
    ket = ('<span style="font-size:11px;color:var(--foreground-subtle)">tidak ikut daftar gaji bulan berikutnya'
           '</span>' if nonaktif else '')
    return f'''      <div style="flex-shrink:0;border-bottom:1px solid var(--border);padding:7px 16px;display:flex;
        align-items:center;gap:9px">{tombol}{ket}</div>'''


def isi_sheet(punya_akun=True):
    kerja = '\n'.join([
        baris('Gaji per bulan', f'<span class="mono" style="font-weight:600">{RP(ORANG["gaji"])}</span>'),
        baris('Jabatan', ORANG['jabatan']),
        baris('Bergabung', ORANG['bergabung']),
    ])
    if punya_akun:
        akun = '\n'.join([
            baris('Username', ORANG['username'], mono=True),
            baris('Dibuat', ORANG['akun_dibuat']),
            baris('Peran', ''.join(A.pill(p, 'accent') for p in ORANG['peran'])),
        ])
        seksi_akun = seksi_sheet('Akun login', akun)
    else:
        kosong = '''            <div style="display:flex;flex-direction:column;gap:7px;align-items:flex-start">
              <span style="font-size:12px;color:var(--foreground-muted)">Belum punya akun, jadi ia belum bisa
                masuk ke aplikasi ini.</span>
              <span class="btn sm">Buat akun login</span>
            </div>'''
        seksi_akun = seksi_sheet('Akun login', kosong)

    pribadi = '\n'.join([
        baris('Nomor KTP', ORANG['ktp'], mono=True),
        baris('Tanggal lahir', ORANG['lahir']),
        baris('Jenis kelamin', ORANG['kelamin']),
        baris('Email', ORANG['email']),
        baris('Nomor HP', ORANG['hp'], mono=True),
    ])
    tinggal = '\n'.join([
        baris('Alamat', ORANG['alamat'], tumpuk=True),
        baris('Wilayah', ORANG['wilayah'], tumpuk=True),
    ])
    return (seksi_sheet('Kepegawaian', kerja, kanan=tautan_gaji())
            + '\n' + seksi_akun
            + '\n' + seksi_sheet('Data pribadi', pribadi)
            + '\n' + seksi_sheet('Tempat tinggal', tinggal, terakhir=True))


def sheet(nonaktif=False, punya_akun=True, lebar=420, tinggi='100%'):
    return f'''    <div style="position:absolute;top:0;right:0;bottom:0;width:{lebar}px;height:{tinggi};
      background:var(--surface);border-left:1px solid var(--border);box-shadow:var(--shadow-md);
      display:flex;flex-direction:column;z-index:2">
{kepala_sheet(nonaktif)}
{toolbar_sheet(nonaktif)}
      <div style="flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column">
{isi_sheet(punya_akun)}
      </div>
    </div>'''


def halaman_detail():
    """Daftar karyawan dengan sheet rincian terbuka di atasnya — itulah seluruh layarnya;
    tidak ada lagi rute /employee/[id] yang berdiri sendiri."""
    return f'''  <div style="position:relative;height:100%;overflow:hidden">
{K.halaman_karyawan()}
    <div style="position:absolute;inset:0;background:hsl(240 20% 6% / .32);z-index:1"></div>
{sheet()}
  </div>'''


def dialog_akun():
    """Dirakit di luar f-string halaman: menyarangkan f-string triple-quote di dalam
    ekspresi f-string lain tidak bisa diurai Python.

    Kata sandi ada di sini karena `PUT /users` mewajibkannya (`required|string|confirmed`)."""
    isi = (
        '        <div style="display:flex;flex-direction:column;gap:9px">\n'
        '          <div>\n'
        + label('Username', wajib=True)
        + '            ' + kotak('budi_santoso', kosong=False) + '\n'
        + pesan('Huruf kecil dan garis bawah. Tidak bisa diubah sesudah dibuat.')
        + '\n          </div>\n'
        '          <div>\n'
        + label('Peran', wajib=True)
        + '            ' + kotak('Admin', kanan=S.svg('down2', 13, 1.9), kosong=False) + '\n'
        + pesan('Menentukan menu apa saja yang ia lihat. Kepala gudang hanya mengkonfirmasi barang masuk.')
        + '\n          </div>\n'
        '          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px">\n'
        '            <div>\n'
        + label('Kata sandi', wajib=True)
        + '            ' + kotak('••••••••', kosong=False) + '\n'
        + '            </div>\n'
        '            <div>\n'
        + label('Ulangi kata sandi', wajib=True)
        + '            ' + kotak('••••••••', kosong=False) + '\n'
        + '            </div>\n'
        '          </div>\n'
        + pesan('Minimal 8 karakter. Ia bisa menggantinya sendiri sesudah masuk.')
        + '\n        </div>'
    )
    return A.dialog(
        'Buat akun login untuk Budi Santoso?',
        'Sesudah akunnya jadi, ia bisa masuk memakai username dan kata sandi di bawah.',
        isi,
        A.tombol_batal() + A.tombol_utama('Buat akun'),
        lebar=460,
    )


def bentuk_modal():
    """Pembanding: bentuk modal yang diminta. Digambar supaya bisa disandingkan dengan
    sheet — bukan untuk dipakai dua-duanya."""
    isi = '\n'.join([
        baris('Gaji per bulan', f'<span class="mono" style="font-weight:600">{RP(ORANG["gaji"])}</span>'),
        baris('Jabatan', ORANG['jabatan']),
        baris('Bergabung', ORANG['bergabung']),
        baris('Username', ORANG['username'], mono=True),
        baris('Nomor KTP', ORANG['ktp'], mono=True),
        baris('Nomor HP', ORANG['hp'], mono=True),
    ])
    return f'''      <div class="card" style="width:560px;padding:0;overflow:hidden;box-shadow:var(--shadow-md)">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px;
          border-bottom:1px solid var(--border-subtle)">
          <div style="display:flex;align-items:center;gap:9px;min-width:0">
            {K.inisial(ORANG['nama'], 30)}
            <div style="display:flex;flex-direction:column;gap:1px;min-width:0">
              <div style="display:flex;align-items:center;gap:7px">
                <span style="font-size:14px;font-weight:700">{ORANG['nama']}</span>
                {A.pill('Aktif', 'success', 'check')}
              </div>
              <span style="font-size:11px;color:var(--foreground-subtle)">{ORANG['jabatan']} ·
                bergabung {ORANG['bergabung']}</span>
            </div>
          </div>
          <span class="ico" style="width:26px;height:26px;border:0">{S.svg('x', 13, 2)}</span>
        </div>
        <div style="padding:12px 16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 24px">
{isi}
        </div>
        <div style="padding:10px 16px;border-top:1px solid var(--border-subtle);display:flex;justify-content:
          flex-end;gap:7px">
          <span class="btn ghost sm" style="border-color:var(--destructive);color:var(--destructive)">
            Nonaktifkan</span>
          <span class="btn sm">{S.svg('pencil', 13, 1.8)}Ubah</span>
        </div>
      </div>'''


def sheet_sempit():
    return f'''      <div style="width:360px;height:520px;border:1px solid var(--border);border-radius:10px;
        overflow:hidden;background:var(--surface);display:flex;flex-direction:column;box-shadow:var(--shadow-sm)">
        <div style="height:48px;flex-shrink:0;border-bottom:1px solid var(--border);display:flex;align-items:center;
          gap:9px;padding:0 12px">
          <span class="ico" style="width:26px;height:26px;border:0">{S.svg('left', 13, 2)}</span>
          {K.inisial(ORANG['nama'], 26)}
          <div style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1">
            <span style="font-size:13px;font-weight:700">{ORANG['nama']}</span>
            <span style="font-size:11px;color:var(--foreground-subtle)">{ORANG['jabatan']}</span>
          </div>
          {A.pill('Aktif', 'success', 'check')}
        </div>
{toolbar_sheet()}
{seksi_sheet('Kepegawaian', baris('Gaji per bulan', '<span class="mono" style="font-weight:600">' + RP(ORANG['gaji']) + '</span>') + chr(10) + baris('Jabatan', ORANG['jabatan']), kanan=tautan_gaji())}
{seksi_sheet('Akun login', baris('Username', ORANG['username'], mono=True), terakhir=True)}
      </div>'''


S.ICONS.setdefault('left', '<path d="M19 12H5M11 18l-6-6 6-6"/>')


def keadaan_detail():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:22px">
    <div>
{A.judul_blok('Karyawan nonaktif', 'kepala diredupkan, toolbar berganti jadi satu aksi')}
      <div style="position:relative;width:420px;height:430px;border:1px solid var(--border);border-radius:10px;
        overflow:hidden">
{sheet(nonaktif=True, lebar=420, tinggi='430px')}
      </div>
    </div>

    <div>
{A.judul_blok('Belum punya akun login', 'ajakan menempel di seksinya sendiri')}
      <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
        <div style="position:relative;width:420px;height:430px;border:1px solid var(--border);border-radius:10px;
          overflow:hidden">
{sheet(punya_akun=False, lebar=420, tinggi='430px')}
        </div>
{dialog_akun()}
      </div>
    </div>

    <div>
{A.judul_blok('Bentuk modal — pembanding', 'yang diminta; sandingkan dengan sheet di atas sebelum memilih')}
{bentuk_modal()}
    </div>

    <div>
{A.judul_blok('Layar sempit', 'sheet mengisi layar, tombol tutup jadi panah kembali')}
{sheet_sempit()}
    </div>
  </div>'''


def tulis():
    for nama, isi, tinggi, logic in (
        ('KaryawanForm.dc.html', halaman_form(), 'height:950px;display:flex', S.logic()),
        ('KaryawanUbah.dc.html', halaman_form('ubah'), 'height:1010px;display:flex', S.logic()),
        ('KaryawanFormKeadaan.dc.html', keadaan_form(), 'min-height:945px', A.logic_gelap()),
        ('KaryawanDetail.dc.html', halaman_detail(), 'height:760px;display:flex', S.logic()),
        ('KaryawanDetailKeadaan.dc.html', keadaan_detail(), 'min-height:1620px', A.logic_gelap()),
    ):
        html = (S.head() + '<div class="root {{theme}}" style="' + tinggi + '">\n'
                + '    <style>.root *{box-sizing:border-box}</style>\n'
                + isi + '\n</div>\n' + S.TAIL + logic + S.END)
        open(nama, 'w').write(html)
        print(nama, len(html), 'bytes')


if __name__ == '__main__':
    tulis()
