import { welcomeEmailConfig } from "../welcome-email-config.js";

/**
 * Renders a pristine, modular, responsive, and cross-client compatible HTML string
 * for the welcome email based on active administrator configurations.
 */
export function renderWelcomeEmail(userName: string): string {
  const { founderName, supportEmail, websiteUrl, companyName, logoUrl, featuresList, premiumPlans } = welcomeEmailConfig;

  // Format features list into bullet points for the email body
  const featuresHtml = featuresList
    .map(
      (feature) => `
      <li style="margin-bottom: 8px; font-size: 14px; line-height: 1.5; color: #334155;">
        <strong style="color: #4f46e5;">•</strong> ${feature}
      </li>`
    )
    .join("");

  // Format plans list into beautiful visual pricing cards
  const plansHtml = premiumPlans
    .map(
      (plan) => `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; text-align: left;">
        <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #1e293b;">${plan.name}</h4>
        <div style="font-size: 18px; font-weight: 800; color: #4f46e5; margin-bottom: 12px;">${plan.price}</div>
        <ul style="margin: 0; padding: 0 0 0 16px; list-style-type: disc;">
          ${plan.features
            .map(
              (f) => `
            <li style="font-size: 13px; color: #475569; margin-bottom: 6px; line-height: 1.4;">${f}</li>`
            )
            .join("")}
        </ul>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to ResumeMorph</title>
  <style>
    /* Reset styles for high compatibility across email clients */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

    /* Touch target, links and hover states */
    a { color: #4f46e5; text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* Media queries for fluid responsive sizing */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; padding: 10px !important; }
      .header-logo { width: 100% !important; max-height: auto !important; }
      .content-padding { padding: 20px !important; }
    }
  </style>
</head>
<body style="background-color: #f1f5f9; margin: 0 !important; padding: 20px 0 !important; width: 100% !important; -webkit-font-smoothing: antialiased;">
  <!-- Centered container table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" valign="top">
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); margin: 0 auto; max-width: 600px;">
          
          <!-- Banner / Top Brand Header Graphic -->
          <tr>
            <td align="center" valign="top">
              <a href="${websiteUrl}" target="_blank" style="display: block; width: 100%;">
                <img src="${logoUrl}" alt="${companyName} Style Cloner" border="0" class="header-logo" style="width: 100%; height: auto; max-height: 250px; display: block; object-fit: cover;" referrerPolicy="no-referrer">
              </a>
            </td>
          </tr>

          <!-- Main Core Email Body padding -->
          <tr>
            <td align="left" valign="top" class="content-padding" style="padding: 40px; color: #1e293b; background-color: #ffffff;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em; color: #0f172a; text-align: left;">
                Hey ${userName}, 👋
              </h1>
              
              <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #4f46e5; line-height: 1.3;">
                Welcome to ${companyName}!
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                We are absolutely thrilled to welcome you to the community. ${companyName} is a high-fidelity style cloning engine engineered to bridge the structural gap between your professional expertise and your target role's layout aesthetic with clinical accuracy.
              </p>

              <!-- Features Section Header -->
              <h3 style="margin: 28px 0 12px 0; font-size: 16px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                ✨ Features Unlocked In Your Suite:
              </h3>
              
              <ul style="margin: 0 0 24px 0; padding: 0; list-style-type: none;">
                ${featuresHtml}
              </ul>

              <!-- Interactive Call to Create Resume -->
              <div style="margin: 30px 0; text-align: center;">
                <a href="${websiteUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 700; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); text-decoration: none;">
                  Build Your Dream Resume Now &rarr;
                </a>
              </div>

              <!-- Premium Tier Showcase -->
              <h3 style="margin: 32px 0 12px 0; font-size: 16px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                🚀 Upgrade &amp; Accelerate (Active Plans):
              </h3>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.5;">
                Supercharge your recruitment conversions with advanced formatting options, limitless high-precision design morphs, and dedicated live portfolios:
              </p>

              <div style="margin-bottom: 30px;">
                ${plansHtml}
              </div>

              <!-- Divider line -->
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">

              <!-- Founder Profile Section -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="top" style="padding-bottom: 20px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #0f172a;">👤 From the Founder:</h3>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                      <em>"I designed ResumeMorph to save candidates thousands of hours wasted on traditional, finicky document editors. Creating a layout-perfect, ATS-compliant application should be as simple and precise as typing. Welcome aboard!"</em>
                    </p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #475569;">
                      <strong>${founderName}</strong><br>
                      Founder, ResumeMorph Suite<br>
                      Email: <a href="mailto:${supportEmail}">${supportEmail}</a><br>
                      Web: <a href="${websiteUrl}" target="_blank">${websiteUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider line -->
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0 30px 0;">

              <!-- Contact callout -->
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b; text-align: center;">
                Need help or have questions? Simply reply directly to this email or write to <a href="mailto:${supportEmail}">${supportEmail}</a>. Our tech support team is always ready to assist!
              </p>

            </td>
          </tr>

          <!-- Footer area -->
          <tr>
            <td align="center" valign="top" style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
              <p style="margin: 0;">Designed to help stellar candidates stand out on every desk.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
