"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Browser speech for now: recognition to listen, synthesis to speak.
// ponytail: browser voices vary by device; swap in a hosted voice when the final model is chosen.

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function makeRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const Ctor = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition })
    .SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function useListen(onFinal: (text: string) => void) {
  const rec = useRef<Recognition | null>(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");

  useEffect(() => setSupported(makeRecognition() !== null), []);

  const start = useCallback(() => {
    const r = makeRecognition();
    if (!r) return;
    r.lang = navigator.language || "en-US";
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (e) => {
      let finalText = "";
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else partial += res[0].transcript;
      }
      setInterim(partial);
      if (finalText.trim()) onFinal(finalText.trim());
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
    };
    r.onerror = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  }, [onFinal]);

  const stop = useCallback(() => rec.current?.stop(), []);
  return { supported, listening, interim, start, stop };
}

export function useSpeak() {
  const [on, setOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!on || typeof window === "undefined" || !window.speechSynthesis || !text) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = /[ऀ-ॿ]/.test(text) ? "hi-IN" : navigator.language || "en-US";
      u.rate = 1.02;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [on],
  );

  const toggle = useCallback(() => {
    setOn((v) => {
      if (v) window.speechSynthesis?.cancel();
      return !v;
    });
  }, []);

  return { on, speaking, speak, stop, toggle };
}
