import { useEffect } from "react";
import { Header } from "../components/header";
import { HeroSection } from "../components/hero-section";
import { FeaturesSection } from "../components/features-section";
import { PricingSection } from "../components/pricing-section";
import { Footer } from "../components/footer";

export default function LandingPage() {
  // Always dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtb2Rlcm4lMjBsaXZpbmclMjByb29tJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcxMzI4NzI5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 backdrop-blur-md bg-black/40 transition-colors duration-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-white transition-colors duration-500">
        <Header />
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <Footer />
      </div>
    </div>
  );
}
