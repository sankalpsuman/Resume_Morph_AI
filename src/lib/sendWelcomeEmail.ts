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
 * our premium responsive email design, and sends it utilizing direct SMTP.
 * Gracefully falls back to a Sandbox Simulation Mode for invalid credentials.
 */
export async function sendWelcomeEmail(
  toEmail: string, 
  userName: string, 
  subscriptionDetails?: UserSubscriptionDetails
): Promise<{ success: boolean; messageId?: string; error?: string; html?: string; simulated?: boolean }> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const cleanName = userName.trim();

  console.log(`[Welcome Email Service] Received email dispatch request:`);
  console.log(`  - Target Recipient: "${cleanEmail}"`);
  console.log(`  - Recipient Name: "${cleanName}"`);

  // 1. Recipient validity check
  if (!isValidEmail(cleanEmail)) {
    const errorMsg = `Invalid recipient email address format: "${cleanEmail}".`;
    console.error(`[Welcome Email Service] Check Failed: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  // 2. Compile email template contents
  console.log(`[Welcome Email Service] Rendering dynamic template contents...`);
  const compiledHtml = renderWelcomeEmail(cleanName, subscriptionDetails);
  console.log(`[Welcome Email Service] Template compiled successfully (${compiledHtml.length} characters)`);

  const fromName = process.env.SMTP_FROM_NAME || `${welcomeEmailConfig.companyName} Team`;

  // 3. SMTP Tryout (If fully configured)
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpUser || !smtpPass) {
    console.log(`[Welcome Email Service] SMTP configuration missing. Falling back to Sandbox Simulation Mode.`);
    return {
      success: true,
      messageId: `sim_${Date.now()}_no_smtp_credentials`,
      html: compiledHtml,
      simulated: true
    };
  }

  console.log(`[Welcome Email Service] SMTP configuration detected. Attempting direct SMTP delivery...`);
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: Number(process.env.SMTP_PORT) === 465 || !process.env.SMTP_PORT,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const smtpFrom = process.env.SMTP_FROM || smtpUser;
    
    const sendTask = () => transporter.sendMail({
      from: `"${fromName}" <${smtpFrom}>`,
      to: cleanEmail,
      subject: "Welcome to ResumeMorph 🚀",
      html: compiledHtml,
    });
    
    const maxRetries = process.env.VERCEL ? 1 : 2;
    const info = await retry(sendTask, maxRetries, 1000);

    console.log(`[Welcome Email Service] SMTP delivery successful! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId, html: compiledHtml };
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[Welcome Email Service] SMTP delivery failed: ${errorMsg}. Falling back to Sandbox Simulation Mode.`);
    
    return {
      success: true,
      messageId: `sim_${Date.now()}_smtp_error`,
      html: compiledHtml,
      simulated: true
    };
  }
}

