import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { sendWelcomeEmail, isValidEmail } from "./src/lib/sendWelcomeEmail.js";
import { initializeApp } from "firebase/app";
import { initializeFirestore, collectionGroup, query, where, getDocs, setLogLevel } from "firebase/firestore";

dotenv.config();

// Silence internal SDK warning logs (like stream idle timeouts) while keeping real errors
setLogLevel('error');

// Read Firebase config
let firebaseApp: any = null;
let db: any = null;

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfigRaw = fs.readFileSync(configPath, 'utf-8');
    const firebaseConfig = JSON.parse(firebaseConfigRaw);

    // Initialize Firebase SDK for server
    firebaseApp = initializeApp(firebaseConfig);
    db = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId || '(default)');
  }
} catch (err) {
  console.error("Error reading firebase config or initializing:", err);
}

// Robust __dirname for both ESM and CJS
let __dirnameOverride: string;
try {
  // @ts-ignore - this works in CJS
  __dirnameOverride = __dirname;
} catch (e) {
  // This works in ESM
  const __filename = fileURLToPath(import.meta.url);
  __dirnameOverride = path.dirname(__filename);
}

const getRoot = () => process.cwd();
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Handle invalid/malformed JSON payloads gracefully with JSON responses instead of HTML error pages
app.use((err: any, req: Request, res: Response, next: any) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    console.warn(`[Server Body Parser] Malformed JSON payload received on ${req.method} ${req.url}:`, err.message);
    return res.status(400).json({ 
      error: "Malformed JSON body payload. Please verify syntax structure before submitting.",
      details: err.message
    });
  }
  next(err);
});

// Request logger middleware for detailed API diagnostics
app.use((req: Request, res: Response, next: any) => {
  if (req.originalUrl.startsWith("/api")) {
    console.log(`[API Logger] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  }
  next();
});

// API Status
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    uptime: process.uptime(), 
    env: process.env.NODE_ENV,
    root: getRoot(),
    dir: __dirnameOverride
  });
});

// Simple in-memory rate limiting map for email recipients
const emailLimits = new Map<string, { count: number; resetAt: number }>();

function isEmailRateLimited(email: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  
  // Exempt Owner/Admin from hard rate limiting constraints to facilitate testing & diagnostic dispatches
  const ownerEmail = (process.env.OWNER_EMAIL || "sankalpsmn@gmail.com").trim().toLowerCase();
  if (cleanEmail === ownerEmail || cleanEmail === "sankalpsmn@gmail.com") {
    console.log(`[Welcome Email API] Exempting owner/admin email (${cleanEmail}) from rate limit constraints.`);
    return false;
  }

  const now = Date.now();
  const limitTime = 60 * 60 * 1000; // 1 hour window
  const maxAttempts = 10; // Raised from 3 to 10 for smoother general trial testing

  const record = emailLimits.get(cleanEmail);
  if (!record) {
    emailLimits.set(cleanEmail, { count: 1, resetAt: now + limitTime });
    return false;
  }

  if (now > record.resetAt) {
    // Reset window
    emailLimits.set(cleanEmail, { count: 1, resetAt: now + limitTime });
    return false;
  }

  if (record.count >= maxAttempts) {
    return true;
  }

  record.count += 1;
  return false;
}

// SMTP API Status endpoint for Admin Diagnoser view (non-sensitive check)
app.get("/api/email-status", (req: Request, res: Response) => {
  try {
    const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || "hello@gmail.com";
    const hasPass = !!process.env.SMTP_PASS;
    console.log(`[Email Status API] Diagnosing parameters: configured=${hasPass}, from=${fromEmail}`);
    
    return res.json({
      success: true,
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
      user: process.env.SMTP_USER || "SMTP User",
      hasPass: hasPass,
      fromEmail: fromEmail,
      fromName: process.env.SMTP_FROM_NAME || "ResumeMorph Team",
      configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    });
  } catch (err: any) {
    console.error("[Email Status API] Diagnosis failed:", err);
    return res.status(500).json({ success: false, error: "Failed to check SMTP integration parameters status", details: err.message });
  }
});

// Welcome Email automation API
app.post("/api/send-welcome-email", async (req: Request, res: Response) => {
  try {
    const { email, name, subscriptionDetails } = req.body;

    if (!email || typeof email !== "string") {
      console.warn("[Welcome Email API] Aborted - Recipient email is missing or empty.");
      return res.status(400).json({ success: false, error: "Recipient email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = typeof name === "string" ? name.trim() : "Morph User";

    console.log(`[Welcome Email API] Received welcome email trigger:`);
    console.log(`  - Recipient: "${cleanEmail}"`);
    console.log(`  - Name: "${cleanName}"`);

    // 1. Validate email address structure
    if (!isValidEmail(cleanEmail)) {
      console.warn(`[Welcome Email API] Aborted - Email address format check failed for "${cleanEmail}"`);
      return res.status(400).json({ success: false, error: "Invalid recipient email address format" });
    }

    // 2. Multi-request spam rate limiting
    if (isEmailRateLimited(cleanEmail)) {
      console.warn(`[Welcome Email API] Aborted - Rate limit has been reached for "${cleanEmail}"`);
      return res.status(429).json({ success: false, error: "Too many welcome email requests for this address. Please try again in an hour." });
    }

    // 3. Dispatch welcome email via SMTP API
    const result = await sendWelcomeEmail(cleanEmail, cleanName, subscriptionDetails);

    if (result.success) {
      console.log(`[Welcome Email API] Succeeded - Welcome email successfully processed for "${cleanEmail}"`);
      return res.json({ 
        success: true, 
        message: "Welcome email dispatched successfully",
        messageId: result.messageId,
        html: result.html
      });
    } else {
      console.error(`[Welcome Email API] SMTP Delivery Failed for "${cleanEmail}":`, result.error);
      return res.status(502).json({ success: false, error: result.error || "Email delivery failed" });
    }

  } catch (err: any) {
    console.error("[Welcome Email API] Unexpected Error caught in route handler:", err);
    return res.status(500).json({ success: false, error: "Internal server error during email dispatch", details: err.message });
  }
});

// Resume Text Extraction API
app.post("/api/extract-text", upload.single("resume"), async (req: any, res: any) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    console.log(`Processing extraction: ${file.originalname} (${file.mimetype})`);

    let extractedText = "";
    const fileName = file.originalname.toLowerCase();

    // Case 1: PDF
    if (file.mimetype === "application/pdf" || fileName.endsWith('.pdf')) {
      try {
        // Dynamic import for pdf-parse to avoid ESM/CJS issues at startup
        const pdf = await import("pdf-parse");
        const pdfParser = (pdf as any).default || pdf;
        const data = await pdfParser(file.buffer);
        extractedText = data.text;
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
        const mammoth = await import("mammoth");
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
      return res.json({ success: true, text: "", warning: "Extraction yielded empty result" });
    }

    console.log(`Extraction successful: ${cleanText.length} characters`);
    res.json({ success: true, text: cleanText });

  } catch (error: any) {
    console.error("Server Extraction Error:", error);
    res.status(500).json({ 
      success: false,
      error: "Server failed to process document",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Explicit catch-all handler for any undefined /api routes to guarantee valid JSON responses instead of HTML fallback error pages
app.all("/api/*", (req: Request, res: Response) => {
  console.warn(`[API Catch-all] 404 - Not Found: ${req.method} ${req.originalUrl}`);
  return res.status(404).json({
    success: false,
    error: `API endpoint '${req.method} ${req.originalUrl}' does not exist on this server. Please verify the path.`
  });
});

// Global Error Handler for API routes and rendering to prevent HTML stack traces or non-JSON errors on /api endpoints
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("[Global Server Error Handlers] Catch:", err);
  if (req.originalUrl.startsWith("/api") || req.baseUrl?.startsWith("/api")) {
    return res.status(err.status || err.statusCode || 500).json({
      success: false,
      error: err.message || "An unexpected internal error occurred on our server.",
      status: err.status || err.statusCode || 500,
      details: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
  next(err);
});

// Professional Brand Image
const LOGO_IMAGE = "https://resume-morph.vercel.app/logo.png";

// Metadata logic
const getMetadata = async (req: Request) => {
  let urlPath = req.originalUrl || req.url || '/';
  const matchedPath = (req.headers['x-matched-path'] || req.headers['x-now-route-source']) as string;
  if (matchedPath && !matchedPath.startsWith('/api')) {
    urlPath = matchedPath;
  }
  
  const protocol = (req.headers['x-forwarded-proto'] || 'https') as string;
  const host = (req.headers['host'] || 'resume-morph.vercel.app') as string;
  const baseUrl = `${protocol}://${host.split(',')[0].trim()}`.replace(/\/+$/, "");
  
  const defaultMeta = {
    title: "ResumeMorphAI",
    description: "AI-powered resume transformation tool",
    image: LOGO_IMAGE,
    url: `${baseUrl}${urlPath.split('?')[0]}`.replace(/\/+$/, "") || baseUrl
  };

  if (urlPath.startsWith('/resume/')) {
    const parts = urlPath.split('?')[0].split('/');
    const resumeId = parts[parts.length - 1];
    if (resumeId && db) {
      try {
        const resumesRef = collectionGroup(db, 'resumes');
        const q = query(resumesRef, where('id', '==', resumeId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          const candidateName = data.name || 'Untitled Resume';
          const role = data.role || 'Professional';
          const yoe = data.yoe;
          
          let desc = `View ${candidateName}'s professional resume and experience.`;
          if (yoe && role) {
            desc = `${yoe} of experience as a ${role}. View full resume and skills.`;
          } else if (role) {
            desc = `Experienced ${role}. View full professional resume and skills.`;
          }

          return {
            ...defaultMeta,
            title: `${candidateName} – ${role} Resume`,
            description: desc,
            image: LOGO_IMAGE,
          };
        }
      } catch (error) {
        console.error(`[Metadata] Failed to fetch resume ${resumeId}:`, error);
      }
    }
  }

  if (urlPath.includes('/portfolio')) {
    return {
      ...defaultMeta,
      title: "Portfolio Generator | ResumeMorphAI",
      description: "Convert your resume into a stunning professional portfolio website instantly with AI.",
      image: LOGO_IMAGE
    };
  }

  if (urlPath.includes('/contact')) {
    return {
      ...defaultMeta,
      title: "Contact & Help Desk | ResumeMorphAI",
      description: "Get in touch with our customer success and technical developer architects.",
      image: LOGO_IMAGE
    };
  }

  if (urlPath.includes('/feedback')) {
    return {
      ...defaultMeta,
      title: "Submit Community Feedback | ResumeMorphAI",
      description: "Shape the future of Resume Morph by suggesting features and modules directly to developers.",
      image: LOGO_IMAGE
    };
  }

  return defaultMeta;
};

const injectMetadata = (html: string, metadata: any) => {
  const title = String(metadata.title || 'ResumeMorphAI');
  const description = String(metadata.description || 'AI-powered resume transformation tool');
  const image = String(metadata.image || LOGO_IMAGE);
  const url = String(metadata.url || 'https://resume-morph.vercel.app/');

  return html
    .replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*"/i, `<meta name="description" content="${description}"`)
    .replace(/<meta property="og:title" content="[^"]*"/i, `<meta property="og:title" content="${title}"`)
    .replace(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${description}"`)
    .replace(/<meta property="og:image" content="[^"]*"/i, `<meta property="og:image" content="${image}"`)
    .replace(/<meta property="og:url" content="[^"]*"/i, `<meta property="og:url" content="${url}"`)
    .replace(/<meta name="twitter:title" content="[^"]*"/i, `<meta name="twitter:title" content="${title}"`)
    .replace(/<meta name="twitter:description" content="[^"]*"/i, `<meta name="twitter:description" content="${description}"`)
    .replace(/<meta name="twitter:image" content="[^"]*"/i, `<meta name="twitter:image" content="${image}"`)
    .replace(/<meta name="twitter:url" content="[^"]*"/i, `<meta name="twitter:url" content="${url}"`)
    .replace(/<link rel="canonical" href="[^"]*"/i, `<link rel="canonical" href="${url}"`);
};

let cachedTemplate: string | null = null;
const getTemplate = async (indexPath: string, vite?: any, url?: string) => {
  if (process.env.NODE_ENV !== "production" && !isVercel) {
    let template = fs.readFileSync(indexPath, 'utf-8');
    if (vite && url) {
      return await vite.transformIndexHtml(url, template);
    }
    return template;
  }
  
  if (cachedTemplate) return cachedTemplate;
  if (fs.existsSync(indexPath)) {
    cachedTemplate = fs.readFileSync(indexPath, 'utf-8');
    return cachedTemplate;
  }
  return "";
};

// Start listening and register asset/Vite middlewares
async function startServer() {
  // Vite Integration (Development Only)
  if (process.env.NODE_ENV !== "production" && !isVercel) {
    // Dynamic import to avoid crash in production if vite is missing
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      // Skip API and assets
      if (url.startsWith('/api')) return next();

      try {
        const indexPath = path.resolve(getRoot(), 'index.html');
        const template = await getTemplate(indexPath, vite, url);
        const metadata = await getMetadata(req);
        const html = injectMetadata(template, metadata);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production Assets & Routing
    let distPath = path.resolve(__dirnameOverride);
    if (isVercel && !fs.existsSync(path.join(distPath, 'index.html'))) {
      const vPath = path.join(process.cwd(), 'dist');
      if (fs.existsSync(path.join(vPath, 'index.html'))) {
        distPath = vPath;
      } else {
        const rootPath = path.join(process.cwd());
        if (fs.existsSync(path.join(rootPath, 'index.html'))) {
          distPath = rootPath;
        }
      }
    }

    console.log(`[Morph Engine] Serving production assets from: ${distPath}`);
    app.use(express.static(distPath, { index: false }));

    app.get('*', async (req, res, next) => {
      let url = req.originalUrl || req.url || '/';
      const matchedPath = (req.headers['x-matched-path'] || req.headers['x-now-route-source']) as string;
      if (matchedPath && !matchedPath.startsWith('/api')) {
        url = matchedPath;
      }

      if (url.startsWith('/api')) return next();

      try {
        const searchPaths = [
          path.join(distPath, 'index.html'),
          path.join(process.cwd(), 'dist', 'index.html'),
          path.join(process.cwd(), 'index.html'),
          path.join(__dirnameOverride, 'index.html'),
          path.join(__dirnameOverride, '..', 'dist', 'index.html')
        ];

        let indexPath = "";
        for (const p of searchPaths) {
          if (fs.existsSync(p)) {
            indexPath = p;
            break;
          }
        }

        if (indexPath) {
          const template = await getTemplate(indexPath);
          const metadata = await getMetadata(req);
          const html = injectMetadata(template, metadata);
          res.set('Cache-Control', 'public, max-age=3600').send(html);
        } else {
          console.error("[Morph Engine] Critical Error: index.html build artifact not found.");
          res.status(404).send('Application build not found.');
        }
      } catch (err) {
        console.error("Template read error:", err);
        res.status(500).send("Internal Server Error");
      }
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 Morph Engine Server booting...`);
      console.log(`📌 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  }
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
