export interface PremiumPlanConfig {
  name: string;
  price: string;
  features: string[];
}

export interface WelcomeEmailConfigType {
  founderName: string;
  supportEmail: string;
  websiteUrl: string;
  companyName: string;
  logoUrl: string;
  featuresList: string[];
  premiumPlans: PremiumPlanConfig[];
}

// Allowed admin configuration options for the Welcome Email without breaking the HTML design
export const welcomeEmailConfig: WelcomeEmailConfigType = {
  founderName: "Sankalp Suman",
  supportEmail: "sankalpsmn@gmail.com",
  websiteUrl: "https://resume-morph.vercel.app",
  companyName: "ResumeMorph",
  // Modern, high-contrast, professional-looking image url to act as top header banner/logo
  logoUrl: "https://res.cloudinary.com/dyksnjhyx/image/upload/v1781114996/oq2lql5xtwblfzrjvnzn.jpg",
  // Appatures available
  featuresList: [
    "Resume Morph (Copy Any Design with AI layout DNA mapping)",
    "AI Resume Optimization (Optimize descriptions for recruiter ATS bots)",
    "Cover Letter Generator (Fully personalized cover letters matched to styling)",
    "Portfolio Builder (Instantly generated online portfolios from resume)",
    "Multi-Template Support (Dynamic font customization & page visualization)",
    "PDF & DOCX Export (Flawless vector-perfect multi-page export standard)",
    "Interactive Real-Time Preview (Interactive split-screen with internal parsing)"
  ],
  premiumPlans: [
    {
      name: "Starter Plan",
      price: "₹299",
      features: [
        "7 high-fidelity Resume Morphs",
        "2 customizable Online Portfolios",
        "No watermarks on outputs"
      ]
    },
    {
      name: "Professional Plan",
      price: "₹999",
      features: [
        "12 high-fidelity Resume Morphs",
        "5 customizable Online Portfolios",
        "Full Cover Letter builder mirroring resume designs",
        "Advanced ATS diagnostic scanning report"
      ]
    },
    {
      name: "Master Combo Unlimited",
      price: "₹1499",
      features: [
        "No limits on Resume Morphs & AI requests",
        "10 customizable Online Portfolios",
        "Multi-page auto-paginating design layouts",
        "Premium support with founder consultation"
      ]
    }
  ]
};
