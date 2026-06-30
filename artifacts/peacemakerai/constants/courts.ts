export type CourtId =
  | "school_relationship"
  | "school_friend"
  | "school_group"
  | "dating"
  | "engaged"
  | "married"
  | "divorced";

export interface Court {
  id: CourtId;
  name: string;
  description: string;
  icon: string;
  category: "School" | "Romantic";
  color: string;
}

export const COURTS: Court[] = [
  {
    id: "dating",
    name: "Dating Court",
    description: "For couples still getting to know each other",
    icon: "heart",
    category: "Romantic",
    color: "#E879A0",
  },
  {
    id: "engaged",
    name: "Engaged Court",
    description: "For couples planning their future together",
    icon: "star",
    category: "Romantic",
    color: "#C9A84C",
  },
  {
    id: "married",
    name: "Married Court",
    description: "For spouses navigating life's challenges",
    icon: "home",
    category: "Romantic",
    color: "#4A9EDE",
  },
  {
    id: "divorced",
    name: "Divorced Court",
    description: "For navigating separation with clarity",
    icon: "wind",
    category: "Romantic",
    color: "#A78BFA",
  },
  {
    id: "school_relationship",
    name: "School Relationship",
    description: "For romantic conflicts in a school setting",
    icon: "book-open",
    category: "School",
    color: "#38A169",
  },
  {
    id: "school_friend",
    name: "Friend Court",
    description: "For friendship disputes and misunderstandings",
    icon: "users",
    category: "School",
    color: "#ED8936",
  },
  {
    id: "school_group",
    name: "Group Court",
    description: "For group conflicts involving three or more people",
    icon: "grid",
    category: "School",
    color: "#667EEA",
  },
];

export function getCourtById(id: CourtId): Court | undefined {
  return COURTS.find((c) => c.id === id);
}
