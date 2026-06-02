import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getLessonById, Lesson } from "@/lib/lessons";
import { getLanguageById, Language, Accent } from "@/lib/languages";
import { LessonPractice } from "@/components/lessons/lesson-practice";
import { LessonComplete } from "@/components/lessons/lesson-complete";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Zap, BookOpen, Loader2 } from "lucide-react";

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

export default function LessonDetailPage() {
  const params = useParams<{ lessonId: string }>();
  const [, setLocation] = useLocation();
  const lessonId = params.lessonId;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [loading, setLoading] = useState(true);

  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [scores, setScores] = useState<number[]>([]);

  useEffect(() => {
    const fetchLesson = async () => {
      // First try to get from static lessons
      const staticLesson = getLessonById(lessonId);
      if (staticLesson) {
        setLesson(staticLesson);
        const staticLang = getLanguageById(staticLesson.languageId);
        setLanguage(staticLang || null);
        setLoading(false);
        return;
      }

      // If not found, try to fetch from admin lessons
      try {
        const lessonSnap = await getDocs(collection(db, "adminLessons"));
        const adminLesson = lessonSnap.docs.find((d) => d.data().id === lessonId);

        if (adminLesson) {
          const data = adminLesson.data() as AdminLesson;
          const convertedLesson: Lesson = {
            id: data.id,
            title: data.title,
            description: data.description || "",
            languageId: data.languageId,
            difficulty: data.difficulty || "beginner",
            xpReward: data.xpReward || 50,
            duration: data.duration || 5,
            phrases: data.phrases || [],
          };
          setLesson(convertedLesson);

          // Try to find the language
          let foundLang = getLanguageById(data.languageId);
          if (!foundLang) {
            // Look in admin languages
            const langSnap = await getDocs(collection(db, "adminLanguages"));
            const adminLang = langSnap.docs.find((d) => d.data().id === data.languageId);
            if (adminLang) {
              const langData = adminLang.data() as AdminLanguage;
              foundLang = {
                id: langData.id,
                name: langData.name,
                nativeName: langData.nativeName || langData.name,
                flag: langData.flag,
                speechCode: langData.speechCode,
                accents: [
                  {
                    id: langData.speechCode,
                    name: "Standard",
                    region: langData.name,
                    speechCode: langData.speechCode,
                  },
                ] as Accent[],
              };
            }
          }
          setLanguage(foundLang || null);
        }
      } catch (error) {
        console.error("Error fetching admin lesson:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  const handleComplete = (finalScores: number[]) => {
    setScores(finalScores);
    setCompleted(true);
  };

  const handleRestart = () => {
    setStarted(false);
    setCompleted(false);
    setScores([]);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!lesson) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lesson not found</h1>
          <Link href="/lessons">
            <Button>Back to Lessons</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (completed) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <LessonComplete
          lesson={lesson}
          scores={scores}
          onRestart={handleRestart}
          onContinue={() => setLocation("/lessons")}
        />
        <Footer />
      </main>
    );
  }

  if (started && language) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <LessonPractice lesson={lesson} language={language} onComplete={handleComplete} />
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/lessons" className="inline-block mb-6">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lessons
            </Button>
          </Link>

          <div className="glass rounded-3xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-5xl">{language?.flag || "📚"}</span>
              <div>
                <span className="text-sm text-primary font-medium">{language?.name || lesson.languageId}</span>
                <h1 className="text-3xl font-bold">{lesson.title}</h1>
              </div>
            </div>

            <p className="text-lg text-muted-foreground mb-8">{lesson.description}</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="glass rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold">{lesson.duration}</p>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <BookOpen className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold">{lesson.phrases.length}</p>
                <p className="text-sm text-muted-foreground">Phrases</p>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">{lesson.xpReward}</p>
                <p className="text-sm text-muted-foreground">XP Reward</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold mb-4">What You Will Learn</h3>
              <div className="space-y-2">
                {lesson.phrases.slice(0, 3).map((phrase, index) => (
                  <div key={phrase.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{phrase.text}</p>
                      <p className="text-sm text-muted-foreground">{phrase.translation}</p>
                    </div>
                  </div>
                ))}
                {lesson.phrases.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    And {lesson.phrases.length - 3} more phrases...
                  </p>
                )}
              </div>
            </div>

            <Button size="lg" className="w-full glow py-6 text-lg" onClick={() => setStarted(true)} disabled={!language}>
              {language ? "Start Lesson" : "Language not available"}
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
