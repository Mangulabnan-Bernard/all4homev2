import {
  Sparkles,
  Wrench,
  Zap,
  Scissors,
  Leaf,
  Truck,
  PaintRoller,
  Hammer,
  Bug,
  Thermometer,
  Drill,
  Wind,
  KeyRound,
  WashingMachine,
  CarFront,
  Flower2,
  PawPrint,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

/**
 * Marketing-side service catalog. This is the public, presentational source of
 * truth for the landing pages, the services mega-dropdown, and the filterable
 * services explorer. (Server-side, the real ServiceCategory rows in the DB
 * drive bookings — these slugs are designed to line up with seeded categories.)
 */
export type ServiceCategorySlug = "repairs" | "cleaning" | "outdoor" | "personal";

export interface ServiceCategoryDef {
  slug: ServiceCategorySlug;
  label: string;
  description: string;
}

export interface ServiceDef {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  category: ServiceCategorySlug;
  /** Seeded stock image (always resolvable). */
  image: string;
  /** Tailwind classes for the tile accent (icon chip background + text). */
  accent: string;
  startingPrice: number;
  popular?: boolean;
}

/** Groups used by the mega-dropdown and the explorer filter chips. */
export const SERVICE_CATEGORIES: ServiceCategoryDef[] = [
  { slug: "repairs", label: "Repairs & Maintenance", description: "Fix, install and maintain" },
  { slug: "cleaning", label: "Cleaning & Pest", description: "Spotless, healthy spaces" },
  { slug: "outdoor", label: "Outdoor & Moving", description: "Beyond the front door" },
  { slug: "personal", label: "Personal Care", description: "Looking after you" },
];

const img = (seed: string) => `https://picsum.photos/seed/a4h-${seed}/800/600`;

export const SERVICES: ServiceDef[] = [
  {
    slug: "cleaning",
    name: "Home Cleaning",
    tagline: "Spotless, every time",
    description:
      "Deep cleans, regular tidy-ups, move-in/move-out — vetted cleaners with their own supplies.",
    icon: Sparkles,
    category: "cleaning",
    image: img("cleaning"),
    accent: "bg-sky-100 text-sky-700",
    startingPrice: 35,
    popular: true,
  },
  {
    slug: "plumbing",
    name: "Plumbing",
    tagline: "Leaks, fixed fast",
    description: "Licensed plumbers for leaks, installs, blocked drains and emergency call-outs.",
    icon: Wrench,
    category: "repairs",
    image: img("plumbing"),
    accent: "bg-blue-100 text-blue-700",
    startingPrice: 60,
    popular: true,
  },
  {
    slug: "electrical",
    name: "Electrical",
    tagline: "Safe & certified",
    description: "Certified electricians for wiring, lighting, fault-finding and safety checks.",
    icon: Zap,
    category: "repairs",
    image: img("electrical"),
    accent: "bg-amber-100 text-amber-700",
    startingPrice: 65,
    popular: true,
  },
  {
    slug: "barber",
    name: "Barber & Grooming",
    tagline: "Sharp, at home",
    description: "Professional barbers and stylists who come to you — cuts, fades, beard trims.",
    icon: Scissors,
    category: "personal",
    image: img("barber"),
    accent: "bg-rose-100 text-rose-700",
    startingPrice: 25,
    popular: true,
  },
  {
    slug: "aircon",
    name: "AC & Heating",
    tagline: "Comfort, year round",
    description: "Aircon servicing, installs and heating repairs to keep every room comfortable.",
    icon: Wind,
    category: "repairs",
    image: img("aircon"),
    accent: "bg-cyan-100 text-cyan-700",
    startingPrice: 55,
    popular: true,
  },
  {
    slug: "laundry",
    name: "Laundry & Ironing",
    tagline: "Fresh, folded, done",
    description: "Wash, dry, fold and ironing with pickup and delivery — laundry off your list.",
    icon: WashingMachine,
    category: "cleaning",
    image: img("laundry"),
    accent: "bg-indigo-100 text-indigo-700",
    startingPrice: 20,
    popular: true,
  },
  {
    slug: "gardening",
    name: "Gardening & Lawn",
    tagline: "Green, kept neat",
    description: "Mowing, hedging, planting and seasonal garden care from local green-thumbs.",
    icon: Leaf,
    category: "outdoor",
    image: img("gardening"),
    accent: "bg-green-100 text-green-700",
    startingPrice: 40,
  },
  {
    slug: "moving",
    name: "Moving & Delivery",
    tagline: "Heavy lifting, sorted",
    description: "Movers and vans for home moves, single-item deliveries and furniture assembly.",
    icon: Truck,
    category: "outdoor",
    image: img("moving"),
    accent: "bg-violet-100 text-violet-700",
    startingPrice: 50,
  },
  {
    slug: "painting",
    name: "Painting",
    tagline: "A fresh coat",
    description: "Interior and exterior painters — feature walls to full repaints, tidy finish.",
    icon: PaintRoller,
    category: "outdoor",
    image: img("painting"),
    accent: "bg-purple-100 text-purple-700",
    startingPrice: 45,
  },
  {
    slug: "handyman",
    name: "Handyman",
    tagline: "Odd jobs done",
    description: "Mounting, repairs, flat-pack assembly and the little fixes that pile up.",
    icon: Hammer,
    category: "repairs",
    image: img("handyman"),
    accent: "bg-orange-100 text-orange-700",
    startingPrice: 40,
  },
  {
    slug: "carpentry",
    name: "Carpentry",
    tagline: "Built to last",
    description: "Custom shelving, cabinets, decking and timber repairs by skilled carpenters.",
    icon: Drill,
    category: "repairs",
    image: img("carpentry"),
    accent: "bg-yellow-100 text-yellow-800",
    startingPrice: 50,
  },
  {
    slug: "locksmith",
    name: "Locksmith",
    tagline: "Locked out? Sorted",
    description: "Lockouts, rekeys, new locks and security upgrades from trusted technicians.",
    icon: KeyRound,
    category: "repairs",
    image: img("locksmith"),
    accent: "bg-slate-100 text-slate-700",
    startingPrice: 45,
  },
  {
    slug: "pest-control",
    name: "Pest Control",
    tagline: "Bye, unwanted guests",
    description: "Safe, effective treatments for insects and rodents from licensed technicians.",
    icon: Bug,
    category: "cleaning",
    image: img("pest"),
    accent: "bg-lime-100 text-lime-700",
    startingPrice: 70,
  },
  {
    slug: "appliance-repair",
    name: "Appliance Repair",
    tagline: "Back up and running",
    description: "Fridges, washers, ovens and AC — diagnosis and repair by experienced techs.",
    icon: Thermometer,
    category: "repairs",
    image: img("appliance"),
    accent: "bg-teal-100 text-teal-700",
    startingPrice: 55,
  },
  {
    slug: "car-wash",
    name: "Car Wash & Detailing",
    tagline: "Showroom shine",
    description: "Mobile wash, interior detailing and polish — your car cleaned in the driveway.",
    icon: CarFront,
    category: "outdoor",
    image: img("carwash"),
    accent: "bg-emerald-100 text-emerald-700",
    startingPrice: 30,
  },
  {
    slug: "massage",
    name: "Massage & Wellness",
    tagline: "Unwind at home",
    description: "Certified therapists for relaxation, deep-tissue and sports massage at your door.",
    icon: Flower2,
    category: "personal",
    image: img("massage"),
    accent: "bg-pink-100 text-pink-700",
    startingPrice: 60,
  },
  {
    slug: "pet-grooming",
    name: "Pet Grooming",
    tagline: "Happy, tidy pets",
    description: "Bathing, trims and nail care for cats and dogs from gentle, vetted groomers.",
    icon: PawPrint,
    category: "personal",
    image: img("pet"),
    accent: "bg-orange-100 text-orange-700",
    startingPrice: 35,
  },
  {
    slug: "tutoring",
    name: "Tutoring & Lessons",
    tagline: "Learn at your pace",
    description: "In-home tutors and coaches for school subjects, music and languages.",
    icon: GraduationCap,
    category: "personal",
    image: img("tutoring"),
    accent: "bg-blue-100 text-blue-700",
    startingPrice: 30,
  },
];

export const POPULAR_SERVICES = SERVICES.filter((s) => s.popular);

export function getService(slug: string): ServiceDef | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function getCategory(slug: string): ServiceCategoryDef | undefined {
  return SERVICE_CATEGORIES.find((c) => c.slug === slug);
}

export function servicesInCategory(slug: ServiceCategorySlug): ServiceDef[] {
  return SERVICES.filter((s) => s.category === slug);
}

/** Services grouped by category, preserving SERVICE_CATEGORIES order. */
export function groupedServices(): { category: ServiceCategoryDef; services: ServiceDef[] }[] {
  return SERVICE_CATEGORIES.map((category) => ({
    category,
    services: SERVICES.filter((s) => s.category === category.slug),
  }));
}
