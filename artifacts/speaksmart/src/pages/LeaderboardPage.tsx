import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Trophy, Medal, Flame, Zap, Crown, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  xp: number;
  level: number;
  streak: number;
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
    case 2: return <Medal className="w-6 h-6 text-gray-400" />;
    case 3: return <Medal className="w-6 h-6 text-amber-500" />;
    default: return (
      <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground text-sm">
        {rank}
      </span>
    );
  }
}

function getRankBg(rank: number) {
  switch (rank) {
    case 1: return "bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent border-yellow-500/30";
    case 2: return "bg-gradient-to-r from-gray-400/20 via-gray-400/5 to-transparent border-gray-400/30";
    case 3: return "bg-gradient-to-r from-amber-600/20 via-amber-600/5 to-transparent border-amber-600/30";
    default: return "bg-card/50 border-border";
  }
}

export default function LeaderboardPage() {
  const { userData, user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "leaderboard"),
      orderBy("xp", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data: LeaderboardEntry[] = snap.docs.map((d) => ({
        uid: d.id,
        displayName: d.data().displayName || "Anonymous",
        photoURL: d.data().photoURL || null,
        xp: d.data().xp || 0,
        level: d.data().level || 1,
        streak: d.data().streak || 0,
      }));
      setEntries(data);
      if (user) {
        const rank = data.findIndex((e) => e.uid === user.uid);
        setUserRank(rank >= 0 ? rank + 1 : null);
      }
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const top10 = entries.slice(0, 10);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 glow">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Leaderboard</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Compete with learners worldwide. Earn XP by completing lessons and practicing!
            </p>
          </div>

          {/* Your Position */}
          {userData && (
            <div className="glass rounded-2xl p-6 mb-8 border border-primary/30">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {userData.photoURL ? (
                      <img src={userData.photoURL} alt={userData.displayName || "You"} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        {userData.displayName?.charAt(0).toUpperCase() || "Y"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">Your Position</p>
                    <p className="text-sm text-muted-foreground">{userData.displayName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {userRank && (
                    <div className="text-right">
                      <p className="text-2xl font-bold">#{userRank}</p>
                      <p className="text-sm text-muted-foreground">Global Rank</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{userData.xp.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total XP</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">Lv. {userData.level}</p>
                    <p className="text-sm text-muted-foreground">{userData.streak}d streak</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rankings */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Global Rankings — Top 10</h2>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              {!loading && entries.length === 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Complete a lesson to appear here!
                </span>
              )}
            </div>

            <div className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-secondary" />
                    <div className="w-10 h-10 rounded-full bg-secondary" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-secondary rounded mb-2" />
                      <div className="h-3 w-20 bg-secondary rounded" />
                    </div>
                    <div className="h-6 w-20 bg-secondary rounded" />
                  </div>
                ))
              ) : top10.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No entries yet</p>
                  <p className="text-sm mt-1">Complete your first lesson to get on the board!</p>
                </div>
              ) : (
                top10.map((entry, idx) => {
                  const rank = idx + 1;
                  const isMe = user?.uid === entry.uid;
                  return (
                    <div
                      key={entry.uid}
                      className={`flex items-center justify-between p-4 border-l-4 transition-colors hover:bg-secondary/30 ${
                        isMe ? "bg-primary/5 border-primary/50" : getRankBg(rank)
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 flex justify-center">{getRankIcon(rank)}</div>
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                          {entry.photoURL ? (
                            <img src={entry.photoURL} alt={entry.displayName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-primary">
                              {entry.displayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {entry.displayName}
                            {isMe && <span className="ml-2 text-xs text-primary font-semibold">(You)</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">Level {entry.level}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="hidden sm:flex items-center gap-1 text-orange-400">
                          <Flame className="w-4 h-4" />
                          <span className="text-sm font-medium">{entry.streak}</span>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <Zap className="w-5 h-5" />
                          <span className="font-bold">{entry.xp.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Hint */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {userData
                ? "Complete lessons and practice sessions to climb the ranks!"
                : "Sign in and start practicing to appear on the leaderboard!"}
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
