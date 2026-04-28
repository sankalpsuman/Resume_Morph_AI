import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Status
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // Resume Text Extraction API
  app.post("/api/extract-text", upload.single("resume"), async (req: any, res: any) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log(`Processing extraction: ${file.originalname} (${file.mimetype})`);

      let extractedText = "";
      const fileName = file.originalname.toLowerCase();

      // Case 1: PDF
      if (file.mimetype === "application/pdf" || fileName.endsWith('.pdf')) {
        try {
          const parser = new PDFParse({ data: file.buffer });
          const result = await parser.getText();
          extractedText = result.text;
          // Ensure we cleanup
          await parser.destroy();
        } catch (pdfError) {
          console.error("PDF Parsing Error:", pdfError);
        }
      } 
      // Case 2: DOCX
      else if (
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
        fileName.endsWith('.docx')
      ) {
        try {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          extractedText = result.value;
        } catch (docxError) {
          console.error("DOCX Parsing Error:", docxError);
        }
      }
      // Case 3: Text-based (txt, html, json, md)
      else if (
        file.mimetype.startsWith("text/") || 
        file.mimetype === "application/json" ||
        /\.(txt|html|htm|json|md)$/i.test(fileName)
      ) {
        extractedText = file.buffer.toString("utf-8");
      }

      // Cleanup text (remove excessive whitespace)
      const cleanText = extractedText.replace(/\s+/g, ' ').trim();

      if (!cleanText) {
        return res.json({ text: "", warning: "Extraction yielded empty result" });
      }

      console.log(`Extraction successful: ${cleanText.length} characters`);
      res.json({ text: cleanText });

    } catch (error: any) {
      console.error("Server Extraction Error:", error);
      res.status(500).json({ 
        error: "Server failed to process document",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Morph Engine Server booting...`);
    console.log(`📌 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
