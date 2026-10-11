import { Intro } from "@/components/landing/Intro";
import { CursorGlow, Hero, LandingHeader } from "@/components/landing/Hero";
import { Audience, Features, FinalCall, Footer, HowItWorks, Pricing, TasteFlow } from "@/components/landing/Sections";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-x-clip">
      <Intro />
      <CursorGlow />
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <TasteFlow />
        <Features />
        <Audience />
        <Pricing />
        <FinalCall />
      </main>
      <Footer />
    </div>
  );
}
