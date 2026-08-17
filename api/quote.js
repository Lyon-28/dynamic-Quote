/**
 *  lyon-28/dynamic-quote — api/quote.js
 *  Serverless entry point (Vercel Functions & Netlify Functions)
 *
 *  Endpoint:
 *    GET /api/quote?day=&period=&format=&theme=&colorText=&colorAuthor=
 *                    &background=&backgroundImage=&type=&width=&height=
 *
 *  Format didukung: json, text, txt, markdown, html, svg, png, jpeg, jpg, pdf
 */

"use strict";

const path = require("path");
const DynamicQuote = require("../script.js");

/* --- HELPERS --- */

function parseQuery(req) {
  try {
    const host = (req.headers && req.headers.host) || "localhost";
    const url = new URL(req.url, `http://${host}`);
    return Object.fromEntries(url.searchParams.entries());
  } catch (e) {
    return req.query || {};
  }
}

function setCommonHeaders(res, contentType) {
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function validateQuery(query) {
  const errors = [];

  const validDays = ["senin", "selasa", "rabu", "kamis", "jum'at", "sabtu", "minggu"];
  const validPeriods = ["pagi", "siang", "sore", "malam"];
  const validFormats = ["json", "text", "txt", "markdown", "md", "html", "svg", "png", "jpeg", "jpg", "pdf"];
  const validThemes = Object.keys(DynamicQuote.THEMES);

  if (query.day && !validDays.includes(query.day.toLowerCase())) {
    errors.push(`Parameter 'day' tidak valid. Gunakan salah satu: ${validDays.join(", ")}`);
  }
  if (query.period && !validPeriods.includes(query.period.toLowerCase())) {
    errors.push(`Parameter 'period' tidak valid. Gunakan salah satu: ${validPeriods.join(", ")}`);
  }
  if (query.format && !validFormats.includes(query.format.toLowerCase())) {
    errors.push(`Parameter 'format' tidak valid. Gunakan salah satu: ${validFormats.join(", ")}`);
  }
  if (query.theme && !validThemes.includes(query.theme.toLowerCase())) {
    errors.push(`Parameter 'theme' tidak valid. Gunakan salah satu: ${validThemes.join(", ")}`);
  }
  if (query.width && (isNaN(parseInt(query.width)) || parseInt(query.width) <= 0)) {
    errors.push(`Parameter 'width' harus berupa angka positif.`);
  }
  if (query.height && (isNaN(parseInt(query.height)) || parseInt(query.height) <= 0)) {
    errors.push(`Parameter 'height' harus berupa angka positif.`);
  }

  return errors;
}

/* --- MAIN VERCEL HANDLER --- */

module.exports = async function handler(req, res) {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    setCommonHeaders(res, "text/plain");
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    setCommonHeaders(res, "application/json");
    res.status(405).json({ error: "Method not allowed. Gunakan GET." });
    return;
  }

  const query = parseQuery(req);

  // Validasi parameter
  const errors = validateQuery(query);
  if (errors.length > 0) {
    setCommonHeaders(res, "application/json");
    res.status(400).json({ error: "Parameter tidak valid", details: errors });
    return;
  }

  try {
    const result = await DynamicQuote.renderQuote(query);
    setCommonHeaders(res, result.contentType);

    if (result.isBinary) {
      res.status(200).end(result.body);
    } else if (typeof res.send === "function") {
      res.status(200).send(result.body);
    } else {
      // fallback jika res tidak punya .send (raw Node http)
      res.statusCode = 200;
      res.end(result.body);
    }
  } catch (err) {
    console.error("[api/quote] Error:", err);
    setCommonHeaders(res, "application/json");
    res.status(500).json({
      error: "Gagal generate quote",
      message: err.message,
    });
  }
};

/* --- NETLIFY FUNCTIONS ADAPTER --- */
/**
 * Netlify Functions punya signature berbeda: (event, context) => response object.
 * Export tambahan ini dipakai jika file di-deploy sebagai Netlify Function
 * (misalnya di-mirror ke /netlify/functions/quote.js yang me-require file ini).
 */

module.exports.netlifyHandler = async function (event, context) {
  const query = event.queryStringParameters || {};

  const errors = validateQuery(query);
  if (errors.length > 0) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Parameter tidak valid", details: errors }),
    };
  }

  try {
    const result = await DynamicQuote.renderQuote(query);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
      body: result.isBinary ? result.body.toString("base64") : result.body,
      isBase64Encoded: !!result.isBinary,
    };
  } catch (err) {
    console.error("[netlify/quote] Error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Gagal generate quote", message: err.message }),
    };
  }
};
