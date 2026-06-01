import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import { ComingSoon } from "@/components/marketing/coming-soon";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <ComingSoon
      icon={LogIn}
      badge="Accounts coming soon"
      title="Sign in"
      description="Authentication is on the way. Soon you'll sign in to manage bookings, message pros, and track your simulated payments."
      primary={{ href: "/services", label: "Browse services" }}
    />
  );
}
