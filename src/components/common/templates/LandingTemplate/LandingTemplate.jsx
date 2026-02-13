import HeroSection from "../../organisms/HeroSection";
import FeaturesSection from "../../organisms/FeaturesSection";
import PropertyShowcaseSection from "../../organisms/PropertyShowcaseSection";
import HowItWorksSection from "../../organisms/HowItWorksSection";
import StatsSection from "../../organisms/StatsSection";
import CTASection from "../../organisms/CTASection";

/**
 * LandingTemplate - Complete landing page template
 * Combines all landing page organisms following atomic design pattern
 * Mobile-first responsive design
 */
const LandingTemplate = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Search */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Property Showcase */}
      <PropertyShowcaseSection limit={6} />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Call to Action */}
      <CTASection />
    </div>
  );
};

export default LandingTemplate;
