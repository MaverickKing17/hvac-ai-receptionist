
import { AppConfig } from './types';

export const CONFIG: AppConfig = {
  companyName: "ServiceVoice AI",
  logoUrl: "https://picsum.photos/200/60?random=10",
  primaryColor: "#0284c7", // HVAC Sky Blue
  secondaryColor: "#0f172a", // Deep Slate
  accentColor: "#f97316", // Energy Orange
  heroTagline: "The AI Receptionist Your HVAC Brand Deserves.",
  heroSubheadline: "White-label AI voice agents that book installs, handle emergency dispatch, and pre-qualify $10k government rebates while you sleep. Built for the 2026 HVAC industry.",
  emergencyPhone: "1-888-HVAC-AI-1",
  rebateAmount: "$10,500",
  guarantees: [
    "100% White-Label Branding",
    "ServiceTitan & Jobber Sync",
    "Dual-Agent (Chloe & Sam)",
    "Custom Voice Training"
  ],
  serviceAreas: ["Toronto", "GTA", "Vancouver", "Calgary", "Ottawa", "Montreal"],
  pricing: [
    {
      name: "Contractor",
      price: "$399/mo",
      description: "Perfect for owner-operators needing a digital voice.",
      features: [
        "1 Custom AI Agent",
        "Lead Capture via Webhook",
        "SMS Notifications",
        "Basic Analytics Dashboard"
      ]
    },
    {
      name: "Fleet Pro",
      price: "$799/mo",
      description: "Scale your multi-truck operation with precision.",
      features: [
        "Chloe & Sam Dual-Agents",
        "Full CRM Integration",
        "Live Calendar Sync",
        "Automatic Rebate Qualifier",
        "Priority 4hr Dispatch Logic"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Dedicated infrastructure for multi-location giants.",
      features: [
        "Unlimited White-Label Agents",
        "Multi-Region Dispatching",
        "Dedicated Account Manager",
        "Custom LLM Fine-tuning",
        "On-premise Data Hosting"
      ]
    }
  ],
  testimonials: [
    {
      name: "Mark T.",
      location: "Toronto HVAC Group",
      text: "We switched our entire dispatch to ServiceVoice. We stopped losing $2k furnace leads at 3 AM. The white-labeling is seamless.",
      rating: 5
    }
  ]
};
