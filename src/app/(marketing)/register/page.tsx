import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { ComingSoon } from "@/components/marketing/coming-soon";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <ComingSoon
      icon={UserPlus}
      badge="Accounts coming soon"
      title="Create your account"
      description="Sign-up is being built. In the meantime, explore the services you can book and how All4Home works."
      primary={{ href: "/services", label: "Explore services" }}
    />
  );
}
