import { useEffect, useState } from "react";
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
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  Shield,
  Users,
  BarChart2,
  Trash2,
  Ban,
  Check,
  RefreshCw,
  Loader2,
  Crown,
  Globe,
  BookOpen,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminTab = "users" | "stats" | "languages" | "lessons";

interface AdminLanguage {
  id: string;
  docId?: string;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
  addedAt?: unknown;
}

interface AdminLesson {
  id: string;
  docId?: string;
  title: string;
  description: string;
  languageId: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  xpReward: number;
  duration: number;
  phrases: { id: string; text: string; translation: string; hint: string }[];
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
  languageId: "",
  difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
  xpReward: 50,
  duration: 5,
};

export default function AdminPage() {
  const { userData } = useAuth();
  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [adminLanguages, setAdminLanguages] = useState<AdminLanguage[]>([]);
  const [adminLessons, setAdminLessons] = useState<AdminLesson[]>([]);
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
    if (isAdmin) loadData();
  }, [isAdmin, tab]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      if (tab === "users" || tab === "stats") {
        const snap = await getDocs(query(collection(db, "users"), orderBy("xp", "desc"), limit(100)));
        setUsers(snap.docs.map((d) => d.data() as UserData));
      }
      if (tab === "languages") {
        const snap = await getDocs(collection(db, "adminLanguages"));
        setAdminLanguages(snap.docs.map((d) => ({ docId: d.id, ...d.data() } as AdminLanguage)));
      }
      if (tab === "lessons") {
        const snap = await getDocs(collection(db, "adminLessons"));
        setAdminLessons(snap.docs.map((d) => ({ docId: d.id, ...d.data() } as AdminLesson)));
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

  // ── Language management ──
  const handleAddLanguage = async () => {
    if (!newLang.name || !newLang.flag || !newLang.speechCode) {
      flash("Fill in all required language fields.");
      return;
    }
    setAddingLang(true);
    try {
      const id = newLang.name.toLowerCase().replace(/\s+/g, "-");
      const docRef = await addDoc(collection(db, "adminLanguages"), {
        ...newLang,
        id,
        addedAt: serverTimestamp(),
      });
      setAdminLanguages((prev) => [...prev, { ...newLang, id, docId: docRef.id }]);
      setNewLang({ name: "", nativeName: "", flag: "", speechCode: "" });
      flash("Language added successfully! Users can now practice this language.");
    } finally {
      setAddingLang(false);
    }
  };

  const handleRemoveAdminLanguage = async (docId: string) => {
    await deleteDoc(doc(db, "adminLanguages", docId));
    setAdminLanguages((prev) => prev.filter((l) => l.docId !== docId));
    flash("Language removed.");
  };

  // ── Lesson management ──
  const handleAddLesson = async () => {
    const validPhrases = newPhrases.filter((p) => p.text.trim() && p.translation.trim());
    if (!newLesson.title || !newLesson.languageId || validPhrases.length < 1) {
      flash("Add a title, select a language, and add at least 1 phrase.");
      return;
    }
    setAddingLesson(true);
    try {
      const lessonId = `admin-${Date.now()}`;
      const docRef = await addDoc(collection(db, "adminLessons"), {
        ...newLesson,
        id: lessonId,
        phrases: validPhrases.map((p, i) => ({ id: String(i + 1), ...p })),
        addedAt: serverTimestamp(),
      });
      setAdminLessons((prev) => [
        ...prev,
        {
          ...newLesson,
          id: lessonId,
          docId: docRef.id,
          phrases: validPhrases.map((p, i) => ({ id: String(i + 1), ...p })),
        },
      ]);
      setNewLesson(EMPTY_LESSON);
      setNewPhrases([{ text: "", translation: "", hint: "" }, { text: "", translation: "", hint: "" }, { text: "", translation: "", hint: "" }]);
      flash("Lesson added successfully! Users can now access this lesson.");
    } finally {
      setAddingLesson(false);
    }
  };

  const handleRemoveLesson = async (docId: string) => {
    await deleteDoc(doc(db, "adminLessons", docId));
    setAdminLessons((prev) => prev.filter((l) => l.docId !== docId));
    flash("Lesson removed.");
  };

  const totalXP = users.reduce((s, u) => s + (u.xp || 0), 0);
  const totalLessons = users.reduce((s, u) => s + (u.totalLessons || 0), 0);

  if (!isAdmin) return null;

  const TABS: { id: AdminTab; label: string; icon: typeof Shield }[] = [
    { id: "users", label: "Users", icon: Users },
    { id: "stats", label: "Stats", icon: BarChart2 },
    { id: "languages", label: "Manage Languages", icon: Globe },
    { id: "lessons", label: "Manage Lessons", icon: BookOpen },
  ];

  // Get available languages for lesson form (admin-added languages)
  const availableLanguages = adminLanguages;

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
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
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
                          {u.isBanned ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Unban
                            </>
                          ) : (
                            <>
                              <Ban className="w-3 h-3 mr-1" />
                              Ban
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && <div className="py-12 text-center text-muted-foreground">No users found.</div>}
                </div>
              )}
            </div>
          )}

          {/* ── Stats Tab ── */}
          {tab === "stats" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass rounded-2xl p-6">
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <p className="text-sm text-muted-foreground mb-1">Total XP Earned</p>
                <p className="text-3xl font-bold text-primary">{totalXP.toLocaleString()}</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <p className="text-sm text-muted-foreground mb-1">Lessons Completed</p>
                <p className="text-3xl font-bold">{totalLessons.toLocaleString()}</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <p className="text-sm text-muted-foreground mb-1">Admins</p>
                <p className="text-3xl font-bold text-yellow-400">{users.filter((u) => u.isAdmin).length}</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <p className="text-sm text-muted-foreground mb-1">Custom Languages</p>
                <p className="text-3xl font-bold text-green-400">{adminLanguages.length}</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <p className="text-sm text-muted-foreground mb-1">Custom Lessons</p>
                <p className="text-3xl font-bold text-blue-400">{adminLessons.length}</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <p className="text-sm text-muted-foreground mb-1">Banned Users</p>
                <p className="text-3xl font-bold text-red-400">{users.filter((u) => u.isBanned).length}</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <p className="text-sm text-muted-foreground mb-1">Active Users</p>
                <p className="text-3xl font-bold text-green-500">{users.filter((u) => !u.isBanned).length}</p>
              </div>
            </div>
          )}

          {/* ── Languages Tab (Admin Management) ── */}
          {tab === "languages" && (
            <div className="space-y-6">
              {/* Admin-added languages list */}
              {adminLanguages.length > 0 && (
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h2 className="font-semibold">Custom Languages ({adminLanguages.length})</h2>
                    <p className="text-xs text-muted-foreground mt-1">These languages are available for users to practice</p>
                  </div>
                  <div className="divide-y divide-border">
                    {adminLanguages.map((lang) => (
                      <div key={lang.docId} className="flex items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{lang.flag}</span>
                          <div>
                            <p className="font-medium">
                              {lang.name} <span className="text-muted-foreground text-sm">({lang.nativeName})</span>
                            </p>
                            <p className="text-xs text-muted-foreground">Speech code: {lang.speechCode}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => handleRemoveAdminLanguage(lang.docId!)} className="h-7 text-xs">
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
                <p className="text-sm text-muted-foreground">
                  Add a new language for users to practice. Use the Web Speech API speech code for pronunciation.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Language Name *</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                      placeholder="e.g. Tagalog"
                      value={newLang.name}
                      onChange={(e) => setNewLang((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Native Name</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                      placeholder="e.g. Tagalog"
                      value={newLang.nativeName}
                      onChange={(e) => setNewLang((p) => ({ ...p, nativeName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Flag Emoji *</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                      placeholder="e.g. flag emoji"
                      value={newLang.flag}
                      onChange={(e) => setNewLang((p) => ({ ...p, flag: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Speech Code *</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                      placeholder="e.g. tl-PH, fil-PH"
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

          {/* ── Lessons Tab (Admin Management) ── */}
          {tab === "lessons" && (
            <div className="space-y-6">
              {/* Admin-added lessons list */}
              {adminLessons.length > 0 && (
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h2 className="font-semibold">Custom Lessons ({adminLessons.length})</h2>
                    <p className="text-xs text-muted-foreground mt-1">These lessons are available for users</p>
                  </div>
                  <div className="divide-y divide-border">
                    {adminLessons.map((lesson) => (
                      <div key={lesson.docId} className="flex items-center justify-between gap-3 p-4">
                        <div>
                          <p className="font-medium">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {lesson.languageId} | {lesson.difficulty} | {lesson.phrases.length} phrases | {lesson.xpReward} XP
                          </p>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => handleRemoveLesson(lesson.docId!)} className="h-7 text-xs">
                          <Trash2 className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add lesson form */}
              <div className="glass rounded-2xl p-6 space-y-5">
                <h2 className="font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" /> Add Custom Lesson
                </h2>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm space-y-2">
                  <p className="font-medium text-blue-400">Important: Phrases must be in the target language!</p>
                  <p className="text-muted-foreground">
                    When adding a lesson for Vietnamese, write the phrases in Vietnamese (e.g., &quot;Xin chao&quot;).
                    When adding a lesson for Tagalog, write phrases in Tagalog (e.g., &quot;Kamusta ka?&quot;).
                    The translation should be the English meaning.
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <strong>Example for Vietnamese:</strong><br />
                    Phrase: &quot;Xin chao&quot; | Translation: &quot;Hello&quot; | Hint: &quot;Stress first syllable&quot;
                  </div>
                </div>

                {availableLanguages.length === 0 ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-400 text-sm">
                    No custom languages available. Please add a language first in the &quot;Manage Languages&quot; tab.
                  </div>
                ) : (
                  <>
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
                        <label className="text-xs text-muted-foreground mb-1 block">Language *</label>
                        <select
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                          value={newLesson.languageId}
                          onChange={(e) => setNewLesson((p) => ({ ...p, languageId: e.target.value }))}
                        >
                          <option value="">Select Language</option>
                          {availableLanguages.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Difficulty</label>
                        <select
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                          value={newLesson.difficulty}
                          onChange={(e) =>
                            setNewLesson((p) => ({ ...p, difficulty: e.target.value as "beginner" | "intermediate" | "advanced" }))
                          }
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

                    {/* Phrases */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground block">Phrases (add at least 1)</label>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">Write phrases in the target language, translations in English</p>
                      </div>
                      {newPhrases.map((phrase, idx) => (
                        <div key={idx} className="grid grid-cols-3 gap-2">
                          <input
                            className="px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                            placeholder="e.g. Xin chao (target lang)"
                            value={phrase.text}
                            onChange={(e) => {
                              const copy = [...newPhrases];
                              copy[idx].text = e.target.value;
                              setNewPhrases(copy);
                            }}
                          />
                          <input
                            className="px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                            placeholder="e.g. Hello (English)"
                            value={phrase.translation}
                            onChange={(e) => {
                              const copy = [...newPhrases];
                              copy[idx].translation = e.target.value;
                              setNewPhrases(copy);
                            }}
                          />
                          <input
                            className="px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                            placeholder="Pronunciation hint"
                            value={phrase.hint}
                            onChange={(e) => {
                              const copy = [...newPhrases];
                              copy[idx].hint = e.target.value;
                              setNewPhrases(copy);
                            }}
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewPhrases((p) => [...p, { text: "", translation: "", hint: "" }])}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Phrase Row
                      </Button>
                    </div>

                    <Button onClick={handleAddLesson} disabled={addingLesson} className="gap-2">
                      {addingLesson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add Lesson
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
