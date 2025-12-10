import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* -------------------------------------------------------
   1. Serve Partytown Library (/~partytown/*)
---------------------------------------------------------- */
app.use(
  "/~partytown",
  express.static(
    path.join(__dirname, "node_modules/@builder.io/partytown/lib"),
    {
      maxAge: "1y",
      immutable: true,
    }
  )
);

/* -------------------------------------------------------
   2. Shopify OS2 REQUIRED:
      Proxy endpoint for worker script requests
      Example:
      /proxy?url=https://www.googletagmanager.com/gtm.js
---------------------------------------------------------- */
app.get("/proxy", async (req, res) => {
  try {
    const externalUrl = req.query.url;
    if (!externalUrl) {
      return res.status(400).send("Missing ?url= parameter.");
    }

    const upstream = await fetch(externalUrl);

    // Copy important headers
    res.set(
      "Content-Type",
      upstream.headers.get("Content-Type") || "application/javascript"
    );
    res.set("Cache-Control", "public, max-age=3600");

    const text = await upstream.text();
    res.send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy failed.");
  }
});

/* -------------------------------------------------------
   3. Health Check
---------------------------------------------------------- */
app.get("/", (req, res) => {
  res.send("Partytown Shopify Host Running 🚀");
});

/* -------------------------------------------------------
   4. Start Server
---------------------------------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Partytown server running on http://localhost:${PORT}`)
);
