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
            body="Teams buy predictable compute: GPUs for training and inference, CPUs for batch and services. They want transparent pricing, clear capacity, and a path from demo to production without surprises."
          />
        </AnimatedSection>

        <AnimatedSection delay={0.05}>
          <HomePosterSection
            title="Poster / background"
            subtitle="Space for a campaign visual, product shot, or any message you want to highlight."
          />
        </AnimatedSection>

        <AnimatedSection delay={0.05}>
          <HomeTextSection
            id="partner"
            eyebrow="Partners"
            title="Why you should become a partner"
            body="Share capacity when you have headroom, consume when you need burst, and keep governance in one place. Partners help balance the network—better utilization for sellers and more optionality for buyers."
          />
        </AnimatedSection>
      </main>
      <Footer />
    </div>
  );
}
