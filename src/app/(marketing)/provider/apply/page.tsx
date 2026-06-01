import type { Metadata } from "next";
import { BriefcaseBusiness } from "lucide-react";
import { ComingSoon } from "@/components/marketing/coming-soon";

export const metadata: Metadata = { title: "Become a provider" };

export default function ProviderApplyPage() {
  return (
    <ComingSoon
      icon={BriefcaseBusiness}
      badge="Provider onboarding coming soon"
      title="Become a provider"
      description="Grow your business with All4Home. Provider applications open soon — you'll be able to list services, set availability, and get booked."
      primary={{ href: "/services", label: "See the services" }}
    />
  );
}
