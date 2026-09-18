# Generator artboard "Audit Barang" (/inventory/audit) — stock opname harian.
#
# Yang dipecahkan halaman ini sekarang:
#  1. Tidak ada satu pun angka kemajuan. 35 baris kotak kosong, dan tidak ada cara tahu
#     sudah berapa yang dihitung tanpa menggulir seluruh tabel.
#  2. Jatah 3 kali kirim per barang hanya muncul sebagai kejutan di modal ("Tersisa 1
#     kali kesempatan") — sebelum itu tidak kelihatan sama sekali, dan sesudah habis
#     barisnya diam saja tanpa keterangan.
#  3. Membuat audit ulang MENGHAPUS seluruh baris tanggal itu di backend
#     (ItemAuditRepository::create memanggil delete() dulu). Tombolnya sekarang tidak
#     mengatakan apa-apa soal itu.
#  4. Stok sistem memang sengaja tidak dikirim ke petugas gudang (defaultView tanpa
#     item_quantity) — hitungannya buta. Itu benar, tapi layarnya tidak pernah bilang,
#     jadi terbaca seperti data yang hilang.
import _shell as S

S.ICONS.update({
    'search': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    'check': '<path d="m5 13 4.5 4.5L19 7"/>',
    'pencil': '<path d="M4 20h4L20 8l-4-4L4 16z"/>',
    'lock': '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    'cal': '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/>',
    'warn': '<path d="M12 4 2.8 20h18.4z"/><path d="M12 10v4"/><path d="M12 17.2v.4"/>',
    'redo': '<path d="M20 5v6h-6"/><path d="M20 11A8 8 0 1 0 18 17"/>',
    'clip': '<rect x="6" y="4.5" width="12" height="16" rx="2"/><path d="M9.5 4.5h5v2.5h-5z"/><path d="M9.5 11h5M9.5 15h3"/>',
    'eye': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
})


def tuts(nama):
    return (f'<span class="mono" style="font-size:11px;line-height:16px;padding:0 5px;border-radius:5px;'
            f'border:1px solid var(--border);background:var(--surface-raised);color:var(--foreground-muted)">'
            f'{nama}</span>')


def petunjuk(nama, ket):
    return (f'<span style="display:inline-flex;align-items:center;gap:5px">{tuts(nama)}'
            f'<span style="color:var(--foreground-subtle)">{ket}</span></span>')


def pill(teks, nada='muted', ikon=''):
    warna = {
        'muted': ('var(--surface-raised)', 'var(--foreground-muted)'),
        'success': ('var(--success-subtle)', 'var(--success)'),
        'warning': ('var(--warning-subtle)', 'var(--warning)'),
        'destructive': ('var(--destructive-subtle)', 'var(--destructive)'),
        'accent': ('var(--accent-subtle)', 'var(--accent)'),
        'info': ('var(--info-subtle)', 'var(--info)'),
    }[nada]
    ic = S.svg(ikon, 11, 2) if ikon else ''
    return f'<span class="pill" style="background:{warna[0]};color:{warna[1]}">{ic}{teks}</span>'


def kpi(label, nilai, ket, nada='var(--foreground)', ket_nada='var(--foreground-subtle)', bar=None):
    garis = ''
    if bar is not None:
        garis = f'''
      <div style="height:4px;border-radius:3px;background:var(--surface-sunken);margin-top:7px;overflow:hidden">
        <div style="width:{bar}%;height:100%;background:var(--accent);border-radius:3px"></div>
      </div>'''
    return f'''      <div class="card" style="padding:11px 14px;display:flex;flex-direction:column;gap:2px;flex:1;min-width:0">
        <span style="font-size:11px;color:var(--foreground-subtle)">{label}</span>
        <span class="mono" style="font-size:19px;font-weight:700;letter-spacing:-.02em;color:{nada}">{nilai}</span>
        <span style="font-size:11px;color:{ket_nada}">{ket}</span>{garis}
      </div>'''


def tab(teks, jumlah, aktif=False):
    if aktif:
        gaya = ('background:var(--surface);color:var(--foreground);box-shadow:var(--shadow-sm);font-weight:600')
    else:
        gaya = 'color:var(--foreground-muted)'
    return (f'<span style="display:flex;align-items:center;gap:5px;height:26px;padding:0 9px;border-radius:6px;'
            f'font-size:12px;{gaya}">{teks}'
            f'<span class="mono" style="font-size:11px;color:var(--foreground-subtle)">{jumlah}</span></span>')


def kesempatan(terpakai):
    """Jatah 3 kali kirim per barang. Titik, bukan kalimat: yang perlu dibaca cuma
    'masih ada' atau 'tinggal sedikit', dan itu bisa dilihat tanpa membaca angka."""
    titik = []
    for i in range(3):
        if i < terpakai:
            warna = 'var(--warning)' if terpakai == 2 else 'var(--foreground-subtle)'
            if terpakai >= 3:
                warna = 'var(--foreground-subtle)'
            titik.append(f'<span style="width:6px;height:6px;border-radius:50%;background:{warna}"></span>')
        else:
            titik.append('<span style="width:6px;height:6px;border-radius:50%;'
                         'border:1px solid var(--border-strong)"></span>')
    ket = 'habis' if terpakai >= 3 else f'{3 - terpakai} tersisa'
    warna_ket = 'var(--foreground-subtle)'
    if terpakai == 2:
        warna_ket = 'var(--warning)'
    return (f'<span style="display:inline-flex;align-items:center;gap:6px">'
            f'<span style="display:inline-flex;gap:3px">{"".join(titik)}</span>'
            f'<span style="font-size:11px;color:{warna_ket}">{ket}</span></span>')


def kotak_hitung(nilai='', fokus=False, mati=False):
    if mati:
        return ('<span class="mono" style="display:inline-flex;align-items:center;justify-content:flex-end;'
                'width:96px;height:32px;font-size:14px;font-weight:600;color:var(--foreground-muted)">'
                f'{nilai}</span>')
    if fokus:
        garis = 'border-color:var(--accent);box-shadow:0 0 0 3px hsl(256 68% 54% / 0.18)'
    else:
        garis = 'border-color:var(--border-strong)'
    warna = 'var(--foreground)' if nilai else 'var(--foreground-subtle)'
    isi = nilai or '0'
    kursor = ('<span style="width:1px;height:16px;background:var(--accent);margin-left:1px"></span>'
              if fokus else '')
    return (f'<span class="field mono" style="width:96px;justify-content:flex-end;font-size:14px;'
            f'font-weight:600;color:{warna};{garis}">{isi}{kursor}</span>')


def tombol_simpan(aktif=False, mati=False):
    if mati:
        return ('<span class="ico" style="display:inline-flex;border-color:transparent;'
                'color:var(--foreground-subtle);opacity:.45">' + S.svg('check', 14, 2.2) + '</span>')
    if aktif:
        return ('<span class="ico" style="display:inline-flex;background:var(--accent);border-color:var(--accent);'
                'color:var(--accent-foreground)">' + S.svg('check', 14, 2.4) + '</span>')
    return ('<span class="ico" style="display:inline-flex;border-color:transparent;color:var(--accent)">'
            + S.svg('pencil', 13, 1.9) + '</span>')


def baris(nama, satuan, hitung, terpakai, status, fokus=False, mati=False, catatan=''):
    latar = 'background:var(--accent-subtle)' if fokus else ''
    ket = (f'<div style="font-size:11px;color:var(--foreground-subtle);margin-top:1px">{catatan}</div>'
           if catatan else '')
    return f'''          <tr style="{latar}">
            <td class="td"><div style="font-weight:500">{nama}</div>{ket}</td>
            <td class="td" style="color:var(--foreground-muted)">{satuan}</td>
            <td class="td" style="text-align:right">{hitung}</td>
            <td class="td">{kesempatan(terpakai)}</td>
            <td class="td">{status}</td>
            <td class="td" style="text-align:right">{tombol_simpan(fokus, mati)}</td>
          </tr>'''


# ── Artboard 1: halaman utama, audit sedang berjalan ──────────────────────────
KANAN_TOPBAR = f'''
    <div class="field" style="height:28px;font-size:12px;gap:6px;padding:0 9px;color:var(--foreground-muted)">
      {S.svg('cal', 13, 1.8)}<span class="mono" style="font-size:12px;color:var(--foreground)">15 Sep 2026</span>
    </div>'''


def kepala():
    return f'''      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="display:flex;flex-direction:column;gap:2px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:15px;font-weight:700">Audit 15 Sep 2026</span>
            {pill('Sedang berjalan', 'accent')}
          </div>
          <span style="font-size:12px;color:var(--foreground-subtle)">Dimulai 08.14 oleh Kepala Gudang ·
            stok sistem sengaja disembunyikan sampai hitungan dikirim</span>
        </div>
        <div style="display:flex;align-items:center;gap:7px">
          <span class="btn ghost sm">{S.svg('redo', 13, 1.9)}Buat ulang</span>
          <span class="btn sm">{S.svg('clip', 13, 1.9)}Lanjut hitung</span>
        </div>
      </div>'''


def strip_kpi():
    return f'''      <div style="display:flex;gap:10px">
{kpi('Sudah dihitung', '12<span style="font-size:13px;color:var(--foreground-subtle)"> / 35</span>',
     '23 barang belum dihitung', bar=34)}
{kpi('Belum dihitung', '23', 'sisa pekerjaan hari ini', 'var(--warning)', 'var(--warning)')}
{kpi('Selisih ditemukan', '4', 'menunggu persetujuan pemilik', 'var(--destructive)', 'var(--destructive)')}
      </div>'''


def toolbar():
    return f'''      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:3px;padding:3px;border-radius:8px;
          background:var(--surface-raised)">
          {tab('Semua', 35, True)}{tab('Belum dihitung', 23)}{tab('Sudah dihitung', 12)}{tab('Terkunci', 1)}
        </div>
        <div style="display:flex;align-items:center;gap:7px">
          <div class="field" style="width:220px;color:var(--foreground-subtle);gap:7px">
            {S.svg('search', 14, 1.9)}<span>Cari nama barang…</span>
          </div>
        </div>
      </div>'''


def petunjuk_tuts():
    return f'''      <div style="display:flex;align-items:center;gap:14px;font-size:12px;padding:0 2px">
        {petunjuk('Enter', 'simpan & lanjut ke barang berikutnya')}
        {petunjuk('Esc', 'kembalikan isian')}
        <span style="color:var(--foreground-subtle)">Tiap barang punya 3 kali kirim per hari.</span>
      </div>'''


def tabel():
    baris_baris = [
        baris('Beras Premium 5 kg', 'karung', kotak_hitung('24', fokus=True), 0,
              pill('Sedang dihitung', 'accent'), fokus=True),
        baris('Air Mineral 600 ml (dus)', 'dus', kotak_hitung('22', mati=True), 1,
              pill('Cocok', 'success', 'check')),
        baris('Gula Pasir 1 kg', 'pak', kotak_hitung('9', mati=True), 1,
              pill('Selisih −2', 'destructive')),
        baris('Minyak Goreng 2 L', 'dus', kotak_hitung('6', mati=True), 2,
              pill('Selisih +1', 'destructive'), catatan='sekali kirim lagi, setelah itu terkunci'),
        baris('Telur Ayam 1 kg', 'kg', kotak_hitung(), 0, pill('Belum dihitung')),
        baris('Kopi Bubuk 250 g', 'pak', kotak_hitung(), 0, pill('Belum dihitung')),
        baris('Susu Bubuk 400 g', 'kotak', kotak_hitung('19', mati=True), 3,
              pill('Selisih −3', 'destructive'), mati=True,
              catatan='jatah kirim habis — perbaikan lewat pemilik'),
        baris('Sabun Mandi Batang', 'pcs', kotak_hitung(), 0, pill('Belum dihitung')),
    ]
    return f'''      <div class="card" style="overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:var(--surface-raised)">
            <th class="th" style="padding-top:9px">Barang</th>
            <th class="th" style="padding-top:9px;width:96px">Satuan</th>
            <th class="th" style="padding-top:9px;text-align:right;width:132px">Hitungan fisik</th>
            <th class="th" style="padding-top:9px;width:132px">Kesempatan</th>
            <th class="th" style="padding-top:9px;width:150px">Status</th>
            <th class="th" style="padding-top:9px;width:56px"></th>
          </tr></thead>
          <tbody>
{"".join(baris_baris)}
          </tbody>
        </table>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 13px;
          border-top:1px solid var(--border);background:var(--surface-raised);font-size:12px;
          color:var(--foreground-muted)">
          <span><span class="mono" style="color:var(--foreground)">35</span> barang ditampilkan</span>
          <span>Kiriman terakhir <span class="mono">20.45</span></span>
        </div>
      </div>'''


def catatan(judul, isi):
    return f'''      <div style="display:flex;gap:9px;padding:10px 12px;border-radius:9px;
        border:1px dashed var(--border-strong);background:var(--surface-raised)">
        <span style="color:var(--accent);flex-shrink:0;margin-top:1px">{S.svg('eye', 14, 1.9)}</span>
        <div style="font-size:12px;color:var(--foreground-muted)">
          <b style="color:var(--foreground)">{judul}</b> {isi}
        </div>
      </div>'''


def halaman():
    return f'''  <div style="display:flex;height:100%">
{S.sidebar('Audit Barang')}
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
{S.topbar('Persediaan', 'Audit Barang', KANAN_TOPBAR)}
      <div style="flex:1;padding:16px 20px;display:flex;flex-direction:column;gap:10px;overflow:hidden">
{kepala()}
{strip_kpi()}
{toolbar()}
{petunjuk_tuts()}
{tabel()}
{catatan('Hitung buta.', 'Stok menurut sistem tidak ditampilkan selama menghitung — angkanya memang tidak '
         'dikirim ke petugas gudang. Cocok atau tidaknya dihitung backend dan terlihat kedua peran; ANGKA '
         'selisihnya hanya terlihat pemilik, dan hanya pemilik yang bisa menyetujuinya di Laporan Audit.')}
      </div>
    </div>
  </div>'''


def tulis_halaman():
    html = (S.head()
            + '<div class="root {{theme}}" style="height:1000px;display:flex">\n'
            + '    <style>.root *{box-sizing:border-box}</style>\n'
            + halaman() + '\n</div>\n' + S.TAIL + S.logic() + S.END)
    open('Audit.dc.html', 'w').write(html)
    print('Audit.dc.html', len(html), 'bytes')


# ── Artboard 2: keadaan & dialog ──────────────────────────────────────────────
def brs(label, nilai, mono=True, nada='var(--foreground)'):
    kelas = 'mono' if mono else ''
    return f'''        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px">
          <span style="font-size:12px;color:var(--foreground-muted)">{label}</span>
          <span class="{kelas}" style="font-size:12px;font-weight:600;color:{nada}">{nilai}</span>
        </div>'''


def ringkas(isi):
    return (f'<div style="display:flex;flex-direction:column;gap:5px;border-radius:9px;'
            f'background:var(--surface-raised);padding:10px 13px">{isi}</div>')


def dialog(judul, penjelasan, isi, tombol, lebar=420):
    return f'''      <div class="card" style="width:{lebar}px;padding:16px;display:flex;flex-direction:column;gap:10px;
        box-shadow:var(--shadow-md)">
        <div>
          <div style="font-size:14px;font-weight:700">{judul}</div>
          <div style="font-size:12px;color:var(--foreground-muted);margin-top:8px;line-height:1.5">{penjelasan}</div>
        </div>
{isi}
        <div style="display:flex;justify-content:flex-end;gap:7px;margin-top:2px">{tombol}</div>
      </div>'''


def tombol_batal(teks='Batal'):
    return f'<span class="btn ghost sm">{teks}</span>'


def tombol_utama(teks, nada='accent'):
    if nada == 'destructive':
        gaya = 'background:var(--destructive);color:var(--destructive-foreground);border-color:var(--destructive)'
    else:
        gaya = ''
    return f'<span class="btn sm" style="{gaya}">{teks}</span>'


def keadaan_kosong():
    return f'''      <div class="card" style="width:640px;padding:0;overflow:hidden">
        <div style="padding:34px 30px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:9px">
          <span style="width:38px;height:38px;border-radius:10px;background:var(--accent-subtle);color:var(--accent);
            display:flex;align-items:center;justify-content:center">{S.svg('clip', 19, 1.8)}</span>
          <div style="font-size:14px;font-weight:700">Audit 15 Sep 2026 belum dibuat</div>
          <div style="font-size:12px;color:var(--foreground-muted);max-width:400px;line-height:1.55">
            Memulai audit memasukkan seluruh barang ke daftar hitung, berikut stok sistemnya saat ini sebagai
            pembanding. Barang yang masuk setelah audit dibuat tidak ikut terhitung.
          </div>
          <div style="display:flex;gap:7px;margin-top:5px">
            <span class="btn sm">{S.svg('clip', 13, 1.9)}Mulai audit</span>
            <span class="btn ghost sm">{S.svg('cal', 13, 1.9)}Pilih tanggal lain</span>
          </div>
        </div>
        <div style="border-top:1px solid var(--border);background:var(--surface-raised);padding:9px 14px;
          font-size:11px;color:var(--foreground-subtle)">
          Audit terakhir: <span class="mono" style="color:var(--foreground-muted)">14 Sep 2026</span> ·
          35 barang · 2 selisih disetujui
        </div>
      </div>'''


def dialog_mulai():
    isi = ringkas(brs('Tanggal', '15 Sep 2026') + brs('Barang yang dihitung', '35')
                  + brs('Petugas', 'Kepala Gudang', mono=False))
    return dialog(
        'Mulai audit hari ini?',
        'Seluruh barang masuk daftar hitung sekarang, berikut stok sistemnya saat ini sebagai pembanding. '
        'Pastikan tidak ada barang masuk yang belum dicatat — barang yang masuk setelah ini tidak ikut terhitung.',
        isi, tombol_batal() + tombol_utama('Mulai audit'))


def dialog_ulang():
    isi = ringkas(brs('Tanggal', '15 Sep 2026')
                  + brs('Sudah dihitung', '12 barang', nada='var(--warning)')
                  + brs('Akan hilang', '12 hitungan', nada='var(--destructive)'))
    return dialog(
        'Buat ulang audit 15 Sep 2026?',
        'Seluruh baris audit tanggal ini dihapus lalu dibuat ulang dari stok sistem terbaru. '
        'Hitungan yang sudah dikirim hari ini hilang dan tidak bisa dikembalikan.',
        isi, tombol_batal('Kembali') + tombol_utama('Ya, buat ulang', 'destructive'))


def dialog_terakhir():
    isi = ringkas(brs('Barang', 'Minyak Goreng 2 L', mono=False)
                  + brs('Hitungan dikirim', '6 dus')
                  + brs('Kesempatan', '3 dari 3', nada='var(--warning)'))
    return dialog(
        'Kesempatan terakhir untuk barang ini',
        'Setelah kiriman ini, hitungan Minyak Goreng 2 L terkunci untuk hari ini. '
        'Perbaikan hanya bisa dilakukan pemilik lewat Laporan Audit.',
        isi, tombol_batal('Hitung ulang dulu') + tombol_utama('Kirim hitungan'), lebar=400)


def kartu(nama, satuan, nilai, status, terpakai, mati=False):
    warna = 'var(--foreground-subtle)' if mati else 'var(--foreground)'
    kanan = (kotak_hitung(nilai, mati=True) if nilai else kotak_hitung())
    return f'''        <div class="card" style="padding:10px 12px;display:flex;flex-direction:column;gap:7px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
            <div style="min-width:0">
              <div style="font-size:13px;font-weight:600;color:{warna}">{nama}</div>
              <div style="font-size:11px;color:var(--foreground-subtle)">{satuan}</div>
            </div>
            {status}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            {kesempatan(terpakai)}
            <div style="display:flex;align-items:center;gap:6px">{kanan}{tombol_simpan(bool(nilai) is False, mati)}</div>
          </div>
        </div>'''


def layar_sempit():
    return f'''      <div style="width:360px;display:flex;flex-direction:column;gap:8px">
        <div style="font-size:12px;color:var(--foreground-subtle)">Layar sempit — 360px</div>
{kartu('Beras Premium 5 kg', 'karung', '', pill('Belum dihitung'), 0)}
{kartu('Gula Pasir 1 kg', 'pak', '9', pill('Selisih −2', 'destructive'), 1)}
{kartu('Susu Bubuk 400 g', 'kotak', '19', pill('Terkunci', 'muted', 'lock'), 3, mati=True)}
      </div>'''


def judul_blok(teks, ket):
    return f'''      <div style="display:flex;align-items:baseline;gap:9px;margin-bottom:9px">
        <span style="font-size:14px;font-weight:700">{teks}</span>
        <span style="font-size:12px;color:var(--foreground-subtle)">{ket}</span>
      </div>'''


def keadaan():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:22px">
    <div>
{judul_blok('Audit belum dibuat', 'yang dilihat petugas saat membuka tanggal kosong')}
      <div style="display:flex;gap:18px;align-items:flex-start">
{keadaan_kosong()}
{dialog_mulai()}
      </div>
    </div>
    <div>
{judul_blok('Dua konfirmasi yang sekarang tidak ada', 'keduanya menghapus atau mengunci sesuatu')}
      <div style="display:flex;gap:18px;align-items:flex-start">
{dialog_ulang()}
{dialog_terakhir()}
{layar_sempit()}
      </div>
    </div>
  </div>'''


def logic_gelap():
    props = '"tema":{"editor":"enum","options":["Terang","Gelap"],"default":"Gelap","section":"Tampilan"}'
    return ('\n<script data-dc-script data-props=\'{' + props + '}\'>\n'
            'class Component extends DCLogic {\n  renderVals() {\n'
            "    const t = this.state?.tema ?? this.props.tema ?? 'Gelap';\n"
            "    return { theme: t === 'Gelap' ? 'dark' : 'light' };\n"
            '  }\n}\n</script>\n')


def tulis_keadaan():
    html = (S.head()
            + '<div class="root {{theme}}" style="min-height:720px">\n'
            + '    <style>.root *{box-sizing:border-box}</style>\n'
            + keadaan() + '\n</div>\n' + S.TAIL + logic_gelap() + S.END)
    open('AuditMulai.dc.html', 'w').write(html)
    print('AuditMulai.dc.html', len(html), 'bytes')


if __name__ == '__main__':
    tulis_halaman()
    tulis_keadaan()
