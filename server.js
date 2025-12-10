import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve Partytown library from node_modules/lib
app.use(
  "/~partytown",
  express.static(
    path.join(__dirname, "node_modules/@builder.io/partytown/lib")
  )
);

// Health check
app.get("/", (req, res) => {
  res.send("Partytown Render Host is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
