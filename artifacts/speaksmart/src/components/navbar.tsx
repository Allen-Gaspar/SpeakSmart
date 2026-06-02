import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Menu, X, Mic, LogOut, User, LayoutDashboard,
  Settings, HelpCircle, Shield,
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, userData, signOut, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setLocation("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-sm">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text">SPEAKSMART</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {/* Only show user pages for non-admin users */}
            {!userData?.isAdmin && (
              <>
                <Link href="/languages" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Languages
                </Link>
                <Link href="/lessons" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Lessons
                </Link>
                <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Leaderboard
                </Link>
                <Link href="/tutorial" className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Help
                </Link>
              </>
            )}
            {/* Admin quick link */}
            {userData?.isAdmin && (
              <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Admin Panel
              </Link>
            )}

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      {userData?.photoURL ? (
                        <img
                          src={userData.photoURL}
                          alt={userData.displayName || "User"}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="hidden lg:inline text-sm">{userData?.displayName || "User"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userData?.displayName}</p>
                    <p className="text-xs text-muted-foreground">Level {userData?.level} · {userData?.xp} XP</p>
                  </div>
                  <DropdownMenuSeparator />
                  {/* Admin gets Admin Panel, users get Dashboard */}
                  {userData?.isAdmin ? (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 text-yellow-400">
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {/* Only show Help for non-admin users */}
                  {!userData?.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/tutorial" className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        Help & Tutorial
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="glow-sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-t border-border">
          <div className="px-4 py-4 space-y-1">
            {/* Only show user pages for non-admin users */}
            {!userData?.isAdmin && (
              <>
                {[
                  { href: "/languages", label: "Languages" },
                  { href: "/lessons", label: "Lessons" },
                  { href: "/leaderboard", label: "Leaderboard" },
                  { href: "/tutorial", label: "Help & Tutorial" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="block px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </>
            )}

            {user ? (
              <>
                <div className="border-t border-border my-2" />
                {/* Admin gets admin panel link, users get dashboard */}
                {userData?.isAdmin ? (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-yellow-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                {[
                  { href: "/profile", label: "Profile" },
                  { href: "/settings", label: "Settings" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="block px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
                <button
                  onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-destructive hover:bg-secondary transition-colors text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-border mt-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full" size="sm">Sign In</Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full glow-sm" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
