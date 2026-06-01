import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickPractice } from "@/components/dashboard/quick-practice";
import { AchievementBanner } from "@/components/dashboard/achievement-banner";
import { OnboardingTour } from "@/components/tutorial/OnboardingTour";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user, userData, loading, markTutorialComplete } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!user || !userData) return null;

  const showTour = userData.tutorialComplete === false;

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome, <span className="gradient-text">{userData.displayName}</span>
            </h1>
            <p className="text-muted-foreground">
              Continue your language learning journey. You&apos;re on a {userData.streak} day streak!
            </p>
          </div>

          <AchievementBanner userData={userData} />
          <DashboardStats userData={userData} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2">
              <QuickPractice />
            </div>
            <div>
              <RecentActivity />
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Onboarding tour for new users — shown once */}
      <OnboardingTour show={showTour} onDone={markTutorialComplete} />
    </main>
  );
}
