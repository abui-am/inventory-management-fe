# Generator artboard "Beban" (/expense).
#
# Halaman ini mencatat uang keluar: tiap beban menulis D Beban / K Kas atau Bank lewat
# ExpenseObserver::created. Dua hal yang menentukan bentuk desainnya:
#  1. `updated` dan `deleted` di observer itu KOSONG — mengubah atau menghapus beban
#     tidak menyentuh jurnalnya. Karena itu baris yang sudah tercatat tetap dibiarkan
#     hanya-baca di layar ini, meski API-nya menyediakan PATCH dan DELETE.
#  2. Sebagian beban tidak dibuat dari sini: Beban Gaji (CreatePayrollExpenseJob) dan
#     Beban Penyusutan Persediaan (ItemAuditController) lahir dari dokumen lain.
import _shell as S
import gen_audit as A

S.ICONS.update({
    'wallet': '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5z"/><path d="M16 12h3"/>',
    'plus2': '<path d="M12 5v14"/><path d="M5 12h14"/>',
    'bolt': '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/>',
    'cash': '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>',
    'down': '<path d="m6 9 6 6 6-6"/>',
    'bank': '<path d="M3 10h18"/><path d="M5 10v8M19 10v8M9 10v8M15 10v8"/><path d="m12 3 9 5H3z"/><path d="M3 21h18"/>',
})

RP = lambda n: f"{n:,}".replace(",", ".")


def sumber(metode):
    peta = {
        'cash': ('Kas', 'cash'),
        'bank': ('Bank', 'bank'),
        'current_account': ('Giro', 'bank'),
        'personal_money': ('Uang Pribadi', 'wallet'),
    }
    label, ikon = peta[metode]
    return (f'<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;'
            f'color:var(--foreground-muted)">{S.svg(ikon, 13, 1.8)}{label}</span>')


def baris(waktu, nama, ket, metode, jumlah, otomatis=False):
    tanda = (f'<span class="pill" style="background:var(--surface-raised);color:var(--foreground-subtle);'
             f'margin-left:7px">{S.svg("bolt", 10, 2)}otomatis</span>' if otomatis else '')
    return f'''          <tr>
            <td class="td mono" style="white-space:nowrap;color:var(--foreground-subtle)">{waktu}</td>
            <td class="td"><span style="font-weight:500">{nama}</span>{tanda}</td>
            <td class="td" style="color:var(--foreground-muted)">{ket}</td>
            <td class="td">{sumber(metode)}</td>
            <td class="td mono" style="text-align:right;font-weight:600">{RP(jumlah)}</td>
          </tr>'''


KANAN = f'''
    <span class="btn sm">{S.svg('plus2', 13, 2)}Catat beban</span>'''


def kepala():
    return f'''      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="display:flex;flex-direction:column;gap:2px">
          <span style="font-size:15px;font-weight:700">Beban</span>
          <span style="font-size:12px;color:var(--foreground-subtle)">Tiap beban menulis jurnal D Beban /
            K sumber dananya saat disimpan.</span>
        </div>
        <div style="display:flex;align-items:center;gap:7px">
          <div class="field" style="height:28px;font-size:12px;gap:6px;padding:0 9px;color:var(--foreground-muted)">
            {S.svg('cal', 13, 1.8)}<span class="mono" style="font-size:12px;color:var(--foreground)">1–16 Sep 2026</span>
            {S.svg('down', 12, 1.9)}
          </div>
          <span class="btn sm">{S.svg('plus2', 13, 2.2)}Catat beban</span>
        </div>
      </div>'''


def strip_kpi():
    return f'''      <div style="display:flex;gap:10px">
{A.kpi('Total beban', '4.182.000', 'periode 1–16 Sep 2026')}
{A.kpi('Dibayar kas', '1.732.000', '9 catatan', 'var(--foreground)')}
{A.kpi('Dibayar bank', '2.450.000', '3 catatan', 'var(--foreground)')}
      </div>'''


def toolbar():
    return f'''      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:3px;padding:3px;border-radius:8px;
          background:var(--surface-raised)">
          {A.tab('Semua', 12, True)}{A.tab('Kas', 9)}{A.tab('Bank', 3)}
        </div>
        <div style="display:flex;align-items:center;gap:7px">
          <div class="field" style="width:240px;color:var(--foreground-subtle);gap:7px">
            {S.svg('search', 14, 1.9)}<span>Cari nama atau keterangan…</span>
          </div>
        </div>
      </div>'''


def tabel():
    isi = [
        baris('16 Sep 09.12', 'Beban Listrik', 'Tagihan September', 'cash', 486000),
        baris('15 Sep 17.40', 'Beban Penyusutan Persediaan', 'Air Mineral Galon', 'cash', 198000, otomatis=True),
        baris('15 Sep 11.05', 'Beban Bahan Habis Pakai', 'Kantong plastik & lakban', 'cash', 175000),
        baris('14 Sep 16.20', 'Beban Gaji', 'Gaji September — 4 karyawan', 'bank', 2450000, otomatis=True),
        baris('13 Sep 08.55', 'Beban Ongkir', 'Kirim pesanan CV Sumber Pangan', 'cash', 120000, otomatis=True),
        baris('12 Sep 14.02', 'Beban Sewa', 'Sewa ruko Agustus', 'cash', 650000),
        baris('11 Sep 10.30', 'Beban Air', 'PDAM September', 'cash', 103000),
    ]
    return f'''      <div class="card" style="overflow:hidden;display:flex;flex-direction:column;min-height:0;flex:1">
        <div style="overflow:auto;min-height:0;flex:1">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:var(--surface-raised)">
            <th class="th" style="padding-top:9px;width:132px">Waktu</th>
            <th class="th" style="padding-top:9px;width:230px">Nama beban</th>
            <th class="th" style="padding-top:9px">Keterangan</th>
            <th class="th" style="padding-top:9px;width:140px">Sumber dana</th>
            <th class="th" style="padding-top:9px;text-align:right;width:140px">Jumlah</th>
          </tr></thead>
          <tbody>
{"".join(isi)}
          </tbody>
        </table>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 13px;
          border-top:1px solid var(--border);background:var(--surface-raised);font-size:12px;
          color:var(--foreground-muted)">
          <span>1–10 dari <span class="mono" style="color:var(--foreground)">12</span></span>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="field" style="height:26px;font-size:12px;padding:0 8px">10</span>
            <span class="ico" style="width:26px;height:26px">‹</span>
            <span class="ico" style="width:26px;height:26px;border-color:var(--accent);color:var(--accent)">1</span>
            <span class="ico" style="width:26px;height:26px">2</span>
            <span class="ico" style="width:26px;height:26px">›</span>
          </div>
        </div>
      </div>'''


def halaman():
    return f'''  <div style="display:flex;height:100%">
{S.sidebar('Beban')}
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
{S.topbar('Keuangan', 'Beban')}
      <div style="flex:1;min-height:0;padding:16px 20px;display:flex;flex-direction:column;gap:10px">
{kepala()}
{strip_kpi()}
{toolbar()}
{tabel()}
{A.catatan('Beban yang sudah tercatat tidak bisa diubah dari sini.', 'API-nya punya PATCH dan DELETE, tapi '
           '`ExpenseObserver` hanya bereaksi pada `created`: mengubah nominal tidak menyentuh jurnal yang sudah '
           'ditulis, dan menghapus beban meninggalkan ayat D Beban / K Kas tanpa dokumen penjelasnya. Selama itu '
           'belum diperbaiki, layar ini sengaja hanya-baca.')}
      </div>
    </div>
  </div>'''


def tulis_halaman():
    html = (S.head()
            + '<div class="root {{theme}}" style="height:1000px;display:flex">\n'
            + '    <style>.root *{box-sizing:border-box}</style>\n'
            + halaman() + '\n</div>\n' + S.TAIL + S.logic() + S.END)
    open('Beban.dc.html', 'w').write(html)
    print('Beban.dc.html', len(html), 'bytes')


# ── Artboard 2: dialog catat beban, keadaan kosong, layar sempit ──────────────
def kolom(label, isi, ket='', ikon=None, fokus=False, kanan='', lebar='100%'):
    garis = ('border-color:var(--accent);box-shadow:0 0 0 3px hsl(256 82% 70% / 0.18)'
             if fokus else 'border-color:var(--border-strong)')
    kiri = (f'<span style="display:flex;color:var(--foreground-subtle)">{S.svg(ikon, 14, 1.8)}</span>'
            if ikon else '')
    warna = 'var(--foreground)' if isi else 'var(--foreground-subtle)'
    bawah = (f'<div style="font-size:11px;color:var(--foreground-subtle);margin-top:5px">{ket}</div>'
             if ket else '')
    return f'''        <div style="width:{lebar}">
          <div style="font-size:12px;font-weight:600;margin-bottom:5px">{label}</div>
          <div class="field" style="width:100%;gap:8px;{garis}">
            {kiri}<span style="flex:1;color:{warna};font-size:13px">{isi}</span>{kanan}
          </div>
          {bawah}
        </div>'''


def saran(nama, sorot=False):
    latar = 'background:var(--accent-subtle);color:var(--accent)' if sorot else 'color:var(--foreground-muted)'
    return (f'<div style="display:flex;align-items:center;height:26px;padding:0 9px;border-radius:6px;'
            f'font-size:12px;{latar}">{nama}</div>')


def daftar_saran():
    isi = ''.join([saran('Beban Listrik', True), saran('Beban Air'), saran('Beban Sewa'),
                   saran('Beban Telepon'), saran('Beban Bahan Habis Pakai')])
    return f'''        <div class="card" style="margin-top:5px;padding:4px;box-shadow:var(--shadow-md)">
          <div style="font-size:11px;color:var(--foreground-subtle);padding:4px 9px 5px">Nama yang pernah dipakai</div>
          {isi}
        </div>'''


def jurnal():
    return f'''        <div style="border-radius:9px;background:var(--surface-raised);padding:10px 13px">
          <div style="font-size:12px;font-weight:600;margin-bottom:5px">Jurnal yang ditulis</div>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <th class="th" style="padding:0 0 4px;border:0">Akun</th>
              <th class="th" style="padding:0 0 4px;border:0;text-align:right">Debit</th>
              <th class="th" style="padding:0 0 4px;border:0;text-align:right">Kredit</th>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:12px">Beban</td>
              <td class="mono" style="padding:5px 0;font-size:12px;text-align:right;font-weight:600;
                color:var(--destructive)">486.000</td>
              <td class="mono" style="padding:5px 0;font-size:12px;text-align:right;
                color:var(--foreground-subtle)">—</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:12px">Kas</td>
              <td class="mono" style="padding:5px 0;font-size:12px;text-align:right;
                color:var(--foreground-subtle)">—</td>
              <td class="mono" style="padding:5px 0;font-size:12px;text-align:right;font-weight:600;
                color:var(--success)">486.000</td>
            </tr>
            <tr><td colspan="3" style="border-top:1px solid var(--border)"></td></tr>
            <tr>
              <td style="padding:5px 0;font-size:12px;font-weight:600">Balance</td>
              <td class="mono" style="padding:5px 0;font-size:12px;text-align:right;font-weight:700;
                color:var(--destructive)">486.000</td>
              <td class="mono" style="padding:5px 0;font-size:12px;text-align:right;font-weight:700;
                color:var(--success)">486.000</td>
            </tr>
          </table>
        </div>'''


def dialog_catat(dengan_saran=False):
    isi = (kolom('Nama beban', 'Beban List', 'Pilih dari daftar atau ketik nama baru.' if not dengan_saran else '',
                 fokus=dengan_saran)
           + ('\n' + daftar_saran() if dengan_saran else '')
           + '\n' + kolom('Keterangan', 'Tagihan September')
           + '\n' + f'''        <div style="display:flex;gap:10px">
{kolom('Jumlah', '486.000', lebar='50%')}
{kolom('Sumber dana', 'Kas', ikon='cash', kanan=S.svg('down', 12, 1.9), lebar='50%')}
        </div>'''
           + '\n' + kolom('Tanggal', '16 Sep 2026 09.12', 'Kosongkan untuk memakai waktu sekarang.', ikon='cal')
           + '\n' + jurnal())
    return A.dialog('Catat beban',
                    'Uangnya dianggap keluar saat disimpan: jurnal di bawah langsung ditulis, dan saldo sumber '
                    'dananya berkurang sebesar itu.',
                    isi, A.tombol_batal() + A.tombol_utama('Simpan beban'), lebar=460)


def kartu(waktu, nama, ket, metode, jumlah, otomatis=False):
    tanda = ('<span class="pill" style="background:var(--surface-raised);color:var(--foreground-subtle)">'
             + S.svg('bolt', 10, 2) + 'otomatis</span>' if otomatis else '')
    return f'''        <div class="card" style="padding:10px 12px;display:flex;flex-direction:column;gap:7px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
            <div style="min-width:0">
              <div style="font-size:13px;font-weight:600">{nama}</div>
              <div style="font-size:11px;color:var(--foreground-subtle)">{ket}</div>
            </div>
            <span class="mono" style="font-size:14px;font-weight:700">{RP(jumlah)}</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;
            border-top:1px solid var(--border-subtle);padding-top:6px">
            <span class="mono" style="font-size:11px;color:var(--foreground-subtle)">{waktu}</span>
            <span style="display:flex;align-items:center;gap:7px">{tanda}{sumber(metode)}</span>
          </div>
        </div>'''


def layar_sempit():
    return f'''      <div style="width:360px;display:flex;flex-direction:column;gap:8px">
        <div style="font-size:12px;color:var(--foreground-subtle)">Layar sempit — 360px</div>
{kartu('16 Sep 09.12', 'Beban Listrik', 'Tagihan September', 'cash', 486000)}
{kartu('14 Sep 16.20', 'Beban Gaji', 'Gaji September — 4 karyawan', 'bank', 2450000, otomatis=True)}
      </div>'''


def keadaan_kosong():
    return f'''      <div class="card" style="width:520px;padding:32px 28px;display:flex;flex-direction:column;
        align-items:center;text-align:center;gap:9px">
        <span style="width:38px;height:38px;border-radius:10px;background:var(--accent-subtle);color:var(--accent);
          display:flex;align-items:center;justify-content:center">{S.svg('wallet', 19, 1.8)}</span>
        <div style="font-size:14px;font-weight:700">Belum ada beban di periode ini</div>
        <div style="font-size:12px;color:var(--foreground-muted);max-width:360px;line-height:1.55">
          Listrik, sewa, ongkir, bahan habis pakai — semua uang keluar yang bukan pembelian barang dicatat di sini
          supaya laporan pendapatan tidak berlebih.
        </div>
        <span class="btn sm" style="margin-top:4px">{S.svg('plus2', 13, 2.2)}Catat beban</span>
      </div>'''


def keadaan():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:22px">
    <div>
{A.judul_blok('Catat beban', 'nama beban dibantu daftar yang pernah dipakai')}
      <div style="display:flex;gap:18px;align-items:flex-start">
{dialog_catat()}
{dialog_catat(dengan_saran=True)}
{layar_sempit()}
      </div>
    </div>
    <div>
{A.judul_blok('Belum ada beban', 'periode yang dipilih kosong')}
{keadaan_kosong()}
    </div>
  </div>'''


def tulis_keadaan():
    html = (S.head()
            + '<div class="root {{theme}}" style="min-height:1120px">\n'
            + '    <style>.root *{box-sizing:border-box}</style>\n'
            + keadaan() + '\n</div>\n' + S.TAIL + A.logic_gelap() + S.END)
    open('BebanCatat.dc.html', 'w').write(html)
    print('BebanCatat.dc.html', len(html), 'bytes')


if __name__ == '__main__':
    tulis_halaman()
    tulis_keadaan()
