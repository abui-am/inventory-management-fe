# Generator artboard "Gaji di Muka" (/pre-paid-salary) dan "Prive" (/prive).
#
# Yang dipecahkan di GAJI DI MUKA:
#  1. Tabelnya mencatat pembayaran, tapi tidak pernah menjawab pertanyaan yang membawa
#     orang ke sini: untuk bulan gajian ini, siapa saja yang sudah mengambil dan BERAPA
#     SISANYA. Sisa itu yang menentukan daftar gaji nanti lunas atau belum
#     (`PayrollRepository`: paid_amount >= salary → LUNAS).
#  2. Saringan tanggalnya memakai `created_at` — kapan uangnya dibayarkan — padahal
#     pengelompokan yang dipakai akuntansinya adalah `payroll_month`, bulan gajiannya.
#     Keduanya perlu, dan sekarang hanya satu yang ada, tanpa menyebut yang mana.
#  3. Akibat akuntansinya tidak pernah disebut: mencatat gaji di muka LANGSUNG
#     mengeluarkan kas dan menambah Beban (AdvancePayrollObserver →
#     CreatePayrollExpenseJob), bukan menunggu daftar gaji dibuat.
#  4. Batas maksimalnya ditulis sebagai teks merah permanen di bawah isian
#     ("Batas maksimal Rp …"), jadi aturan yang belum dilanggar sudah tampil seperti error.
#
# Yang dipecahkan di PRIVE:
#  5. Kolom "Metode Transaksi" menampilkan nilai mentah backend — `cash`, `bank`.
#  6. Header kolomnya "Description", satu-satunya header berbahasa Inggris di halaman
#     berbahasa Indonesia.
#  7. Prive MENGURANGI MODAL (debit Modal, kredit Kas/Bank — `setPriveLedger`), bukan
#     beban. Tidak ada satu pun kalimat di layar yang mengatakannya, padahal itu bedanya
#     dengan halaman Beban yang bentuknya mirip.
#  8. Tidak ada angka ringkasan: berapa yang sudah diambil periode ini, dan modal
#     tersisa berapa.
import _shell as S
import gen_audit as A
import gen_karyawan as K

RP = K.RP

ORANG = [
    ('Budi Santoso', 'Kepala Gudang', 3_500_000, 1_500_000, '12 Sep 2026'),
    ('Sari Wulandari', 'Kasir', 2_800_000, 2_800_000, '10 Sep 2026'),
    ('Tono Prasetyo', 'Staf Gudang', 2_400_000, 800_000, '5 Sep 2026'),
]
TOTAL_MUKA = sum(o[3] for o in ORANG)
SISA_TOTAL = sum(o[2] - o[3] for o in ORANG)

PRIVE = [
    ('28 Sep 2026', 'Biaya sekolah anak', 'cash', 5_000_000, 'super_admin'),
    ('21 Sep 2026', 'Renovasi rumah', 'bank', 25_000_000, 'super_admin'),
    ('14 Sep 2026', 'Keperluan keluarga', 'cash', 3_500_000, 'super_admin'),
    ('2 Sep 2026', 'Setoran arisan', 'bank', 2_000_000, 'super_admin'),
]
TOTAL_PRIVE = sum(p[3] for p in PRIVE)
MODAL = 2_852_213_875

S.ICONS.setdefault('plus', '<path d="M12 5v14M5 12h14"/>')
S.ICONS.setdefault('down2', '<path d="m6 9 6 6 6-6"/>')
S.ICONS.setdefault('search', '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>')
S.ICONS.setdefault('cal', '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>')
S.ICONS.setdefault('check', '<path d="m5 13 4 4L19 7"/>')
S.ICONS.setdefault('coin', '<ellipse cx="12" cy="7" rx="8" ry="3.4"/><path d="M4 7v10c0 1.9 3.6 3.4 8 3.4s8-1.5 8-3.4V7"/>')
S.ICONS.setdefault('warn2', '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>')
S.ICONS.setdefault('wallet', '<path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
                             '<path d="M16 12h4"/>')
S.ICONS.setdefault('kiri', '<path d="m15 6-6 6 6 6"/>')
S.ICONS.setdefault('kanan2', '<path d="m9 6 6 6-6 6"/>')


# ── potongan bersama ─────────────────────────────────────────────────────────
def kepala(judul, ket, tombol):
    return f'''        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:15px;font-weight:700">{judul}</span>
            <span style="font-size:12px;color:var(--foreground-subtle);max-width:620px">{ket}</span>
          </div>
          <span class="btn sm">{S.svg('plus', 13, 2)}{tombol}</span>
        </div>'''


def pemilih_bulan(bulan='September 2026'):
    """Bulan GAJIAN, bukan tanggal dibayar. Keduanya penyaring yang berbeda dan di layar
    lama hanya satu yang ada — tanpa menyebut yang mana."""
    return f'''<div style="display:inline-flex;align-items:center;gap:2px;height:32px;padding:0 3px;
      border:1px solid var(--border-strong);border-radius:7px;background:var(--surface)">
      <span class="ico" style="width:24px;height:24px;border:0">{S.svg('kiri', 13, 2)}</span>
      <span style="font-size:13px;font-weight:600;padding:0 6px;white-space:nowrap">{bulan}</span>
      <span class="ico" style="width:24px;height:24px;border:0">{S.svg('kanan2', 13, 2)}</span>
    </div>'''


def kotak_cari(teks):
    return f'''<div class="field" style="width:230px">
      {S.svg('search', 13, 1.9)}<span style="color:var(--foreground-subtle)">{teks}</span>
    </div>'''


def rentang(teks='1 Sep – 30 Sep 2026'):
    return f'''<div class="field" style="gap:6px">{S.svg('cal', 13, 1.8)}
      <span style="font-size:13px">{teks}</span></div>'''


def th(teks, lebar=None, kanan=False, pad_atas=8):
    gaya = f'width:{lebar};' if lebar else ''
    gaya += 'text-align:right;' if kanan else ''
    return f'<th class="th" style="{gaya}padding-top:{pad_atas}px">{teks}</th>'


def td(isi, kanan=False, tambahan=''):
    gaya = ('text-align:right;' if kanan else '') + tambahan
    return f'<td class="td" style="{gaya}">{isi}</td>'


# ── Gaji di Muka ─────────────────────────────────────────────────────────────
def baris_muka(o, terakhir=False):
    nama, jabatan, gaji, muka, tgl = o
    sisa = gaji - muka
    garis = 'border-bottom:0' if terakhir else ''
    nada_sisa = 'var(--foreground-subtle)' if sisa == 0 else 'var(--foreground)'
    ket_sisa = ('<span class="pill" style="background:var(--success-subtle);color:var(--success)">'
                + S.svg('check', 11, 2) + 'Lunas</span>') if sisa == 0 else K.angka(sisa, nada_sisa, 500)
    return f'''              <tr>
{td(K.nama_sel(nama), tambahan=garis)}
{td(f'<span style="color:var(--foreground-muted)">{jabatan}</span>', tambahan=garis)}
{td('<span class="pill" style="background:var(--surface-raised);color:var(--foreground-muted)">Sep 2026</span>', tambahan=garis)}
{td(f'<span style="color:var(--foreground-muted)">{tgl}</span>', tambahan=garis)}
{td(K.angka(muka), kanan=True, tambahan=garis)}
{td(ket_sisa, kanan=True, tambahan=garis)}
              </tr>'''


def tabel_muka():
    baris = '\n'.join(baris_muka(o, i == len(ORANG) - 1) for i, o in enumerate(ORANG))
    return f'''        <div class="card" style="padding:0;overflow:hidden">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:var(--surface-raised)">
{th('Nama')}
{th('Jabatan', '170px')}
{th('Bulan gajian', '130px')}
{th('Dibayar', '130px')}
{th('Jumlah', '150px', kanan=True)}
{th('Sisa gaji bulan itu', '170px', kanan=True)}
            </tr></thead>
            <tbody>
{baris}
            </tbody>
          </table>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 10px;
            border-top:1px solid var(--border);background:var(--surface-raised)">
            <span style="font-size:12px;color:var(--foreground-subtle)">3 dari 12 karyawan aktif sudah mengambil
              gaji di muka untuk September 2026</span>
            <div style="display:flex;align-items:baseline;gap:18px">
              <span style="font-size:12px;color:var(--foreground-subtle)">Total di muka
                <span class="mono" style="font-size:13px;font-weight:700;color:var(--foreground);margin-left:6px">
                  {RP(TOTAL_MUKA)}</span></span>
              <span style="font-size:12px;color:var(--foreground-subtle)">Sisa
                <span class="mono" style="font-size:13px;font-weight:700;color:var(--foreground);margin-left:6px">
                  {RP(SISA_TOTAL)}</span></span>
            </div>
          </div>
        </div>'''


def halaman_muka():
    return f'''  <div style="display:flex;height:100%">
{S.sidebar('Gaji di Muka')}
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
{S.topbar('Karyawan', 'Gaji di Muka')}
      <div style="flex:1;min-height:0;padding:16px 20px;display:flex;flex-direction:column;gap:11px;overflow:hidden">
{kepala('Gaji di Muka', 'Gaji yang dibayarkan sebelum tanggal gajian. Jumlahnya otomatis terpotong dari daftar gaji bulan yang dipilih.', 'Catat gaji di muka')}

        <div style="display:flex;gap:10px">
{A.kpi('Dibayar di muka', RP(TOTAL_MUKA), 'untuk gaji September 2026')}
{A.kpi('Karyawan', '3', 'dari 12 yang aktif')}
{A.kpi('Rata-rata per orang', RP(TOTAL_MUKA // 3), 'dari gaji sebulannya')}
{A.kpi('Sisa dibayar nanti', RP(SISA_TOTAL), 'kalau tidak ada tambahan', nada='var(--warning)')}
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:9px">
            <span style="font-size:12px;color:var(--foreground-subtle)">Bulan gajian</span>
{pemilih_bulan()}
          </div>
          <div style="display:flex;align-items:center;gap:7px">
            <span style="font-size:12px;color:var(--foreground-subtle)">Dibayar</span>
{rentang()}
{kotak_cari('Cari nama karyawan')}
          </div>
        </div>

{tabel_muka()}

        <div style="display:flex;align-items:center;gap:14px;font-size:12px;padding:0 2px">
{A.petunjuk('N', 'catat gaji di muka')}
{A.petunjuk('/', 'cari nama')}
{A.petunjuk('⌘K', 'pindah halaman')}
        </div>

{A.catatan('Uangnya keluar saat dicatat, bukan saat gajian.',
           'Mencatat gaji di muka langsung mengurangi Kas dan menambah Beban hari itu juga. Yang menunggu tanggal '
           'gajian hanyalah pemotongannya di daftar gaji — kalau jumlahnya sudah sama dengan gajinya, barisnya '
           'langsung berstatus lunas.')}
      </div>
    </div>
  </div>'''


def dialog_muka(error=False):
    # Peringatan akibat kas menyebut angka yang SEDANG diisi, termasuk saat angkanya
    # ditolak — kalau ia menyebut angka lain, dialognya berbicara tentang dua jumlah.
    jumlah = 4_000_000 if error else 1_500_000
    isi = (
        '        <div style="display:flex;flex-direction:column;gap:10px">\n'
        '          <div>\n'
        '            <div style="font-size:12px;font-weight:500;color:var(--foreground-muted);margin-bottom:5px">'
        'Karyawan<span style="color:var(--destructive);margin-left:2px">*</span></div>\n'
        '            <div class="field" style="width:100%">' + K.inisial('Budi Santoso', 20)
        + '<span style="flex:1;font-size:13px">Budi Santoso</span>'
        + S.svg('down2', 13, 1.9) + '</div>\n'
        '          </div>\n'
        '          <div style="display:flex;gap:10px;align-items:flex-start;padding:9px 11px;border-radius:9px;'
        'background:var(--surface-raised)">\n'
        '            <div style="flex:1"><div style="font-size:11px;color:var(--foreground-subtle)">Gaji per bulan'
        '</div><div class="mono" style="font-size:13px;font-weight:600">' + RP(3_500_000) + '</div></div>\n'
        '            <div style="flex:1"><div style="font-size:11px;color:var(--foreground-subtle)">Sudah diambil '
        'untuk Sep 2026</div><div class="mono" style="font-size:13px;font-weight:600">' + RP(0) + '</div></div>\n'
        '            <div style="flex:1"><div style="font-size:11px;color:var(--foreground-subtle)">Bisa diambil'
        '</div><div class="mono" style="font-size:13px;font-weight:700;color:var(--success)">' + RP(3_500_000)
        + '</div></div>\n'
        '          </div>\n'
    )
    if error:
        isi += (
            '          <div>\n'
            '            <div style="font-size:12px;font-weight:500;color:var(--foreground-muted);margin-bottom:5px">'
            'Jumlah<span style="color:var(--destructive);margin-left:2px">*</span></div>\n'
            '            <div class="field" style="width:100%;border-color:var(--destructive);'
            'box-shadow:0 0 0 3px hsl(2 80% 69% / 0.16)"><span style="color:var(--foreground-subtle);font-size:12px">'
            'Rp</span><span class="mono" style="flex:1;text-align:right;font-size:13px">4.000.000</span></div>\n'
            '            <div style="font-size:11px;color:var(--destructive);margin-top:5px">Melebihi gaji sebulannya '
            '— paling banyak <span class="mono" style="font-weight:600">' + RP(3_500_000) + '</span>.</div>\n'
            '          </div>\n'
        )
    else:
        isi += (
            '          <div>\n'
            '            <div style="font-size:12px;font-weight:500;color:var(--foreground-muted);margin-bottom:5px">'
            'Jumlah<span style="color:var(--destructive);margin-left:2px">*</span></div>\n'
            '            <div class="field" style="width:100%"><span style="color:var(--foreground-subtle);'
            'font-size:12px">Rp</span><span class="mono" style="flex:1;text-align:right;font-size:13px">1.500.000'
            '</span></div>\n'
            '            <div style="font-size:11px;color:var(--foreground-subtle);margin-top:5px">Sisa gajinya jadi '
            '<span class="mono" style="font-weight:600;color:var(--foreground)">' + RP(2_000_000) + '</span>, '
            'dibayar pada tanggal gajian.</div>\n'
            '          </div>\n'
        )
    isi += (
        '          <div>\n'
        '            <div style="font-size:12px;font-weight:500;color:var(--foreground-muted);margin-bottom:5px">'
        'Bulan gajian<span style="color:var(--destructive);margin-left:2px">*</span></div>\n'
        '            <div class="field" style="width:100%">' + S.svg('cal', 13, 1.8)
        + '<span style="flex:1;font-size:13px">September 2026</span></div>\n'
        '          </div>\n'
        '          <div style="display:flex;gap:8px;align-items:flex-start;padding:9px 11px;border-radius:9px;'
        'background:var(--warning-subtle);color:var(--warning);font-size:12px;line-height:1.45">\n'
        '            ' + K.ikon_tetap('warn2') + '\n'
        '            <span>Kas berkurang <span class="mono" style="font-weight:600">' + RP(jumlah)
        + '</span> dan Beban bertambah sebesar itu juga — hari ini, bukan saat gajian.</span>\n'
        '          </div>\n'
        '        </div>'
    )
    return A.dialog(
        'Catat gaji di muka',
        'Dibayarkan sekarang, lalu terpotong otomatis dari daftar gaji bulan yang dipilih.',
        isi,
        A.tombol_batal() + A.tombol_utama('Catat gaji di muka'),
        lebar=460,
    )


def kosong_muka():
    return A.keadaan_kosong() if False else f'''      <div class="card" style="width:620px;padding:0;overflow:hidden">
        <div style="padding:30px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px">
          <span style="width:38px;height:38px;border-radius:10px;background:var(--accent-subtle);color:var(--accent);
            display:flex;align-items:center;justify-content:center">{S.svg('wallet', 19, 1.8)}</span>
          <div style="font-size:14px;font-weight:700">Belum ada gaji di muka untuk September 2026</div>
          <div style="font-size:12px;color:var(--foreground-muted);max-width:400px;line-height:1.55">
            Daftar gaji bulan ini akan dibuat penuh untuk semua karyawan aktif. Catat di sini kalau ada yang
            mengambil gajinya lebih awal.
          </div>
          <span class="btn sm" style="margin-top:5px">{S.svg('plus', 13, 2)}Catat gaji di muka</span>
        </div>
        <div style="border-top:1px solid var(--border);background:var(--surface-raised);padding:9px 14px;
          font-size:11px;color:var(--foreground-subtle)">Bulan lain punya catatan: Agustus 2026 ·
          <span class="mono" style="color:var(--foreground-muted)">{RP(2_300_000)}</span> untuk 2 orang</div>
      </div>'''


def sempit_muka():
    def kartu(o):
        nama, jabatan, gaji, muka, tgl = o
        sisa = gaji - muka
        return f'''        <div class="card" style="padding:11px 12px;display:flex;flex-direction:column;gap:7px">
          <div style="display:flex;align-items:center;gap:9px">
            {K.inisial(nama, 26)}
            <div style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1">
              <span style="font-size:13px;font-weight:600">{nama}</span>
              <span style="font-size:11px;color:var(--foreground-muted)">{jabatan} · dibayar {tgl}</span>
            </div>
            <span class="mono" style="font-size:14px;font-weight:700">{RP(muka)}</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:9px;padding-top:7px;
            border-top:1px solid var(--border-subtle);font-size:11px;color:var(--foreground-subtle)">
            <span>Sep 2026</span>
            <span>Sisa <span class="mono" style="color:var(--foreground);font-weight:600">{RP(sisa)}</span></span>
          </div>
        </div>'''
    return ('      <div style="width:360px;display:flex;flex-direction:column;gap:8px">\n'
            + '\n'.join(kartu(o) for o in ORANG[:2]) + '\n      </div>')


def keadaan_muka():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:22px">
    <div>
{A.judul_blok('Mencatat gaji di muka', 'ringkasan gajinya ikut di dalam dialog, jadi batasnya tidak perlu dihafal')}
      <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
{dialog_muka()}
{dialog_muka(error=True)}
      </div>
    </div>

    <div>
{A.judul_blok('Belum ada catatan bulan ini', 'menyebut bulan yang sedang dipilih, dan bulan lain yang ada isinya')}
{kosong_muka()}
    </div>

    <div>
{A.judul_blok('Layar sempit', 'tiap baris jadi kartu; jumlah di kanan atas, sisa di kaki kartu')}
{sempit_muka()}
    </div>
  </div>'''


# ── Prive ────────────────────────────────────────────────────────────────────
def pill_metode(metode):
    if metode == 'cash':
        return '<span class="pill" style="background:var(--success-subtle);color:var(--success)">Kas</span>'
    return '<span class="pill" style="background:var(--info-subtle);color:var(--info)">Bank</span>'


def baris_prive(p, terakhir=False):
    tgl, ket, metode, jumlah, oleh = p
    garis = 'border-bottom:0' if terakhir else ''
    return f'''              <tr>
{td(f'<span style="color:var(--foreground-muted)">{tgl}</span>', tambahan=garis)}
{td(f'<span style="font-weight:500">{ket}</span>', tambahan=garis)}
{td(pill_metode(metode), tambahan=garis)}
{td(f'<span class="mono" style="font-size:12px;color:var(--foreground-subtle)">{oleh}</span>', tambahan=garis)}
{td(K.angka(jumlah), kanan=True, tambahan=garis)}
              </tr>'''


def tabel_prive():
    baris = '\n'.join(baris_prive(p, i == len(PRIVE) - 1) for i, p in enumerate(PRIVE))
    return f'''        <div class="card" style="padding:0;overflow:hidden">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:var(--surface-raised)">
{th('Tanggal', '140px')}
{th('Keterangan')}
{th('Dibayar melalui', '150px')}
{th('Dicatat oleh', '150px')}
{th('Jumlah', '160px', kanan=True)}
            </tr></thead>
            <tbody>
{baris}
            </tbody>
          </table>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 10px;
            border-top:1px solid var(--border);background:var(--surface-raised)">
            <span style="font-size:12px;color:var(--foreground-subtle)">4 penarikan · 1 – 30 September 2026</span>
            <span style="font-size:12px;color:var(--foreground-subtle)">Total
              <span class="mono" style="font-size:13px;font-weight:700;color:var(--foreground);margin-left:6px">
                {RP(TOTAL_PRIVE)}</span></span>
          </div>
        </div>'''


def halaman_prive():
    return f'''  <div style="display:flex;height:100%">
{S.sidebar('Prive')}
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
{S.topbar('Karyawan', 'Prive')}
      <div style="flex:1;min-height:0;padding:16px 20px;display:flex;flex-direction:column;gap:11px;overflow:hidden">
{kepala('Prive', 'Uang toko yang diambil pemilik untuk keperluan pribadi. Mengurangi Modal, bukan dicatat sebagai beban usaha.', 'Catat prive')}

        <div style="display:flex;gap:10px">
{A.kpi('Diambil periode ini', RP(TOTAL_PRIVE), '1 – 30 September 2026')}
{A.kpi('Penarikan', '4', 'rata-rata ' + RP(TOTAL_PRIVE // 4))}
{A.kpi('Lewat Kas', RP(8_500_000), '2 penarikan')}
{A.kpi('Modal sekarang', RP(MODAL), 'sesudah prive bulan ini')}
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
{K.segmen(['Semua', 'Kas', 'Bank'], 'Semua')}
          <div style="display:flex;align-items:center;gap:7px">
{rentang()}
{kotak_cari('Cari keterangan')}
          </div>
        </div>

{tabel_prive()}

        <div style="display:flex;align-items:center;gap:14px;font-size:12px;padding:0 2px">
{A.petunjuk('N', 'catat prive')}
{A.petunjuk('/', 'cari keterangan')}
{A.petunjuk('⌘K', 'pindah halaman')}
        </div>

{A.catatan('Prive bukan beban.',
           'Di buku besar, prive mendebit Modal dan mengkredit Kas atau Bank — jadi ia mengurangi hak pemilik, '
           'bukan mengurangi laba. Pengeluaran untuk keperluan toko tempatnya di halaman Beban.')}
      </div>
    </div>
  </div>'''


def dialog_prive():
    isi = (
        '        <div style="display:flex;flex-direction:column;gap:10px">\n'
        '          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">\n'
        '            <div>\n'
        '              <div style="font-size:12px;font-weight:500;color:var(--foreground-muted);margin-bottom:5px">'
        'Tanggal<span style="color:var(--destructive);margin-left:2px">*</span></div>\n'
        '              <div class="field" style="width:100%">' + S.svg('cal', 13, 1.8)
        + '<span style="flex:1;font-size:13px">28 Sep 2026</span></div>\n'
        '            </div>\n'
        '            <div>\n'
        '              <div style="font-size:12px;font-weight:500;color:var(--foreground-muted);margin-bottom:5px">'
        'Jumlah<span style="color:var(--destructive);margin-left:2px">*</span></div>\n'
        '              <div class="field" style="width:100%"><span style="color:var(--foreground-subtle);'
        'font-size:12px">Rp</span><span class="mono" style="flex:1;text-align:right;font-size:13px">5.000.000'
        '</span></div>\n'
        '            </div>\n'
        '          </div>\n'
        '          <div>\n'
        '            <div style="font-size:12px;font-weight:500;color:var(--foreground-muted);margin-bottom:5px">'
        'Dibayar melalui<span style="color:var(--destructive);margin-left:2px">*</span></div>\n'
        '            ' + K.segmen(['Kas', 'Bank'], 'Kas', {'Kas': 'success', 'Bank': 'info'}) + '\n'
        '            <div style="font-size:11px;color:var(--foreground-subtle);margin-top:5px">Kas sesudah ini '
        '<span class="mono" style="font-weight:600;color:var(--foreground)">' + RP(1_600_000) + '</span>.</div>\n'
        '          </div>\n'
        '          <div>\n'
        '            <div style="font-size:12px;font-weight:500;color:var(--foreground-muted);margin-bottom:5px">'
        'Keterangan<span style="color:var(--destructive);margin-left:2px">*</span></div>\n'
        '            <div style="border:1px solid var(--border-strong);border-radius:7px;padding:8px 10px;'
        'min-height:56px;font-size:13px;background:var(--surface)">Biaya sekolah anak</div>\n'
        '            <div style="font-size:11px;color:var(--foreground-subtle);margin-top:5px">Muncul di buku besar '
        'sebagai "Prive Biaya sekolah anak".</div>\n'
        '          </div>\n'
        '          <div style="border:1px dashed var(--border-strong);border-radius:9px;padding:9px 11px">\n'
        '            <div class="eyebrow" style="margin-bottom:5px">Jurnal yang terbentuk</div>\n'
        '            <div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0">'
        '<span>Modal</span><span class="mono" style="font-weight:600">Debit ' + RP(5_000_000) + '</span></div>\n'
        '            <div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0">'
        '<span style="padding-left:12px;color:var(--foreground-muted)">Kas</span>'
        '<span class="mono" style="font-weight:600;color:var(--foreground-muted)">Kredit ' + RP(5_000_000)
        + '</span></div>\n'
        '          </div>\n'
        '        </div>'
    )
    return A.dialog(
        'Catat prive',
        'Uang toko yang diambil pemilik. Modal berkurang sebesar ini, dan kas atau bank ikut berkurang hari ini juga.',
        isi,
        A.tombol_batal() + A.tombol_utama('Catat prive'),
        lebar=470,
    )


def kosong_prive():
    return f'''      <div class="card" style="width:620px;padding:30px;display:flex;flex-direction:column;
        align-items:center;text-align:center;gap:8px">
        <span style="width:38px;height:38px;border-radius:10px;background:var(--accent-subtle);color:var(--accent);
          display:flex;align-items:center;justify-content:center">{S.svg('coin', 19, 1.8)}</span>
        <div style="font-size:14px;font-weight:700">Tidak ada prive di periode ini</div>
        <div style="font-size:12px;color:var(--foreground-muted);max-width:420px;line-height:1.55">
          Belum ada uang toko yang diambil pemilik antara 1 – 30 September 2026. Coba pilih tanggal yang lain, atau
          catat yang baru.
        </div>
        <div style="display:flex;gap:7px;margin-top:5px">
          <span class="btn sm">{S.svg('plus', 13, 2)}Catat prive</span>
          <span class="btn ghost sm">{S.svg('cal', 13, 1.9)}Pilih tanggal lain</span>
        </div>
      </div>'''


def sempit_prive():
    def kartu(p):
        tgl, ket, metode, jumlah, oleh = p
        return f'''        <div class="card" style="padding:11px 12px;display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:9px">
            <div style="display:flex;flex-direction:column;gap:1px;min-width:0">
              <span style="font-size:13px;font-weight:600">{ket}</span>
              <span style="font-size:11px;color:var(--foreground-muted)">{tgl} · {oleh}</span>
            </div>
            <span class="mono" style="font-size:14px;font-weight:700;white-space:nowrap">{RP(jumlah)}</span>
          </div>
          <div>{pill_metode(metode)}</div>
        </div>'''
    return ('      <div style="width:360px;display:flex;flex-direction:column;gap:8px">\n'
            + '\n'.join(kartu(p) for p in PRIVE[:2]) + '\n      </div>')


def keadaan_prive():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:22px">
    <div>
{A.judul_blok('Mencatat prive', 'jurnalnya diperlihatkan sebelum disimpan — ini satu-satunya layar yang mendebit Modal')}
{dialog_prive()}
    </div>

    <div>
{A.judul_blok('Tidak ada di periode ini', 'menyebut periodenya, dan memberi dua jalan keluar')}
{kosong_prive()}
    </div>

    <div>
{A.judul_blok('Layar sempit', 'keterangan jadi judul kartu, jumlah di kanan atas')}
{sempit_prive()}
    </div>
  </div>'''


def tulis():
    for nama, isi, tinggi, logic in (
        ('GajiMuka.dc.html', halaman_muka(), 'height:800px;display:flex', S.logic()),
        ('GajiMukaKeadaan.dc.html', keadaan_muka(), 'min-height:1180px', A.logic_gelap()),
        ('Prive.dc.html', halaman_prive(), 'height:800px;display:flex', S.logic()),
        ('PriveKeadaan.dc.html', keadaan_prive(), 'min-height:1240px', A.logic_gelap()),
    ):
        html = (S.head() + '<div class="root {{theme}}" style="' + tinggi + '">\n'
                + '    <style>.root *{box-sizing:border-box}</style>\n'
                + isi + '\n</div>\n' + S.TAIL + logic + S.END)
        open(nama, 'w').write(html)
        print(nama, len(html), 'bytes')


if __name__ == '__main__':
    tulis()
