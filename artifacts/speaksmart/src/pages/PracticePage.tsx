import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getLanguageById, Language, Accent } from "@/lib/languages";
import { PracticeArea } from "@/components/practice/practice-area";
import { AccentSelector } from "@/components/practice/accent-selector";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLanguage {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
}

export default function PracticePage() {
  const params = useParams<{ language: string }>();
  const languageId = params.language;

  const [language, setLanguage] = useState<Language | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAccent, setSelectedAccent] = useState("");

  useEffect(() => {
    const fetchLanguage = async () => {
      // First try to get from static languages
      const staticLang = getLanguageById(languageId);
      if (staticLang) {
        setLanguage(staticLang);
        setSelectedAccent(staticLang.accents[0]?.id || "");
        setLoading(false);
        return;
      }

      // If not found, try to fetch from admin languages
      try {
        const snap = await getDocs(collection(db, "adminLanguages"));
        const adminLang = snap.docs.find((d) => d.data().id === languageId);
        if (adminLang) {
          const data = adminLang.data() as AdminLanguage;
          const convertedLang: Language = {
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
          };
          setLanguage(convertedLang);
          setSelectedAccent(convertedLang.accents[0]?.id || "");
        }
      } catch (error) {
        console.error("Error fetching admin language:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguage();
  }, [languageId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!language) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Language not found</h1>
          <Link href="/languages">
            <Button>Back to Languages</Button>
          </Link>
        </div>
      </main>
    );
  }

  const currentAccent = language.accents.find((a) => a.id === selectedAccent) || language.accents[0];

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/languages" className="inline-block mb-6">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Languages
            </Button>
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-5xl">{language.flag}</span>
              <div>
                <h1 className="text-3xl font-bold">{language.name} Practice</h1>
                <p className="text-muted-foreground">{language.nativeName}</p>
              </div>
            </div>
          </div>

          <AccentSelector
            accents={language.accents}
            selectedAccent={selectedAccent}
            onSelectAccent={setSelectedAccent}
          />

          <PracticeArea language={language} accent={currentAccent} />
        </div>
      </div>
      <Footer />
    </main>
  );
}
