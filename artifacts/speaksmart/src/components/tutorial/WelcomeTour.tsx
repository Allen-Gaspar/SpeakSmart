import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Mic, LogIn, UserPlus, X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "speaksmart-welcome-seen";

interface WelcomeStep {
  icon: typeof Mic;
  iconColor: string;
  badge?: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

const STEPS: WelcomeStep[] = [
  {
    icon: Mic,
    iconColor: "text-primary",
    badge: "Welcome",
    title: "Welcome to SPEAKSMART! 🎤",
    description: "The AI-powered voice language learning platform. Practice speaking 11+ languages with real-time pronunciation feedback.",
  },
  {
    icon: LogIn,
    iconColor: "text-blue-400",
    badge: "Step 1",
    title: "Already have an account?",
    description: "Click the Sign In button in the top-right corner of the page, or use the button below to go to the login page.",
    action: { label: "Go to Sign In", href: "/login" },
  },
  {
    icon: UserPlus,
    iconColor: "text-green-400",
    badge: "Step 2",
    title: "New here? Create a free account",
    description: "Click Get Started in the top-right corner, or use the button below. Registration takes less than a minute — no credit card needed!",
    action: { label: "Create Account", href: "/register" },
  },
];

export function WelcomeTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setVisible(true);
    } catch { /* ignore */ }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={dismiss} />

      {/* Card */}
      <div className="relative w-full max-w-md glass rounded-3xl p-8 shadow-2xl mb-safe">
        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-all ${i <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>

        {/* Logo on first step */}
        {step === 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-sm">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text">SPEAKSMART</span>
          </div>
        )}

        {step !== 0 && (
          <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
            <Icon className={`w-7 h-7 ${current.iconColor}`} />
          </div>
        )}

        {current.badge && (
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-2">
            {current.badge}
          </span>
        )}

        <h2 className="text-2xl font-bold mb-3">{current.title}</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          {current.description}
        </p>

        {current.action && (
          <Link href={current.action.href} onClick={dismiss}>
            <Button variant="outline" className="w-full mb-4 gap-2">
              <Sparkles className="w-4 h-4" />
              {current.action.label}
            </Button>
          </Link>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <button
            onClick={dismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>

          {isLast ? (
            <Button size="sm" onClick={dismiss} className="gap-1">
              Done <Sparkles className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep((s) => s + 1)} className="gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
