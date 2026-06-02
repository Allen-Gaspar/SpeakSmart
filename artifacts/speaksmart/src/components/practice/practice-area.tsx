import { useState, useRef, useEffect, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Language, Accent } from "@/lib/languages";
import {
  useSpeechRecognition,
  useTextToSpeech,
  calculatePronunciationScore,
} from "@/hooks/use-speech";
import { Button } from "@/components/ui/button";
import {
  Mic, MicOff, Volume2, RotateCcw, CheckCircle, XCircle,
  AlertCircle, RefreshCw, ChevronRight, PenLine, BookOpen,
  Clock, Star,
} from "lucide-react";
import { PronunciationScore } from "./pronunciation-score";

interface PracticeAreaProps {
  language: Language;
  accent: Accent;
}

interface Phrase {
  native: string;
  romanization?: string;
  translation: string;
}

type Score = { accuracy: number; fluency: number; completeness: number; overall: number };
type Mode = "bank" | "custom";

// ── Local-storage history ─────────────────────────────────────────────────────
const HISTORY_KEY = "speaksmart_custom_history";
const MAX_HISTORY = 10;

interface HistoryEntry {
  phrase: string;
  bestScore: number;
  lastPracticed: number; // epoch ms
}

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

function addToHistory(entries: HistoryEntry[], phrase: string, score: number): HistoryEntry[] {
  const idx = entries.findIndex((e) => e.phrase.toLowerCase() === phrase.toLowerCase());
  if (idx !== -1) {
    // Update existing entry — keep best score
    const updated = [...entries];
    updated[idx] = {
      phrase,
      bestScore: Math.max(updated[idx].bestScore, score),
      lastPracticed: Date.now(),
    };
    // Move to front
    const [entry] = updated.splice(idx, 1);
    return [entry, ...updated];
  }
  return [{ phrase, bestScore: score, lastPracticed: Date.now() }, ...entries].slice(0, MAX_HISTORY);
}

// ── Phrase bank (15 per language) ─────────────────────────────────────────────
const phraseBank: Record<string, Phrase[]> = {
  english: [
    { native: "Hello, how are you today?", translation: "General greeting" },
    { native: "The weather is beautiful.", translation: "Nice weather" },
    { native: "I would like to order some coffee.", translation: "Ordering coffee" },
    { native: "Thank you very much for your help.", translation: "Expressing gratitude" },
    { native: "Where is the nearest train station?", translation: "Asking directions" },
    { native: "Have a wonderful day!", translation: "Farewell" },
    { native: "Nice to meet you.", translation: "Introduction" },
    { native: "Can you help me, please?", translation: "Asking for help" },
    { native: "How much does this cost?", translation: "Asking price" },
    { native: "I don't understand.", translation: "Expressing confusion" },
    { native: "Could you repeat that, please?", translation: "Asking to repeat" },
    { native: "I live in a big city.", translation: "Describing where you live" },
    { native: "What time is it?", translation: "Asking the time" },
    { native: "I am learning English.", translation: "Talking about learning" },
    { native: "See you tomorrow!", translation: "Parting phrase" },
  ],
  spanish: [
    { native: "Hola, ¿cómo estás hoy?", translation: "Hello, how are you today?" },
    { native: "El tiempo es hermoso.", translation: "The weather is beautiful." },
    { native: "Me gustaría pedir un café.", translation: "I would like to order a coffee." },
    { native: "Muchas gracias por tu ayuda.", translation: "Thank you very much." },
    { native: "¿Dónde está la estación de tren?", translation: "Where is the train station?" },
    { native: "Por favor, ¿puedes ayudarme?", translation: "Can you help me?" },
    { native: "Buenos días, ¿cómo te llamas?", translation: "Good morning, what is your name?" },
    { native: "No entiendo.", translation: "I don't understand." },
    { native: "¿Cuánto cuesta esto?", translation: "How much does this cost?" },
    { native: "Hasta luego.", translation: "See you later." },
    { native: "Me llamo Carlos.", translation: "My name is Carlos." },
    { native: "Estoy aprendiendo español.", translation: "I am learning Spanish." },
    { native: "¿Qué hora es?", translation: "What time is it?" },
    { native: "Mucho gusto.", translation: "Nice to meet you." },
    { native: "¿De dónde eres?", translation: "Where are you from?" },
  ],
  french: [
    { native: "Bonjour, comment allez-vous?", translation: "Hello, how are you? (formal)" },
    { native: "Le temps est magnifique.", translation: "The weather is magnificent." },
    { native: "Je voudrais commander un café.", translation: "I would like to order a coffee." },
    { native: "Merci beaucoup pour votre aide.", translation: "Thank you very much." },
    { native: "Où est la gare la plus proche?", translation: "Where is the nearest train station?" },
    { native: "S'il vous plaît, pouvez-vous m'aider?", translation: "Please, can you help me?" },
    { native: "Je ne comprends pas.", translation: "I don't understand." },
    { native: "Combien ça coûte?", translation: "How much does it cost?" },
    { native: "Au revoir.", translation: "Goodbye." },
    { native: "Je m'appelle Marie.", translation: "My name is Marie." },
    { native: "J'apprends le français.", translation: "I am learning French." },
    { native: "Quelle heure est-il?", translation: "What time is it?" },
    { native: "Enchanté de vous rencontrer.", translation: "Nice to meet you." },
    { native: "Bonne journée!", translation: "Have a nice day!" },
    { native: "D'où venez-vous?", translation: "Where are you from?" },
  ],
  german: [
    { native: "Hallo, wie geht es Ihnen?", translation: "Hello, how are you? (formal)" },
    { native: "Das Wetter ist schön.", translation: "The weather is nice." },
    { native: "Ich möchte einen Kaffee bestellen.", translation: "I would like to order a coffee." },
    { native: "Vielen Dank für Ihre Hilfe.", translation: "Thank you very much." },
    { native: "Wo ist der nächste Bahnhof?", translation: "Where is the nearest train station?" },
    { native: "Können Sie mir bitte helfen?", translation: "Can you please help me?" },
    { native: "Ich verstehe nicht.", translation: "I don't understand." },
    { native: "Was kostet das?", translation: "What does this cost?" },
    { native: "Auf Wiedersehen.", translation: "Goodbye." },
    { native: "Ich heiße Thomas.", translation: "My name is Thomas." },
    { native: "Ich lerne Deutsch.", translation: "I am learning German." },
    { native: "Wie spät ist es?", translation: "What time is it?" },
    { native: "Freut mich, Sie kennenzulernen.", translation: "Nice to meet you." },
    { native: "Einen schönen Tag noch!", translation: "Have a nice day!" },
    { native: "Woher kommen Sie?", translation: "Where are you from?" },
  ],
  japanese: [
    { native: "こんにちは、お元気ですか？", romanization: "Konnichiwa, ogenki desu ka?", translation: "Hello, how are you?" },
    { native: "天気がいいですね。", romanization: "Tenki ga ii desu ne.", translation: "The weather is nice." },
    { native: "コーヒーを注文したいです。", romanization: "Kōhī wo chūmon shitai desu.", translation: "I would like to order coffee." },
    { native: "ありがとうございます。", romanization: "Arigatō gozaimasu.", translation: "Thank you very much." },
    { native: "一番近い駅はどこですか？", romanization: "Ichiban chikai eki wa doko desu ka?", translation: "Where is the nearest station?" },
    { native: "手伝ってください。", romanization: "Tetsudatte kudasai.", translation: "Please help me." },
    { native: "わかりません。", romanization: "Wakarimasen.", translation: "I don't understand." },
    { native: "いくらですか？", romanization: "Ikura desu ka?", translation: "How much is it?" },
    { native: "さようなら。", romanization: "Sayōnara.", translation: "Goodbye." },
    { native: "おはようございます。", romanization: "Ohayō gozaimasu.", translation: "Good morning." },
    { native: "日本語を勉強しています。", romanization: "Nihongo wo benkyō shite imasu.", translation: "I am studying Japanese." },
    { native: "何時ですか？", romanization: "Nanji desu ka?", translation: "What time is it?" },
    { native: "よろしくお願いします。", romanization: "Yoroshiku onegaishimasu.", translation: "Nice to meet you / Please treat me well." },
    { native: "もう一度おねがいします。", romanization: "Mō ichido onegaishimasu.", translation: "Please say it again." },
    { native: "おいしいです！", romanization: "Oishii desu!", translation: "It's delicious!" },
  ],
  chinese: [
    { native: "你好，今天怎么样？", romanization: "Nǐ hǎo, jīntiān zěnmeyàng?", translation: "Hello, how is today?" },
    { native: "天气很好。", romanization: "Tiānqì hěn hǎo.", translation: "The weather is very nice." },
    { native: "我想点一杯咖啡。", romanization: "Wǒ xiǎng diǎn yī bēi kāfēi.", translation: "I want to order a coffee." },
    { native: "非常感谢你的帮助。", romanization: "Fēicháng gǎnxiè nǐ de bāngzhù.", translation: "Thank you very much." },
    { native: "最近的火车站在哪里？", romanization: "Zuìjìn de huǒchē zhàn zài nǎlǐ?", translation: "Where is the nearest train station?" },
    { native: "请帮帮我。", romanization: "Qǐng bāng bāng wǒ.", translation: "Please help me." },
    { native: "我听不懂。", romanization: "Wǒ tīng bù dǒng.", translation: "I don't understand." },
    { native: "这个多少钱？", romanization: "Zhège duōshao qián?", translation: "How much is this?" },
    { native: "再见。", romanization: "Zàijiàn.", translation: "Goodbye." },
    { native: "早上好。", romanization: "Zǎoshang hǎo.", translation: "Good morning." },
    { native: "我在学中文。", romanization: "Wǒ zài xué Zhōngwén.", translation: "I am learning Chinese." },
    { native: "现在几点了？", romanization: "Xiànzài jǐ diǎn le?", translation: "What time is it now?" },
    { native: "很高兴认识你。", romanization: "Hěn gāoxìng rènshi nǐ.", translation: "Nice to meet you." },
    { native: "请再说一遍。", romanization: "Qǐng zài shuō yībiàn.", translation: "Please say it again." },
    { native: "好吃！", romanization: "Hǎo chī!", translation: "Delicious!" },
  ],
  korean: [
    { native: "안녕하세요, 오늘 어떠세요?", romanization: "Annyeonghaseyo, oneul eotteo-seyo?", translation: "Hello, how are you today?" },
    { native: "날씨가 좋네요.", romanization: "Nalssiga joh-neyo.", translation: "The weather is nice." },
    { native: "커피 한 잔 주문하고 싶어요.", romanization: "Keopi han jan jumunhago sipeoyo.", translation: "I would like to order a coffee." },
    { native: "도움 주셔서 감사합니다.", romanization: "Doum jusyeoseo gamsahamnida.", translation: "Thank you very much." },
    { native: "가장 가까운 역이 어디예요?", romanization: "Gajang gakkaun yeogi eodiyeyo?", translation: "Where is the nearest station?" },
    { native: "도와주세요.", romanization: "Dowajuseyo.", translation: "Please help me." },
    { native: "이해가 안 돼요.", romanization: "Ihaega an dwaeyo.", translation: "I don't understand." },
    { native: "이�� 얼마예요?", romanization: "Igeo eolmayeyo?", translation: "How much is this?" },
    { native: "안녕히 가세요.", romanization: "Annyeonghi gaseyo.", translation: "Goodbye." },
    { native: "좋은 아침이에요.", romanization: "Joeun achimieyo.", translation: "Good morning." },
    { native: "한국어를 배우고 있어요.", romanization: "Hangugeoreul baeugo isseoyo.", translation: "I am learning Korean." },
    { native: "지금 몇 시예요?", romanization: "Jigeum myeot si-yeyo?", translation: "What time is it now?" },
    { native: "처음 뵙겠습니다.", romanization: "Cheoeum boepgesseumnida.", translation: "Nice to meet you." },
    { native: "다시 한 번 말씀해 주세요.", romanization: "Dasi han beon malsseum haejuseyo.", translation: "Please say it again." },
    { native: "맛있어요!", romanization: "Masisseoyo!", translation: "It's delicious!" },
  ],
  portuguese: [
    { native: "Olá, como você está hoje?", translation: "Hello, how are you today?" },
    { native: "O tempo está lindo.", translation: "The weather is beautiful." },
    { native: "Gostaria de pedir um café.", translation: "I would like to order a coffee." },
    { native: "Muito obrigado pela sua ajuda.", translation: "Thank you very much." },
    { native: "Onde fica a estação de trem?", translation: "Where is the train station?" },
    { native: "Por favor, pode me ajudar?", translation: "Can you help me, please?" },
    { native: "Não entendo.", translation: "I don't understand." },
    { native: "Quanto custa isso?", translation: "How much does this cost?" },
    { native: "Tchau!", translation: "Bye!" },
    { native: "Bom dia.", translation: "Good morning." },
    { native: "Estou aprendendo português.", translation: "I am learning Portuguese." },
    { native: "Que horas são?", translation: "What time is it?" },
    { native: "Prazer em conhecê-lo.", translation: "Nice to meet you." },
    { native: "Pode repetir, por favor?", translation: "Can you repeat, please?" },
    { native: "Está delicioso!", translation: "It's delicious!" },
  ],
  italian: [
    { native: "Ciao, come stai oggi?", translation: "Hi, how are you today?" },
    { native: "Il tempo è bellissimo.", translation: "The weather is very beautiful." },
    { native: "Vorrei ordinare un caffè.", translation: "I would like to order a coffee." },
    { native: "Grazie mille per il tuo aiuto.", translation: "Thank you very much." },
    { native: "Dov'è la stazione ferroviaria?", translation: "Where is the train station?" },
    { native: "Per favore, puoi aiutarmi?", translation: "Can you help me, please?" },
    { native: "Non capisco.", translation: "I don't understand." },
    { native: "Quanto costa?", translation: "How much does it cost?" },
    { native: "Arrivederci.", translation: "Goodbye." },
    { native: "Buongiorno.", translation: "Good morning." },
    { native: "Sto imparando l'italiano.", translation: "I am learning Italian." },
    { native: "Che ore sono?", translation: "What time is it?" },
    { native: "Piacere di conoscerti.", translation: "Nice to meet you." },
    { native: "Può ripetere, per favore?", translation: "Can you repeat, please?" },
    { native: "È buonissimo!", translation: "It's very good!" },
  ],
  arabic: [
    { native: "مرحبا، كيف حالك اليوم؟", romanization: "Marhaban, kayfa hāluka al-yawm?", translation: "Hello, how are you today?" },
    { native: "الطقس جميل.", romanization: "Aṭ-ṭaqs jamīl.", translation: "The weather is beautiful." },
    { native: "أود أن أطلب قهوة.", romanization: "Awaddu an aṭluba qahwatan.", translation: "I would like to order coffee." },
    { native: "شكرا جزيلا على مساعدتك.", romanization: "Shukran jazīlan ʿalā musāʿadatika.", translation: "Thank you very much." },
    { native: "أين أقرب محطة قطار؟", romanization: "Ayna aqrabu maḥaṭṭati qiṭār?", translation: "Where is the nearest train station?" },
    { native: "ساعدني من فضلك.", romanization: "Sāʿidnī min faḍlik.", translation: "Please help me." },
    { native: "لا أفهم.", romanization: "Lā afham.", translation: "I don't understand." },
    { native: "كم ثمن هذا؟", romanization: "Kam thamanu hādhā?", translation: "How much does this cost?" },
    { native: "مع السلامة.", romanization: "Maʿa as-salāma.", translation: "Goodbye." },
    { native: "صباح الخير.", romanization: "Ṣabāḥ al-khayr.", translation: "Good morning." },
    { native: "أتعلم العربية.", romanization: "Ataʿallamu al-ʿarabiyya.", translation: "I am learning Arabic." },
    { native: "كم الساعة الآن؟", romanization: "Kam as-sāʿatu al-ān?", translation: "What time is it now?" },
    { native: "تشرفنا بمعرفتك.", romanization: "Tasharrafnā bimaʿrifatik.", translation: "Nice to meet you." },
    { native: "هل يمكنك التكرار؟", romanization: "Hal yumkinuka at-tikrār?", translation: "Can you repeat?" },
    { native: "هذا لذيذ!", romanization: "Hādhā ladhīdh!", translation: "This is delicious!" },
  ],
  tagalog: [
    { native: "Kumusta ka?", translation: "How are you?" },
    { native: "Magandang umaga!", translation: "Good morning!" },
    { native: "Magandang hapon!", translation: "Good afternoon!" },
    { native: "Magandang gabi!", translation: "Good evening!" },
    { native: "Salamat po.", translation: "Thank you (polite)." },
    { native: "Walang anuman.", translation: "You're welcome." },
    { native: "Paalam na po.", translation: "Goodbye (polite)." },
    { native: "Ako si Juan.", translation: "I am Juan." },
    { native: "Natutuwa akong makilala ka.", translation: "Nice to meet you." },
    { native: "Saan ka pupunta?", translation: "Where are you going?" },
    { native: "Magkano po ito?", translation: "How much is this?" },
    { native: "Hindi ko maintindihan.", translation: "I don't understand." },
    { native: "Pwede mo bang ulitin?", translation: "Can you repeat that?" },
    { native: "Nag-aaral ako ng Tagalog.", translation: "I am learning Tagalog." },
    { native: "Masarap ang pagkain!", translation: "The food is delicious!" },
  ],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const BATCH = 5;

function scoreColor(s: number) {
  if (s >= 70) return "text-green-400 bg-green-500/15";
  if (s >= 50) return "text-yellow-400 bg-yellow-500/15";
  return "text-orange-400 bg-orange-500/15";
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export function PracticeArea({ language, accent }: PracticeAreaProps) {
  const staticPhrases = phraseBank[language.id] || [];
  const [allPhrases, setAllPhrases] = useState<Phrase[]>(staticPhrases.length > 0 ? staticPhrases : phraseBank.english);
  const [loadingPhrases, setLoadingPhrases] = useState(false);

  // Fetch admin-added lessons for this language from Firestore
  useEffect(() => {
    const fetchAdminLessons = async () => {
      setLoadingPhrases(true);
      try {
        const q = query(collection(db, "adminLessons"), where("languageId", "==", language.id));
        const snap = await getDocs(q);
        const adminPhrases: Phrase[] = [];
        snap.docs.forEach((doc) => {
          const data = doc.data();
          if (data.phrases && Array.isArray(data.phrases)) {
            data.phrases.forEach((p: { text: string; translation: string; hint?: string }) => {
              adminPhrases.push({
                native: p.text,
                translation: p.translation,
                romanization: p.hint, // use hint as romanization/pronunciation guide
              });
            });
          }
        });
        
        // Combine static phrases with admin phrases
        const combined = [...staticPhrases, ...adminPhrases];
        if (combined.length > 0) {
          setAllPhrases(combined);
        } else {
          // Fallback to English if no phrases found
          setAllPhrases(phraseBank.english);
        }
      } catch (error) {
        console.error("Error fetching admin lessons:", error);
        // Keep static phrases or English fallback
        if (staticPhrases.length > 0) {
          setAllPhrases(staticPhrases);
        }
      } finally {
        setLoadingPhrases(false);
      }
    };

    fetchAdminLessons();
  }, [language.id, staticPhrases]);

  // ── Mode ───────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("bank");

  // ── Phrase Bank ────────────────────────────────────────────────────────────
  const [pool, setPool] = useState<Phrase[]>(() => shuffle(allPhrases).slice(0, BATCH));
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentPhraseRef = useRef(pool[currentIndex]);
  useEffect(() => { currentPhraseRef.current = pool[currentIndex]; }, [pool, currentIndex]);

  // Update pool when allPhrases changes
  useEffect(() => {
    setPool(shuffle(allPhrases).slice(0, BATCH));
    setCurrentIndex(0);
  }, [allPhrases]);

  // ── Custom Phrase ──────────────────────────────────────────────────────────
  const [customInput, setCustomInput] = useState("");
  const [lockedPhrase, setLockedPhrase] = useState<string | null>(null);
  const lockedPhraseRef = useRef<string | null>(null);
  useEffect(() => { lockedPhraseRef.current = lockedPhrase; }, [lockedPhrase]);

  // ── Custom History ─────────────────────────────────────────────────────────
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);

  // ── Shared Scoring ─────────────────────────────────────────────────────────
  const [score, setScore] = useState<Score | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [heardText, setHeardText] = useState("");

  const {
    isListening, transcript, isSupported: speechSupported,
    startListening, stopListening, resetTranscript, error: speechError,
  } = useSpeechRecognition();

  const { speak, isSpeaking, isSupported: ttsSupported } = useTextToSpeech();

  const getTarget = useCallback(() =>
    mode === "custom"
      ? (lockedPhraseRef.current ?? "")
      : currentPhraseRef.current.native,
    [mode]
  );

  const applyScore = useCallback((text: string) => {
    const target = getTarget();
    if (!text.trim() || !target.trim()) return;
    const calc = calculatePronunciationScore(target, text);
    setScore(calc);
    setHeardText(text);
    setShowResults(true);
    // Persist to history if custom mode
    if (mode === "custom" && lockedPhraseRef.current) {
      setHistory((prev) => {
        const next = addToHistory(prev, lockedPhraseRef.current!, calc.overall);
        saveHistory(next);
        return next;
      });
    }
  }, [getTarget, mode]);

  const handleListen = () => {
    const target = getTarget();
    if (target) speak(target, accent.speechCode, 0.8);
  };

  const handleStartRecording = () => {
    resetTranscript();
    setScore(null);
    setShowResults(false);
    setHeardText("");
    startListening(accent.speechCode, applyScore);
  };

  const handleStopRecording = () => {
    const text = stopListening();
    if (text.trim()) applyScore(text);
  };

  const handleReset = () => {
    resetTranscript();
    setScore(null);
    setShowResults(false);
    setHeardText("");
  };

  // ── Bank navigation ────────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentIndex < pool.length - 1) {
      setCurrentIndex((p) => p + 1);
    } else {
      setPool(shuffle(allPhrases).slice(0, BATCH));
      setCurrentIndex(0);
    }
    handleReset();
  };

  const handleRefresh = () => {
    setPool(shuffle(allPhrases).slice(0, BATCH));
    setCurrentIndex(0);
    handleReset();
  };

  // ── Mode switch ────────────────────────────────────────────────────────────
  const handleModeSwitch = (m: Mode) => {
    setMode(m);
    handleReset();
  };

  // ── Practice a history entry ───────────────────────────────────────────────
  const practiceHistoryEntry = (phrase: string) => {
    setCustomInput(phrase);
    setLockedPhrase(phrase);
    handleReset();
    setShowHistory(false);
  };

  const currentPhrase = pool[currentIndex];

  if (!speechSupported) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Speech Recognition Not Supported</h3>
        <p className="text-muted-foreground">
          Please use Chrome or Edge for speech recognition. TTS listening still works!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Mode Toggle ── */}
      <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
        <button
          onClick={() => handleModeSwitch("bank")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === "bank"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Phrase Bank
        </button>
        <button
          onClick={() => handleModeSwitch("custom")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === "custom"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <PenLine className="w-4 h-4" />
          Custom Phrase
        </button>
      </div>

      {/* ── Phrase Bank Mode ── */}
      {mode === "bank" && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Practice Phrase</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {pool.length}
              </span>
              <button
                onClick={handleRefresh}
                title="Load new phrases"
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-secondary/50 rounded-xl p-6 mb-6 text-center space-y-2">
            <p className="text-3xl font-bold leading-relaxed">{currentPhrase.native}</p>
            {currentPhrase.romanization && (
              <p className="text-lg text-primary/80 font-medium">{currentPhrase.romanization}</p>
            )}
            <p className="text-sm text-muted-foreground">{currentPhrase.translation}</p>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={handleListen}
              disabled={isSpeaking || !ttsSupported}
              className="gap-2"
            >
              <Volume2 className={`w-5 h-5 ${isSpeaking ? "animate-pulse text-primary" : ""}`} />
              {isSpeaking ? "Playing..." : "Listen"}
            </Button>
            <Button variant="outline" onClick={handleNext} className="gap-2">
              <ChevronRight className="w-4 h-4" />
              Next Phrase
            </Button>
          </div>
        </div>
      )}

      {/* ── Custom Phrase Mode ── */}
      {mode === "custom" && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Custom Phrase Practice</h3>
            <p className="text-sm text-muted-foreground">
              Type any word or phrase, then practice saying it out loud.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customInput.trim()) {
                  setLockedPhrase(customInput.trim());
                  handleReset();
                }
              }}
              placeholder="e.g. Tetsudatte kudasai, Bonjour, 你好…"
              className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              onClick={() => {
                if (customInput.trim()) {
                  setLockedPhrase(customInput.trim());
                  handleReset();
                }
              }}
              disabled={!customInput.trim()}
              className="shrink-0"
            >
              Practice
            </Button>
          </div>

          {lockedPhrase && (
            <div className="bg-secondary/50 rounded-xl p-5 text-center space-y-1">
              <p className="text-2xl font-bold leading-relaxed">{lockedPhrase}</p>
              <p className="text-xs text-muted-foreground">
                Using {language.name} ({accent.name}) voice
              </p>
              <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleListen}
                  disabled={isSpeaking || !ttsSupported}
                  className="gap-2"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? "animate-pulse text-primary" : ""}`} />
                  {isSpeaking ? "Playing..." : "Listen"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setLockedPhrase(null); setCustomInput(""); handleReset(); }}
                  className="gap-1 text-muted-foreground"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </Button>
              </div>
            </div>
          )}

          {/* ── History ── */}
          {history.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <Clock className="w-4 h-4" />
                <span className="font-medium">Recent phrases</span>
                <span className="ml-1 text-xs bg-secondary px-1.5 py-0.5 rounded-full">
                  {history.length}
                </span>
                <ChevronRight
                  className={`w-4 h-4 ml-auto transition-transform ${showHistory ? "rotate-90" : ""}`}
                />
              </button>

              {showHistory && (
                <div className="mt-3 space-y-2">
                  {history.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl hover:bg-secondary/60 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{entry.phrase}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {timeAgo(entry.lastPracticed)}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold shrink-0 ${scoreColor(entry.bestScore)}`}>
                        <Star className="w-3 h-3" />
                        {entry.bestScore}%
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => practiceHistoryEntry(entry.phrase)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2"
                      >
                        Practice
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Recording Area (shared) ── */}
      {(mode === "bank" || (mode === "custom" && lockedPhrase)) && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Your Turn</h3>

          {speechError && (
            <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {speechError === "not-allowed"
                ? "Microphone access denied. Please allow mic in browser settings."
                : speechError === "no-speech"
                ? "No speech detected. Try speaking louder."
                : `Speech error: ${speechError}`}
            </div>
          )}

          <div className="flex flex-col items-center">
            <button
              onClick={isListening ? handleStopRecording : handleStartRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening
                  ? "bg-destructive text-destructive-foreground animate-pulse glow"
                  : "bg-primary text-primary-foreground hover:scale-105 glow-sm"
              }`}
            >
              {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>

            <p className="mt-4 text-sm text-muted-foreground">
              {isListening
                ? "Listening… speak now, then wait or click to stop"
                : "Click mic to start recording"}
            </p>

            {/* Live transcript while listening */}
            {isListening && transcript && (
              <div className="mt-4 w-full bg-secondary/30 rounded-xl p-3 text-center">
                <p className="text-sm text-muted-foreground italic">{transcript}</p>
              </div>
            )}

            {/* Final heard text after stopping */}
            {!isListening && heardText && (
              <div className="mt-6 w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">You said:</span>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Try Again
                  </Button>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <p className="text-lg">{heardText}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {showResults && score && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            {score.overall >= 70 ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-yellow-500" />
            )}
            <h3 className="text-lg font-semibold">
              {score.overall >= 80
                ? "Excellent!"
                : score.overall >= 60
                ? "Great Job!"
                : "Keep Practicing!"}
            </h3>
          </div>

          <PronunciationScore score={score} />

          <div className="mt-6 flex items-center justify-center gap-4">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" /> Try Again
            </Button>
            {mode === "bank" && (
              <Button onClick={handleNext} className="gap-2">
                Next Phrase <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
