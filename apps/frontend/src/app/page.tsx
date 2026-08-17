import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import StatsStrip from "@/components/landing/StatsStrip";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Security from "@/components/landing/Security";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <div className="mt-24">
        <StatsStrip />
      </div>
      <Features />
      <HowItWorks />
      <Security />
      <CTA />
      <Footer />
    </main>
  );
}
