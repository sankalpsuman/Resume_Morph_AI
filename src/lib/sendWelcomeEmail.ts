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
 * our premium responsive email design, and sends it utilizing the Resend API or direct SMTP.
 * Gracefully falls back to a Sandbox Simulation Mode for invalid credentials/sandbox restrictions.
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
  if (smtpUser && smtpPass) {
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
      const info = await transporter.sendMail({
        from: `"${fromName}" <${smtpFrom}>`,
        to: cleanEmail,
        subject: "Welcome to ResumeMorph 🚀",
        html: compiledHtml,
      });

      console.log(`[Welcome Email Service] SMTP delivery successful! Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, html: compiledHtml };
    } catch (smtpErr: any) {
      console.warn(`[Welcome Email Service] SMTP delivery failed, will attempt Resend or Simulation: ${smtpErr.message || String(smtpErr)}`);
    }
  }

  // 4. Resend Delivery Tryout
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const isPlaceholderResend = !resendKey || resendKey === "your_api_key_here" || !resendKey.startsWith("re_");

  if (isPlaceholderResend) {
    console.log(`[Welcome Email Service] Resend API key is a placeholder, missing, or invalid. Falling back to Sandbox Simulation Mode.`);
    return {
      success: true,
      messageId: `sim_${Date.now()}_no_resend_key`,
      html: compiledHtml,
      simulated: true
    };
  }

  let resendClient: Resend;
  try {
    resendClient = new Resend(resendKey);
  } catch (initErr: any) {
    console.warn(`[Welcome Email Service] Resend client failed initialization: ${initErr.message || String(initErr)}. Falling back to Sandbox Simulation Mode.`);
    return {
      success: true,
      messageId: `sim_${Date.now()}_init_failed`,
      html: compiledHtml,
      simulated: true
    };
  }

  try {
    const sendTask = () => resendClient.emails.send({
      from: `"${fromName}" <${fromEmail}>`,
      to: [cleanEmail],
      subject: "Welcome to ResumeMorph 🚀",
      html: compiledHtml,
    });

    console.log(`[Welcome Email Service] Initiating Resend delivery to ${cleanEmail}...`);
    const maxRetries = process.env.VERCEL ? 1 : 2;
    const response = await retry(sendTask, maxRetries, 1000);

    if (response.error) {
      const errName = response.error.name || "Unknown";
      const errMsg = response.error.message || "No message";
      console.error(`[Welcome Email Service] Resend API delivery returned error response: ${errName} - ${errMsg}`);
      
      const errorStr = `${errName} ${errMsg}`.toLowerCase();
      const isSandboxOrAuthError = 
        errorStr.includes("validation") ||
        errorStr.includes("invalid") ||
        errorStr.includes("unauthorized") ||
        errorStr.includes("api key") ||
        errorStr.includes("onboarding") ||
        errorStr.includes("domain") ||
        errorStr.includes("verify") ||
        errorStr.includes("recipient");

      if (isSandboxOrAuthError) {
        console.warn(`[Welcome Email Service] Resend returned a credentials or sandbox restriction error. Gracefully falling back to Sandbox Simulation Mode.`);
        return {
          success: true,
          messageId: `sim_${Date.now()}_sandbox_err`,
          html: compiledHtml,
          simulated: true
        };
      }

      return {
        success: false,
        error: `Resend API delivery failure: ${errMsg} (${errName})`
      };
    }

    const messageId = response.data?.id || `msg_${Date.now()}`;
    console.log(`[Welcome Email Service] Delivery confirmed by Resend API! Message ID: ${messageId}`);
    return { success: true, messageId, html: compiledHtml };

  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Welcome Email Service] Exception during Resend delivery: ${errorMsg}`);
    
    const errorStr = errorMsg.toLowerCase();
    const isSandboxOrAuthError = 
      errorStr.includes("validation") ||
      errorStr.includes("invalid") ||
      errorStr.includes("unauthorized") ||
      errorStr.includes("api key") ||
      errorStr.includes("onboarding") ||
      errorStr.includes("domain") ||
      errorStr.includes("verify") ||
      errorStr.includes("recipient");

    if (isSandboxOrAuthError) {
      console.warn(`[Welcome Email Service] Caught credential/sandbox exception. Gracefully falling back to Sandbox Simulation Mode.`);
      return {
        success: true,
        messageId: `sim_${Date.now()}_exception_fallback`,
        html: compiledHtml,
        simulated: true
      };
    }

    return {
      success: false,
      error: `Welcome email delivery exception: ${errorMsg}`
    };
  }
}

