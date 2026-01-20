
import { AppConfig } from './types';

export const CONFIG: AppConfig = {
  companyName: "Peel AI Receptionist",
  logoUrl: "https://picsum.photos/200/60?random=1",
  primaryColor: "#1E40AF", // Blue
  secondaryColor: "#F97316", // Orange
  accentColor: "#0D9488", // Teal
  heroTagline: "24/7 AI Receptionist + Custom Website for GTA HVAC Pros",
  heroSubheadline: "Never miss a no-heat call again. Melissa, your AI receptionist, answers, qualifies, and books calls instantly while you're on-site.",
  emergencyPhone: "416-555-0199",
  rebateAmount: "$10,500",
  guarantees: [
    "Certified Technicians",
    "24/7 Emergency Support",
    "Upfront Honest Pricing",
    "Local GTA Experts"
  ],
  serviceAreas: ["Toronto", "Mississauga", "Brampton", "Vaughan", "Markham", "Oakville"],
  pricing: [
    {
      name: "Starter Site",
      price: "$299/mo",
      description: "Perfect for solo contractors needing a professional presence.",
      features: [
        "Custom Brand Website",
        "Mobile-First Design",
        "SEO Optimization",
        "Lead Capture Forms",
        "Standard Hosting"
      ]
    },
    {
      name: "Pro AI Voice",
      price: "$599/mo",
      description: "Our most popular plan for growth-focused businesses.",
      features: [
        "Everything in Starter",
        "24/7 AI Voice Receptionist",
        "Live Calendar Booking",
        "SMS Lead Alerts",
        "Rebate Optimizer Tool"
      ],
      popular: true
    },
    {
      name: "Premium SaaS",
      price: "$999/mo",
      description: "Full automation for large fleets and franchises.",
      features: [
        "Everything in Pro",
        "Multi-Agent Support",
        "CRM Integration",
        "Advanced Analytics",
        "Priority 24/7 Tech Support"
      ]
    }
  ],
  testimonials: [
    {
      name: "Dave Miller",
      location: "Miller Heating & Air, Brampton",
      text: "Since adding Melissa to our calls, we've booked 30% more jobs that would have gone to voicemail. It paid for itself in two days.",
      rating: 5
    },
    {
      name: "Sarah Chen",
      location: "Chen HVAC Services, Toronto",
      text: "The website is sleek, but the AI voice is the real hero. It handles my midnight no-heat calls while I sleep. Incredible tech.",
      rating: 5
    },
    {
      name: "Mark Thompson",
      location: "Thompson Cooling, Mississauga",
      text: "Best investment I made for my business this year. Clients are blown away when they 'talk' to our AI and get booked instantly.",
      rating: 5
    }
  ]
};
