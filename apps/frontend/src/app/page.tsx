import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Security from "@/components/landing/Security";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import Grainient from "@/components/Grainient";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background overflow-x-hidden">
      <Nav />
      <main className="relative mx-auto max-w-6xl border-x border-border/60">
        {/* Full-Page Background WebGL Grainient Animation Constrained Within Grid Boundaries (opacity-60) */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60 overflow-hidden">
          <Grainient
            color1="#070707"
            color2="#000000"
            color3="#555555"
            timeSpeed={0.35}
            colorBalance={0.28}
            warpStrength={0}
            warpFrequency={0}
            warpSpeed={0}
            warpAmplitude={5}
            blendAngle={-180}
            blendSoftness={0.74}
            rotationAmount={360}
            noiseScale={3.4}
            grainAmount={0.12}
            grainScale={1.7}
            grainAnimated
            contrast={1.2}
            gamma={0.5}
            saturation={0}
            centerX={-1}
            centerY={-0.86}
            zoom={1.3}
          />
        </div>

        <div className="relative z-10">
          <Hero />
          <Features />
          <HowItWorks />
          <Security />
          <CTA />
        </div>
      </main>
      <Footer />
    </div>
  );
}
