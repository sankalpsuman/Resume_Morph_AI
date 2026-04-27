export interface PortfolioContent {
  hero: {
    name: string;
    headline: string;
    subheadline: string;
  };
  about: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    description: string[];
  }[];
  projects: {
    title: string;
    description: string;
    tech: string[];
    link?: string;
    github?: string;
  }[];
  education: {
    school: string;
    degree: string;
    year: string;
  }[];
  contact: {
    email: string;
    linkedin?: string;
    github?: string;
  };
  styles?: Record<string, { 
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    backgroundColor?: string;
    lineHeight?: number;
    fontFamily?: string;
  }>;
}

export type PortfolioTemplate = 'minimal' | 'developer' | 'professional' | 'modern' | 'glass' | 'cyber';
