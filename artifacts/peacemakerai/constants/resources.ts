export interface SafetyResource {
  name: string;
  number: string;
  description: string;
  available: string;
}

export const SAFETY_RESOURCES: SafetyResource[] = [
  {
    name: "National Domestic Violence Hotline",
    number: "1-800-799-7233",
    description: "Safe, confidential support for domestic violence situations",
    available: "24/7",
  },
  {
    name: "Crisis Text Line",
    number: "Text HOME to 741741",
    description: "Free crisis counseling via text message",
    available: "24/7",
  },
  {
    name: "988 Suicide & Crisis Lifeline",
    number: "988",
    description: "Mental health crisis support and suicide prevention",
    available: "24/7",
  },
  {
    name: "RAINN Sexual Assault Hotline",
    number: "1-800-656-4673",
    description: "Support for survivors of sexual violence",
    available: "24/7",
  },
  {
    name: "Childhelp National Abuse Hotline",
    number: "1-800-422-4453",
    description: "Crisis intervention and support for child abuse",
    available: "24/7",
  },
  {
    name: "Teen Line",
    number: "1-800-852-8336",
    description: "Peer support for teenagers facing tough situations",
    available: "6pm–10pm PT",
  },
  {
    name: "National Parent Helpline",
    number: "1-855-427-2736",
    description: "Emotional support and resources for parents",
    available: "Mon–Fri 10am–7pm PT",
  },
];
