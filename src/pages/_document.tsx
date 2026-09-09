import Document, { Head, Html, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          {/*
            Plus Jakarta Sans — dirancang di Jakarta, hangat tapi rapi di ukuran kecil,
            jadi terasa ramah tanpa jadi lucu-lucuan. JetBrains Mono khusus angka uang:
            tabular, sehingga kolom rupiah rata secara vertikal.
            Hanya bobot yang dipakai yang diminta.
          */}
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
