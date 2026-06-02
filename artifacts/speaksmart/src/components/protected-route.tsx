import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, userData, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      // Not logged in - redirect to login and replace history to prevent back button
      if (!user) {
        // Replace history state to prevent back button from returning to protected page
        window.history.replaceState(null, "", "/login");
        setLocation("/login");
        return;
      }

      // User is banned - redirect to login
      if (userData?.isBanned) {
        window.history.replaceState(null, "", "/login");
        setLocation("/login");
        return;
      }

      // Requires admin but user is not admin - redirect to dashboard
      if (requireAdmin && !userData?.isAdmin) {
        setLocation("/dashboard");
        return;
      }
    }
  }, [user, userData, loading, requireAdmin, setLocation]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  // Don't render content if not authorized
  if (!user || userData?.isBanned) {
    return null;
  }

  // Don't render admin content if not admin
  if (requireAdmin && !userData?.isAdmin) {
    return null;
  }

  return <>{children}</>;
}

// Higher-order component for protecting pages
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  requireAdmin = false
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requireAdmin={requireAdmin}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
