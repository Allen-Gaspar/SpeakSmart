import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getAllLessons, type Lesson } from "@/lib/lessons";
import { getLanguageById, languages as staticLanguages, Language, Accent } from "@/lib/languages";
import { Link } from "wouter";
import { Clock, Zap, ArrowRight, BookOpen, Loader2 } from "lucide-react";

interface AdminLanguage {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
}

interface AdminLesson {
  id: string;
  title: string;
  description: string;
  languageId: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  xpReward: number;
  duration: number;
  phrases: { id: string; text: string; translation: string; hint: string }[];
}

function getDifficultyColor(difficulty: Lesson["difficulty"]): string {
  switch (difficulty) {
    case "beginner":
      return "bg-green-500/10 text-green-500";
    case "intermediate":
      return "bg-yellow-500/10 text-yellow-500";
    case "advanced":
      return "bg-red-500/10 text-red-500";
  }
}

export default function LessonsPage() {
  const [adminLanguages, setAdminLanguages] = useState<Language[]>([]);
  const [adminLessons, setAdminLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch admin languages
        const langSnap = await getDocs(collection(db, "adminLanguages"));
        const langs = langSnap.docs.map((d) => {
          const data = d.data() as AdminLanguage;
          return {
            id: data.id,
            name: data.name,
            nativeName: data.nativeName || data.name,
            flag: data.flag,
            speechCode: data.speechCode,
            accents: [
              {
                id: data.speechCode,
                name: "Standard",
                region: data.name,
                speechCode: data.speechCode,
              },
            ] as Accent[],
          } as Language;
        });
        setAdminLanguages(langs);

        // Fetch admin lessons
        const lessonSnap = await getDocs(collection(db, "adminLessons"));
        const lessons = lessonSnap.docs.map((d) => {
          const data = d.data() as AdminLesson;
          return {
            id: data.id,
            title: data.title,
            description: data.description || "",
            languageId: data.languageId,
            difficulty: data.difficulty || "beginner",
            xpReward: data.xpReward || 50,
            duration: data.duration || 5,
            phrases: data.phrases || [],
          } as Lesson;
        });
        setAdminLessons(lessons);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Combine static and admin lessons
  const staticLessons = getAllLessons();
  const allLessons = [...staticLessons, ...adminLessons];
  const allLanguages = [...staticLanguages, ...adminLanguages];

  // Helper to get language by ID from combined list
  const getLanguage = (languageId: string): Language | undefined => {
    return getLanguageById(languageId) || allLanguages.find((l) => l.id === languageId);
  };

  const lessonsByLanguage = allLessons.reduce((acc, lesson) => {
    if (!acc[lesson.languageId]) {
      acc[lesson.languageId] = [];
    }
    acc[lesson.languageId].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              <span className="text-balance">Structured </span>
              <span className="gradient-text">Lessons</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Follow our curated lessons to build your language skills step by step.
              Each lesson includes guided phrases with pronunciation practice.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(lessonsByLanguage).map(([languageId, languageLessons]) => {
                const language = getLanguage(languageId);
                if (!language) return null;

                return (
                  <div key={languageId}>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-3xl">{language.flag}</span>
                      <h2 className="text-2xl font-bold">{language.name}</h2>
                      <span className="text-sm text-muted-foreground">({languageLessons.length} lessons)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {languageLessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          href={`/lessons/${lesson.id}`}
                          className="glass rounded-2xl p-6 hover:bg-card/90 transition-all duration-300 group"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-lg ${getDifficultyColor(lesson.difficulty)}`}>
                              {lesson.difficulty}
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                            {lesson.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {lesson.description}
                          </p>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {lesson.duration} min
                              </span>
                              <span className="flex items-center gap-1 text-primary">
                                <Zap className="w-4 h-4" />
                                {lesson.xpReward} XP
                              </span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
