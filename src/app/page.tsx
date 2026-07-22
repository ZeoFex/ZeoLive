import { FAQ } from "@/components/landing/faq";
import { FeaturedTutors } from "@/components/landing/featured-tutors";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Showcase } from "@/components/landing/showcase";
import { Stats } from "@/components/landing/stats";
import { Testimonials } from "@/components/landing/testimonials";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getLandingCms, getPublicPlatformStats } from "@/lib/cms";
import { ensureTutorRatingsSeeded, listFeaturedTutorsForHomepage } from "@/lib/featured-tutors";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureTutorRatingsSeeded();

  const [cms, liveStats, tutors] = await Promise.all([
    getLandingCms(),
    getPublicPlatformStats(),
    listFeaturedTutorsForHomepage(8),
  ]);

  const stats = { ...cms.stats, ...liveStats };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main>
        <Hero content={cms.hero} />
        <Stats stats={stats} />
        <Showcase heading={cms.showcase} />
        <Features content={cms.features} />
        <HowItWorks content={cms.howItWorks} />
        <FeaturedTutors heading={cms.featuredTutors} tutors={tutors} />
        <Testimonials content={cms.testimonials} />
        <FAQ content={cms.faq} />
      </main>
      <Footer />
    </div>
  );
}
