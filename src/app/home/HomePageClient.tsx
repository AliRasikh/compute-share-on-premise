"use client";

import { AnimatedSection } from "@/components/home/AnimatedSection";
import { HomeHero } from "@/components/home/HomeHero";
import { HomePosterSection } from "@/components/home/HomePosterSection";
import { HomeTextSection } from "@/components/home/HomeTextSection";
import { MarketingHeader } from "@/components/home/MarketingHeader";
import { Footer } from "@/components/Footer";

export function HomePageClient() {
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <MarketingHeader />
      <main className="w-full space-y-16 px-4 py-10 md:space-y-24 md:px-8 md:py-14">
        <AnimatedSection>
          <HomeHero />
        </AnimatedSection>

        <AnimatedSection>
          <HomeTextSection
            eyebrow="Offer"
            title="What people buy"
            body="On our platform you can rent CPU, GPU, and RAM exactly when you need it—for AI, simulations, data processing, or short-term cloud bursts. All compute comes from EU-based servers, giving you fast, local, and legally compliant resources without relying on global cloud giants."
          />
        </AnimatedSection>

        <AnimatedSection delay={0.05}>
          <HomePosterSection
            title="Digital Sovereignty in the EU"
            subtitle="Digital sovereignty means having control over your own data and infrastructure under laws you trust. In the EU today, this is crucial: too many companies still rely on foreign cloud providers, creating risks for control, compliance, and resilience. By keeping compute local, Europe strengthens independence and actively contributes to secure, EU-based digital infrastructure."
          />
        </AnimatedSection>

        <AnimatedSection delay={0.05}>
          <HomeTextSection
            id="partner"
            eyebrow="Partners"
            title="Why you should become a partner"
            body="Digital sovereignty means having control over your own data and infrastructure under laws you trust. In the EU today, this is crucial: too many companies still rely on foreign cloud providers, creating risks for control, compliance, and resilience. By keeping compute local, Europe strengthens independence and actively contributes to secure, EU-based digital infrastructure."
          />
        </AnimatedSection>
      </main>
      <Footer />
    </div>
  );
}