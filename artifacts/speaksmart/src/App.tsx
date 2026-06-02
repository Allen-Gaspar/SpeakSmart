import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ProtectedRoute } from "@/components/protected-route";
import { WelcomeTour } from "@/components/tutorial/WelcomeTour";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import LanguagesPage from "@/pages/LanguagesPage";
import LessonsPage from "@/pages/LessonsPage";
import LessonDetailPage from "@/pages/LessonDetailPage";
import PracticePage from "@/pages/PracticePage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import AdminPage from "@/pages/AdminPage";
import TutorialPage from "@/pages/TutorialPage";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground mb-4">Page not found</p>
        <a href="/" className="text-primary hover:underline">Go home</a>
      </div>
    </div>
  );
}

function HomePageWithTour() {
  const { user } = useAuth();
  return (
    <>
      <HomePage />
      {!user && <WelcomeTour />}
    </>
  );
}

// Wrapped components for protected routes
function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}

function ProtectedProfile() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
}

function ProtectedSettings() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
}

function ProtectedLessonDetail() {
  return (
    <ProtectedRoute>
      <LessonDetailPage />
    </ProtectedRoute>
  );
}

function ProtectedPractice() {
  return (
    <ProtectedRoute>
      <PracticePage />
    </ProtectedRoute>
  );
}

function ProtectedAdmin() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminPage />
    </ProtectedRoute>
  );
}

function ProtectedTutorial() {
  return (
    <ProtectedRoute>
      <TutorialPage />
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={HomePageWithTour} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/languages" component={LanguagesPage} />
      <Route path="/lessons" component={LessonsPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      
      {/* Protected user routes */}
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route path="/lessons/:lessonId" component={ProtectedLessonDetail} />
      <Route path="/practice/:language" component={ProtectedPractice} />
      <Route path="/profile" component={ProtectedProfile} />
      <Route path="/settings" component={ProtectedSettings} />
      <Route path="/tutorial" component={ProtectedTutorial} />
      
      {/* Admin routes */}
      <Route path="/admin" component={ProtectedAdmin} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
