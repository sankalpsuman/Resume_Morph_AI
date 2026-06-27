import { welcomeEmailConfig } from "../welcome-email-config.js";

interface SubscriptionInfo {
  planName: string;
  planBenefits: string[];
  remainingCredits?: number;
  upgradeInstructions: string;
}

/**
 * Renders a pristine, modular, responsive, and cross-client compatible HTML string
 * for the welcome email using SMTP, based on active administrator configurations.
 */
export function renderWelcomeEmail(userName: string, subInfo?: SubscriptionInfo): string {
  const { 
    founderName, 
    founderRole, 
    supportEmail, 
    websiteUrl, 
    linkedinUrl, 
    companyName, 
    logoUrl, 
    faqUrl, 
    helpCenterUrl, 
    featuresList, 
    steps, 
    premiumPlans 
  } = welcomeEmailConfig;

  // Set default subscription info if not provided
  const activeSubInfo: SubscriptionInfo = subInfo || {
    planName: "Free Trial",
    planBenefits: [
      "Access to base templates",
      "Standard PDF compilation export",
      "1 high-fidelity Resume Morph"
    ],
    remainingCredits: 1,
    upgradeInstructions: "Open your ResumeMorph Account Panel any time and click 'Upgrade' to choose any of our Starter, Professional, or Master Unlimited tiers."
  };

  // 1. Format core features using modern visual styling
  const featuresHtml = featuresList
    .map(
      (feature) => `
      <div style="background-color: #fafafa; border: 1px solid #eaeaea; border-radius: 8px; padding: 12px; margin-bottom: 8px; font-size: 13.5px; opacity: 0.95;">
        <span style="color: #4f46e5; font-weight: 800; margin-right: 6px;">✔</span> <span style="color: #1e293b; font-weight: 500;">${feature}</span>
      </div>`
    )
    .join("");

  // 2. Format getting started steps with numbered circles
  const stepsHtml = steps
    .map(
      (step, idx) => `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td valign="top" width="28" style="padding-top: 2px;">
            <div style="width: 22px; height: 22px; line-height: 22px; border-radius: 11px; background-color: #4f46e5; color: #ffffff; font-size: 11px; font-weight: 900; text-align: center;">
              ${idx + 1}
            </div>
          </td>
          <td valign="top" style="padding-left: 8px; font-size: 14px; line-height: 1.5; color: #334155;">
            ${step}
          </td>
        </tr>
      </table>`
    )
    .join("");

  // 3. Current active plan visual card
  const creditsDisplay = activeSubInfo.remainingCredits !== undefined 
    ? `<div style="margin-top: 8px; font-size: 13px; font-weight: 700; color: #4f46e5;">🔋 Remaining Morphs/Credits: ${activeSubInfo.remainingCredits}</div>`
    : "";

  const activePlanCardHtml = `
    <div style="background-color: #f5f3ff; border: 1.5px solid #c7d2fe; border-radius: 12px; padding: 20px; text-align: left; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; background-color: #ddd6fe; color: #5b21b6; padding: 3px 8px; border-radius: 9999px;">
          Active Plan
        </span>
      </div>
      <h4 style="margin: 4px 0; font-size: 18px; font-weight: 800; color: #1e1b4b;">${activeSubInfo.planName}</h4>
      ${creditsDisplay}
      <ul style="margin: 12px 0 16px 0; padding: 0 0 0 16px; list-style-type: square; font-size: 13px; color: #2e1065; line-height: 1.5;">
        ${activeSubInfo.planBenefits.map(b => `<li style="margin-bottom: 4px;">${b}</li>`).join("")}
      </ul>
      <div style="border-top: 1px dashed #c7d2fe; padding-top: 12px; font-size: 12px; line-height: 1.5; color: #4338ca;">
        <strong>How to Upgrade:</strong> ${activeSubInfo.upgradeInstructions}
      </div>
    </div>
  `;

  // 4. Premium pricing tier cards for upgrade guidance
  const pricingCardsHtml = premiumPlans
    .map(
      (plan) => `
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; text-align: left;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td valign="top">
              <strong style="font-size: 14px; color: #0f172a;">${plan.name}</strong>
            </td>
            <td align="right" valign="top">
              <span style="font-size: 14px; font-weight: 800; color: #4f46e5;">${plan.price}</span>
            </td>
          </tr>
        </table>
        <div style="margin-top: 8px; font-size: 12px; color: #64748b; line-height: 1.4;">
          ${plan.features.join(" • ")}
        </div>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to ResumeMorph 🚀</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

    a { color: #4f46e5; text-decoration: none; }
    a:hover { text-decoration: underline; }

    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; padding: 10px !important; }
      .header-logo { width: 100% !important; max-height: auto !important; }
      .content-padding { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="background-color: #f8fafc; margin: 0 !important; padding: 20px 0 !important; width: 100% !important; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td align="center" valign="top">
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08); margin: 0 auto; max-width: 600px; border: 1px solid #e2e8f0;">
          
          <!-- Modern Promotional / Graphic Branding Logo Banner -->
          <tr>
            <td align="center" valign="top">
              <a href="${websiteUrl}" target="_blank" style="display: block; width: 100%;">
                <img src="${logoUrl}" alt="${companyName} Style Cloner Banner" border="0" class="header-logo" style="width: 100%; height: auto; max-height: 240px; display: block; object-fit: cover;" referrerPolicy="no-referrer">
              </a>
            </td>
          </tr>

          <!-- Main Core Content -->
          <tr>
            <td align="left" valign="top" class="content-padding" style="padding: 40px; color: #1e293b; background-color: #ffffff;">
              
              <!-- Personal Greeting -->
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em; color: #0f172a; text-align: left;">
                Hey ${userName}, 👋
              </h1>
              
              <h2 style="margin: 0 0 18px 0; font-size: 18px; font-weight: 700; color: #4f46e5; line-height: 1.3;">
                Welcome to ${companyName} – Your Elite Style Cloning Engine!
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 14.5px; line-height: 1.6; color: #475569;">
                We are thrilled to welcome you. <strong>${companyName}</strong> leverages custom layout extraction technology that automatically maps, parses, and overlays the architectural layout DNA of any target resume design onto your professional history. Stop fighting markdown compilers or text editor margins—simply clone your target style immediately.
              </p>

              <!-- CTA Main Button -->
              <div style="margin: 28px 0 32px 0; text-align: center;">
                <a href="${websiteUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 700; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); text-decoration: none;">
                  Start Building Your Resume Now &rarr;
                </a>
              </div>

              <!-- Section: Getting Started Steps -->
              <div style="margin-bottom: 32px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                  🏁 4 Steps to Perfect Cloning
                </h3>
                ${stepsHtml}
              </div>

              <!-- Section: Current Tier and Upgrade Guide -->
              <h3 style="margin: 32px 0 12px 0; font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                🛡️ Your Subscription Integrity
              </h3>
              ${activePlanCardHtml}

              <!-- Section: Key Features -->
              <h3 style="margin: 32px 0 12px 0; font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                💡 Features Inside Your Dashboard
              </h3>
              <div style="margin-bottom: 28px;">
                ${featuresHtml}
              </div>

              <!-- Section: Upgrade Tiers Options -->
              <h3 style="margin: 32px 0 14px 0; font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                ⭐ Fast-Track Plans
              </h3>
              <div style="margin-bottom: 32px;">
                ${pricingCardsHtml}
              </div>

              <!-- Divider line -->
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;">

              <!-- Founder Profile Section with custom requested roles -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="top" style="padding-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #0f172a;">👤 Meet the Architect:</h3>
                    <p style="margin: 0 0 14px 0; font-size: 13.5px; line-height: 1.6; color: #475569;">
                      <em>"I built ResumeMorph with a unified priority: eliminate formatting manual labor so candidates can focus purely on capturing their worth. By analyzing resume styles like compile files, we give you the keys to pass recruitment ATS filters cleanly. If you ever have ideas, feel free to contact me directly."</em>
                    </p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size: 13.5px; line-height: 1.6; color: #334155;">
                          <strong>${founderName}</strong><br>
                          <span style="font-size: 12px; color: #64748b; font-weight: 600;">${founderRole}</span><br>
                          ✉️ Contact: <a href="mailto:${supportEmail}" style="color: #4f46e5; text-decoration: none;">${supportEmail}</a><br>
                          🔗 LinkedIn: <a href="${linkedinUrl}" target="_blank" style="color: #4f46e5; text-decoration: none;">Sankalp Suman</a><br>
                          💻 Portfolio Website: <a href="${websiteUrl}" target="_blank" style="color: #4f46e5; text-decoration: none;">${websiteUrl}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divider line -->
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">

              <!-- Support Help Center links -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="top" align="center" style="font-size: 12.5px; color: #64748b; line-height: 1.6;">
                    <strong>Need Assitance?</strong> Please search our library resource networks:<br>
                    🏥 <a href="${helpCenterUrl}" target="_blank" style="color: #4f46e5; font-weight: 600; text-decoration: underline;">Help Center</a>
                    &nbsp;&nbsp;•&nbsp;&nbsp;
                    ❔ <a href="${faqUrl}" target="_blank" style="color: #4f46e5; font-weight: 600; text-decoration: underline;">FAQ Guide</a>
                    &nbsp;&nbsp;•&nbsp;&nbsp;
                    📩 Support Email: <a href="mailto:${supportEmail}" style="color: #4f46e5; font-weight: 600;">${supportEmail}</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer area -->
          <tr>
            <td align="center" valign="top" style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11.5px; line-height: 1.6;">
              <p style="margin: 0 0 6px 0;">&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              <p style="margin: 0; font-size: 11px;">You are receiving this automated email because you registered on ${companyName}. This transaction dispatch does not contain tracking pixels.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
