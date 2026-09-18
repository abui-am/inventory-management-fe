# Generator artboard "Barang" di /transaction/add — usulan alur baru.
#
# Masalah yang dipecahkan: baris draf. Sekarang barang dipilih di sebuah baris yang
# BENTUKNYA sama persis dengan baris yang sudah masuk, lalu harus ditekan "+" supaya
# benar-benar tercatat. Baris itu berbohong: ia terlihat seperti sudah masuk. Akibatnya
# barang terakhir sering hilang, dan pada transaksi satu barang seluruh isinya hilang.
#
# Usulnya: hilangkan keadaan "belum masuk". Memilih barang = barang masuk daftar.
import _shell as S

S.ICONS.update({
    'search': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'plus': '<path d="M12 5v14"/><path d="M5 12h14"/>',
    'minus': '<path d="M5 12h14"/>',
    'box': '<path d="M12 3 3 7.5v9L12 21l9-4.5v-9z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    'down': '<path d="m6 9 6 6 6-6"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.5"/>',
})

RP = lambda n: f"{n:,}".replace(",", ".")

# Tuts papan ketik ditulis seperti tuts: bergaris dan berlatar, bukan teks biasa. Tanpa
# itu "Enter tambahkan" terbaca sebagai satu kalimat, dan mata harus memisahkan sendiri
# mana yang harus ditekan dan mana keterangannya.
def tuts(nama):
    return (f'<span class="mono" style="font-size:11px;line-height:16px;padding:0 5px;border-radius:5px;'
            f'border:1px solid var(--border);background:var(--surface-raised);color:var(--foreground-muted)">'
            f'{nama}</span>')


def petunjuk(nama, keterangan):
    return (f'<span style="display:inline-flex;align-items:center;gap:5px">{tuts(nama)}'
            f'<span style="color:var(--foreground-subtle)">{keterangan}</span></span>')


def judul(nomor, teks, catatan):
    return f'''    <div style="display:flex;align-items:baseline;gap:9px;margin:0 0 9px">
      <span class="pill" style="background:var(--accent-subtle);color:var(--accent)">{nomor}</span>
      <span style="font-size:14px;font-weight:700">{teks}</span>
      <span style="font-size:12px;color:var(--foreground-subtle)">{catatan}</span>
    </div>'''


def kepala_kartu(jumlah):
    return f'''      <div style="display:flex;align-items:center;gap:7px;padding:11px 14px;border-bottom:1px solid var(--border)">
        <span style="font-size:13px;font-weight:600">Barang</span>
        <span class="mono" style="font-size:12px;color:var(--foreground-subtle)">{jumlah}</span>
      </div>'''


def pencari(isi='', fokus=False, lebar='100%'):
    """Kotak cari barang. Tingginya 36px — lebih tinggi dari kontrol lain di halaman ini
    karena ia satu-satunya tempat kerja yang dipakai berulang-ulang."""
    garis = ('border-color:var(--accent);box-shadow:0 0 0 3px hsl(256 68% 54% / 0.18)'
             if fokus else 'border-color:var(--border-strong)')
    warna = 'var(--foreground)' if isi else 'var(--foreground-subtle)'
    teks = isi or 'Ketik nama atau kode barang…'
    return f'''        <div class="field" style="height:36px;width:{lebar};gap:9px;box-sizing:border-box;{garis}">
          <span style="color:var(--foreground-subtle);display:flex">{S.svg('search', 15, 1.9)}</span>
          <span style="color:{warna};flex:1">{teks}</span>
          {tuts('F2')}
        </div>'''


def hasil(nama, stok, harga, satuan, sorot=False, habis=False):
    latar = 'background:var(--accent-subtle)' if sorot else ''
    warna_nama = 'var(--foreground-subtle)' if habis else 'var(--foreground)'
    kanan = (f'<span class="pill" style="background:var(--destructive-subtle);color:var(--destructive)">Stok habis</span>'
             if habis else f'<span class="mono" style="font-size:12px;color:var(--foreground-muted)">{RP(harga)}</span>')
    enter = tuts('Enter') if sorot else ''
    return f'''          <div style="display:flex;align-items:center;gap:10px;padding:7px 12px;{latar}">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500;color:{warna_nama}">{nama}</div>
              <div style="font-size:11px;color:var(--foreground-subtle)">Stok {stok} {satuan}</div>
            </div>
            {enter}{kanan}
          </div>'''


def stepper(qty, sorot=False):
    garis = 'var(--accent)' if sorot else 'var(--border-strong)'
    return f'''<span style="display:inline-flex;align-items:center;border:1px solid {garis};border-radius:7px;
      overflow:hidden;height:28px">
      <span style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;
        color:var(--foreground-subtle)">{S.svg('minus', 13, 2)}</span>
      <span class="mono" style="width:34px;text-align:center;font-size:13px;font-weight:600">{qty}</span>
      <span style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;
        color:var(--foreground-subtle)">{S.svg('plus', 13, 2)}</span>
    </span>'''


def baris(nama, qty, satuan, harga, baru=False):
    latar = 'background:var(--accent-subtle)' if baru else ''
    tanda = ('<span class="pill" style="background:var(--accent);color:var(--accent-foreground);margin-left:7px">'
             'baru</span>' if baru else '')
    return f'''          <tr style="{latar}">
            <td class="td">{nama}{tanda}</td>
            <td class="td" style="text-align:center">{stepper(qty, baru)}</td>
            <td class="td" style="color:var(--foreground-muted)">{satuan}</td>
            <td class="td mono" style="text-align:right;color:var(--foreground-muted)">{RP(harga)}</td>
            <td class="td mono" style="text-align:right;font-weight:600">{RP(harga * qty)}</td>
            <td class="td" style="text-align:right">
              <span class="ico" style="display:inline-flex;border-color:transparent">{S.svg('x', 13, 2)}</span></td>
          </tr>'''


def kepala_tabel():
    return '''          <tr>
            <th class="th" style="padding-top:9px">Nama</th>
            <th class="th" style="padding-top:9px;text-align:center;width:110px">Qty</th>
            <th class="th" style="padding-top:9px;width:80px">Satuan</th>
            <th class="th" style="padding-top:9px;text-align:right;width:110px">Harga</th>
            <th class="th" style="padding-top:9px;text-align:right;width:120px">Subtotal</th>
            <th class="th" style="padding-top:9px;width:44px"></th>
          </tr>'''


# ── keadaan 1: kosong ─────────────────────────────────────────────────────────
def keadaan_kosong():
    return f'''{judul('1', 'Kosong', 'kotak cari langsung siap — tidak ada baris yang menunggu ditekan')}
    <div class="card" style="overflow:hidden">
{kepala_kartu(0)}
      <div style="padding:12px 14px">
{pencari(fokus=True)}
      </div>
      <div style="padding:6px 14px 26px;text-align:center;color:var(--foreground-subtle)">
        <div style="display:flex;justify-content:center;margin-bottom:7px">{S.svg('box', 22, 1.5)}</div>
        <div style="font-size:13px;color:var(--foreground-muted)">Belum ada barang</div>
        <div style="font-size:12px;margin-top:2px">Pilih barang di dropdown di atas — begitu dipilih, barang
          langsung masuk daftar.</div>
      </div>
    </div>'''


# ── keadaan 2: sedang mencari ────────────────────────────────────────────────
def keadaan_mencari():
    return f'''{judul('2', 'Sedang mencari', 'stok dan harga terlihat sebelum memilih')}
    <div class="card" style="overflow:hidden">
{kepala_kartu(0)}
      <div style="padding:12px 14px 0">
{pencari('gar', fokus=True)}
        <div class="card" style="margin-top:5px;padding:4px 0;box-shadow:var(--shadow-md)">
{hasil('Garam Halus 500 g', 107, 5500, 'pak', sorot=True)}
{hasil('Garam Kasar 1 kg', 42, 8000, 'pak')}
{hasil('Gula Pasir 1 kg', 0, 14000, 'pak', habis=True)}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;padding:11px 14px 12px;font-size:11px">
        {petunjuk('↑ ↓', 'pilih')}{petunjuk('Enter', 'tambahkan')}{petunjuk('Esc', 'tutup')}
      </div>
    </div>'''


# ── keadaan 3: sudah terisi ──────────────────────────────────────────────────
def keadaan_terisi():
    items = [('Kacang Kulit 200 g', 2, 'pak', 13500, False),
             ('Garam Halus 500 g', 1, 'pak', 5500, False),
             ('Tepung Beras 500 g', 3, 'pak', 13000, True)]
    total = sum(h * q for _, q, _, h, _ in items)
    baris_html = '\n'.join(baris(*i) for i in items)
    return f'''{judul('3', 'Terisi', 'barang terakhir sudah masuk tanpa tombol tambahan')}
    <div class="card" style="overflow:hidden">
{kepala_kartu(3)}
      <table style="width:100%;border-collapse:collapse">
        <thead>
{kepala_tabel()}
        </thead>
        <tbody>
{baris_html}
        </tbody>
      </table>
      <div style="padding:12px 14px">
{pencari()}
        <div style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:11px;
          color:var(--foreground-subtle)">
          {S.svg('info', 12, 1.9)}Qty barang yang baru masuk langsung terpilih — ketik angkanya,
          lalu Enter untuk kembali mencari barang berikutnya.
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;
        background:var(--surface-raised);border-top:1px solid var(--border)">
        <span style="font-size:12px;color:var(--foreground-muted)">3 barang</span>
        <span style="display:flex;align-items:baseline;gap:8px">
          <span style="font-size:12px;color:var(--foreground-muted)">Subtotal</span>
          <span class="mono" style="font-size:16px;font-weight:700">{RP(total)}</span></span>
      </div>
    </div>'''


# ── keadaan 4: yang dibuang ──────────────────────────────────────────────────
def keadaan_lama():
    return f'''{judul('✕', 'Yang dibuang', 'baris draf — bentuknya sama dengan baris yang sudah masuk')}
    <div class="card" style="overflow:hidden;opacity:.75">
      <table style="width:100%;border-collapse:collapse">
        <thead>
{kepala_tabel()}
        </thead>
        <tbody>
          <tr style="background:var(--accent-subtle)">
            <td class="td" style="color:var(--foreground-subtle)">Ketik nama atau kode barang…</td>
            <td class="td" style="text-align:center"><span class="field" style="width:52px;height:28px;
              justify-content:center">1</span></td>
            <td class="td" style="color:var(--foreground-subtle)">—</td>
            <td class="td" style="text-align:right;color:var(--foreground-subtle)">—</td>
            <td class="td" style="text-align:right;color:var(--foreground-subtle)">—</td>
            <td class="td" style="text-align:right">
              <span class="ico" style="display:inline-flex;border-color:var(--accent);color:var(--accent)">
                {S.svg('plus', 13, 2)}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="display:flex;gap:7px;margin-top:8px;font-size:12px;color:var(--destructive)">
      {S.svg('info', 13, 1.9)}
      <span style="color:var(--foreground-muted)">Barang yang sudah dipilih di baris ini BELUM tercatat sampai
        "+" ditekan, padahal barisnya sudah terlihat seperti baris lain. Satu barang terlewat pada transaksi
        dua barang; seluruh isinya hilang pada transaksi satu barang.</span>
    </div>'''


def isi():
    return f'''    <style>.root *{{box-sizing:border-box}}</style>
    <div style="padding:20px 22px;display:flex;flex-direction:column;gap:22px">
{keadaan_kosong()}
{keadaan_mencari()}
{keadaan_terisi()}
{keadaan_lama()}
    </div>'''


def tulis():
    html = (S.head()
            + '<div class="root {{theme}}" style="min-height:1280px">\n'
            + isi() + '\n'
            + '</div>\n'
            + S.TAIL + S.logic() + S.END)
    with open('TransaksiBarang.dc.html', 'w') as f:
        f.write(html)
    print('TransaksiBarang.dc.html', len(html), 'bytes')


if __name__ == '__main__':
    tulis()
