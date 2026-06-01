import { Hero } from "@/components/marketing/hero";
import { ServicesSection } from "@/components/marketing/services-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Stats } from "@/components/marketing/stats";
import { PopularProviders } from "@/components/marketing/popular-providers";
import { Testimonials } from "@/components/marketing/testimonials";
import { CtaBand } from "@/components/marketing/cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <HowItWorks />
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <Stats />
      </div>
      <PopularProviders />
      <Testimonials />
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <CtaBand />
      </div>
    </>
  );
}
