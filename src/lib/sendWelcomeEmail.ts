import { Resend } from "resend";
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

// Lazy initialization of Resend client to avoid module-load crashes if API key is not yet set
let resendClient: Resend | null = null;
function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is required to dispatch welcome emails via Resend.");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
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
 * our premium responsive email design, and sends it utilizing Resend with built-in retries.
 */
export async function sendWelcomeEmail(
  toEmail: string, 
  userName: string, 
  subscriptionDetails?: UserSubscriptionDetails
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log(`[Welcome Email Service] Dispatch requested for: ${toEmail} (${userName})`);

  // 1. Recipient validity check
  if (!isValidEmail(toEmail)) {
    const errorMsg = "Invalid email recipient address format. Send aborted.";
    console.error(`[Welcome Email Service] ${errorMsg}: "${toEmail}"`);
    return { success: false, error: errorMsg };
  }

  // 2. Load API credentials (with a clean fallback alert)
  let scheduler: Resend;
  try {
    scheduler = getResendClient();
  } catch (initErr: any) {
    console.warn(`[Welcome Email Service] Initialization skipped: ${initErr.message}`);
    return { success: false, error: initErr.message };
  }

  // 3. Resolve From email config
  // Note: Resend Free plan requires using "onboarding@resend.dev" as Sender if no custom domain is verified
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const fromName = `${welcomeEmailConfig.companyName} Team`;

  try {
    // Compile email template with dynamic subscription context
    const compiledHtml = renderWelcomeEmail(userName, subscriptionDetails);
    
    // Execute sending with built-in retry mechanism to defend against socket bottlenecks or temporary Resend rate limits
    const sendTask = () => scheduler.emails.send({
      from: `"${fromName}" <${fromEmail}>`,
      to: [toEmail],
      subject: "Welcome to ResumeMorph 🚀",
      html: compiledHtml,
    });

    const response = await retry(sendTask, 3, 1500);

    if (response.error) {
      console.error("[Welcome Email Service] Resend API returned delivery error:", response.error);
      return { success: false, error: response.error.message || "Failed dispatching via Resend" };
    }

    console.log(`[Welcome Email Service] Message dispatched successfully to ${toEmail}. Message ID: ${response.data?.id}`);
    return { success: true, messageId: response.data?.id };

  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Welcome Email Service] Sending failed for ${toEmail}. Reason:`, errorMsg, err);
    return { success: false, error: errorMsg };
  }
}
