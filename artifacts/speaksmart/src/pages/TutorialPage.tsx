import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, Globe, BookOpen, Mic, Trophy, User,
  Settings, Shield, HelpCircle, ChevronRight, Sparkles, Palette, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Section {
  icon: typeof LayoutDashboard;
  color: string;
  bg: string;
  title: string;
  route: string;
  steps: string[];
}

const SECTIONS: Section[] = [
  {
    icon: LayoutDashboard,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    title: "Dashboard",
    route: "/dashboard",
    steps: [
      "Go to Dashboard from the navigation menu after logging in.",
      "See your current XP, level, and streak at a glance.",
      "Check Recent Activity to see your last practice sessions.",
      "Use Quick Practice to jump straight into speaking.",
    ],
  },
  {
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    title: "Languages",
    route: "/languages",
    steps: [
      "Browse all 11 available languages on the Languages page.",
      "Each language has multiple regional accents to choose from.",
      "Click a language to start practicing with that accent.",
      "Languages include: English, Spanish, French, German, Japanese, Chinese, Korean, Portuguese, Italian, Arabic, and Tagalog.",
    ],
  },
  {
    icon: BookOpen,
    color: "text-green-400",
    bg: "bg-green-400/10",
    title: "Lessons",
    route: "/lessons",
    steps: [
      "Go to Lessons to find structured, guided practice sessions.",
      "Lessons are sorted by language and difficulty level.",
      "Each lesson contains a set of phrases to pronounce.",
      "Completing a lesson earns you XP and updates your streak.",
      "Your score is based on pronunciation accuracy (Levenshtein scoring).",
    ],
  },
  {
    icon: Mic,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    title: "Practice Mode",
    route: "/practice/english",
    steps: [
      "Open any language and click Practice to enter free practice.",
      "The app listens to your voice using your microphone.",
      "Speak the displayed phrase and get an instant accuracy score (0–100%).",
      "Try different accents by selecting one from the dropdown.",
      "Note: Speech recognition requires Chrome or Edge browser.",
    ],
  },
  {
    icon: Trophy,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    title: "Leaderboard",
    route: "/leaderboard",
    steps: [
      "The Leaderboard ranks all users by total XP earned.",
      "Complete lessons and practice sessions to earn more XP.",
      "Your entry updates automatically every time you gain XP.",
      "500 XP = 1 level up.",
    ],
  },
  {
    icon: User,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    title: "Your Profile",
    route: "/profile",
    steps: [
      "Visit your Profile to see all your stats and achievements.",
      "The Overview tab shows XP, level, streak, and lesson count.",
      "The Achievements tab lists all badges you've unlocked.",
      "The History tab shows every phrase you've practiced with its score.",
    ],
  },
  {
    icon: Palette,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    title: "Settings & Themes",
    route: "/settings",
    steps: [
      "Open Settings from the profile dropdown in the top-right.",
      "Profile tab: update your name, bio, and public profile toggle.",
      "Appearance tab: choose from 8 color themes (Dark Purple, Ocean, Forest, Rose, Amber, Midnight, Crimson, Light).",
      "Preferences tab: toggle email notifications and sound effects.",
      "Your theme is saved to your browser and applied instantly.",
    ],
  },
  {
    icon: History,
    color: "text-teal-400",
    bg: "bg-teal-400/10",
    title: "Practice History",
    route: "/profile",
    steps: [
      "Every phrase you practice is saved automatically.",
      "Go to Profile → History tab to see all your past sessions.",
      "History items show the phrase, language, type (lesson or free practice), and your score.",
      "Score colors: green (85%+), blue (65%+), yellow (45%+), red (below 45%).",
    ],
  },
];

export default function TutorialPage() {
  const { userData } = useAuth();

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4" />
              User Guide
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              How to use{" "}
              <span className="gradient-text">SPEAKSMART</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to know about learning languages with SPEAKSMART — step by step.
            </p>
          </div>

          {/* Quick start CTA */}
          {!userData && (
            <div className="glass rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Ready to start learning?</h3>
                <p className="text-muted-foreground text-sm">Create a free account to track your progress and compete on the leaderboard.</p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Link href="/login"><Button variant="outline">Sign In</Button></Link>
                <Link href="/register"><Button className="glow-sm gap-2"><Sparkles className="w-4 h-4" />Get Started</Button></Link>
              </div>
            </div>
          )}

          {/* Sections */}
          <div className="space-y-6">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="glass rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${section.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${section.color}`} />
                      </div>
                      <h2 className="font-bold text-lg">{section.title}</h2>
                    </div>
                    <Link href={section.route}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        Open <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                  <div className="p-5">
                    <ol className="space-y-2.5">
                      {section.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm text-muted-foreground leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              );
            })}

            {/* Admin section (only for admins) */}
            {userData?.isAdmin && (
              <div className="glass rounded-2xl overflow-hidden border border-yellow-400/20">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">Admin Panel</h2>
                      <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">Admin Only</span>
                    </div>
                  </div>
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs border-yellow-400/30">
                      Open <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
                <div className="p-5">
                  <ol className="space-y-2.5">
                    {[
                      "Access the Admin Panel at /admin — only accounts with admin privileges can enter.",
                      "Users tab: view all registered users, grant/revoke admin access, ban/unban users.",
                      "Leaderboard tab: view the full leaderboard and remove individual entries.",
                      "Languages tab: view built-in languages and add custom languages to Firestore.",
                      "Lessons tab: create custom lesson packs with phrases and assign them to any language.",
                      "Stats tab: see platform-wide stats including total XP, lessons completed, and admin count.",
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-yellow-400/15 text-yellow-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm text-muted-foreground leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="mt-10 text-center">
            <p className="text-muted-foreground text-sm mb-4">Still have questions?</p>
            <Link href="/contact">
              <Button variant="outline" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                Contact Support
              </Button>
            </Link>
          </div>

        </div>
      </div>
      <Footer />
    </main>
  );
}
