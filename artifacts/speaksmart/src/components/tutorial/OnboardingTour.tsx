import { useState } from "react";
import {
  LayoutDashboard, Globe, BookOpen, Mic, Trophy, Settings,
  X, ChevronRight, ChevronLeft, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step {
  icon: typeof LayoutDashboard;
  color: string;
  title: string;
  description: string;
  tip: string;
}

const STEPS: Step[] = [
  {
    icon: LayoutDashboard,
    color: "text-purple-400",
    title: "Your Dashboard",
    description: "This is your home base. See your XP, streak, level, and recent activity all in one place.",
    tip: "Keep your streak alive by practicing every day!",
  },
  {
    icon: Globe,
    color: "text-blue-400",
    title: "Choose a Language",
    description: "Go to Languages in the navigation to browse 11 languages — including Filipino! Pick your accent too.",
    tip: "You can practice multiple languages at the same time.",
  },
  {
    icon: BookOpen,
    color: "text-green-400",
    title: "Take Lessons",
    description: "Structured lessons guide you through vocabulary and phrases step by step. Earn XP when you finish.",
    tip: "Lessons are grouped by difficulty: Beginner → Intermediate → Advanced.",
  },
  {
    icon: Mic,
    color: "text-pink-400",
    title: "Free Practice",
    description: "In Practice mode, speak any phrase and get an instant pronunciation accuracy score from 0–100%.",
    tip: "The speech recognition works best in Chrome or Edge.",
  },
  {
    icon: Trophy,
    color: "text-yellow-400",
    title: "Compete on the Leaderboard",
    description: "Your XP earns you a spot on the global leaderboard. Complete lessons to climb the ranks!",
    tip: "Leaderboard updates automatically every time you earn XP.",
  },
  {
    icon: Settings,
    color: "text-orange-400",
    title: "Customize Your Experience",
    description: "Head to Settings to change your profile, pick from 8 color themes, and manage notifications.",
    tip: "Your Practice History lives on your Profile page under the History tab.",
  },
];

interface OnboardingTourProps {
  show: boolean;
  onDone: () => void;
}

export function OnboardingTour({ show, onDone }: OnboardingTourProps) {
  const [step, setStep] = useState(0);

  if (!show) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-md glass rounded-3xl p-8 shadow-2xl">
        {/* Skip button */}
        <button
          onClick={onDone}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-all ${
                i <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl bg-card flex items-center justify-center mb-6 border border-border`}>
          <Icon className={`w-8 h-8 ${current.color}`} />
        </div>

        {/* Content */}
        <div className="mb-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-3">{current.title}</h2>
        <p className="text-muted-foreground leading-relaxed mb-5">
          {current.description}
        </p>

        {/* Tip */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 mb-8">
          <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-primary">{current.tip}</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {isLast ? (
            <Button onClick={onDone} className="gap-2 glow-sm">
              <Sparkles className="w-4 h-4" />
              Let's Go!
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)} className="gap-2">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
