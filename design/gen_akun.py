# Generator artboard "Menu akun" + "Login".
#
# Menu akun sekarang: panel 256px berlatar `bg-white` MENTAH (Dropdown.tsx) — jadi di
# mode gelap ia tetap putih menyilaukan, satu-satunya permukaan di aplikasi yang tidak
# ikut tema. Isinya foto stok abu-abu yang sama untuk semua orang, lalu dua baris
# setinggi 40px dipisah garis penuh, tanpa ikon, dan "Log out" tampak sederajat dengan
# "Akun" padahal satu menutup sesi.
#
# Login sekarang: judul 36px (skala teks aplikasi berhenti di 22px), `text-blue-600`
# dan `text-blueGray-600` sisa palet lama, kartu `shadow-2xl`, dan autocomplete
# "invt-email"/"invt-password" yang membuat pengelola sandi tidak mengenali formnya.
import _shell as S
import gen_audit as A

S.ICONS.update({
    'user2': '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    'logout': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    'eye2': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    'lock2': '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    'at': '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
    'alert': '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5"/><path d="M12 16.2v.4"/>',
})


def item(ikon, teks, pintas='', sorot=False, bahaya=False):
    """Baris menu 30px — setinggi baris menu sidebar, bukan 40px seperti sekarang."""
    warna = 'var(--destructive)' if bahaya else 'var(--foreground)'
    latar = ''
    if sorot:
        latar = ('background:var(--destructive-subtle)' if bahaya else 'background:var(--surface-raised)')
    kanan = (f'<span class="mono" style="font-size:11px;color:var(--foreground-subtle)">{pintas}</span>'
             if pintas else '')
    return f'''      <div style="display:flex;align-items:center;gap:9px;height:30px;padding:0 9px;border-radius:7px;
        font-size:13px;color:{warna};{latar}">
        <span style="display:flex;color:{'var(--destructive)' if bahaya else 'var(--foreground-subtle)'}">
          {S.svg(ikon, 14, 1.8)}</span>
        <span style="flex:1">{teks}</span>{kanan}
      </div>'''


def menu(sorot=None):
    """sorot: None | 'akun' | 'logout'"""
    return f'''    <div class="card" style="width:232px;padding:4px;box-shadow:var(--shadow-md)">
      <div style="display:flex;align-items:center;gap:9px;padding:8px 9px 9px">
        <span style="width:30px;height:30px;border-radius:50%;background:var(--accent-subtle);color:var(--accent);
          display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">SA</span>
        <div style="min-width:0;flex:1">
          <div style="font-size:13px;font-weight:600;line-height:16px">Super Admin</div>
          <div class="mono" style="font-size:11px;color:var(--foreground-subtle);line-height:15px">superadmin</div>
        </div>
      </div>
      <div style="height:1px;background:var(--border-subtle);margin:0 -4px 4px"></div>
{item('user2', 'Akun', sorot=(sorot == 'akun'))}
{item('logout', 'Log out', sorot=(sorot == 'logout'), bahaya=True)}
    </div>'''


def topbar_mini(buka=True):
    kanan = f'''
    <div class="field" style="height:26px;font-size:12px;color:var(--foreground-subtle);gap:5px;padding:0 8px">
      <span class="mono" style="font-size:11px">⌘K</span></div>
    <div style="display:flex;gap:2px;padding:2px;border-radius:8px;background:var(--surface-raised)">
      <span style="width:24px;height:22px;border-radius:6px;background:var(--surface);color:var(--accent);
        display:flex;align-items:center;justify-content:center">{S.svg('sun', 13, 1.8)}</span>
      <span style="width:24px;height:22px;border-radius:6px;color:var(--foreground-subtle);
        display:flex;align-items:center;justify-content:center">{S.svg('moon', 13, 1.8)}</span>
    </div>
    <div style="width:26px;height:26px;border-radius:50%;background:var(--accent-subtle);color:var(--accent);
      display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;
      {'box-shadow:0 0 0 2px var(--accent)' if buka else ''}">SA</div>'''
    return f'''  <div style="height:50px;border-bottom:1px solid var(--border);display:flex;align-items:center;
    justify-content:flex-end;gap:9px;padding:0 20px;background:var(--background)">{kanan}</div>'''


S.ICONS.update({
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    'moon': '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
})


def blok_menu():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:20px">
{A.judul_blok('Menu akun', 'dipanggil dari avatar di kanan atas')}
    <div style="display:flex;gap:26px;align-items:flex-start">
      <div style="width:420px;border-radius:12px;border:1px solid var(--border);overflow:hidden">
{topbar_mini()}
        <div style="height:150px;background:var(--surface-sunken);position:relative">
          <div style="position:absolute;right:14px;top:8px">
{menu()}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:18px">
        <div>
          <div style="font-size:11px;color:var(--foreground-subtle);margin-bottom:7px">Akun ditunjuk</div>
{menu('akun')}
        </div>
        <div>
          <div style="font-size:11px;color:var(--foreground-subtle);margin-bottom:7px">Log out ditunjuk</div>
{menu('logout')}
        </div>
      </div>
    </div>
{A.catatan('Yang berubah.', 'Panelnya memakai permukaan bertema — bukan `bg-white` mentah seperti sekarang, '
           'yang membuatnya tetap putih di mode gelap. Foto stok abu-abu diganti inisial yang sama dengan avatar '
           'di topbar, tinggi baris turun 40px → 30px mengikuti baris menu sidebar, tiap baris dapat ikon, dan '
           '"Log out" diberi warna destruktif supaya tidak terbaca sederajat dengan "Akun".')}
  </div>'''


# ── Login ─────────────────────────────────────────────────────────────────────
def kolom(label, isi, ikon=None, pesan=None, fokus=False, kanan=''):
    garis = ('border-color:var(--accent);box-shadow:0 0 0 3px hsl(256 68% 54% / 0.18)'
             if fokus else ('border-color:var(--destructive)' if pesan else 'border-color:var(--border-strong)'))
    kiri = (f'<span style="display:flex;color:var(--foreground-subtle)">{S.svg(ikon, 14, 1.8)}</span>'
            if ikon else '')
    warna_isi = 'var(--foreground)' if isi else 'var(--foreground-subtle)'
    ket = (f'<div style="font-size:11px;color:var(--destructive);margin-top:5px;display:flex;align-items:center;'
           f'gap:5px">{S.svg("alert", 12, 1.9)}{pesan}</div>' if pesan else '')
    return f'''        <div>
          <div style="font-size:12px;font-weight:600;margin-bottom:5px">{label}</div>
          <div class="field" style="width:100%;gap:8px;{garis}">
            {kiri}<span style="flex:1;color:{warna_isi};font-size:13px">{isi or 'Masukkan ' + label.lower()}</span>
            {kanan}
          </div>
          {ket}
        </div>'''


def kartu_login(error=False, memuat=False):
    tombol = ('<span class="btn" style="width:100%;justify-content:center;opacity:.75">Memeriksa…</span>'
              if memuat else '<span class="btn" style="width:100%;justify-content:center">Masuk</span>')
    peringatan = ('''        <div style="display:flex;gap:8px;align-items:flex-start;padding:9px 11px;border-radius:9px;
          background:var(--destructive-subtle);color:var(--destructive);font-size:12px;line-height:1.45">
          ''' + S.svg('alert', 14, 1.9) + '''
          <span><b>Username atau kata sandi salah.</b><br>Periksa lagi, atau pulihkan kata sandimu lewat tautan
          di bawah.</span>
        </div>''' if error else '')
    sandi_kanan = (f'<span style="display:flex;color:var(--foreground-subtle)">{S.svg("eye2", 14, 1.8)}</span>')
    return f'''      <div class="card" style="width:352px;padding:20px;display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;flex-direction:column;align-items:center;gap:7px;text-align:center">
          <span style="width:34px;height:34px;border-radius:9px;background:var(--accent);color:var(--accent-foreground);
            display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800">P</span>
          <div>
            <div style="font-size:16px;font-weight:700;line-height:20px">Putra Pribumi</div>
            <div style="font-size:12px;color:var(--foreground-subtle);line-height:17px">Masuk untuk melanjutkan</div>
          </div>
        </div>
{peringatan}
        <div style="display:flex;flex-direction:column;gap:11px">
{kolom('Username', 'superadmin' if error else '', 'at', fokus=not error)}
{kolom('Kata sandi', '••••••••' if error else '', 'lock2', pesan=None, kanan=sandi_kanan)}
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <span style="display:inline-flex;align-items:center;gap:7px;font-size:12px;color:var(--foreground-muted)">
              <span style="width:14px;height:14px;border-radius:4px;border:1px solid var(--border-strong);
                display:inline-block"></span>Ingat saya
            </span>
            <a style="font-size:12px">Lupa kata sandi</a>
          </div>
          {tombol}
        </div>
      </div>'''


def layar_login(judul, ket, isi, lebar=520, tinggi=470):
    return f'''    <div>
      <div style="font-size:12px;color:var(--foreground-subtle);margin-bottom:7px">{judul} — {ket}</div>
      <div style="width:{lebar}px;height:{tinggi}px;border-radius:12px;border:1px solid var(--border);
        background:var(--background);display:flex;align-items:center;justify-content:center;overflow:hidden">
{isi}
      </div>
    </div>'''


def blok_login():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:20px">
{A.judul_blok('Login', 'satu kartu di tengah, tanpa hiasan')}
    <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
{layar_login('Biasa', 'kursor di kolom pertama', kartu_login())}
{layar_login('Ditolak', 'kredensial salah', kartu_login(error=True))}
{layar_login('Mengirim', 'tombol menahan kiriman kedua', kartu_login(memuat=True), lebar=420)}
    </div>
{A.catatan('Yang berubah.', 'Judul 36px dan warna sisa palet lama (`text-blue-600`, `text-blueGray-600`, '
           'kartu `shadow-2xl`) diganti token dan skala teks aplikasi. Kegagalan login muncul sebagai panel di '
           'dalam form, bukan cuma toast yang keburu hilang. Kolom sandi dapat tombol lihat/sembunyi, dan '
           'autocomplete dikembalikan ke nilai standar supaya pengelola sandi mengenali formnya.')}
  </div>'''


def tulis():
    html = (S.head()
            + '<div class="root {{theme}}" style="min-height:520px">\n'
            + '    <style>.root *{box-sizing:border-box}</style>\n'
            + blok_menu() + '\n</div>\n' + S.TAIL + S.logic() + S.END)
    open('MenuAkun.dc.html', 'w').write(html)
    print('MenuAkun.dc.html', len(html), 'bytes')

    html = (S.head()
            + '<div class="root {{theme}}" style="min-height:660px">\n'
            + '    <style>.root *{box-sizing:border-box}</style>\n'
            + blok_login() + '\n</div>\n' + S.TAIL + A.logic_gelap() + S.END)
    open('Login.dc.html', 'w').write(html)
    print('Login.dc.html', len(html), 'bytes')


if __name__ == '__main__':
    tulis()
