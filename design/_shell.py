# Shell bersama. Penamaan token mengikuti shadcn/ui supaya peta ke implementasi 1:1.
# Artboard tidak berbagi runtime, jadi markup ini digenerate ulang ke tiap berkas.

FONTS = ("https://fonts.googleapis.com/css2?"
         "family=Plus+Jakarta+Sans:wght@400;500;600;700;800&"
         "family=JetBrains+Mono:wght@400;500;600&display=swap")

THEME = '''
    .light{
      --background:hsl(240 20% 99%);
      --surface:hsl(0 0% 100%);
      --surface-raised:hsl(240 20% 97%);
      --surface-sunken:hsl(240 16% 95%);
      --border:hsl(240 12% 89%);
      --border-subtle:hsl(240 14% 94%);
      --border-strong:hsl(240 10% 80%);
      --foreground:hsl(240 15% 12%);
      --foreground-muted:hsl(240 8% 42%);
      --foreground-subtle:hsl(240 7% 58%);
      --accent:hsl(256 68% 54%);
      --accent-foreground:hsl(0 0% 100%);
      --accent-subtle:hsl(256 70% 96%);
      --accent-hover:hsl(256 68% 47%);
      --success:hsl(152 62% 28%);
      --success-foreground:hsl(0 0% 100%);
      --success-subtle:hsl(152 48% 95%);
      --warning:hsl(30 90% 31%);
      --warning-foreground:hsl(0 0% 100%);
      --warning-subtle:hsl(36 85% 94%);
      --destructive:hsl(2 72% 45%);
      --destructive-foreground:hsl(0 0% 100%);
      --destructive-subtle:hsl(2 72% 96%);
      --info:hsl(212 72% 45%);
      --info-foreground:hsl(0 0% 100%);
      --info-subtle:hsl(212 70% 95%);
      --ring:hsl(256 68% 54%);
      --shadow-sm:0 1px 2px 0 hsl(240 15% 12% / 0.05);
      --shadow-md:0 4px 12px -2px hsl(240 15% 12% / 0.10), 0 2px 4px -2px hsl(240 15% 12% / 0.06);
    }
    .dark{
      --background:hsl(240 12% 8%);
      --surface:hsl(240 11% 11%);
      --surface-raised:hsl(240 10% 15%);
      --surface-sunken:hsl(240 13% 6%);
      --border:hsl(240 8% 21%);
      --border-subtle:hsl(240 8% 16%);
      --border-strong:hsl(240 7% 32%);
      --foreground:hsl(240 18% 96%);
      --foreground-muted:hsl(240 8% 67%);
      --foreground-subtle:hsl(240 7% 50%);
      --accent:hsl(256 82% 70%);
      --accent-foreground:hsl(250 30% 10%);
      --accent-subtle:hsl(256 38% 20%);
      --accent-hover:hsl(256 82% 77%);
      --success:hsl(152 52% 56%);
      --success-foreground:hsl(152 40% 9%);
      --success-subtle:hsl(152 32% 17%);
      --warning:hsl(36 84% 62%);
      --warning-foreground:hsl(36 50% 10%);
      --warning-subtle:hsl(36 40% 18%);
      --destructive:hsl(2 80% 69%);
      --destructive-foreground:hsl(2 40% 10%);
      --destructive-subtle:hsl(2 36% 18%);
      --info:hsl(212 78% 66%);
      --info-foreground:hsl(212 45% 10%);
      --info-subtle:hsl(212 38% 20%);
      --ring:hsl(256 82% 70%);
      --shadow-sm:0 1px 2px 0 hsl(0 0% 0% / 0.30);
      --shadow-md:0 4px 12px -2px hsl(0 0% 0% / 0.45), 0 2px 4px -2px hsl(0 0% 0% / 0.30);
    }
'''

BASE = '''
    body{margin:0}
    .root{background:var(--background);color:var(--foreground);
      font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;
      font-size:13px;line-height:1.45}
    a{color:var(--accent);text-decoration:none} a:hover{opacity:.8}
    .mono{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;
      letter-spacing:-0.01em}
    .eyebrow{font-size:11px;font-weight:700;color:var(--foreground-subtle)}
    .card{background:var(--surface);border:1px solid var(--border);border-radius:10px;box-shadow:var(--shadow-sm)}
    .nav{display:flex;align-items:center;gap:9px;height:28px;padding:0 9px;border-radius:7px;
      font-size:13px;font-weight:500;color:var(--foreground-muted);cursor:pointer}
    .nav:hover{background:var(--surface-raised);color:var(--foreground)}
    .nav.on{background:var(--accent-subtle);color:var(--accent);font-weight:600}
    .navsec{font-size:11px;font-weight:700;
      color:var(--foreground-subtle);padding:0 9px;margin:12px 0 4px}
    .th{font-size:11px;font-weight:700;color:var(--foreground-subtle);
      text-align:left;padding:0 10px 7px;border-bottom:1px solid var(--border)}
    .td{font-size:13px;padding:8px 10px;border-bottom:1px solid var(--border);vertical-align:middle}
    .pill{font-size:11px;font-weight:600;padding:1px 7px;border-radius:5px;display:inline-flex;align-items:center;
      gap:4px;white-space:nowrap;line-height:18px}
    .btn{height:32px;padding:0 12px;border-radius:7px;border:1px solid transparent;background:var(--accent);
      color:var(--accent-foreground);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;
      display:inline-flex;align-items:center;gap:6px}
    .btn.ghost{background:var(--surface);border-color:var(--border-strong);color:var(--foreground)}
    .btn.sm{height:28px;padding:0 9px;font-size:12px;border-radius:6px}
    .field{height:32px;border:1px solid var(--border-strong);border-radius:7px;padding:0 10px;font-size:13px;
      font-family:inherit;color:var(--foreground);background:var(--surface);display:flex;align-items:center;gap:7px}
    .ico{width:26px;height:26px;border-radius:6px;border:1px solid var(--border);display:flex;
      align-items:center;justify-content:center;cursor:pointer;color:var(--foreground-muted)}
'''

NAV = [
    ('', ['Beranda']),
    ('Penjualan', ['Transaksi', 'Customer', 'Piutang']),
    ('Pembelian', ['Barang Masuk', 'Konfirmasi', 'Supplier', 'Utang', 'Utang Giro']),
    ('Persediaan', ['Barang', 'Harga Jual', 'Audit Barang', 'Laporan Audit']),
    ('Keuangan', ['Jurnal Umum', 'Buku Besar', 'Beban', 'Konversi Saldo', 'Laporan Pendapatan', 'Laporan per Kasir', 'Perubahan Modal']),
    ('Karyawan', ['Karyawan', 'Gaji Karyawan', 'Gaji di Muka', 'Prive']),
]

ICONS = {
 'home':'<path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 'cart':'<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.4 12h11L21 7H6"/>',
 'box':'<path d="M12 3 3 7.5v9L12 21l9-4.5v-9z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
 'stack':'<path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/>',
 'coin':'<ellipse cx="12" cy="7" rx="8" ry="3.4"/><path d="M4 7v10c0 1.9 3.6 3.4 8 3.4s8-1.5 8-3.4V7"/>',
 'user':'<circle cx="12" cy="8.5" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
}
SEC_ICON = {'':'home','Penjualan':'cart','Pembelian':'box','Persediaan':'stack','Keuangan':'coin','Karyawan':'user'}

def svg(name, size=15, sw=1.7):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{ICONS[name]}</svg>')

def head():
    return ('<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n'
            '  <script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n'
            f'  <link rel="stylesheet" href="{FONTS}">\n'
            f'  <style>{THEME}{BASE}  </style>\n</helmet>\n')

def sidebar(active, role='Pemilik', nav=None):
    nav = nav if nav is not None else NAV
    out = ['<div style="width:222px;flex-shrink:0;background:var(--background);border-right:1px solid var(--border);'
           'display:flex;flex-direction:column;padding:12px 10px;gap:1px">',
           '  <div style="display:flex;align-items:center;gap:8px;padding:4px 6px 12px">',
           '    <div style="width:26px;height:26px;border-radius:7px;background:var(--accent);color:var(--accent-foreground);'
           'display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800">P</div>',
           '    <div style="display:flex;flex-direction:column;min-width:0">',
           '      <div style="font-size:13px;font-weight:700;line-height:15px">Putra Pribumi</div>',
           f'      <div style="font-size:11px;color:var(--foreground-subtle);line-height:14px">{role}</div>',
           '    </div>', '  </div>']
    for name, items in nav:
        if name:
            out.append(f'  <div class="navsec">{name}</div>')
        for it in items:
            on = ' on' if it == active else ''
            ic = svg(SEC_ICON[name], 14, 1.8)
            out.append(f'  <div class="nav{on}">{ic}{it}</div>')
    out.append('</div>')
    return '\n'.join(out)

def topbar(crumb, title, right=''):
    return f'''<div style="height:50px;flex-shrink:0;border-bottom:1px solid var(--border);display:flex;
  align-items:center;justify-content:space-between;padding:0 20px;background:var(--background)">
  <div style="display:flex;align-items:center;gap:7px;font-size:13px">
    <span style="color:var(--foreground-subtle)">{crumb}</span>
    <span style="color:var(--foreground-subtle)">/</span>
    <span style="font-weight:600">{title}</span>
  </div>
  <div style="display:flex;align-items:center;gap:9px">{right}
    <div class="field" style="height:28px;font-size:12px;color:var(--foreground-subtle);gap:5px;padding:0 8px">
      <span class="mono" style="font-size:11px">⌘K</span></div>
    <div style="width:26px;height:26px;border-radius:50%;background:var(--accent-subtle);color:var(--accent);
      display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">SA</div>
  </div>
</div>'''

def logic(extra=''):
    props = '"tema":{"editor":"enum","options":["Terang","Gelap"],"default":"Terang","section":"Tampilan"}'
    if extra: props += ',' + extra
    return ('\n<script data-dc-script data-props=\'{' + props + '}\'>\n'
            'class Component extends DCLogic {\n  renderVals() {\n'
            "    const t = this.state?.tema ?? this.props.tema ?? 'Terang';\n"
            "    return { theme: t === 'Gelap' ? 'dark' : 'light' };\n"
            '  }\n}\n</script>\n')

TAIL = '</x-dc>\n'
END = '</body>\n</html>\n'
