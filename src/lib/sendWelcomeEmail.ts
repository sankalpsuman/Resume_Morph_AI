import nodemailer from "nodemailer";
import { renderWelcomeEmail } from "./welcomeEmailTemplate.js";
import { welcomeEmailConfig } from "../welcome-email-config.js";

/**
 * Validates whether an email string adheres to basic RFC-compliant formats.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string" || email.length > 254) return false;
  // Standard robust RFC email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Core backend service function that creates an SMTP transporter,
 * validates recipient email addresses, compiles HTML designs, and dispatches them safely.
 */
export async function sendWelcomeEmail(toEmail: string, userName: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log(`[Welcome Email Service] Initiated for: ${toEmail} (${userName})`);

  // 1. Validation
  if (!isValidEmail(toEmail)) {
    const errorMsg = "Invalid email recipient address pattern provided. Sending aborted.";
    console.error(`[Welcome Email Service] ${errorMsg}: "${toEmail}"`);
    return { success: false, error: errorMsg };
  }

  // 2. SMTP Environment Variables Check
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL || welcomeEmailConfig.supportEmail;
  const fromName = process.env.SMTP_FROM_NAME || "ResumeMorph Team";

  if (!host || !user || !pass) {
    const errorMsg = "SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not fully configured in environment variables. Aborting delivery.";
    console.warn(`[Welcome Email Service] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    // 3. Initialize dynamic transporter (on-demand lazy load to prevent crashes if SMTP is disabled/failing)
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // True for 465, false for 587/other ports
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed certificate blocks
      },
    });

    // 4. Compile high-quality rendering
    const emailHtml = renderWelcomeEmail(userName);
    const subject = `🎉 Welcome to ResumeMorph – Build ATS-Friendly Resumes in Minutes`;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject,
      html: emailHtml,
    };

    // 5. Dispatch email
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Welcome Email Service] Email successfully sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Welcome Email Service] Sending failed for ${toEmail}. Reason:`, errorMsg, err);
    return { success: false, error: errorMsg };
  }
}
