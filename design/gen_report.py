# Generator artboard "Laporan Audit" (/audit/report) — layar pemilik.
#
# Di sinilah uang bergerak: menyetujui satu baris membuat ItemAuditObserver menyamakan
# stok barang dengan hasil audit, lalu ItemAuditController menulis beban penyusutan
# (audit < sistem) atau jurnal pendapatan lain-lain (audit > sistem). Layar lama
# menyembunyikan seluruh akibat itu di balik satu modal berisi satu kotak angka.
import _shell as S
import gen_audit as A

S.ICONS.update({
    'gavel': '<path d="M4 20h9"/><path d="m9.5 13.5 5-5"/><path d="m11 6 7 7"/><path d="m14.5 2.5 7 7"/>',
    'arrowdown': '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
    'arrowup': '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
    'book': '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/>',
})

RP = lambda n: f"{n:,}".replace(",", ".")


def selisih_chip(n):
    if n == 0:
        return A.pill('Cocok', 'success', 'check')
    nada = 'destructive' if n < 0 else 'info'
    tanda = '+' if n > 0 else '−'
    return A.pill(f'{tanda}{abs(n)}', nada)


def baris(nama, satuan, sistem, audit, petugas, status, aksi, nilai):
    beda = audit - sistem
    return f'''          <tr>
            <td class="td"><div style="font-weight:500">{nama}</div>
              <div style="font-size:11px;color:var(--foreground-subtle)">{satuan}</div></td>
            <td class="td mono" style="text-align:right;color:var(--foreground-muted)">{sistem}</td>
            <td class="td mono" style="text-align:right;font-weight:600">{audit}</td>
            <td class="td" style="text-align:right">{selisih_chip(beda)}</td>
            <td class="td mono" style="text-align:right;color:var(--foreground-muted)">{nilai}</td>
            <td class="td" style="color:var(--foreground-muted)">{petugas}</td>
            <td class="td">{status}</td>
            <td class="td" style="text-align:right">{aksi}</td>
          </tr>'''


def tombol_setuju(aktif=True):
    if not aktif:
        return '<span style="font-size:12px;color:var(--foreground-subtle)">—</span>'
    return ('<span class="btn sm" style="height:26px;padding:0 9px;font-size:12px">'
            + S.svg('check', 12, 2.4) + 'Setujui</span>')


KANAN = f'''
    <div class="field" style="height:28px;font-size:12px;gap:6px;padding:0 9px;color:var(--foreground-muted)">
      {S.svg('cal', 13, 1.8)}<span class="mono" style="font-size:12px;color:var(--foreground)">15 Sep 2026</span>
    </div>'''


def kepala():
    return f'''      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="display:flex;flex-direction:column;gap:2px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:15px;font-weight:700">Laporan audit 15 Sep 2026</span>
            {A.pill('6 menunggu persetujuan', 'warning')}
          </div>
          <span style="font-size:12px;color:var(--foreground-subtle)">Menyetujui menyesuaikan stok barang dan
            menulis jurnalnya — tidak bisa dibatalkan.</span>
        </div>
      </div>'''


def strip_kpi():
    return f'''      <div style="display:flex;gap:10px">
{A.kpi('Menunggu persetujuan', '6', 'dari 35 barang yang dihitung')}
{A.kpi('Stok akan berkurang', '−57', 'beban penyusutan 1.284.000', 'var(--destructive)', 'var(--destructive)')}
{A.kpi('Stok akan bertambah', '+18', 'pendapatan lain-lain 486.000', 'var(--info)', 'var(--info)')}
      </div>'''


def toolbar():
    return f'''      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:3px;padding:3px;border-radius:8px;
          background:var(--surface-raised)">
          {A.tab('Menunggu', 6, True)}{A.tab('Cocok', 27)}{A.tab('Disetujui', 2)}{A.tab('Semua', 35)}
        </div>
        <div class="field" style="width:220px;color:var(--foreground-subtle);gap:7px">
          {S.svg('search', 14, 1.9)}<span>Cari nama barang…</span>
        </div>
      </div>'''


def tabel():
    isi = [
        baris('Air Mineral Galon', 'galon', 13, 2, 'Kepala Gudang', A.pill('Selisih', 'destructive'),
              tombol_setuju(), '198.000'),
        baris('Kopi Bubuk 250 g', 'pak', 43, 3, 'Kepala Gudang', A.pill('Selisih', 'destructive'),
              tombol_setuju(), '880.000'),
        baris('Telur Ayam 1 kg', 'kg', 77, 33, 'Kepala Gudang', A.pill('Selisih', 'destructive'),
              tombol_setuju(), '1.056.000'),
        baris('Merica Bubuk 50 g', 'pak', 39, 32, 'Kepala Gudang', A.pill('Selisih', 'destructive'),
              tombol_setuju(), '42.000'),
        baris('Kacang Kulit 200 g', 'pak', 22, 30, 'Kepala Gudang', A.pill('Selisih', 'info'),
              tombol_setuju(), '96.000'),
        baris('Air Mineral 600 ml (dus)', 'dus', 22, 32, 'Kepala Gudang', A.pill('Selisih', 'info'),
              tombol_setuju(), '390.000'),
    ]
    return f'''      <div class="card" style="overflow:hidden;display:flex;flex-direction:column;min-height:0;flex:1">
        <div style="overflow:auto;min-height:0;flex:1">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:var(--surface-raised)">
            <th class="th" style="padding-top:9px">Barang</th>
            <th class="th" style="padding-top:9px;text-align:right;width:104px">Stok sistem</th>
            <th class="th" style="padding-top:9px;text-align:right;width:104px">Hasil audit</th>
            <th class="th" style="padding-top:9px;text-align:right;width:92px">Selisih</th>
            <th class="th" style="padding-top:9px;text-align:right;width:116px">Nilai</th>
            <th class="th" style="padding-top:9px;width:132px">Petugas</th>
            <th class="th" style="padding-top:9px;width:104px">Status</th>
            <th class="th" style="padding-top:9px;text-align:right;width:104px">Aksi</th>
          </tr></thead>
          <tbody>
{"".join(isi)}
          </tbody>
        </table>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 13px;
          border-top:1px solid var(--border);background:var(--surface-raised);font-size:12px;
          color:var(--foreground-muted)">
          <span><span class="mono" style="color:var(--foreground)">6</span> barang menunggu persetujuan</span>
          <span>Nilai dihitung dari harga beli rata-rata</span>
        </div>
      </div>'''


def halaman():
    return f'''  <div style="display:flex;height:100%">
{S.sidebar('Laporan Audit')}
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
{S.topbar('Persediaan', 'Laporan Audit', KANAN)}
      <div style="flex:1;min-height:0;padding:16px 20px;display:flex;flex-direction:column;gap:10px">
{kepala()}
{strip_kpi()}
{toolbar()}
{tabel()}
{A.catatan('Angka yang disetujui yang berlaku.', 'Pemilik boleh mengubah hasil hitungan petugas di dialog '
           'persetujuan — angka itu yang dipakai menyesuaikan stok, dan hitungan petugas ikut tertimpa.')}
      </div>
    </div>
  </div>'''


def tulis_halaman():
    html = (S.head()
            + '<div class="root {{theme}}" style="height:1000px;display:flex">\n'
            + '    <style>.root *{box-sizing:border-box}</style>\n'
            + halaman() + '\n</div>\n' + S.TAIL + S.logic() + S.END)
    open('LaporanAudit.dc.html', 'w').write(html)
    print('LaporanAudit.dc.html', len(html), 'bytes')


# ── Artboard 2: dialog persetujuan, kartu layar sempit, keadaan kosong ────────
def jurnal(baris_baris, total):
    isi = []
    for akun, tipe, jumlah in baris_baris:
        warna = 'var(--foreground)' if tipe == 'debit' else 'var(--foreground-muted)'
        kiri = f'<span style="color:{warna}">{akun}</span>'
        d = RP(jumlah) if tipe == 'debit' else '—'
        k = RP(jumlah) if tipe == 'credit' else '—'
        isi.append(f'''          <tr>
            <td style="padding:5px 0;font-size:12px">{kiri}</td>
            <td class="mono" style="padding:5px 0;font-size:12px;text-align:right;width:96px">{d}</td>
            <td class="mono" style="padding:5px 0;font-size:12px;text-align:right;width:96px">{k}</td>
          </tr>''')
    return f'''        <div style="border-radius:9px;background:var(--surface-raised);padding:10px 13px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="color:var(--foreground-subtle);display:flex">{S.svg('book', 13, 1.8)}</span>
            <span style="font-size:12px;font-weight:600">Jurnal yang ditulis</span>
          </div>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <th class="th" style="padding:0 0 4px;border:0">Akun</th>
              <th class="th" style="padding:0 0 4px;border:0;text-align:right">Debit</th>
              <th class="th" style="padding:0 0 4px;border:0;text-align:right">Kredit</th>
            </tr>
{"".join(isi)}
            <tr><td colspan="3" style="border-top:1px solid var(--border)"></td></tr>
            <tr>
              <td style="padding:5px 0;font-size:12px;font-weight:600">Balance</td>
              <td class="mono" style="padding:5px 0;font-size:12px;text-align:right;font-weight:700">{RP(total)}</td>
              <td class="mono" style="padding:5px 0;font-size:12px;text-align:right;font-weight:700">{RP(total)}</td>
            </tr>
          </table>
        </div>'''


def kotak_angka(nilai, catatan=''):
    ket = (f'<div style="font-size:11px;color:var(--warning);margin-top:5px">{catatan}</div>' if catatan else '')
    return f'''        <div>
          <div style="font-size:12px;font-weight:600;margin-bottom:5px">Jumlah yang disetujui</div>
          <div class="field mono" style="width:100%;justify-content:flex-end;font-size:14px;font-weight:600;
            border-color:var(--accent);box-shadow:0 0 0 3px hsl(256 82% 70% / 0.18)">{nilai}</div>
          {ket}
        </div>'''


def dialog_kurang():
    isi = (A.ringkas(A.brs('Barang', 'Air Mineral Galon', mono=False)
                     + A.brs('Stok menurut sistem', '13 galon', mono=False)
                     + A.brs('Hasil hitung petugas', '2 galon', mono=False)
                     + '<div style="height:1px;background:var(--border);margin:3px 0"></div>'
                     + A.brs('Selisih', '−11 galon', mono=False, nada='var(--destructive)')
                     + A.brs('Nilai', '198.000', nada='var(--destructive)'))
           + '\n' + kotak_angka('2')
           + '\n' + jurnal([('Beban Penyusutan Persediaan', 'debit', 198000),
                            ('Persediaan', 'credit', 198000)], 198000))
    return A.dialog('Setujui hasil audit?',
                    'Stok Air Mineral Galon berubah dari <b>13</b> menjadi <b>2</b>, dan jurnal di bawah ditulis '
                    'saat ini juga. Tidak ada cara membatalkannya dari layar mana pun.',
                    isi, A.tombol_batal('Kembali') + A.tombol_utama('Setujui & sesuaikan stok'), lebar=460)


def dialog_lebih():
    isi = (A.ringkas(A.brs('Barang', 'Kacang Kulit 200 g', mono=False)
                     + A.brs('Stok menurut sistem', '22 pak', mono=False)
                     + A.brs('Hasil hitung petugas', '30 pak', mono=False)
                     + '<div style="height:1px;background:var(--border);margin:3px 0"></div>'
                     + A.brs('Selisih', '+8 pak', mono=False, nada='var(--info)')
                     + A.brs('Nilai', '96.000', nada='var(--info)'))
           + '\n' + kotak_angka('28', 'Diubah dari hasil hitungan petugas (30). Angka ini yang dipakai.')
           + '\n' + jurnal([('Persediaan', 'debit', 72000),
                            ('Pendapatan Lain-lain', 'credit', 72000)], 72000))
    return A.dialog('Setujui hasil audit?',
                    'Stok Kacang Kulit 200 g berubah dari <b>22</b> menjadi <b>28</b>. Nilainya ikut berubah '
                    'mengikuti angka yang kamu setujui.',
                    isi, A.tombol_batal('Kembali') + A.tombol_utama('Setujui & sesuaikan stok'), lebar=460)


def kartu(nama, satuan, sistem, audit, nada):
    beda = audit - sistem
    return f'''        <div class="card" style="padding:10px 12px;display:flex;flex-direction:column;gap:7px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
            <div style="min-width:0">
              <div style="font-size:13px;font-weight:600">{nama}</div>
              <div style="font-size:11px;color:var(--foreground-subtle)">{satuan}</div>
            </div>
            {selisih_chip(beda)}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <span style="font-size:11px;color:var(--foreground-subtle)">Sistem
              <span class="mono" style="color:var(--foreground-muted)">{sistem}</span> ·
              Audit <span class="mono" style="color:var(--foreground)">{audit}</span></span>
            <span class="btn sm" style="height:26px;padding:0 9px;font-size:12px;{nada}">
              {S.svg('check', 12, 2.4)}Setujui</span>
          </div>
        </div>'''


def layar_sempit():
    return f'''      <div style="width:360px;display:flex;flex-direction:column;gap:8px">
        <div style="font-size:12px;color:var(--foreground-subtle)">Layar sempit — 360px</div>
{kartu('Air Mineral Galon', 'galon', 13, 2, '')}
{kartu('Kacang Kulit 200 g', 'pak', 22, 30, '')}
      </div>'''


def keadaan_kosong():
    return f'''      <div class="card" style="width:560px;padding:32px 28px;display:flex;flex-direction:column;
        align-items:center;text-align:center;gap:9px">
        <span style="width:38px;height:38px;border-radius:10px;background:var(--accent-subtle);color:var(--accent);
          display:flex;align-items:center;justify-content:center">{S.svg('gavel', 19, 1.8)}</span>
        <div style="font-size:14px;font-weight:700">Tidak ada yang menunggu persetujuan</div>
        <div style="font-size:12px;color:var(--foreground-muted);max-width:380px;line-height:1.55">
          Seluruh hitungan 15 Sep 2026 cocok dengan stok sistem. Tidak ada stok yang perlu disesuaikan dan
          tidak ada jurnal yang perlu ditulis.
        </div>
        <span class="btn ghost sm" style="margin-top:4px">{S.svg('clip', 13, 1.9)}Buka Audit Barang</span>
      </div>'''


def keadaan():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:22px">
    <div>
{A.judul_blok('Persetujuan selisih', 'satu-satunya tempat stok bisa berubah tanpa transaksi')}
      <div style="display:flex;gap:18px;align-items:flex-start">
{dialog_kurang()}
{dialog_lebih()}
{layar_sempit()}
      </div>
    </div>
    <div>
{A.judul_blok('Tidak ada selisih', 'yang dilihat pemilik kalau semua hitungan cocok')}
{keadaan_kosong()}
    </div>
  </div>'''


def tulis_keadaan():
    html = (S.head()
            + '<div class="root {{theme}}" style="min-height:900px">\n'
            + '    <style>.root *{box-sizing:border-box}</style>\n'
            + keadaan() + '\n</div>\n' + S.TAIL + A.logic_gelap() + S.END)
    open('LaporanAuditSetujui.dc.html', 'w').write(html)
    print('LaporanAuditSetujui.dc.html', len(html), 'bytes')


if __name__ == '__main__':
    tulis_halaman()
    tulis_keadaan()
