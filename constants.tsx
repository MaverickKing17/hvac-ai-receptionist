
import { AppConfig } from './types';

export const CONFIG: AppConfig = {
  companyName: "ServiceVoice GTA",
  logoUrl: "https://picsum.photos/200/60?random=15",
  primaryColor: "#0284c7", // HVAC Sky Blue
  secondaryColor: "#0f172a", // Deep Slate
  accentColor: "#f97316", // Energy Orange
  heroTagline: "The GTA's #1 AI Dispatcher for HVAC Leaders.",
  heroSubheadline: "White-label AI voice agents engineered for Toronto contractors. Book high-margin installs, automate Enbridge rebate pre-qualification, and dominate the 416/905 markets 24/7.",
  emergencyPhone: "416-555-HVAC",
  rebateAmount: "$10,500",
  guarantees: [
    "GTA Region Specialist",
    "Enbridge & HRS Program Expert",
    "Jobber & ServiceTitan Sync",
    "4-Hour GTA Dispatch Logic"
  ],
  serviceAreas: ["Toronto", "Mississauga", "Brampton", "Vaughan", "Markham", "Oakville", "Richmond Hill", "Burlington"],
  pricing: [
    {
      name: "Local Shop",
      price: "$399/mo",
      description: "Ideal for solo-truck operators in the GTA.",
      features: [
        "1 GTA-Trained AI Agent",
        "Basic Lead Capture",
        "SMS Dispatch Alerts",
        "Enbridge Rebate Scripting"
      ]
    },
    {
      name: "GTA Fleet Pro",
      price: "$799/mo",
      description: "The gold standard for multi-crew GTA operations.",
      features: [
        "Chloe (Sales) & Sam (Dispatch)",
        "Full CRM Integration",
        "Live Calendar Sync",
        "HRS Rebate Optimizer",
        "Multi-City Dispatch Rules"
      ],
      popular: true
    },
    {
      name: "Regional Giant",
      price: "Custom",
      description: "For established firms covering the entire Golden Horseshoe.",
      features: [
        "Unlimited White-Label Agents",
        "Advanced Multi-Region Logic",
        "Dedicated Account Manager",
        "Custom LLM Fine-tuning",
        "Priority On-boarding"
      ]
    }
  ],
  testimonials: [
    {
      name: "Dave S.",
      location: "Brampton Comfort Solutions",
      text: "ServiceVoice changed our winter game. Chloe handles all the Enbridge rebate questions while our guys are on-site. It's like having a full-time office manager for a fraction of the cost.",
      rating: 5
    }
  ]
};
