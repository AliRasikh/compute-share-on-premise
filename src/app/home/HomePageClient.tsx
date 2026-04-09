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

        {/* EU Sovereignty Section */}
        <AnimatedSection delay={0.1}>
          <section className="mx-auto max-w-4xl">
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 p-8 md:p-12 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <span className="text-4xl">🇪🇺</span>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                    Help support European autonomy
                  </h2>
                  <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mt-1">
                    Digital Sovereignty starts with small choices
                  </p>
                </div>
              </div>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-6 max-w-3xl">
                Make sovereignty practical. Prefer European alternatives for everyday tools — documents,
                storage, messaging, cloud compute. Every small switch adds up to a more independent,
                resilient European digital ecosystem.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://european-alternatives.eu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-blue-700 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  European Alternatives for Digital Products
                </a>
                <a
                  href="https://www.goeuropean.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 text-sm font-bold rounded-xl border border-blue-200 shadow-sm hover:bg-blue-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  European Products &amp; Services
                </a>
              </div>
            </div>
          </section>
        </AnimatedSection>
      </main>
      <Footer />
    </div>
  );
}