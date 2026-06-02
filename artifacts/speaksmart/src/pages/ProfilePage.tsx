import { useEffect, useState } from "react";
import { Link } from "wouter";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, HistoryEntry } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProfileStats } from "@/components/profile/profile-stats";
import { AchievementsList } from "@/components/profile/achievements-list";
import { Loader2, User, Settings, History, BookOpen, Mic, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProfileTab = "overview" | "achievements" | "history";

interface HistoryItem extends HistoryEntry {
  id: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 85 ? "text-green-400 bg-green-400/10" :
    score >= 65 ? "text-blue-400 bg-blue-400/10" :
    score >= 45 ? "text-yellow-400 bg-yellow-400/10" :
    "text-red-400 bg-red-400/10";
  return (
    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${color}`}>
      {score}%
    </span>
  );
}

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (tab === "history" && user) {
      setHistoryLoading(true);
      const q = query(
        collection(db, "userHistory", user.uid, "items"),
        orderBy("timestamp", "desc"),
        limit(100)
      );
      getDocs(q)
        .then((snap) => {
          setHistory(
            snap.docs.map((d) => ({ id: d.id, ...d.data() } as HistoryItem))
          );
        })
        .finally(() => setHistoryLoading(false));
    }
  }, [tab, user]);

  // ProtectedRoute handles auth check, so userData should always exist here
  if (!user || !userData) return null;

  const tabs: { id: ProfileTab; label: string; icon: typeof User }[] = [
    { id: "overview",     label: "Overview",     icon: User },
    { id: "achievements", label: "Achievements", icon: Trophy },
    { id: "history",      label: "History",      icon: History },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Profile header */}
          <div className="glass rounded-3xl p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center glow">
                  {userData.photoURL ? (
                    <img
                      src={userData.photoURL}
                      alt={userData.displayName || "User"}
                      className="w-24 h-24 rounded-full"
                    />
                  ) : (
                    <User className="w-12 h-12 text-primary" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {userData.level}
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold mb-1">{userData.displayName}</h1>
                <p className="text-muted-foreground mb-4">{userData.email}</p>
                {userData.bio && (
                  <p className="text-sm text-muted-foreground mb-4 max-w-md">{userData.bio}</p>
                )}
                <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                  <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                    <span>⚡</span>
                    <span>{userData.xp.toLocaleString()} XP</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full text-sm">
                    <span>🔥</span>
                    <span>{userData.streak}-day streak</span>
                  </div>
                  {userData.isAdmin && (
                    <div className="flex items-center gap-1.5 bg-yellow-400/10 text-yellow-400 px-3 py-1.5 rounded-full text-sm font-medium">
                      <span>👑</span>
                      <span>Admin</span>
                    </div>
                  )}
                </div>
              </div>

              <Link href="/settings">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
                    tab === t.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* ── Overview Tab ── */}
          {tab === "overview" && (
            <div className="space-y-6">
              <ProfileStats userData={userData} />
            </div>
          )}

          {/* ── Achievements Tab ── */}
          {tab === "achievements" && (
            <div className="glass rounded-2xl p-6">
              <AchievementsList achievements={userData.achievements || []} level={userData.level} />
            </div>
          )}

          {/* ── History Tab ── */}
          {tab === "history" && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Practice History</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Phrases and words you've practiced</p>
                </div>
                <span className="text-sm text-muted-foreground">{history.length} items</span>
              </div>

              {historyLoading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : history.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-7 h-7 text-primary" />
                  </div>
                  <p className="font-medium mb-1">No practice history yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete lessons or practice sessions to see your history here.
                  </p>
                  <Link href="/lessons">
                    <Button size="sm">Start a Lesson</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {item.type === "lesson" ? (
                            <BookOpen className="w-4 h-4 text-primary" />
                          ) : (
                            <Mic className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.phrase}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {item.language} · {item.type}
                          </p>
                        </div>
                      </div>
                      <ScoreBadge score={item.score} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      <Footer />
    </main>
  );
}
