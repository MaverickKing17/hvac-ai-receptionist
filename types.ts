
export interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface Testimonial {
  name: string;
  location: string;
  text: string;
  rating: number;
}

export interface AppConfig {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  heroTagline: string;
  heroSubheadline: string;
  emergencyPhone: string;
  rebateAmount: string;
  guarantees: string[];
  serviceAreas: string[];
  pricing: PricingTier[];
  testimonials: Testimonial[];
}
