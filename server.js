import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ------------------------------------------------------------------
   0. Required headers for Shopify App Proxy compatibility
------------------------------------------------------------------- */
app.use((req, res, next) => {
  // Shopify proxies requests → must allow them
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Prevent Shopify from blocking Partytown iframe/worker loading
  res.set("Content-Security-Policy", "frame-ancestors *");

  next();
});

/* ------------------------------------------------------------------
   1. Serve Partytown library through app proxy route:
      Shopify URL → /apps/partytown/~partytown/...
      Proxy URL → https://partytown-1.onrender.com/~partytown
------------------------------------------------------------------- */
app.use(
  "/~partytown",
  express.static(
    path.join(__dirname, "node_modules/@builder.io/partytown/lib"),
    {
      immutable: true,
      maxAge: "1y",
    }
  )
);

/* ------------------------------------------------------------------
   2. App Proxy Script Loader:
      Shopify → /apps/partytown/proxy?url=https://example.com/script.js
      Render → /proxy → fetches remote script and returns JS
------------------------------------------------------------------- */
app.get("/proxy", async (req, res) => {
  try {
    const externalUrl = req.query.url;

    if (!externalUrl) {
      return res.status(400).send("Missing ?url parameter");
    }

    // Fetch original external script
    const upstream = await fetch(externalUrl);

    // Respond with same content type
    res.set(
      "Content-Type",
      upstream.headers.get("Content-Type") || "application/javascript"
    );

    res.set("Cache-Control", "public, max-age=3600");

    const body = await upstream.text();
    res.send(body);
  } catch (err) {
    console.error("Proxy Error:", err);
    res.status(500).send("Proxy fetch failed.");
  }
});

/* ------------------------------------------------------------------
   3. Health check
------------------------------------------------------------------- */
app.get("/", (req, res) => {
  res.send("Shopify Partytown App Proxy Host Running 🚀");
});

/* ------------------------------------------------------------------
   4. Start the server
------------------------------------------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Partytown Proxy Server running on port ${PORT}`);
});
