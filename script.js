/**
 *  lyon-28/dynamic-quote — script.js
 *  Universal module: Node (Vercel/Netlify Function) + Browser
 *
 *  Fitur:
 *  - Auto detect hari & periode (WIB) atau override via query
 *  - Random quote per hari/periode
 *  - Format: json, text, txt, html, svg, markdown, png, jpeg, pdf, copyToClipboard
 *  - Custom warna: colorText, colorAuthor, backgroundColor, backgroundImage
 *  - Theme preset (radical, dark, light, dracula, monokai, gruvbox, tokyonight, sunset, ocean, forest, transparent)
 *  - PNG/JPEG hybrid fallback: screenshotone -> apiflash -> cloudinary -> microlink -> screenshotapi -> local
 */

(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(); // Node / CommonJS (Vercel & Netlify Functions)
  } else {
    root.DynamicQuote = factory(); // Browser
  }
})(typeof self !== "undefined" ? self : this, function() {
  "use strict";
  
  /* --- CONFIG --- */
  
  const CONFIG = {
    SCREENSHOTONE_KEY: "SCREENSHOTONE_API_KEY_HERE",
    APIFLASH_KEY: "APIFLASH_API_KEY_HERE",
    CLOUDINARY_CLOUD_NAME: "CLOUDINARY_CLOUD_NAME_HERE",
    CLOUDINARY_API_KEY: "CLOUDINARY_API_KEY_HERE",
    CLOUDINARY_API_SECRET: "CLOUDINARY_API_SECRET_HERE",
    MICROLINK_KEY: "MICROLINK_API_KEY_HERE",
    SCREENSHOTAPI_KEY: "SCREENSHOTAPI_NET_KEY_HERE",
    
    BASE_URL: process_env_base_url(),
    
    TIMEZONE: "Asia/Jakarta",
    QUOTES_PATH_NODE: "./data/quotes.json",
    QUOTES_PATH_BROWSER: "/data/quotes.json",
  };
  
  function process_env_base_url() {
    try {
      return (typeof process !== "undefined" && process.env && process.env.BASE_URL) || "";
    } catch (e) {
      return "";
    }
  }
  
  /* --- THEMES --- */
  
  const THEMES = {
    radical: { bg: "#141321", text: "#fe428e", author: "#a9fef7", accent: "#f8d847" },
    dark: { bg: "#0d1117", text: "#c9d1d9", author: "#58a6ff", accent: "#f778ba" },
    light: { bg: "#ffffff", text: "#24292e", author: "#0366d6", accent: "#d73a49" },
    dracula: { bg: "#282a36", text: "#f8f8f2", author: "#bd93f9", accent: "#ff79c6" },
    monokai: { bg: "#272822", text: "#f8f8f2", author: "#a6e22e", accent: "#fd971f" },
    gruvbox: { bg: "#282828", text: "#ebdbb2", author: "#fabd2f", accent: "#fb4934" },
    tokyonight: { bg: "#1a1b27", text: "#a9b1d6", author: "#7aa2f7", accent: "#bb9af7" },
    sunset: { bg: "#2d1b2e", text: "#ffb677", author: "#ff6f91", accent: "#ffd23f" },
    ocean: { bg: "#0f2027", text: "#c9f2ff", author: "#38bdf8", accent: "#22d3ee" },
    forest: { bg: "#1b2e1f", text: "#c8e6c9", author: "#81c784", accent: "#aed581" },
    transparent: { bg: "none", text: "#333333", author: "#666666", accent: "#999999" },
  };
  
  /* --- DAY / PERIOD LOGIC --- */
  
  const DAY_MAP = ["minggu", "senin", "selasa", "rabu", "kamis", "jum'at", "sabtu"];
  // JS getDay(): 0=Sunday...6=Saturday -> cocok langsung dgn DAY_MAP index
  
  function getWIBDate() {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: CONFIG.TIMEZONE,
        hour12: false,
        weekday: "short",
        hour: "numeric",
      });
      const parts = formatter.formatToParts(now);
      const hourPart = parts.find((p) => p.type === "hour");
      const weekdayPart = parts.find((p) => p.type === "weekday");
      const hour = parseInt(hourPart.value, 10) % 24;
      
      const weekdayIndexMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const dayIndex = weekdayIndexMap[weekdayPart.value];
      
      return { dayIndex, hour };
    } catch (e) {
      const now = new Date();
      return { dayIndex: now.getDay(), hour: now.getHours() };
    }
  }
  
  function getPeriodFromHour(hour) {
    if (hour >= 5 && hour <= 10) return "pagi";
    if (hour >= 11 && hour <= 14) return "siang";
    if (hour >= 15 && hour <= 17) return "sore";
    return "malam"; // 18:00 - 04:59
  }
  
  function resolveDayPeriod(query) {
    const { dayIndex, hour } = getWIBDate();
    let day = (query.day || DAY_MAP[dayIndex]).toLowerCase();
    let period = (query.period || getPeriodFromHour(hour)).toLowerCase();
    
    if (!DAY_MAP.includes(day)) day = DAY_MAP[dayIndex];
    if (!["pagi", "siang", "sore", "malam"].includes(period)) period = getPeriodFromHour(hour);
    
    return { day, period };
  }
  
  /* --- QUOTES LOADER --- */
  
  let _cache = null;
  
  async function loadQuotes() {
    if (_cache) return _cache;
    
    if (typeof window !== "undefined") {
      const res = await fetch(CONFIG.QUOTES_PATH_BROWSER);
      _cache = await res.json();
      return _cache;
    } else {
      // require statis relatif — aman untuk bundler/nft trace
      _cache = require("./data/quotes.json");
      return _cache;
    }
  }
  
  function pickRandomQuote(list) {
    if (!list || list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  }
  
  async function getQuote(query = {}) {
    const quotes = await loadQuotes();
    const { day, period } = resolveDayPeriod(query);
    
    const dayData = quotes[day];
    if (!dayData) throw new Error(`Hari tidak ditemukan: ${day}`);
    
    const periodList = dayData[period];
    if (!periodList) throw new Error(`Periode tidak ditemukan: ${period}`);
    
    const picked = pickRandomQuote(periodList);
    if (!picked) throw new Error(`Tidak ada quote untuk ${day}/${period}`);
    
    return {
      day,
      period,
      text: picked.text,
      author: picked.author,
      generatedAt: new Date().toISOString(),
    };
  }
  
  /* --- STYLE RESOLVER --- */
  
  function resolveStyle(query) {
    const theme = THEMES[query.theme] || THEMES.radical;
    
    const colorText = query.colorText && query.colorText !== "none" ? `#${query.colorText.replace("#", "")}` : theme.text;
    const colorAuthor = query.colorAuthor && query.colorAuthor !== "none" ? `#${query.colorAuthor.replace("#", "")}` : theme.author;
    
    let background = theme.bg;
    if (query.background === "none") background = "none";
    else if (query.background) background = `#${query.background.replace("#", "")}`;
    
    const backgroundImage =
      query.backgroundImage && /^https?:\/\//i.test(query.backgroundImage) ?
      query.backgroundImage :
      null;
    const layout = query.type === "horizontal" ? "horizontal" : query.type === "vertical" ? "vertical" : "horizontal";
    const width = parseInt(query.width) || (layout === "horizontal" ? 600 : 400);
    const height = parseInt(query.height) || (layout === "horizontal" ? 300 : 500);
    
    return { colorText, colorAuthor, background, backgroundImage, layout, width, height, accent: theme.accent };
  }
  
  /* --- FORMATTERS --- */
  
  function formatText(quote) {
    return `${quote.text.join("\n")}\n\n- ${quote.author}`;
  }
  
  function formatMarkdown(quote) {
    const lines = quote.text.map((l) => `> ${l}`).join("\n");
    return `${lines}\n\n— **${quote.author}**`;
  }
  
  function formatJSON(quote) {
    return JSON.stringify(quote, null, 2);
  }
  
  function wrapSVGText(lines, maxCharsPerLine = 50) {
    // Text sudah per baris dari data, tapi tetap wrap jika kepanjangan
    const wrapped = [];
    lines.forEach((line) => {
      if (line.length <= maxCharsPerLine) {
        wrapped.push(line);
      } else {
        const words = line.split(" ");
        let current = "";
        words.forEach((w) => {
          if ((current + " " + w).trim().length > maxCharsPerLine) {
            wrapped.push(current.trim());
            current = w;
          } else {
            current += " " + w;
          }
        });
        if (current.trim()) wrapped.push(current.trim());
      }
    });
    return wrapped;
  }
  
  function formatSVG(quote, style) {
    const { colorText, colorAuthor, background, backgroundImage, width, height, accent } = style;
    const lines = wrapSVGText(quote.text, style.layout === "horizontal" ? 55 : 40);
    const lineHeight = 28;
    const startY = height / 2 - (lines.length * lineHeight) / 2;
    
    const bgRect =
      background === "none" ?
      "" :
      `<rect width="100%" height="100%" rx="12" fill="${background}"/>`;
    
    const bgImage = backgroundImage ?
      `<image href="${backgroundImage}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" opacity="0.35"/>` :
      "";
    
    const textLines = lines
      .map(
        (line, i) =>
        `<text x="50%" y="${startY + i * lineHeight}" text-anchor="middle" font-size="20" font-family="Verdana, sans-serif" fill="${colorText}">${escapeXML(line)}</text>`
      )
      .join("\n    ");
    
    const quoteMark = `<text x="30" y="50" font-size="60" font-family="Georgia, serif" fill="${accent}" opacity="0.5">"</text>`;
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      text { font-family: 'Verdana', sans-serif; }
    </style>
  </defs>
  <g>
    ${bgRect}
    ${bgImage}
    ${quoteMark}
    ${textLines}
    <text x="50%" y="${startY + lines.length * lineHeight + 40}" text-anchor="middle" font-size="16" font-style="italic" fill="${colorAuthor}">— ${escapeXML(quote.author)}</text>
  </g>
</svg>`;
  }
  
  function formatHTML(quote, style) {
    const { colorText, colorAuthor, background, backgroundImage, width, height } = style;
    const bgStyle =
      background === "none" ?
      "background: transparent;" :
      `background-color: ${background};`;
    const bgImageStyle = backgroundImage ?
      `background-image: url('${backgroundImage}'); background-size: cover; background-position: center;` :
      "";
    
    const textHTML = quote.text
      .map((l) => `<p style="margin:4px 0; color:${colorText}; font-size:18px; font-family:Verdana, sans-serif;">${escapeXML(l)}</p>`)
      .join("\n      ");
    
    return `<div style="width:${width}px; height:${height}px; ${bgStyle} ${bgImageStyle} border-radius:12px; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:24px; box-sizing:border-box; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
      ${textHTML}
      <p style="margin-top:16px; font-style:italic; color:${colorAuthor}; font-size:14px;">— ${escapeXML(quote.author)}</p>
    </div>`;
  }
  
  function escapeXML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
  
  /* --- PNG / JPEG HYBRID GENERATOR --- */
  
  async function svgToImageBufferLocal(svgString, width, height, format = "png") {
    const sharp = require("sharp");
    const img = sharp(Buffer.from(svgString)).resize(width, height);
    if (format === "jpeg" || format === "jpg") {
      return await img.jpeg({ quality: 90 }).toBuffer();
    }
    return await img.png().toBuffer();
  }
  
  async function fetchBuffer(url) {
    const fetchFn = typeof fetch !== "undefined" ? fetch : require("node-fetch");
    const res = await fetchFn(url);
    if (!res.ok) throw new Error(`Request gagal: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  
  function buildTargetHTMLUrl(query) {
    // URL ke endpoint HTML sendiri, dipakai target screenshot API
    const qs = new URLSearchParams({ ...query, format: "html" }).toString();
    return `${CONFIG.BASE_URL}/api/quote?${qs}`;
  }
  
  async function generateImage(query, style, format = "png") {
    const targetUrl = buildTargetHTMLUrl(query);
    const providers = [
      // 1. ScreenshotOne
      async () => {
          const url = `https://api.screenshotone.com/take?access_key=${CONFIG.SCREENSHOTONE_KEY}&url=${encodeURIComponent(
          targetUrl
        )}&viewport_width=${style.width}&viewport_height=${style.height}&format=${format}&image_quality=90`;
          return await fetchBuffer(url);
        },
        // 2. ApiFlash
        async () => {
            const url = `https://api.apiflash.com/v1/urltoimage?access_key=${CONFIG.APIFLASH_KEY}&url=${encodeURIComponent(
          targetUrl
        )}&width=${style.width}&height=${style.height}&format=${format}`;
            return await fetchBuffer(url);
          },
          // 3. Cloudinary (via fetch remote url as transformation source)
          async () => {
              const url = `https://res.cloudinary.com/${CONFIG.CLOUDINARY_CLOUD_NAME}/image/fetch/w_${style.width},h_${style.height},f_${format}/${encodeURIComponent(
          targetUrl
        )}`;
              return await fetchBuffer(url);
            },
            // 4. Microlink
            async () => {
                const url = `https://api.microlink.io/?url=${encodeURIComponent(
          targetUrl
        )}&screenshot=true&meta=false&embed=screenshot.url${CONFIG.MICROLINK_KEY ? `&x-api-key=${CONFIG.MICROLINK_KEY}` : ""}`;
                return await fetchBuffer(url);
              },
              // 5. ScreenshotAPI.net
              async () => {
                  const url = `https://shot.screenshotapi.net/screenshot?token=${CONFIG.SCREENSHOTAPI_KEY}&url=${encodeURIComponent(
          targetUrl
        )}&width=${style.width}&height=${style.height}&output=image&file_type=${format}`;
                  return await fetchBuffer(url);
                },
                // 6. Local fallback (svg -> png via sharp, hanya support png)
                async () => {
                  const quote = await getQuote(query);
                  const svg = formatSVG(quote, style);
                  return await svgToImageBufferLocal(svg, style.width, style.height, format);
                },
    ];
    
    let lastError = null;
    for (const provider of providers) {
      try {
        const buffer = await provider();
        if (buffer && buffer.length > 0) return buffer;
      } catch (err) {
        lastError = err;
        continue; // coba provider berikutnya
      }
    }
    throw new Error(`Semua provider screenshot gagal: ${lastError && lastError.message}`);
  }
  
  /* --- PDF GENERATOR --- */
  
  async function generatePDF(quote, style) {
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ size: [style.width, style.height], margin: 30 });
    const chunks = [];
    
    return new Promise((resolve, reject) => {
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      
      if (style.background !== "none") {
        doc.rect(0, 0, style.width, style.height).fill(style.background);
      }
      
      doc.fillColor(style.colorText).fontSize(18).font("Helvetica-Oblique");
      let y = style.height / 2 - (quote.text.length * 24) / 2;
      quote.text.forEach((line) => {
        doc.text(line, 30, y, { width: style.width - 60, align: "center" });
        y += 26;
      });
      
      doc.moveDown(1);
      doc.fillColor(style.colorAuthor).fontSize(13).font("Helvetica-BoldOblique");
      doc.text(`— ${quote.author}`, 30, y + 10, { width: style.width - 60, align: "center" });
      
      doc.end();
    });
  }
  
  /* --- MAIN RENDER DISPATCHER --- */
  
  async function renderQuote(query = {}) {
    const quote = await getQuote(query);
    const style = resolveStyle(query);
    const format = (query.format || "json").toLowerCase();
    
    switch (format) {
      case "text":
      case "txt":
        return { contentType: "text/plain; charset=utf-8", body: formatText(quote) };
        
      case "markdown":
      case "md":
        return { contentType: "text/markdown; charset=utf-8", body: formatMarkdown(quote) };
        
      case "json":
        return { contentType: "application/json; charset=utf-8", body: formatJSON(quote) };
        
      case "html":
        return { contentType: "text/html; charset=utf-8", body: formatHTML(quote, style) };
        
      case "svg":
        return { contentType: "image/svg+xml", body: formatSVG(quote, style) };
        
      case "png": {
        const buffer = await generateImage(query, style, "png");
        return { contentType: "image/png", body: buffer, isBinary: true };
      }
      
      case "jpeg":
      case "jpg": {
        const buffer = await generateImage(query, style, "jpeg");
        return { contentType: "image/jpeg", body: buffer, isBinary: true };
      }
      
      case "pdf": {
        const buffer = await generatePDF(quote, style);
        return { contentType: "application/pdf", body: buffer, isBinary: true };
      }
      
      default:
        return { contentType: "application/json; charset=utf-8", body: formatJSON(quote) };
    }
  }
  
  /* --- NODE HANDLER (Vercel / Netlify) --- */
  
  async function nodeHandler(req, res) {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const query = Object.fromEntries(url.searchParams.entries());
      
      const result = await renderQuote(query);
      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Cache-Control", "no-store, max-age=0");
      
      if (result.isBinary) {
        res.status(200).end(result.body);
      } else {
        res.status(200).send(result.body);
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
  
  /* --- BROWSER API --- */
  
  const BrowserAPI = {
    async fetchQuote(query = {}) {
      return await getQuote(query);
    },
    
    async render(selector, query = {}) {
      const quote = await getQuote(query);
      const style = resolveStyle(query);
      const format = (query.format || "html").toLowerCase();
      const el = document.querySelector(selector);
      if (!el) throw new Error(`Element tidak ditemukan: ${selector}`);
      
      if (format === "svg") {
        el.innerHTML = formatSVG(quote, style);
      } else if (format === "text" || format === "txt") {
        el.textContent = formatText(quote);
      } else if (format === "markdown" || format === "md") {
        el.textContent = formatMarkdown(quote);
      } else {
        el.innerHTML = formatHTML(quote, style);
      }
      return quote;
    },
    
    async copyToClipboard(query = {}) {
      const quote = await getQuote(query);
      const format = (query.format || "text").toLowerCase();
      let text;
      if (format === "markdown" || format === "md") text = formatMarkdown(quote);
      else if (format === "json") text = formatJSON(quote);
      else text = formatText(quote);
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      return text;
    },
    
    async downloadEmbedURL(baseUrl, query = {}) {
      const qs = new URLSearchParams(query).toString();
      return `${baseUrl}/api/quote?${qs}`;
    },
  };
  
  /* --- EXPORTS --- */
  
  return {
    // core
    getQuote,
    renderQuote,
    resolveDayPeriod,
    resolveStyle,
    THEMES,
    // formatters
    formatText,
    formatMarkdown,
    formatJSON,
    formatSVG,
    formatHTML,
    generateImage,
    generatePDF,
    // node
    handler: nodeHandler,
    // browser
    browser: BrowserAPI,
  };
});
