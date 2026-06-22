export interface PremiumPlanConfig {
  name: string;
  price: string;
  features: string[];
}

export interface WelcomeEmailConfigType {
  founderName: string;
  founderRole: string;
  supportEmail: string;
  websiteUrl: string;
  linkedinUrl: string;
  companyName: string;
  logoUrl: string;
  faqUrl: string;
  helpCenterUrl: string;
  featuresList: string[];
  steps: string[];
  premiumPlans: PremiumPlanConfig[];
}

export const welcomeEmailConfig: WelcomeEmailConfigType = {
  founderName: "Sankalp Suman",
  founderRole: "Software Test Specialist & Scrum Master",
  supportEmail: "sankalpsmn@gmail.com",
  websiteUrl: "https://resume-morph.vercel.app",
  linkedinUrl: "https://www.linkedin.com/in/sankalp-suman",
  companyName: "ResumeMorph",
  logoUrl: "https://res.cloudinary.com/dyksnjhyx/image/upload/v1781114996/oq2lql5xtwblfzrjvnzn.jpg",
  faqUrl: "https://resume-morph.vercel.app/#faq",
  helpCenterUrl: "https://resume-morph.vercel.app/help",
  featuresList: [
    "AI Resume Morphing – Mirror any document's structural architecture in one-click",
    "ATS Optimization – Dynamically adjust descriptions for recruiter screening algorithms",
    "Resume Analysis – Evaluate formatting gaps and section balance clinically",
    "Cover Letter Generation – Build professional matched sheets that fit your template",
    "Resume Preview – Interactive real-time split-screen side-by-side editing",
    "PDF Export – Export flawless, vector-perfect multi-page documents",
    "Smart Resume Enhancement – Deep semantic analysis powered by Gemini AI",
    "AI Suggestions – Section-by-section advice on professional impact metrics",
    "Secure Cloud Storage – Encrypted personal workspace database protection"
  ],
  steps: [
    "Upload Resume (Select your existing master document or starting layout)",
    "Upload Target Resume (Input the layout design style/DNA you want to clone)",
    "Generate Professional Resume (Let AI execute high-fidelity matching)",
    "Download PDF (Acquire clean, high-contrast, ATS-approved vector files)"
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
