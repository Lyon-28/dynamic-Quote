<div align="center">

# 🌤️ Dynamic Quote

**API kutipan dinamis berbasis waktu — otomatis berganti sesuai hari & periode (pagi/siang/sore/malam) waktu Indonesia (WIB).**

Dukung format **SVG, PNG, JPEG, PDF, HTML, JSON, Text, Markdown**, dan **Copy to Clipboard** — bisa dipakai di README GitHub, website, atau aplikasi Node/Browser.

<p align="center">
  <img src="https://your-deploy-url/api/quote?type=horizontal&theme=radical&format=svg" alt="dynamic quote preview" width="600">
</p>

<p align="center">
  <img alt="Vercel" src="https://img.shields.io/badge/deploy-vercel-black?style=flat-square&logo=vercel">
  <img alt="Netlify" src="https://img.shields.io/badge/deploy-netlify-00C7B7?style=flat-square&logo=netlify">
  <img alt="GitHub Pages" src="https://img.shields.io/badge/deploy-github%20pages-222?style=flat-square&logo=github">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square">
</p>

</div>

---

## 📖 Daftar Isi

- [Fitur](#-fitur)
- [Cara Kerja](#-cara-kerja)
- [Struktur Proyek](#-struktur-proyek)
- [Instalasi & Deploy](#-instalasi--deploy)
- [Parameter API](#-parameter-api)
- [Tema (Theme)](#-tema-theme)
- [Format Output](#-format-output)
  - [SVG](#1-svg)
  - [PNG](#2-png)
  - [JPEG](#3-jpeg)
  - [PDF](#4-pdf)
  - [HTML](#5-html)
  - [JSON](#6-json)
  - [Text / TXT](#7-text--txt)
  - [Markdown](#8-markdown)
  - [Copy to Clipboard](#9-copy-to-clipboard)
- [Penggunaan di Browser](#-penggunaan-di-browser)
- [Penggunaan di Node.js](#-penggunaan-di-nodejs)
- [Contoh Embed Lengkap](#-contoh-embed-lengkap)
- [Struktur data/quotes.json](#-struktur-dataquotesjson)
- [Kustomisasi Warna & Background](#-kustomisasi-warna--background)
- [Hybrid Screenshot Fallback](#-hybrid-screenshot-fallback)
- [FAQ](#-faq)
- [Lisensi](#-lisensi)

---

## ✨ Fitur

<table>
<tr><td>🗓️</td><td>Auto-detect hari & periode waktu (WIB) — quote berubah otomatis sepanjang hari</td></tr>
<tr><td>🎲</td><td>Random quote dari kumpulan quote per hari/periode</td></tr>
<tr><td>🎨</td><td>11 tema preset + kustomisasi warna teks, author, background, dan background image</td></tr>
<tr><td>🖼️</td><td>Export ke SVG, PNG, JPEG, PDF, HTML, JSON, Text, Markdown</td></tr>
<tr><td>📋</td><td>Copy to clipboard langsung dari browser</td></tr>
<tr><td>🔀</td><td>Hybrid screenshot API dengan auto-fallback 6 lapis (ScreenshotOne → ApiFlash → Cloudinary → Microlink → ScreenshotAPI → local)</td></tr>
<tr><td>🚀</td><td>Deploy hybrid: Vercel, Netlify, atau GitHub Pages (static fallback)</td></tr>
<tr><td>🧩</td><td>Bisa dipakai di Node.js maupun langsung di browser (client-side fetch)</td></tr>
</table>

---

## ⚙️ Cara Kerja

1. Sistem mendeteksi **hari** (senin–minggu) dan **jam saat ini** dalam zona waktu `Asia/Jakarta`.
2. Jam dipetakan ke salah satu dari 4 periode:

| Periode | Rentang Jam (WIB) |
|---|---|
| `pagi`  | 05:00 – 10:59 |
| `siang` | 11:00 – 14:59 |
| `sore`  | 15:00 – 17:59 |
| `malam` | 18:00 – 04:59 |

3. Dari `data/quotes.json`, sistem mengambil array quote sesuai `hari.periode`, lalu memilih **satu quote secara acak**.
4. Quote dirender sesuai `format` yang diminta (svg, png, json, dst) dan `theme`/warna yang dipilih.

> 💡 Kamu juga bisa **override** hari/periode manual lewat parameter `?day=` dan `?period=`, tidak harus mengikuti waktu real-time.

---

## 📁 Struktur Proyek

```

lyon-28/dynamic-quote/
├── .github/
│   └── workflows/        # CI/CD untuk auto-deploy
├── data/
│   └── quotes.json       # Database kutipan per hari & periode
├── api/
│   └── quote.js          # Serverless function entry (Vercel/Netlify)
├── script.js             # Core logic (Node + Browser)
├── index.html            # Demo & showcase semua format
└── README.md             # Dokumentasi ini
```

---

## 🚀 Instalasi & Deploy

### Clone repo

```bash
git clone https://github.com/lyon-28/dynamic-quote.git
cd dynamic-quote
npm install
```

### Deploy ke Vercel

```bash
npm i -g vercel
vercel --prod
```

Tambahkan environment variable di dashboard Vercel:

```
BASE_URL=https://dynamic-quote.vercel.app
```

### Deploy ke Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod
```

### Deploy ke GitHub Pages (mode statis, tanpa PNG/PDF server-side)

GitHub Pages hanya mendukung file statis, sehingga endpoint format `png`/`jpeg`/`pdf` (yang butuh server function) **tidak berjalan** di sana. Format `svg`, `json`, `html`, `text`, `markdown` tetap berfungsi penuh karena dirender client-side via `script.js` + `fetch`.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/deploy-pages@v4
```

---

## 🔧 Parameter API

Endpoint dasar:

```
GET /api/quote
```

| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `day` | string | auto (hari ini) | `senin`, `selasa`, `rabu`, `kamis`, `jum'at`, `sabtu`, `minggu` |
| `period` | string | auto (jam sekarang) | `pagi`, `siang`, `sore`, `malam` |
| `format` | string | `json` | `svg`, `png`, `jpeg`, `pdf`, `html`, `json`, `text`, `txt`, `markdown` |
| `theme` | string | `radical` | Lihat [Tema](#-tema-theme) |
| `type` | string | `horizontal` | `horizontal` atau `vertical` |
| `width` | number | `600` (horizontal) / `400` (vertical) | Lebar gambar/kartu (px) |
| `height` | number | `300` (horizontal) / `500` (vertical) | Tinggi gambar/kartu (px) |
| `colorText` | string / `none` | sesuai tema | Hex tanpa `#`, contoh `ffffff` |
| `colorAuthor` | string / `none` | sesuai tema | Hex tanpa `#` |
| `background` | string / `none` | sesuai tema | Hex tanpa `#`, atau `none` untuk transparan |
| `backgroundImage` | URL | – | URL gambar sebagai latar belakang |

---

## 🎨 Tema (Theme)

<div align="center">

| Theme | Preview |
|---|---|
| `radical` | 

![radical](https://your-deploy-url/api/quote?theme=radical&format=svg&day=senin&period=pagi)

 |
| `dark` | 

![dark](https://your-deploy-url/api/quote?theme=dark&format=svg&day=senin&period=pagi)

 |
| `light` | 

![light](https://your-deploy-url/api/quote?theme=light&format=svg&day=senin&period=pagi)

 |
| `dracula` | 

![dracula](https://your-deploy-url/api/quote?theme=dracula&format=svg&day=senin&period=pagi)

 |
| `monokai` | 

![monokai](https://your-deploy-url/api/quote?theme=monokai&format=svg&day=senin&period=pagi)

 |
| `gruvbox` | 

![gruvbox](https://your-deploy-url/api/quote?theme=gruvbox&format=svg&day=senin&period=pagi)

 |
| `tokyonight` | 

![tokyonight](https://your-deploy-url/api/quote?theme=tokyonight&format=svg&day=senin&period=pagi)

 |
| `sunset` | 

![sunset](https://your-deploy-url/api/quote?theme=sunset&format=svg&day=senin&period=pagi)

 |
| `ocean` | 

![ocean](https://your-deploy-url/api/quote?theme=ocean&format=svg&day=senin&period=pagi)

 |
| `forest` | 

![forest](https://your-deploy-url/api/quote?theme=forest&format=svg&day=senin&period=pagi)

 |
| `transparent` | 

![transparent](https://your-deploy-url/api/quote?theme=transparent&format=svg&day=senin&period=pagi)

 |

</div>

---

## 🖼️ Format Output

### 1. SVG

Format paling ringan & scalable, cocok untuk embed di README GitHub karena render langsung tanpa request tambahan.

```html
<p align="center">
  <img src="https://your-deploy-url/api/quote?type=horizontal&theme=radical&format=svg" alt="quote">
</p>
```

Vertical card:

```html
<img src="https://your-deploy-url/api/quote?type=vertical&theme=tokyonight&format=svg" width="400" alt="quote">
```

---

### 2. PNG

Dirender via hybrid screenshot API (lihat [Hybrid Screenshot Fallback](#-hybrid-screenshot-fallback)). Cocok untuk platform yang tidak mendukung SVG (misalnya beberapa preview link).

```html
<img src="https://your-deploy-url/api/quote?format=png&theme=dracula&width=600&height=300" alt="quote png">
```

---

### 3. JPEG

Sama seperti PNG tapi ukuran file lebih kecil (tanpa transparansi).

```html
<img src="https://your-deploy-url/api/quote?format=jpeg&theme=sunset" alt="quote jpeg">
```

---

### 4. PDF

Cocok untuk generate kartu kutipan yang bisa dicetak.

```html
<a href="https://your-deploy-url/api/quote?format=pdf&theme=forest&width=400&height=500">
  📄 Download Quote PDF
</a>
```

---

### 5. HTML

Mengembalikan potongan HTML siap tempel (misalnya untuk `iframe` atau widget di web).

```html
<iframe
  src="https://your-deploy-url/api/quote?format=html&theme=ocean"
  width="600" height="300" frameborder="0">
</iframe>
```

---

### 6. JSON

Untuk kebutuhan integrasi custom (aplikasi mobile, bot Discord/Telegram, dsb).

**Request:**

```
GET /api/quote?format=json&day=senin&period=pagi
```

**Response:**

```json
{
  "day": "senin",
  "period": "pagi",
  "text": [
    "Senin datang lagi",
    "membawa lembaran baru",
    "jangan takut memulai"
  ],
  "author": "LyonPoy",
  "generatedAt": "2026-08-17T02:15:00.000Z"
}
```

**Contoh fetch (JavaScript):**

```javascript
fetch("https://your-deploy-url/api/quote?format=json")
  .then((res) => res.json())
  .then((quote) => {
    console.log(quote.text.join("\n"));
    console.log("—", quote.author);
  });
```

---

### 7. Text / TXT

Output polos tanpa markup, cocok untuk bot chat atau CLI.

```
GET /api/quote?format=text
```

```javascript
fetch("https://your-deploy-url/api/quote?format=text")
  .then((res) => res.text())
  .then((txt) => console.log(txt));
```

Output:

```
Senin datang lagi
membawa lembaran baru
jangan takut memulai

- LyonPoy
```

---

### 8. Markdown

Cocok ditempel langsung ke file `.md`, changelog, atau commit message.

```
GET /api/quote?format=markdown
```

Output:

```markdown
> Senin datang lagi
> membawa lembaran baru
> jangan takut memulai

— **LyonPoy**
```

---

### 9. Copy to Clipboard

Hanya tersedia di **browser** (client-side), lihat contoh di bawah.

```html
<button onclick="copyQuote()">📋 Copy Quote</button>

<script src="https://your-deploy-url/script.js"></script>
<script>
  async function copyQuote() {
    const text = await DynamicQuote.browser.copyToClipboard({ format: "text" });
    alert("Quote disalin:\n" + text);
  }
</script>
```

---

## 🌐 Penggunaan di Browser

### Render langsung ke elemen HTML

```html
<div id="quote-box"></div>

<script src="https://your-deploy-url/script.js"></script>
<script>
  DynamicQuote.browser.render("#quote-box", {
    theme: "dracula",
    type: "horizontal",
    format: "html",
  });
</script>
```

### Ambil data quote saja (tanpa render visual)

```javascript
const quote = await DynamicQuote.browser.fetchQuote({ day: "jum'at", period: "sore" });
console.log(quote);
```

### Generate URL embed secara dinamis

```javascript
const url = await DynamicQuote.browser.downloadEmbedURL(
  "https://your-deploy-url",
  { format: "svg", theme: "gruvbox" }
);
document.querySelector("#preview").src = url;
```

---

## 🖥️ Penggunaan di Node.js

### Sebagai serverless function (Vercel/Netlify)

```javascript
// api/quote.js
const DynamicQuote = require("../script.js");
module.exports = DynamicQuote.handler;
```

### Sebagai modul biasa di aplikasi Node lain

```javascript
const DynamicQuote = require("dynamic-quote/script.js");

(async () => {
  const quote = await DynamicQuote.getQuote({ day: "rabu", period: "malam" });
  console.log(quote.text.join("\n"), "-", quote.author);

  // Generate SVG string
  const style = DynamicQuote.resolveStyle({ theme: "ocean" });
  const svg = DynamicQuote.formatSVG(quote, style);
  console.log(svg);
})();
```

### Contoh integrasi bot Telegram

```javascript
const DynamicQuote = require("./script.js");
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command("quote", async (ctx) => {
  const quote = await DynamicQuote.getQuote({});
  ctx.reply(`${quote.text.join("\n")}\n\n— ${quote.author}`);
});

bot.launch();
```

---

## 🧷 Contoh Embed Lengkap

<div align="center">

### Horizontal, tema radical, background bawaan

<p align="center">
  <img src="https://your-deploy-url/api/quote?type=horizontal&theme=radical&format=svg" alt="quote 1">
</p>

### Vertical, tema tokyonight, custom warna teks putih

<p align="center">
  <img src="https://your-deploy-url/api/quote?type=vertical&theme=tokyonight&colorText=ffffff&format=svg" width="350" alt="quote 2">
</p>

### Background transparan (menyatu dengan tema GitHub README)

<p align="center">
  <img src="https://your-deploy-url/api/quote?background=none&theme=transparent&format=svg" alt="quote 3">
</p>

### Background custom image

<p align="center">
  <img src="https://your-deploy-url/api/quote?backgroundImage=https://example.com/bg.jpg&colorText=ffffff&colorAuthor=ffd700&format=svg" alt="quote 4">
</p>

### PNG untuk platform yang tidak render SVG

<p align="center">
  <img src="https://your-deploy-url/api/quote?format=png&theme=monokai" alt="quote png">
</p>

### Force hari & periode tertentu (tidak ikut waktu real-time)

<p align="center">
  <img src="https://your-deploy-url/api/quote?day=minggu&period=malam&theme=forest&format=svg" alt="quote fixed">
</p>

</div>

---

## 🗃️ Struktur `data/quotes.json`

```
{hari}.{periode} = [ { text: string[], author: string }, ... ]
```

Contoh:

```json
{
  "senin": {
    "pagi": [
      { "text": ["baris 1", "baris 2", "baris 3"], "author": "LyonPoy" },
      { "text": ["baris 1", "baris 2"], "author": "LyonPoy" }
    ],
    "siang": [ { "text": ["baris 1", "baris 2"], "author": "LyonPoy" } ],
    "sore":  [ { "text": ["baris 1"], "author": "LyonPoy" } ],
    "malam": [ { "text": ["baris 1"], "author": "LyonPoy" } ]
  }
}
```

**Menambah quote baru:** cukup tambahkan objek baru `{ text: [...], author: "..." }` ke dalam array `hari.periode` yang sesuai — sistem otomatis akan mengikutkannya dalam pemilihan random.

**Hari yang didukung:** `senin`, `selasa`, `rabu`, `kamis`, `jum'at`, `sabtu`, `minggu`
**Periode yang didukung:** `pagi`, `siang`, `sore`, `malam`

---

## 🎨 Kustomisasi Warna & Background

| Kebutuhan | Parameter |
|---|---|
| Warna teks kutipan saja | `colorText=ff6f91` |
| Warna nama author saja | `colorAuthor=38bdf8` |
| Warna background solid | `background=1a1b27` |
| Background transparan | `background=none` |
| Background pakai gambar | `backgroundImage=https://...jpg` |
| Kombinasi lengkap | `background=0d1117&colorText=c9d1d9&colorAuthor=58a6ff` |

> ⚠️ Nilai hex **tidak perlu** tanda `#` di URL, cukup tulis kode warnanya saja (contoh: `ffffff`, bukan `%23ffffff`).

---

## 🔄 Hybrid Screenshot Fallback

Untuk format `png`/`jpeg`, sistem mencoba provider secara berurutan hingga salah satu berhasil:

```
ScreenshotOne → ApiFlash → Cloudinary → Microlink → ScreenshotAPI.net → Local (sharp)
```

Ini memastikan endpoint tetap berjalan meski salah satu provider sedang down, kena limit, atau API key expired. Semua API key dikonfigurasi di bagian `CONFIG` pada `script.js`.

---

## ❓ FAQ

**Q: Kenapa quote tidak berubah walau saya refresh berkali-kali?**
A: Quote hanya berubah otomatis saat masuk periode waktu baru (pagi/siang/sore/malam), bukan setiap refresh. Untuk memaksa random baru di rentang periode yang sama, panggil ulang endpoint — pemilihan quote dari array memang acak setiap request.

**Q: Bisa pakai di luar GitHub README?**
A: Bisa. Semua format bisa dipakai di website biasa, aplikasi Node.js, bot chat, maupun email template (khusus format yang didukung platform tersebut).

**Q: Format PNG saya gagal load di GitHub Pages, kenapa?**
A: GitHub Pages tidak menjalankan server function, jadi endpoint PNG/PDF butuh deploy di Vercel/Netlify. Gunakan format `svg` sebagai alternatif di GitHub Pages.

**Q: Bagaimana menambah tema baru?**
A: Tambahkan entri baru di object `THEMES` pada `script.js` dengan properti `bg`, `text`, `author`, `accent`.

---

## 📄 Lisensi

MIT © [LyonPoy](https://github.com/lyon-28)

<div align="center">
  <sub>Dibuat dengan ❤️ oleh LyonPoy — kutipan baru setiap pergantian waktu.</sub>
</div>

