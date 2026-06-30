export type ResourceCategory =
  | "emergency"
  | "domestic_violence"
  | "mens_support"
  | "child_protection"
  | "mental_health"
  | "sexual_violence"
  | "youth"
  | "counseling"
  | "legal";

export interface SafetyResource {
  name: string;
  number: string;
  description: string;
  available: string;
  category: ResourceCategory;
  isText?: boolean;
}

export const SAFETY_RESOURCES: SafetyResource[] = [
  // Emergency
  {
    name: "Emergency Services",
    number: "911",
    description: "Police, ambulance, fire — call immediately if anyone is in physical danger right now.",
    available: "24/7",
    category: "emergency",
  },

  // Domestic Violence
  {
    name: "National DV Hotline",
    number: "1-800-799-7233",
    description: "Confidential support, safety planning, and shelter referrals for domestic violence survivors.",
    available: "24/7",
    category: "domestic_violence",
  },
  {
    name: "DV Hotline — Text Line",
    number: "Text START to 88788",
    description: "Text-based support — safer if you cannot speak freely.",
    available: "24/7",
    category: "domestic_violence",
    isText: true,
  },

  // Men's Support
  {
    name: "Mensline Australia",
    number: "1300 78 99 78",
    description: "Telephone and online counselling for men with relationship or family concerns.",
    available: "24/7",
    category: "mens_support",
  },
  {
    name: "Men's Health Line (AU)",
    number: "1300 789 978",
    description: "Free, confidential support for men experiencing domestic violence, mental health issues, or crisis.",
    available: "Mon–Fri 9am–5pm AEST",
    category: "mens_support",
  },

  // Child Protection
  {
    name: "Childhelp Abuse Hotline",
    number: "1-800-422-4453",
    description: "Crisis intervention and support for child abuse and neglect situations.",
    available: "24/7",
    category: "child_protection",
  },
  {
    name: "Child Protective Services",
    number: "1-800-252-2873",
    description: "Report child abuse or neglect to child protective services (DCFS/DHS).",
    available: "24/7",
    category: "child_protection",
  },

  // Mental Health
  {
    name: "988 Suicide & Crisis Lifeline",
    number: "988",
    description: "Free, confidential support for mental health crises and suicide prevention.",
    available: "24/7",
    category: "mental_health",
  },
  {
    name: "Crisis Text Line",
    number: "Text HOME to 741741",
    description: "Free crisis counselling via text message.",
    available: "24/7",
    category: "mental_health",
    isText: true,
  },
  {
    name: "Lifeline (AU)",
    number: "13 11 14",
    description: "Australian crisis support and suicide prevention.",
    available: "24/7",
    category: "mental_health",
  },

  // Sexual Violence
  {
    name: "RAINN Sexual Assault Hotline",
    number: "1-800-656-4673",
    description: "Confidential support for survivors of sexual violence, assault, and abuse.",
    available: "24/7",
    category: "sexual_violence",
  },

  // Youth
  {
    name: "Teen Line",
    number: "1-800-852-8336",
    description: "Peer support by teenagers, for teenagers — talk to someone your age.",
    available: "6pm–10pm PT",
    category: "youth",
  },
  {
    name: "Kids Helpline (AU)",
    number: "1800 55 1800",
    description: "Free counselling for young Australians aged 5-25 — call, chat, or email.",
    available: "24/7",
    category: "youth",
  },

  // Counseling
  {
    name: "National Parent Helpline",
    number: "1-855-427-2736",
    description: "Emotional support and resources for parents facing challenging situations.",
    available: "Mon–Fri 10am–7pm PT",
    category: "counseling",
  },
];

export const CATEGORY_RESOURCES: Record<string, ResourceCategory[]> = {
  active_violence:    ["emergency", "domestic_violence", "mens_support"],
  self_harm:          ["mental_health", "youth"],
  child_endangerment: ["emergency", "child_protection"],
  hostage_danger:     ["emergency"],
  sexual_assault:     ["emergency", "sexual_violence", "mental_health"],
  domestic_pattern:   ["domestic_violence", "mens_support", "mental_health", "counseling"],
  past_physical:      ["domestic_violence", "counseling", "mental_health"],
  stalking:           ["emergency", "domestic_violence"],
};

export function getResourcesForCategory(safetyCategory: string): SafetyResource[] {
  const cats = CATEGORY_RESOURCES[safetyCategory] ?? ["mental_health", "counseling"];
  return SAFETY_RESOURCES.filter((r) => cats.includes(r.category));
}
