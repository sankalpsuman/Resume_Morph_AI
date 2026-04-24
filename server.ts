import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import mammoth from "mammoth";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Most common way to import pdf-parse in ESM/Node
let pdf: any;
try {
  pdf = require('pdf-parse');
} catch (e) {
  console.warn("Failed to require pdf-parse, PDF extraction might fail.");
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  app.post("/api/extract-text", upload.single("resume"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No resume file uploaded" });
      }

      console.log(`Extracting file: ${file.originalname} (${file.mimetype})`);

      let resumeText = "";
      
      // 1. PDF Handling
      if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith('.pdf')) {
        try {
          if (pdf) {
            const pdfParser = typeof pdf === 'function' ? pdf : pdf.default;
            if (typeof pdfParser === 'function') {
              const data = await pdfParser(file.buffer);
              resumeText = data.text;
              console.log("Local PDF extraction success");
            }
          }
        } catch (pdfError) {
          console.error("Local PDF Parsing Error:", pdfError);
        }
      } 
      // 2. DOCX Handling
      else if (
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
        file.originalname.toLowerCase().endsWith('.docx')
      ) {
        try {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          resumeText = result.value;
          console.log("Local DOCX extraction success");
        } catch (docxError) {
          console.error("DOCX Parsing Error:", docxError);
        }
      }
      // 3. Simple text-based formats (txt, html, json)
      else if (
        file.mimetype === "text/plain" || 
        file.mimetype === "text/html" || 
        file.mimetype === "application/json" ||
        file.originalname.toLowerCase().endsWith('.txt') ||
        file.originalname.toLowerCase().endsWith('.html') ||
        file.originalname.toLowerCase().endsWith('.json')
      ) {
        resumeText = file.buffer.toString("utf-8");
      }

      if (!resumeText || resumeText.trim().length === 0) {
        // Return empty text so frontend can handle fallback to AI
        return res.json({ text: "" });
      }

      res.json({ text: resumeText });
    } catch (error: any) {
      console.error("Global Extraction Error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to process resume file"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
