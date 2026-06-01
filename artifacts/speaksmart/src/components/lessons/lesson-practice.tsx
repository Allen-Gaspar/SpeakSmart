import { useState, useRef, useEffect, useCallback } from "react";
import type { Lesson, LessonPhrase } from "@/lib/lessons";
import type { Language } from "@/lib/languages";
import { useSpeechRecognition, useTextToSpeech, calculatePronunciationScore } from "@/hooks/use-speech";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, ArrowRight, AlertCircle, Lightbulb, RotateCcw, Shuffle } from "lucide-react";

interface LessonPracticeProps {
  lesson: Lesson;
  language: Language;
  onComplete: (scores: number[]) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function LessonPractice({ lesson, language, onComplete }: LessonPracticeProps) {
  const { awardXP } = useAuth();

  // Shuffle phrases on mount — different order every time
  const [phrases, setPhrases] = useState<LessonPhrase[]>(() => shuffle(lesson.phrases));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [heardText, setHeardText] = useState("");
  const [showHint, setShowHint] = useState(false);

  const {
    isListening, transcript, isSupported, error: speechError,
    startListening, stopListening, resetTranscript,
  } = useSpeechRecognition();

  const { speak, isSpeaking } = useTextToSpeech();

  const currentPhrase: LessonPhrase = phrases[currentIndex];
  const progress = (currentIndex / phrases.length) * 100;

  // Ref so onDone callback always captures the latest phrase (no stale closure)
  const currentPhraseRef = useRef(currentPhrase);
  useEffect(() => { currentPhraseRef.current = currentPhrase; }, [currentPhrase]);

  const handleReset = useCallback(() => {
    resetTranscript();
    setCurrentScore(null);
    setHeardText("");
  }, [resetTranscript]);

  // Shuffle phrases and restart from the beginning
  const handleShuffle = () => {
    setPhrases(shuffle(lesson.phrases));
    setCurrentIndex(0);
    setScores([]);
    handleReset();
    setShowHint(false);
  };

  const handleListen = () => {
    speak(currentPhrase.text, language.speechCode, 0.8);
  };

  const applyScore = (text: string) => {
    const target = currentPhraseRef.current.text;
    if (!text.trim()) return;
    const s = calculatePronunciationScore(target, text);
    setCurrentScore(s.overall);
    setHeardText(text);
  };

  const handleStartRecording = () => {
    resetTranscript();
    setCurrentScore(null);
    setHeardText("");
    startListening(language.speechCode, applyScore);
  };

  const handleStopRecording = () => {
    const text = stopListening();
    if (text.trim()) applyScore(text);
  };

  const advance = (score: number) => {
    const newScores = [...scores, score];
    setScores(newScores);
    if (currentIndex < phrases.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentScore(null);
      resetTranscript();
      setHeardText("");
      setShowHint(false);
    } else {
      awardXP(lesson.xpReward).catch(() => {});
      onComplete(newScores);
    }
  };

  const handleNext = () => advance(currentScore ?? 0);
  const handleSkip = () => advance(0);

  if (!isSupported) {
    return (
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Speech Recognition Not Supported</h3>
            <p className="text-muted-foreground">Please use Chrome or Edge for speech recognition.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Progress bar + shuffle button */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Phrase {currentIndex + 1} of {phrases.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{Math.round(progress)}% Complete</span>
              <button
                onClick={handleShuffle}
                title="Shuffle phrases and restart"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Shuffle
              </button>
            </div>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Phrase Card */}
        <div className="glass rounded-3xl p-8 mb-6">
          <div className="text-center mb-6 space-y-2">
            <p className="text-sm text-muted-foreground">Say this phrase:</p>
            <p className="text-3xl font-bold leading-relaxed">{currentPhrase.text}</p>
            {currentPhrase.romanization && (
              <p className="text-lg text-primary/80 font-medium">{currentPhrase.romanization}</p>
            )}
            <p className="text-muted-foreground">{currentPhrase.translation}</p>
          </div>

          {/* Hint */}
          {currentPhrase.hint && (
            <div className="mb-6">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 text-sm text-primary hover:underline mx-auto"
              >
                <Lightbulb className="w-4 h-4" />
                {showHint ? "Hide hint" : "Show pronunciation hint"}
              </button>
              {showHint && (
                <p className="text-center text-sm text-muted-foreground mt-2 p-3 bg-primary/10 rounded-lg">
                  {currentPhrase.hint}
                </p>
              )}
            </div>
          )}

          {/* Listen */}
          <div className="flex justify-center mb-8">
            <Button variant="outline" onClick={handleListen} disabled={isSpeaking} className="gap-2">
              <Volume2 className={`w-5 h-5 ${isSpeaking ? "animate-pulse text-primary" : ""}`} />
              {isSpeaking ? "Playing..." : "Listen to pronunciation"}
            </Button>
          </div>

          {/* Speech error */}
          {speechError && (
            <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm text-center">
              {speechError === "not-allowed"
                ? "Microphone access denied. Check browser settings."
                : speechError === "no-speech"
                ? "No speech detected. Please try again."
                : `Error: ${speechError}`}
            </div>
          )}

          {/* Mic */}
          <div className="flex flex-col items-center">
            <button
              onClick={isListening ? handleStopRecording : handleStartRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening
                  ? "bg-destructive text-destructive-foreground animate-pulse glow"
                  : "bg-primary text-primary-foreground hover:scale-105 glow-sm"
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <p className="mt-3 text-sm text-muted-foreground">
              {isListening
                ? "Listening… speak now, then wait or click to stop"
                : "Click to record"}
            </p>
          </div>

          {/* Live transcript while listening */}
          {isListening && transcript && (
            <div className="mt-4 p-3 bg-secondary/30 rounded-xl text-center">
              <p className="text-sm text-muted-foreground italic">{transcript}</p>
            </div>
          )}

          {/* Final heard text */}
          {!isListening && heardText && (
            <div className="mt-6 p-4 bg-secondary/50 rounded-xl text-center">
              <p className="text-sm text-muted-foreground mb-1">You said:</p>
              <p className="text-lg font-medium">{heardText}</p>
            </div>
          )}

          {/* Score badge */}
          {currentScore !== null && (
            <div className="mt-6 text-center space-y-3">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold ${
                currentScore >= 70
                  ? "bg-green-500/20 text-green-400"
                  : currentScore >= 50
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-orange-500/20 text-orange-400"
              }`}>
                {currentScore}%
                <span className="text-sm font-normal">
                  {currentScore >= 70 ? "Great!" : currentScore >= 50 ? "Good effort!" : "Keep trying!"}
                </span>
              </div>
              <div>
                <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-muted-foreground">
                  <RotateCcw className="w-3 h-3" /> Try Again
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleSkip}>Skip</Button>
          <Button
            onClick={handleNext}
            disabled={currentScore === null && !heardText}
            className="gap-2"
          >
            {currentIndex < phrases.length - 1 ? "Next Phrase" : "Complete Lesson"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
