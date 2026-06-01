import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  collection,
  query,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  limit,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, UserData } from "@/lib/auth-context";
import { languages as staticLanguages } from "@/lib/languages";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  Shield,
  Users,
  Trophy,
  BarChart2,
  Trash2,
  Ban,
  Check,
  RefreshCw,
  Loader2,
  ChevronUp,
  Crown,
  Globe,
  BookOpen,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminTab = "users" | "leaderboard" | "stats" | "languages" | "lessons";

interface LeaderboardEntry {
  uid: string;
  displayName: string;
  xp: number;
  level: number;
  streak: number;
  updatedAt?: unknown;
}

interface AdminLanguage {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
  addedAt?: unknown;
}

interface NewPhraseRow {
  text: string;
  translation: string;
  hint: string;
}

const EMPTY_LESSON = {
  title: "",
  description: "",
  languageId: "english",
  difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
  xpReward: 50,
  duration: 5,
};

export default function AdminPage() {
  const { userData, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [lbEntries, setLbEntries] = useState<LeaderboardEntry[]>([]);
  const [adminLanguages, setAdminLanguages] = useState<AdminLanguage[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  // Add Language form
  const [newLang, setNewLang] = useState({ name: "", nativeName: "", flag: "", speechCode: "" });
  const [addingLang, setAddingLang] = useState(false);

  // Add Lesson form
  const [newLesson, setNewLesson] = useState(EMPTY_LESSON);
  const [newPhrases, setNewPhrases] = useState<NewPhraseRow[]>([
    { text: "", translation: "", hint: "" },
    { text: "", translation: "", hint: "" },
    { text: "", translation: "", hint: "" },
  ]);
  const [addingLesson, setAddingLesson] = useState(false);

  const isAdmin = userData?.isAdmin === true;

  useEffect(() => {
    if (!loading && !isAdmin) setLocation("/");
  }, [loading, isAdmin, setLocation]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, tab]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      if (tab === "users" || tab === "stats") {
        const snap = await getDocs(query(collection(db, "users"), orderBy("xp", "desc"), limit(100)));
        setUsers(snap.docs.map((d) => d.data() as UserData));
      }
      if (tab === "leaderboard") {
        const snap = await getDocs(query(collection(db, "leaderboard"), orderBy("xp", "desc"), limit(50)));
        setLbEntries(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as LeaderboardEntry)));
      }
      if (tab === "languages") {
        const snap = await getDocs(collection(db, "adminLanguages"));
        setAdminLanguages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminLanguage)));
      }
    } finally {
      setDataLoading(false);
    }
  };

  const flash = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 3000);
  };

  const toggleBan = async (uid: string, isBanned: boolean) => {
    await updateDoc(doc(db, "users", uid), { isBanned: !isBanned });
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, isBanned: !isBanned } : u)));
    flash(isBanned ? "User unbanned." : "User banned.");
  };

  const toggleAdmin = async (uid: string, isAdminNow: boolean) => {
    await updateDoc(doc(db, "users", uid), { isAdmin: !isAdminNow });
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, isAdmin: !isAdminNow } : u)));
    flash(isAdminNow ? "Admin removed." : "Admin granted.");
  };

  const deleteLbEntry = async (uid: string) => {
    await deleteDoc(doc(db, "leaderboard", uid));
    setLbEntries((prev) => prev.filter((e) => e.uid !== uid));
    flash("Entry removed from leaderboard.");
  };

  const handleAddLanguage = async () => {
    if (!newLang.name || !newLang.flag || !newLang.speechCode) {
      flash("Fill in all required language fields.");
      return;
    }
    setAddingLang(true);
    try {
      const id = newLang.name.toLowerCase().replace(/\s+/g, "-");
      await addDoc(collection(db, "adminLanguages"), {
        ...newLang,
        id,
        addedAt: serverTimestamp(),
      });
      setAdminLanguages((prev) => [...prev, { ...newLang, id }]);
      setNewLang({ name: "", nativeName: "", flag: "", speechCode: "" });
      flash("Language added successfully!");
    } finally {
      setAddingLang(false);
    }
  };

  const handleRemoveAdminLanguage = async (docId: string) => {
    await deleteDoc(doc(db, "adminLanguages", docId));
    setAdminLanguages((prev) => prev.filter((l) => l.id !== docId));
    flash("Language removed.");
  };

  const handleAddLesson = async () => {
    const validPhrases = newPhrases.filter((p) => p.text.trim() && p.translation.trim());
    if (!newLesson.title || validPhrases.length < 1) {
      flash("Add a title and at least 1 phrase.");
      return;
    }
    setAddingLesson(true);
    try {
      await addDoc(collection(db, "adminLessons"), {
        ...newLesson,
        phrases: validPhrases.map((p, i) => ({ id: String(i + 1), ...p })),
        addedAt: serverTimestamp(),
      });
      setNewLesson(EMPTY_LESSON);
      setNewPhrases([{ text: "", translation: "", hint: "" }, { text: "", translation: "", hint: "" }, { text: "", translation: "", hint: "" }]);
      flash("Lesson added successfully!");
    } finally {
      setAddingLesson(false);
    }
  };

  const totalXP = users.reduce((s, u) => s + (u.xp || 0), 0);
  const totalLessons = users.reduce((s, u) => s + (u.totalLessons || 0), 0);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!isAdmin) return null;

  const TABS: { id: AdminTab; label: string; icon: typeof Shield }[] = [
    { id: "users",     label: "Users",     icon: Users },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "languages", label: "Languages", icon: Globe },
    { id: "lessons",   label: "Lessons",   icon: BookOpen },
    { id: "stats",     label: "Stats",     icon: BarChart2 },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center glow-sm">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Admin Panel</h1>
              <p className="text-muted-foreground text-sm">Manage SPEAKSMART system</p>
            </div>
          </div>

          {/* Action message */}
          {actionMsg && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" /> {actionMsg}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                  tab === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
            <button
              onClick={loadData}
              className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground bg-secondary transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* ── Users Tab ── */}
          {tab === "users" && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold">All Users ({users.length})</h2>
              </div>
              {dataLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <div className="divide-y divide-border">
                  {users.map((u) => (
                    <div key={u.uid} className={`flex items-center justify-between p-4 gap-4 flex-wrap ${u.isBanned ? "opacity-50" : ""}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-primary">{(u.displayName || "?").charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate flex items-center gap-1">
                            {u.displayName || "Unnamed"}
                            {u.isAdmin && <Crown className="w-3 h-3 text-yellow-400" />}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Lv.{u.level}</span>
                        <span className="text-primary font-semibold">{(u.xp || 0).toLocaleString()} XP</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleAdmin(u.uid, !!u.isAdmin)} className="h-7 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          {u.isAdmin ? "Remove Admin" : "Make Admin"}
                        </Button>
                        <Button size="sm" variant={u.isBanned ? "default" : "destructive"} onClick={() => toggleBan(u.uid, !!u.isBanned)} className="h-7 text-xs">
                          {u.isBanned ? <><Check className="w-3 h-3 mr-1" />Unban</> : <><Ban className="w-3 h-3 mr-1" />Ban</>}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && <div className="py-12 text-center text-muted-foreground">No users found.</div>}
                </div>
              )}
            </div>
          )}

          {/* ── Leaderboard Tab ── */}
          {tab === "leaderboard" && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold">Leaderboard Entries ({lbEntries.length})</h2>
              </div>
              {dataLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <div className="divide-y divide-border">
                  {lbEntries.map((e, i) => (
                    <div key={e.uid} className="flex items-center justify-between p-4 gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-muted-foreground text-sm text-center">{i + 1}</span>
                        <div>
                          <p className="font-medium">{e.displayName}</p>
                          <p className="text-xs text-muted-foreground">Lv.{e.level} · {e.streak}d streak</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-bold">{e.xp.toLocaleString()} XP</span>
                        <Button size="sm" variant="destructive" onClick={() => deleteLbEntry(e.uid)} className="h-7 text-xs">
                          <Trash2 className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  {lbEntries.length === 0 && <div className="py-12 text-center text-muted-foreground">No leaderboard entries yet.</div>}
                </div>
              )}
            </div>
          )}

          {/* ── Languages Tab ── */}
          {tab === "languages" && (
            <div className="space-y-6">
              {/* Built-in languages */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold">Built-in Languages ({staticLanguages.length})</h2>
                </div>
                <div className="divide-y divide-border">
                  {staticLanguages.map((lang) => (
                    <div key={lang.id} className="flex items-center gap-3 p-4">
                      <span className="text-2xl">{lang.flag}</span>
                      <div>
                        <p className="font-medium">{lang.name} <span className="text-muted-foreground text-sm">({lang.nativeName})</span></p>
                        <p className="text-xs text-muted-foreground">{lang.accents.length} accent{lang.accents.length !== 1 ? "s" : ""} · {lang.speechCode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin-added languages */}
              {adminLanguages.length > 0 && (
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h2 className="font-semibold">Admin-Added Languages ({adminLanguages.length})</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {adminLanguages.map((lang) => (
                      <div key={lang.id} className="flex items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{lang.flag}</span>
                          <div>
                            <p className="font-medium">{lang.name} <span className="text-muted-foreground text-sm">({lang.nativeName})</span></p>
                            <p className="text-xs text-muted-foreground">{lang.speechCode}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => handleRemoveAdminLanguage(lang.id)} className="h-7 text-xs">
                          <X className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add language form */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" /> Add New Language
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Language Name *</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                      placeholder="e.g. Swahili"
                      value={newLang.name}
                      onChange={(e) => setNewLang((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Native Name</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                      placeholder="e.g. Kiswahili"
                      value={newLang.nativeName}
                      onChange={(e) => setNewLang((p) => ({ ...p, nativeName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Flag Emoji *</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                      placeholder="e.g. 🇰🇪"
                      value={newLang.flag}
                      onChange={(e) => setNewLang((p) => ({ ...p, flag: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Speech Code *</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                      placeholder="e.g. sw-KE"
                      value={newLang.speechCode}
                      onChange={(e) => setNewLang((p) => ({ ...p, speechCode: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleAddLanguage} disabled={addingLang} className="gap-2">
                  {addingLang ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Language
                </Button>
              </div>
            </div>
          )}

          {/* ── Lessons Tab ── */}
          {tab === "lessons" && (
            <div className="glass rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Add Custom Lesson
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Lesson Title *</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                    placeholder="e.g. Everyday Greetings"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                    placeholder="Short description of the lesson"
                    value={newLesson.description}
                    onChange={(e) => setNewLesson((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Language</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                    value={newLesson.languageId}
                    onChange={(e) => setNewLesson((p) => ({ ...p, languageId: e.target.value }))}
                  >
                    {staticLanguages.map((l) => (
                      <option key={l.id} value={l.id}>{l.flag} {l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Difficulty</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                    value={newLesson.difficulty}
                    onChange={(e) => setNewLesson((p) => ({ ...p, difficulty: e.target.value as "beginner" | "intermediate" | "advanced" }))}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">XP Reward</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                    value={newLesson.xpReward}
                    onChange={(e) => setNewLesson((p) => ({ ...p, xpReward: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Duration (min)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                    value={newLesson.duration}
                    onChange={(e) => setNewLesson((p) => ({ ...p, duration: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground">Phrases (at least 1 required)</label>
                  <button
                    onClick={() => setNewPhrases((p) => [...p, { text: "", translation: "", hint: "" }])}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add phrase
                  </button>
                </div>
                <div className="space-y-2">
                  {newPhrases.map((phrase, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 items-center">
                      <input
                        className="px-2.5 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                        placeholder={`Phrase ${idx + 1}`}
                        value={phrase.text}
                        onChange={(e) => setNewPhrases((p) => p.map((r, i) => i === idx ? { ...r, text: e.target.value } : r))}
                      />
                      <input
                        className="px-2.5 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                        placeholder="Translation"
                        value={phrase.translation}
                        onChange={(e) => setNewPhrases((p) => p.map((r, i) => i === idx ? { ...r, translation: e.target.value } : r))}
                      />
                      <div className="flex gap-1">
                        <input
                          className="flex-1 px-2.5 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                          placeholder="Hint (optional)"
                          value={phrase.hint}
                          onChange={(e) => setNewPhrases((p) => p.map((r, i) => i === idx ? { ...r, hint: e.target.value } : r))}
                        />
                        {newPhrases.length > 1 && (
                          <button
                            onClick={() => setNewPhrases((p) => p.filter((_, i) => i !== idx))}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleAddLesson} disabled={addingLesson} className="gap-2">
                {addingLesson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Lesson
              </Button>
            </div>
          )}

          {/* ── Stats Tab ── */}
          {tab === "stats" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Users", value: users.length, icon: Users },
                { label: "Total XP Earned", value: totalXP.toLocaleString(), icon: Trophy },
                { label: "Lessons Completed", value: totalLessons, icon: BarChart2 },
                { label: "Admin Accounts", value: users.filter((u) => u.isAdmin).length, icon: Shield },
                { label: "Banned Users", value: users.filter((u) => u.isBanned).length, icon: Ban },
                {
                  label: "Avg XP / User",
                  value: users.length ? Math.round(totalXP / users.length).toLocaleString() : 0,
                  icon: ChevronUp,
                },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-2xl p-5 text-center">
                  <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {dataLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
      <Footer />
    </main>
  );
}
