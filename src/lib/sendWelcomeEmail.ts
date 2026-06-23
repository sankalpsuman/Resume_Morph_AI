import { Resend } from "resend";
import nodemailer from "nodemailer";
import { renderWelcomeEmail } from "./welcomeEmailTemplate.js";
import { welcomeEmailConfig } from "../welcome-email-config.js";

/**
 * Validates whether an email string adheres to basic RFC-compliant formats.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string" || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Dynamic resolution of Resend client to avoid module-load crashes and ensure we always pick up live hot-configured API key changes
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required to dispatch welcome emails via Resend.");
  }
  return new Resend(apiKey);
}

/**
 * Retries an asynchronous function a set number of times with an exponential backoff.
 */
async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) {
      throw error;
    }
    console.warn(`[Welcome Email Retry Engine] Attempt failed. Retrying in ${delay}ms... Remaining attempts: ${retries - 1}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

interface UserSubscriptionDetails {
  planName: string;
  planBenefits: string[];
  remainingCredits?: number;
  upgradeInstructions: string;
}

/**
 * Core server-side function that validates the recipient address, compiles
 * our premium responsive email design, and sends it utilizing either SMTP (Nodemailer) or Resend.
 */
export async function sendWelcomeEmail(
  toEmail: string, 
  userName: string, 
  subscriptionDetails?: UserSubscriptionDetails,
  simulate?: boolean,
  isAdmin?: boolean
): Promise<{ success: boolean; messageId?: string; error?: string; simulated?: boolean; html?: string }> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const cleanName = userName.trim();

  console.log(`[Welcome Email Service] Received email dispatch request:`);
  console.log(`  - Target Recipient: "${cleanEmail}"`);
  console.log(`  - Recipient Name: "${cleanName}"`);
  console.log(`  - Has Custom Plan Customizations: ${subscriptionDetails ? "Yes" : "No"}`);
  console.log(`  - Is Admin Requester: ${isAdmin ? "Yes" : "No"}`);

  // 1. Recipient validity check
  if (!isValidEmail(cleanEmail)) {
    const errorMsg = "Invalid email recipient address format. Send aborted.";
    console.error(`[Welcome Email Service] Check Failed: ${errorMsg} ("${cleanEmail}")`);
    return { success: false, error: errorMsg };
  }

  // Compile email template first so we can always return the gorgeous HTML
  console.log(`[Welcome Email Service] Rendering dynamic template contents...`);
  const compiledHtml = renderWelcomeEmail(cleanName, subscriptionDetails);
  console.log(`[Welcome Email Service] Template compiled successfully (${compiledHtml.length} characters)`);

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const resendKey = process.env.RESEND_API_KEY;

  const hasSmtpConfig = !!(smtpUser && smtpPass);
  const hasResendConfig = !!(resendKey && resendKey !== "your_api_key_here");

  // ==========================================
  // MODE 1: SMTP Direct Delivery (Zero domain setup required)
  // ==========================================
  if (hasSmtpConfig) {
    console.log(`[Welcome Email Service] Active SMTP Configuration detected. Initiating SMTP delivery via Nodemailer...`);
    
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = port === 465; // SSL default for secure Gmail / secure SMTP
    const fromAddress = process.env.SMTP_FROM || smtpUser;
    const fromName = process.env.SMTP_FROM_NAME || `${welcomeEmailConfig.companyName} Team`;

    try {
      const isVercel = !!process.env.VERCEL;
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: isVercel ? 3000 : 5000, // Safe short connection timeout on serverless
        greetingTimeout: isVercel ? 2000 : 5000,   // Save time if port is blocked
        socketTimeout: isVercel ? 4000 : 8000,
      });

      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: cleanEmail,
        subject: "Welcome to ResumeMorph 🚀",
        html: compiledHtml,
      };

      console.log(`[Welcome Email Service] Dispatching email to ${cleanEmail} via SMTP at ${host}:${port}...`);
      const maxRetries = isVercel ? 1 : 2; // Do not retry on Vercel to save execution time
      const info = await retry(() => transporter.sendMail(mailOptions), maxRetries, 1000);
      
      console.log(`[Welcome Email Service] Email successfully delivered via SMTP! Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, html: compiledHtml, simulated: false };
    } catch (smtpErr: any) {
      console.error(`[Welcome Email Service] SMTP Dispatch failed:`, smtpErr);
      const host = process.env.SMTP_HOST || "smtp.gmail.com";
      const port = parseInt(process.env.SMTP_PORT || "465", 10);
      const isVercel = !!process.env.VERCEL;
      
      let enhancedError = smtpErr.message || String(smtpErr);
      if (isVercel && (enhancedError.toLowerCase().includes("timeout") || enhancedError.toLowerCase().includes("conn") || smtpErr.code === "ETIMEDOUT")) {
        enhancedError = `SMTP Connection Timeout (${enhancedError}). NOTE: Since you are running on Vercel Serverless, outbound direct TCP/SMTP traffic on port ${port} is likely blocked by Vercel's platform to prevent spam. Please consider setting RESEND_API_KEY to use the secure Resend HTTP API instead.`;
      }
      
      return {
        success: false,
        error: `SMTP mailing delivery failure: ${enhancedError}`
      };
    }
  }

  // ==========================================
  // MODE 2: Resend API Delivery (Requires custom domain config or authorized recipient)
  // ==========================================
  if (hasResendConfig) {
    let scheduler: Resend;
    try {
      console.log(`[Welcome Email Service] No SMTP config found, using Resend Client...`);
      scheduler = getResendClient();
    } catch (initErr: any) {
      console.error(`[Welcome Email Service] Resend Client failed initialization. Error: ${initErr.message}`);
      return {
        success: false,
        error: `Welcome email delivery failed: Resend Client initialization failed: ${initErr.message}`
      };
    }

    const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const fromName = process.env.SMTP_FROM_NAME || `${welcomeEmailConfig.companyName} Team`;

    try {
      const sendTask = () => scheduler.emails.send({
        from: `"${fromName}" <${fromEmail}>`,
        to: [cleanEmail],
        subject: "Welcome to ResumeMorph 🚀",
        html: compiledHtml,
      });

      console.log(`[Welcome Email Service] Initiating Resend delivery with retry fallback...`);
      const response = await retry(sendTask, 3, 1500);

      if (response.error) {
        const errName = response.error.name || "Unknown";
        const errMsg = response.error.message || "No message";
        console.error(`[Welcome Email Service] Resend API delivery failed. Error: ${errName} - ${errMsg}`);
        
        const isSandboxConstraint = 
          errMsg.toLowerCase().includes("authorized recipient") || 
          errMsg.toLowerCase().includes("single recipient") || 
          errMsg.toLowerCase().includes("verify your domain") ||
          errMsg.toLowerCase().includes("unverified") ||
          errName.toLowerCase().includes("restriction") ||
          errName.toLowerCase().includes("validation");

        if (isSandboxConstraint) {
          console.warn(`[Welcome Email Service] Detected Resend Sandbox/restriction constraint. Bypassing gracefully with simulation fallback.`);
          return {
            success: true,
            simulated: true,
            html: compiledHtml,
            error: `Resend sandbox constraint: Since you are using a Resend account without a verified custom domain, emails can only be sent to the verified Resend account owner. To send to other addresses, add them to Authorized Recipients inside Resend dashboard or verify your domain. (Attempted to send to: ${cleanEmail})`,
            messageId: `sim_${Date.now()}`
          };
        }

        return {
          success: false,
          error: `Resend API delivery failure: ${errMsg} (${errName})`
        };
      }

      console.log(`[Welcome Email Service] Delivery confirmed by Resend API! Message ID: ${response.data?.id || "N/A"}`);
      return { success: true, messageId: response.data?.id, html: compiledHtml, simulated: false };

    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Welcome Email Service] Exception during Resend delivery. Error: ${errorMsg}`);
      return {
        success: false,
        error: `Welcome email delivery exception: ${errorMsg}`
      };
    }
  }

  // ==========================================
  // MODE 3: Fallback Simulation / Informative Guidance Mode
  // ==========================================
  if (isAdmin) {
    console.log(`[Welcome Email Service] Neither SMTP nor Resend config is set. Falling back to Sandbox Simulation for Admin review.`);
    return {
      success: true,
      simulated: true,
      html: compiledHtml,
      error: "No mailing service credentials configured. Please set SMTP credentials (SMTP_USER, SMTP_PASS) for free global delivery without domain limits, or RESEND_API_KEY inside AI Studio Secrets.",
      messageId: `sim_${Date.now()}`
    };
  } else {
    const errorMsg = "Mailing credentials are not configured. To enable real delivery to all users without domain verification, please define SMTP_USER and SMTP_PASS variables inside AI Studio Secrets.";
    console.error(`[Welcome Email Service] Check Failed for standard user: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}
