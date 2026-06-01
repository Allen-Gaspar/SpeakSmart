import { useState, useCallback, useRef, useEffect } from "react";

interface UseSpeechRecognitionResult {
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  isSupported: boolean;
  /** onDone is called when recognition ends (auto or manual) with the final text */
  startListening: (lang?: string, onDone?: (text: string) => void) => void;
  /** Returns current transcript synchronously; marks onDone as already handled */
  stopListening: () => string;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef("");   // always current, avoids stale closure
  const onDoneRef = useRef<((text: string) => void) | null>(null);
  const handledRef = useRef(false);   // prevents double-scoring

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(!!SR);
    }
  }, []);

  const startListening = useCallback(
    (lang: string = "en-US", onDone?: (text: string) => void) => {
      if (typeof window === "undefined") return;
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { setError("Speech recognition not supported"); return; }

      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) { /* ignore */ }
      }

      // Reset state
      transcriptRef.current = "";
      onDoneRef.current = onDone || null;
      handledRef.current = false;

      const recognition = new SR();
      recognition.lang = lang;
      recognition.continuous = false;   // single utterance
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = "";
        let interimText = "";
        let maxConf = 0;
        for (let i = 0; i < event.results.length; i++) {
          const r = event.results[i];
          if (r.isFinal) {
            finalText += r[0].transcript;
            maxConf = Math.max(maxConf, r[0].confidence);
          } else {
            interimText += r[0].transcript;
          }
        }
        const value = finalText || interimText;
        transcriptRef.current = value;
        setTranscript(value);
        if (maxConf > 0) setConfidence(maxConf);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error !== "aborted") setError(event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Fire onDone if not already handled by manual stopListening()
        if (!handledRef.current && onDoneRef.current) {
          const text = transcriptRef.current;
          if (text.trim()) {
            handledRef.current = true;
            onDoneRef.current(text);
          }
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (_) {
        setError("Could not start microphone. Try again.");
        setIsListening(false);
      }
    },
    []
  );

  /** Call when the user manually clicks Stop. Returns latest transcript immediately. */
  const stopListening = useCallback((): string => {
    handledRef.current = true; // Prevent onend from firing callback again
    const current = transcriptRef.current;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
    return current;
  }, []);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = "";
    setTranscript("");
    setConfidence(0);
    setError(null);
    handledRef.current = false;
  }, []);

  return {
    isListening,
    transcript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}

// ─── Pronunciation Scoring ────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFC")
    .replace(/[.,!?;:'"""''`¿¡。、！？「」『』：；・…·،؟]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the string is primarily CJK or Arabic (no spaces between words) */
function isNonLatin(s: string): boolean {
  const nonLatinChars = (s.match(/[\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u0600-\u06FF]/g) || []).length;
  return nonLatinChars / Math.max(s.length, 1) > 0.3;
}

/**
 * Returns true when two words should be considered a match.
 * Strict: exact only for short words; 1 edit distance allowed for 5+ char words.
 */
function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 5) return false; // short words must be exact
  return levenshteinDistance(a, b) <= 1; // allow 1 typo for longer words
}

/**
 * Word Error Rate on an array of string tokens.
 * Returns the fraction of expected words that are wrong/missing (0–1).
 */
function wordErrorRate(expWords: string[], actWords: string[]): number {
  const m = expWords.length;
  const n = actWords.length;
  if (m === 0) return 0;

  // Levenshtein on word sequences
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = wordsMatch(expWords[i - 1], actWords[j - 1]) ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution or match
      );
    }
  }
  return dp[m][n] / m;
}

/**
 * Greedy word coverage: how many expected words appear somewhere in actual.
 * Each actual word can only match once. No substring matching.
 */
function countMatchedWords(expWords: string[], actWords: string[]): number {
  const available = [...actWords];
  let matched = 0;
  for (const exp of expWords) {
    const idx = available.findIndex((act) => wordsMatch(exp, act));
    if (idx !== -1) {
      matched++;
      available.splice(idx, 1);
    }
  }
  return matched;
}

export function calculatePronunciationScore(
  expected: string,
  actual: string
): { accuracy: number; fluency: number; completeness: number; overall: number } {
  const normExp = normalize(expected);
  const normAct = normalize(actual);

  if (!normExp || !normAct) {
    return { accuracy: 0, fluency: 0, completeness: 0, overall: 0 };
  }

  let accuracy: number;
  let completeness: number;
  let fluency: number;

  if (isNonLatin(normExp)) {
    // ── Non-Latin (CJK / Arabic): character-level ──────────────────────────
    const dist = levenshteinDistance(normExp, normAct);
    const maxLen = Math.max(normExp.length, normAct.length);
    accuracy = maxLen > 0 ? Math.max(0, 1 - dist / maxLen) * 100 : 0;

    // Completeness: LCS length as fraction of expected length
    const lcsLen = longestCommonSubsequence(normExp, normAct);
    completeness = normExp.length > 0 ? (lcsLen / normExp.length) * 100 : 0;

    // Fluency: character length ratio (penalise both too short and too long)
    fluency =
      normAct.length > 0 && normExp.length > 0
        ? (Math.min(normAct.length, normExp.length) /
            Math.max(normAct.length, normExp.length)) *
          100
        : 0;
  } else {
    // ── Latin scripts: word-level ─────────────────────────────────────────
    const expWords = normExp.split(/\s+/).filter(Boolean);
    const actWords = normAct.split(/\s+/).filter(Boolean);

    // Accuracy: 1 − Word Error Rate
    const wer = wordErrorRate(expWords, actWords);
    accuracy = Math.max(0, 1 - wer) * 100;

    // Completeness: fraction of expected words found in actual (greedy, strict)
    const matched = countMatchedWords(expWords, actWords);
    completeness = expWords.length > 0 ? (matched / expWords.length) * 100 : 0;

    // Fluency: word-count ratio — penalise too few OR too many words
    fluency =
      actWords.length > 0 && expWords.length > 0
        ? (Math.min(actWords.length, expWords.length) /
            Math.max(actWords.length, expWords.length)) *
          100
        : 0;
  }

  const overall = accuracy * 0.5 + completeness * 0.3 + fluency * 0.2;

  return {
    accuracy: Math.round(accuracy),
    fluency: Math.round(fluency),
    completeness: Math.round(completeness),
    overall: Math.round(overall),
  };
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Longest Common Subsequence length (for CJK completeness) */
function longestCommonSubsequence(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

// ─── Text-to-Speech ───────────────────────────────────────────────────────────

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = useCallback(
    (text: string, lang: string = "en-US", rate: number = 1) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking, isSupported };
}
