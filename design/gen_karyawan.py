# Generator artboard "Karyawan" (/employee) dan "Gaji Karyawan" (/monthly-salary).
#
# Dua layar yang isinya orang yang sama, tapi sekarang tidak pernah saling menyebut.
#
# Yang dipecahkan di /employee:
#  1. Daftarnya dipaku ke `where: { active: true }`. Tombol "Deactivate" di halaman detail
#     membuat orangnya HILANG dari satu-satunya daftar yang ada — tidak ada saringan,
#     tidak ada tab, tidak ada cara mengaktifkan lagi selain menebak URL detailnya.
#  2. Kolom "Akun Dashboard" berisi "Aktif / Tidak Aktif" — kata yang sama persis dengan
#     status karyawannya sendiri, untuk dua hal yang sama sekali berbeda.
#  3. Gaji tidak pernah kelihatan di daftar, padahal itu angka yang dipakai /monthly-salary
#     tiap bulan. Employee::simpleView() memang belum mengirimnya (lihat catatan di bawah).
#
# Yang dipecahkan di /monthly-salary:
#  4. Tidak ada satu pun jumlah. Berapa total gaji bulan ini, berapa yang sudah dibayar,
#     berapa sisanya — semuanya harus dijumlah sendiri dari baris tabel.
#  5. Statusnya biner ('lunas' / 'belum lunas', Payroll::$statuses). Orang yang sudah
#     dibayar separuh terbaca sama persis dengan yang belum dibayar sepeser pun, dan
#     SISA yang harus dibayar — angka yang sebenarnya dicari — tidak pernah ditampilkan.
#  6. "Buat Daftar" menghapus dulu. PayrollRepository::create() memanggil delete() atas
#     seluruh payroll bulan itu sebelum membuat ulang, jadi pembayaran yang sudah tercatat
#     ikut terhapus. Layarnya sekarang tidak mengatakan apa-apa soal itu.
#  7. Membayar gaji menulis beban "Beban Gaji" ke buku besar lewat CreatePayrollExpenseJob.
#     Tidak pernah disebut di layar, padahal itu yang membuatnya muncul di Laporan Pendapatan.
#
# Semua angka dari endpoint yang sudah ada: POST /employees, POST /payrolls,
# POST /payrolls/preview, PATCH /payrolls/{id}, PUT /payrolls.
import _shell as S
import gen_audit as A

S.ICONS.update({
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'left': '<path d="m15 6-6 6 6 6"/>',
    'right': '<path d="m9 6 6 6-6 6"/>',
    'printer': '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="7" rx="2"/><path d="M6 14h12v7H6z"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.5"/>',
    'warn2': '<path d="M12 4.5 2.8 20h18.4z"/><path d="M12 10v4"/><path d="M12 17v.4"/>',
    'users': '<circle cx="9" cy="8.5" r="3.4"/><path d="M2.5 19.5a6.5 6.5 0 0 1 13 0"/>'
             '<path d="M16 5.4a3.4 3.4 0 0 1 0 6.3M17.5 19.5a6.5 6.5 0 0 0-1.6-4.3"/>',
    'idcard': '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="11" r="2.2"/>'
              '<path d="M5.8 16.4a3.7 3.7 0 0 1 6.4 0M14.5 10h4M14.5 13.5h4"/>',
    'wallet': '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M16 12.5h3"/>',
    'power': '<path d="M12 4v8"/><path d="M6.8 7.2a7.5 7.5 0 1 0 10.4 0"/>',
    'sort': '<path d="M7 4v16M7 20l-3-3M7 4l3 3"/><path d="M17 20V4M17 4l3 3M17 20l-3-3"/>',
})

RP = lambda n: f"{n:,}".replace(",", ".")

BULAN = 'September 2026'

# Satu himpunan orang untuk KEDUA artboard — /employee dan /monthly-salary memang
# menampilkan orang yang sama, dan desainnya jadi bohong kalau namanya berbeda.
ORANG = [
    dict(nama='Siti Aminah',    jabatan='Kasir',         gaji=2_800_000, dibayar=2_800_000, akun=True,  muka=0),
    dict(nama='Budi Santoso',   jabatan='Kepala Gudang', gaji=3_500_000, dibayar=3_500_000, akun=True,  muka=1_500_000),
    dict(nama='Rina Marlina',   jabatan='Kasir',         gaji=2_800_000, dibayar=1_400_000, akun=False, muka=0),
    dict(nama='Agus Setiawan',  jabatan='Staf Gudang',   gaji=2_400_000, dibayar=0,         akun=False, muka=0),
    dict(nama='Dewi Lestari',   jabatan='Admin',         gaji=3_000_000, dibayar=3_000_000, akun=True,  muka=0),
    dict(nama='Hendra Wijaya',  jabatan='Kurir',         gaji=2_200_000, dibayar=0,         akun=False, muka=0),
]
NONAKTIF = dict(nama='Tono Prasetyo', jabatan='Staf Gudang', gaji=2_400_000, akun=False, keluar='12 Jul 2026')

TOTAL_GAJI = sum(o['gaji'] for o in ORANG)
TOTAL_DIBAYAR = sum(o['dibayar'] for o in ORANG)
TOTAL_SISA = TOTAL_GAJI - TOTAL_DIBAYAR
BELUM_LUNAS = sum(1 for o in ORANG if o['dibayar'] < o['gaji'])
PERSEN = round(TOTAL_DIBAYAR / TOTAL_GAJI * 100)
PUNYA_AKUN = sum(1 for o in ORANG if o['akun'])


def ikon_tetap(nama, ukuran=14, tebal=1.9, warna=None):
    """Ikon di dalam kotak flex. Tanpa flex-shrink:0 SVG-nya ikut menyusut sampai
    segitiga peringatannya tinggal setitik."""
    gaya = f'flex-shrink:0;display:flex;margin-top:1px' + (f';color:{warna}' if warna else '')
    return f'<span style="{gaya}">{S.svg(nama, ukuran, tebal)}</span>'


def inisial(nama, ukuran=24):
    huruf = ''.join(p[0] for p in nama.split()[:2]).upper()
    return f'''<span style="width:{ukuran}px;height:{ukuran}px;border-radius:50%;background:var(--accent-subtle);
      color:var(--accent);display:inline-flex;align-items:center;justify-content:center;font-size:10px;
      font-weight:700;flex-shrink:0;letter-spacing:-.02em">{huruf}</span>'''


def nama_sel(nama, pudar=False):
    warna = 'var(--foreground-subtle)' if pudar else 'var(--foreground)'
    return f'''<span style="display:inline-flex;align-items:center;gap:9px;min-width:0">
                  {inisial(nama)}
                  <span style="font-weight:500;color:{warna}">{nama}</span>
                </span>'''


def ikon_aksi(nama):
    return f'<span class="ico" style="width:24px;height:24px">{S.svg(nama, 13, 1.8)}</span>'


def angka(nilai, nada='var(--foreground)', tebal=600):
    """Nol ditulis sebagai em dash. Kolom 'Sisa' yang penuh 'Rp 0' membuat baris yang sudah
    selesai sama ramainya dengan baris yang masih perlu dikerjakan."""
    if nilai == 0:
        return '<span class="mono" style="font-size:13px;color:var(--foreground-subtle)">—</span>'
    return f'<span class="mono" style="font-size:13px;font-weight:{tebal};color:{nada}">{RP(nilai)}</span>'


# ── /employee ────────────────────────────────────────────────────────────────
def segmen(pilihan, aktif, nada=None):
    """Kendali dua pilihan. `nada` mewarnai yang sedang terpilih — dipakai kalau nilainya
    punya arti (status karyawan), supaya warnanya sama dengan lencana dan tombol yang
    membicarakan hal yang sama di layar lain. Tanpa `nada`, yang terpilih tampil netral."""
    nada = nada or {}

    def gaya(t):
        if t != aktif:
            return 'color:var(--foreground-muted)'
        warna = nada.get(t)
        latar = f'var(--{warna}-subtle)' if warna else 'var(--surface)'
        teks = f'var(--{warna})' if warna else 'var(--foreground)'
        return f'background:{latar};color:{teks};font-weight:600;box-shadow:var(--shadow-sm)'

    kotak = ''.join(
        f'<span style="display:inline-flex;align-items:center;height:26px;padding:0 11px;border-radius:6px;'
        f'font-size:12px;{gaya(t)}">{t}</span>'
        for t in pilihan
    )
    return (f'<div style="display:inline-flex;gap:2px;padding:3px;border-radius:8px;'
            f'background:var(--surface-sunken)">{kotak}</div>')


def toolbar_karyawan(aktif='Aktif', cari=''):
    isi_cari = (f'<span style="color:var(--foreground)">{cari}</span>' if cari else
                '<span style="color:var(--foreground-subtle)">Cari nama karyawan</span>')
    return f'''        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          {segmen(['Aktif', 'Nonaktif', 'Semua'], aktif)}
          <div style="display:flex;align-items:center;gap:7px">
            <div class="field" style="width:230px;color:var(--foreground-subtle)">
              {S.svg('search', 13, 1.9)}<span style="font-size:13px">{isi_cari}</span>
            </div>
            <div class="field" style="gap:6px;font-size:12px;color:var(--foreground-muted)">
              {S.svg('sort', 13, 1.8)}<span>Urutkan menurut</span>
              <span style="color:var(--foreground);font-weight:600">Nama</span>
            </div>
          </div>
        </div>'''


def baris_karyawan(o, terakhir=False, nonaktif=False):
    garis = 'border-bottom:0' if terakhir else ''
    akun = (A.pill('Ada', 'info') if o['akun'] else
            '<span style="font-size:12px;color:var(--foreground-subtle)">Belum dibuat</span>')
    if nonaktif:
        aksi = (f'<span class="btn ghost sm" style="white-space:nowrap">'
                f'{S.svg("redo", 12, 1.9)}Aktifkan</span>')
        gaji = '<span class="mono" style="font-size:13px;color:var(--foreground-subtle)">—</span>'
    else:
        aksi = (f'<span style="display:inline-flex;gap:5px;justify-content:flex-end">'
                f'{ikon_aksi("eye")}{ikon_aksi("pencil")}</span>')
        gaji = angka(o['gaji'])
    return f'''            <tr>
              <td class="td" style="{garis}">{nama_sel(o['nama'], pudar=nonaktif)}</td>
              <td class="td" style="{garis};color:var(--foreground-muted)">{o['jabatan']}</td>
              <td class="td" style="{garis};text-align:right">{gaji}</td>
              <td class="td" style="{garis}">{akun}</td>
              <td class="td" style="{garis};text-align:right">{aksi}</td>
            </tr>'''


def tabel_karyawan(orang=None, nonaktif=False, terakhir_polos=True):
    lebar_aksi = 120 if nonaktif else 96
    orang = orang if orang is not None else ORANG
    baris = [baris_karyawan(o, terakhir=(terakhir_polos and i == len(orang) - 1), nonaktif=nonaktif)
             for i, o in enumerate(orang)]
    return f'''        <div class="card" style="overflow:hidden">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:var(--surface-raised)">
              <th class="th" style="padding-top:8px">Nama</th>
              <th class="th" style="padding-top:8px;width:170px">Jabatan</th>
              <th class="th" style="padding-top:8px;width:140px;text-align:right">Gaji per bulan</th>
              <th class="th" style="padding-top:8px;width:140px">Akun login</th>
              <th class="th" style="padding-top:8px;width:{lebar_aksi}px"></th>
            </tr></thead>
            <tbody>
{"".join(baris)}
            </tbody>
          </table>
        </div>'''


def halaman_karyawan():
    return f'''  <div style="display:flex;height:100%">
{S.sidebar('Karyawan')}
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
{S.topbar('Karyawan', 'Karyawan')}
      <div style="flex:1;min-height:0;padding:16px 20px;display:flex;flex-direction:column;gap:11px;overflow:hidden">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:15px;font-weight:700">Karyawan</span>
            <span style="font-size:12px;color:var(--foreground-subtle)">Orang yang bekerja di toko. Yang
              berstatus aktif ikut masuk daftar gaji tiap bulan.</span>
          </div>
          <span class="btn sm">{S.svg('plus', 13, 2)}Tambah karyawan</span>
        </div>

        <div style="display:flex;gap:10px">
{A.kpi('Karyawan aktif', str(len(ORANG)), 'ikut daftar gaji bulan ini')}
{A.kpi('Nonaktif', '1', 'tidak ikut daftar gaji')}
{A.kpi('Punya akun login', str(PUNYA_AKUN), f'dari {len(ORANG)} orang yang aktif')}
{A.kpi('Gaji sebulan', RP(TOTAL_GAJI), 'kalau semuanya dibayar penuh')}
        </div>

{toolbar_karyawan()}
{tabel_karyawan()}

        <div style="display:flex;align-items:center;gap:14px;font-size:12px;padding:0 2px">
{A.petunjuk('/', 'cari nama')}
{A.petunjuk('N', 'tambah karyawan')}
{A.petunjuk('⌘K', 'pindah halaman')}
        </div>

{A.catatan('Menonaktifkan karyawan tidak menghilangkannya.',
           'Sekarang daftarnya dikunci ke yang aktif saja, jadi orang yang dinonaktifkan lenyap dan tidak bisa '
           'dikembalikan dari layar mana pun. Dengan saringan Aktif/Nonaktif/Semua, ia tetap bisa dibuka dan '
           'diaktifkan lagi.')}
      </div>
    </div>
  </div>'''


# ── /monthly-salary ──────────────────────────────────────────────────────────
def status_gaji(o):
    sisa = o['gaji'] - o['dibayar']
    if sisa == 0:
        utama = A.pill('Lunas', 'success', 'check')
    elif o['dibayar'] > 0:
        utama = A.pill('Dibayar sebagian', 'warning')
    else:
        utama = A.pill('Belum dibayar', 'muted')
    muka = ('<span style="font-size:11px;color:var(--foreground-subtle);margin-left:6px">di muka</span>'
            if o['muka'] else '')
    return utama + muka


def baris_gaji(o, terakhir=False):
    garis = 'border-bottom:0' if terakhir else ''
    sisa = o['gaji'] - o['dibayar']
    aksi = ('<span class="btn ghost sm">Bayar</span>' if sisa else
            f'<span style="color:var(--success);display:inline-flex">{S.svg("check", 14, 2.2)}</span>')
    return f'''            <tr>
              <td class="td" style="{garis}">{nama_sel(o['nama'])}</td>
              <td class="td" style="{garis};color:var(--foreground-muted)">{o['jabatan']}</td>
              <td class="td" style="{garis};text-align:right">{angka(o['gaji'], tebal=500)}</td>
              <td class="td" style="{garis};text-align:right">{angka(o['dibayar'], 'var(--success)')}</td>
              <td class="td" style="{garis};text-align:right">{angka(sisa, 'var(--destructive)', 700)}</td>
              <td class="td" style="{garis}">{status_gaji(o)}</td>
              <td class="td" style="{garis};text-align:right">{aksi}</td>
            </tr>'''


def tabel_gaji():
    baris = [baris_gaji(o, terakhir=(i == len(ORANG) - 1)) for i, o in enumerate(ORANG)]
    return f'''        <div class="card" style="overflow:hidden">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:var(--surface-raised)">
              <th class="th" style="padding-top:8px">Nama</th>
              <th class="th" style="padding-top:8px;width:150px">Jabatan</th>
              <th class="th" style="padding-top:8px;width:130px;text-align:right">Gaji</th>
              <th class="th" style="padding-top:8px;width:130px;text-align:right">Sudah dibayar</th>
              <th class="th" style="padding-top:8px;width:130px;text-align:right">Sisa</th>
              <th class="th" style="padding-top:8px;width:170px">Status</th>
              <th class="th" style="padding-top:8px;width:86px"></th>
            </tr></thead>
            <tbody>
{"".join(baris)}
            </tbody>
            <tfoot><tr style="background:var(--surface-raised)">
              <td class="td" style="border-bottom:0;font-weight:700" colspan="2">Total {len(ORANG)} orang</td>
              <td class="td mono" style="border-bottom:0;text-align:right;font-weight:700">{RP(TOTAL_GAJI)}</td>
              <td class="td mono" style="border-bottom:0;text-align:right;font-weight:700;color:var(--success)">
                {RP(TOTAL_DIBAYAR)}</td>
              <td class="td mono" style="border-bottom:0;text-align:right;font-weight:700;color:var(--destructive)">
                {RP(TOTAL_SISA)}</td>
              <td class="td" style="border-bottom:0" colspan="2"></td>
            </tr></tfoot>
          </table>
        </div>'''


def pemilih_bulan():
    return f'''        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:6px">
            <span class="ico">{S.svg('left', 13, 2)}</span>
            <div class="field" style="gap:7px;font-weight:600">
              {S.svg('cal', 13, 1.8)}<span style="font-size:13px">{BULAN}</span>
            </div>
            <span class="ico">{S.svg('right', 13, 2)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:7px">
            <div class="field" style="gap:6px;font-size:12px;color:var(--foreground-muted)">
              {S.svg('sort', 13, 1.8)}<span>Urutkan menurut</span>
              <span style="color:var(--foreground);font-weight:600">Sisa terbesar</span>
            </div>
            <span class="btn ghost sm">{S.svg('printer', 13, 1.9)}Print</span>
          </div>
        </div>'''


def halaman_gaji():
    return f'''  <div style="display:flex;height:100%">
{S.sidebar('Gaji Karyawan')}
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
{S.topbar('Karyawan', 'Gaji Karyawan')}
      <div style="flex:1;min-height:0;padding:16px 20px;display:flex;flex-direction:column;gap:11px;overflow:hidden">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:15px;font-weight:700">Gaji Karyawan</span>
            <span style="font-size:12px;color:var(--foreground-subtle)">Gaji yang harus dibayar bulan ini,
              dan berapa yang sudah dibayarkan ke tiap orang.</span>
          </div>
        </div>

        <div style="display:flex;gap:10px">
{A.kpi('Gaji bulan ini', RP(TOTAL_GAJI), f'{len(ORANG)} orang di daftar')}
{A.kpi('Sudah dibayar', RP(TOTAL_DIBAYAR), f'{PERSEN}% dari total', 'var(--success)', 'var(--foreground-subtle)',
       bar=PERSEN)}
{A.kpi('Sisa dibayar', RP(TOTAL_SISA), 'masih harus dikeluarkan bulan ini', 'var(--destructive)',
       'var(--foreground-subtle)')}
{A.kpi('Belum lunas', f'{BELUM_LUNAS} orang', 'termasuk yang baru dibayar sebagian')}
        </div>

{pemilih_bulan()}
{tabel_gaji()}

{A.catatan('Membayar gaji langsung masuk buku besar.',
           'Tiap pembayaran dicatat sebagai beban "Beban Gaji" pada tanggal pembayarannya, jadi angkanya ikut '
           'terbawa ke Laporan Pendapatan bulan itu. Gaji yang sudah dibayar di muka sudah terhitung di kolom '
           'Sudah dibayar sejak daftarnya dibuat.')}
      </div>
    </div>
  </div>'''


# ── Keadaan /employee ────────────────────────────────────────────────────────
def kartu_kosong(ikon, judul, isi, tombol='', lebar=430):
    aksi = f'<div style="margin-top:6px">{tombol}</div>' if tombol else ''
    return f'''      <div class="card" style="width:{lebar}px;padding:34px 18px;display:flex;flex-direction:column;
        align-items:center;gap:7px;text-align:center">
        <span style="color:var(--foreground-subtle)">{S.svg(ikon, 26, 1.6)}</span>
        <span style="font-size:14px;font-weight:600">{judul}</span>
        <span style="font-size:12px;color:var(--foreground-muted);max-width:310px;line-height:1.5">{isi}</span>
        {aksi}
      </div>'''


def kartu_sempit_karyawan(o):
    akun = (A.pill('Akun login', 'info') if o['akun'] else
            '<span style="font-size:11px;color:var(--foreground-subtle)">Belum punya akun</span>')
    return f'''        <div class="card" style="padding:11px 13px;display:flex;align-items:center;gap:10px">
          {inisial(o['nama'], 30)}
          <div style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1">
            <span style="font-size:13px;font-weight:600">{o['nama']}</span>
            <span style="font-size:11px;color:var(--foreground-muted)">{o['jabatan']}</span>
            <div style="margin-top:3px">{akun}</div>
          </div>
          <span class="mono" style="font-size:12px;font-weight:600;white-space:nowrap">{RP(o['gaji'])}</span>
        </div>'''


def keadaan_karyawan():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:22px">
    <div>
{A.judul_blok('Nonaktif bukan berarti hilang', 'saringan yang sekarang tidak ada sama sekali')}
{toolbar_karyawan(aktif='Nonaktif')}
      <div style="margin-top:9px">
{tabel_karyawan([NONAKTIF], nonaktif=True)}
      </div>
      <div style="display:flex;gap:7px;align-items:flex-start;font-size:12px;color:var(--foreground-muted);
        line-height:1.5;margin-top:9px;max-width:760px">
        {ikon_tetap('info', 13, warna='var(--foreground-subtle)')}
        <span>Gajinya sengaja dikosongkan: orang nonaktif tidak ikut dibuatkan baris gaji bulan berikutnya
          (<span class="mono" style="font-size:11px">PayrollRepository::create()</span> hanya mengambil yang
          <span class="mono" style="font-size:11px">active = true</span>), jadi menampilkan angkanya di sini
          akan terbaca seperti tagihan yang masih berjalan.</span>
      </div>
    </div>

    <div>
{A.judul_blok('Dua kekosongan yang berbeda', 'belum ada datanya, versus pencarian yang tidak menemukan')}
      <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
{kartu_kosong('users', 'Belum ada karyawan',
              'Tambahkan orang yang bekerja di toko. Gaji dan jabatannya dipakai untuk membuat daftar gaji '
              'tiap bulan.',
              f'<span class="btn sm">{S.svg("plus", 13, 2)}Tambah karyawan</span>')}
{kartu_kosong('search', 'Tidak ada yang cocok',
              'Tidak ada karyawan aktif yang namanya mengandung <b>“budi santosa”</b>. Coba kata yang lebih '
              'pendek, atau lihat yang nonaktif.',
              '<span class="btn ghost sm">Cari di semua status</span>')}
      </div>
    </div>

    <div>
{A.judul_blok('Layar sempit', 'tabel lima kolom jadi kartu di 360px')}
      <div style="width:360px;display:flex;flex-direction:column;gap:8px">
{"".join(kartu_sempit_karyawan(o) for o in ORANG[:3])}
      </div>
    </div>
  </div>'''


# ── Keadaan /monthly-salary ──────────────────────────────────────────────────
def brs(label, nilai, tebal=False, nada='var(--foreground)', ket=''):
    berat = '700' if tebal else '500'
    ket_html = (f'<div style="font-size:11px;color:var(--foreground-subtle);margin-top:1px">{ket}</div>'
                if ket else '')
    return f'''          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;
            font-size:12px;padding:3px 0">
            <div style="min-width:0"><span style="color:var(--foreground-muted)">{label}</span>{ket_html}</div>
            <span class="mono" style="font-weight:{berat};color:{nada}">{RP(nilai)}</span>
          </div>'''


def dialog_bayar():
    o = ORANG[2]  # Rina Marlina — baru dibayar separuh, keadaan yang paling sering terjadi
    sisa = o['gaji'] - o['dibayar']
    isi = f'''        <div style="display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:9px;
          background:var(--surface-raised)">
          {inisial(o['nama'], 28)}
          <div style="display:flex;flex-direction:column;gap:1px">
            <span style="font-size:13px;font-weight:600">{o['nama']}</span>
            <span style="font-size:11px;color:var(--foreground-muted)">{o['jabatan']} · {BULAN}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column">
{brs('Gaji sebulan', o['gaji'])}
{brs('Sudah dibayar', o['dibayar'], nada='var(--success)', ket='1 pembayaran, 5 Sep 2026')}
          <div style="border-top:1px solid var(--border);margin-top:4px;padding-top:4px">
{brs('Sisa', sisa, tebal=True, nada='var(--destructive)')}
          </div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:600;margin-bottom:5px">Yang dibayarkan sekarang</div>
          <div class="field" style="width:100%;gap:8px;border-color:var(--accent);
            box-shadow:0 0 0 3px hsl(256 82% 70% / 0.18)">
            <span style="color:var(--foreground-subtle);font-size:12px">Rp</span>
            <span style="flex:1;font-size:13px;text-align:right" class="mono">{RP(sisa)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:7px;margin-top:7px">
            <span style="width:14px;height:14px;border-radius:4px;background:var(--accent);
              color:var(--accent-foreground);display:inline-flex;align-items:center;justify-content:center">
              {S.svg('check', 10, 3)}</span>
            <span style="font-size:12px">Bayar sisanya sekaligus</span>
          </div>
          <div style="font-size:11px;color:var(--foreground-subtle);margin-top:6px">Tidak boleh melebihi sisa
            {RP(sisa)} — backend menolaknya, bukan cuma formulirnya.</div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:600;margin-bottom:5px">Dibayar dari</div>
          <div style="display:flex;gap:6px">
            <span class="btn ghost sm" style="border-color:var(--accent);color:var(--accent);
              background:var(--accent-subtle);font-weight:600">Kas</span>
            <span class="btn ghost sm">Bank</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:flex-start;padding:9px 11px;border-radius:9px;
          background:var(--info-subtle);color:var(--info);font-size:12px;line-height:1.45">
          {ikon_tetap('info')}
          <span>Tercatat sebagai beban <b>Beban Gaji</b> hari ini dan langsung masuk buku besar.</span>
        </div>'''
    return A.dialog('Bayar gaji', 'Boleh dibayar sebagian. Sisanya tetap tercatat dan bisa dibayar lagi kapan saja.',
                    isi, A.tombol_batal() + A.tombol_utama('Bayar'), lebar=440)


def dialog_buat():
    isi = f'''        <div style="border-radius:9px;background:var(--surface-raised);padding:10px 13px">
{brs('Karyawan aktif', len(ORANG), ket='yang nonaktif tidak ikut')}
{brs('Total gaji sebulan', TOTAL_GAJI, tebal=True)}
{brs('Sudah dibayar di muka', 1_500_000, nada='var(--success)', ket='1 orang, otomatis terhitung')}
        </div>
        <div style="display:flex;gap:8px;align-items:flex-start;padding:9px 11px;border-radius:9px;
          background:var(--destructive-subtle);color:var(--destructive);font-size:12px;line-height:1.45">
          {ikon_tetap('warn2')}
          <span>Kalau daftar {BULAN} sudah pernah dibuat, membuatnya lagi <b>menghapus daftar yang lama
          beserta pembayaran yang sudah tercatat di dalamnya</b>, lalu menyusunnya ulang dari gaji karyawan
          yang berlaku sekarang.</span>
        </div>'''
    return A.dialog(f'Buat daftar gaji {BULAN}?',
                    'Gaji dan jabatan tiap karyawan aktif disalin ke daftar bulan ini. Perubahan gaji sesudah '
                    'ini tidak ikut berubah di daftar yang sudah jadi.',
                    isi, A.tombol_batal() + A.tombol_utama('Buat daftar'), lebar=450)


def kartu_sempit_gaji(o):
    sisa = o['gaji'] - o['dibayar']
    persen = round(o['dibayar'] / o['gaji'] * 100)
    aksi = ('<span class="btn ghost sm" style="width:100%;justify-content:center">Bayar sisa '
            f'{RP(sisa)}</span>' if sisa else '')
    return f'''        <div class="card" style="padding:11px 13px;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;gap:10px">
            {inisial(o['nama'], 30)}
            <div style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1">
              <span style="font-size:13px;font-weight:600">{o['nama']}</span>
              <span style="font-size:11px;color:var(--foreground-muted)">{o['jabatan']}</span>
            </div>
            {status_gaji(o)}
          </div>
          <div style="height:4px;border-radius:3px;background:var(--surface-sunken);overflow:hidden">
            <div style="width:{persen}%;height:100%;background:var(--success);border-radius:3px"></div>
          </div>
          <div style="display:flex;align-items:baseline;justify-content:space-between;font-size:11px">
            <span style="color:var(--foreground-muted)">
              <span class="mono" style="color:{'var(--success)' if o['dibayar'] else 'var(--foreground-subtle)'};
                font-weight:600">{RP(o['dibayar'])}</span>
              dari <span class="mono">{RP(o['gaji'])}</span></span>
          </div>
          {aksi}
        </div>'''


def keadaan_gaji():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:22px">
    <div>
{A.judul_blok('Dua dialog', 'membayar satu orang, dan membuat daftar sebulan')}
      <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
{dialog_bayar()}
        <div style="display:flex;flex-direction:column;gap:18px">
{dialog_buat()}
{kartu_kosong('wallet', f'Daftar gaji {BULAN} belum dibuat',
              'Daftarnya disusun sekali tiap bulan dari karyawan yang aktif. Gaji yang sudah dibayar di muka '
              'ikut terhitung otomatis.',
              '<span class="btn sm">Buat daftar</span>', lebar=450)}
        </div>
      </div>
    </div>

    <div>
{A.judul_blok('Layar sempit', 'tujuh kolom jadi kartu dengan satu batang kemajuan')}
      <div style="width:360px;display:flex;flex-direction:column;gap:8px">
{"".join(kartu_sempit_gaji(o) for o in (ORANG[2], ORANG[0], ORANG[3]))}
      </div>
    </div>
  </div>'''


def tulis():
    for nama, isi, tinggi, logic in (
        ('Karyawan.dc.html', halaman_karyawan(), 'height:740px;display:flex', S.logic()),
        ('KaryawanKeadaan.dc.html', keadaan_karyawan(), 'min-height:860px', A.logic_gelap()),
        ('Gaji.dc.html', halaman_gaji(), 'height:780px;display:flex', S.logic()),
        ('GajiKeadaan.dc.html', keadaan_gaji(), 'min-height:1140px', A.logic_gelap()),
    ):
        html = (S.head() + '<div class="root {{theme}}" style="' + tinggi + '">\n'
                + '    <style>.root *{box-sizing:border-box}</style>\n'
                + isi + '\n</div>\n' + S.TAIL + logic + S.END)
        open(nama, 'w').write(html)
        print(nama, len(html), 'bytes')


if __name__ == '__main__':
    tulis()
