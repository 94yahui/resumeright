"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Upload, Pencil, Cloud, FileText, Target } from "lucide-react";
import TemplateThumbnail from "../lib/TemplateThumbnail";
import { getTemplate } from "../lib/templates-config";
import { sampleResumeData } from "../lib/types";

// Hero preview: single-column sample, 3 bullets per project entry, no Languages section.
const heroSample = (() => {
  const d = sampleResumeData({ single: true });
  return {
    ...d,
    hasLanguage: false,
    project: d.project.map((p) => ({ ...p, bullets: p.bullets.slice(0, 3) })),
  };
})();

// Adjectives cycled in the hero headline ("___ resume"). First word matches the
// original copy so the initial paint is unchanged. Each carries a distinct meaning.
const ROTATING_WORDS = [
  "high-impact",  // makes an impression
  "job-matched",  // tailored to the target role
  "ATS-friendly", // passes applicant-tracking systems
];

// The indefinite article ("a"/"an") for a word, by its leading sound. Our word list
// has no tricky cases (silent-h / vowel-letter-consonant-sound), so a vowel-letter
// check is enough — "ATS-friendly" → "an" ("ay-tee-ess"), "high-impact" → "a".
function articleFor(word: string): "a" | "an" {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

// Typewriter loop: types a word, holds, deletes it, advances to the next, forever.
// Returns the visible text plus the current target word so the caller can pick the
// matching article. The article flips while the line is empty (between words), so it
// never disagrees with what's on screen.
function useTypewriter(words: string[]) {
  const [wordIdx, setWordIdx] = useState(0);
  const [text, setText] = useState(words[0]);
  const [phase, setPhase] = useState<"typing" | "deleting">("typing");

  useEffect(() => {
    const current = words[wordIdx];
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      timer = text.length < current.length
        ? setTimeout(() => setText(current.slice(0, text.length + 1)), 95)  // type next char
        : setTimeout(() => setPhase("deleting"), 2000);                     // hold, then erase
    } else {
      timer = text.length > 0
        ? setTimeout(() => setText(current.slice(0, text.length - 1)), 45)  // erase a char
        : setTimeout(() => {                                                // pause, then next word
            setWordIdx((i) => (i + 1) % words.length);
            setPhase("typing");
          }, 400);
    }
    return () => clearTimeout(timer);
  }, [phase, text, wordIdx, words]);

  return { text, word: words[wordIdx] };
}

// Renders the typed text + blinking cursor. The reserved-width spacer (sized to the
// widest word) keeps the trailing "resume" from jittering as the word length changes.
function TypedWord({ text, words }: { text: string; words: string[] }) {
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");
  return (
    <span style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}>
      <span aria-hidden style={{ visibility: "hidden" }}>{longest}</span>
      <span style={{ position: "absolute", left: 0, top: 0, color: "var(--paper)" }}>
        {text}
        <span className="tw-cursor" aria-hidden>|</span>
      </span>
    </span>
  );
}

export default function Hero({ onUploadClick }: { onUploadClick: () => void }) {
  const { text: typedWord, word: currentWord } = useTypewriter(ROTATING_WORDS);
  return (
    <div
      style={{
        background: "linear-gradient(to top, #06b6d4, var(--paper3))",
        minHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingTop: "64px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
      }} />
      <section
        className="hero-section"
        style={{
          padding: "72px 32px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          alignItems: "center",
        }}
      >
        {/* Left */}
        <div className="fade-in">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(7,137,236,0.15)",
              boxShadow: "0 0 5px 1px",
              color: "white",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              padding: "5px 14px",
              borderRadius: "20px",
              marginBottom: "30px",
              backdropFilter: "blur(1px)",
            }}
          >
            ✦ AI-powered · Professional templates
          </div>

          <h1
            style={{
              fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
              fontSize: "clamp(34px, 5vw, 58px)",
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              marginBottom: "30px",
            }}
          >
            <div style={{ marginBottom: '15px'}}>
              Build {articleFor(currentWord)}{" "}
              <TypedWord text={typedWord} words={ROTATING_WORDS} />
            </div>
            resume that gets read
          </h1>

          <p
            style={{
              fontSize: "17px",
              lineHeight: 1.7,
              color: "var(--paper)",
              marginBottom: "36px",
              fontWeight: 300,
            }}
          >
            Modular editing · deep AI optimization · professional templates
            <br />
            Build a resume that stands out in minutes
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/editor"
              style={{
                background: "black",
                color: "var(--paper)",
                border: "none",
                padding: "14px 28px",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Create resume
            </Link>

            <button
              onClick={onUploadClick}
              style={{
                background: "transparent",
                color: "var(--paper)",
                border: "1.5px solid var(--paper)",
                padding: "13px 24px",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 400,
                cursor: "pointer",
                fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--theme-blue)";
                // e.currentTarget.style.color = 'var(--ink)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--paper)";
              }}
            >
              <Upload size={15} /> Upload
            </button>
          </div>

          {/* Stats */}
          <div
            className="hero-stats"
            style={{ display: "flex", gap: "20px", marginTop: "44px", alignItems: "center", flexWrap: "wrap" }}
          >
            {[
              { icon: Cloud,    label: "Cross-device sync" },
              { icon: Target,   label: "Precise job matching" },
              { icon: FileText, label: "Fit to one page" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ height: "34px", display: "flex", alignItems: "center" }}>
                  <Icon size={28} color="var(--paper)" strokeWidth={1.5} />
                </div>
                <span style={{ fontSize: "12px", color: "var(--paper2)", marginTop: "4px" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Resume preview card */}
        <div
          className="hero-right fade-in"
          style={{ position: "relative", transitionDelay: "0.2s" }}
        >
          {/* Stacked background cards */}
          <div style={{
            position: "absolute",
            top: "16px", left: "16px", right: "-16px", bottom: "-16px",
            background: "rgba(255,255,255,0.45)",
            borderRadius: "0",
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow: "0 6px 24px rgba(26,24,20,0.08)",
            animation: "heroTilt5 0.9s cubic-bezier(0.34,1.56,0.64,1) .8s both",
            zIndex: 0,
          }} />
          <div style={{
            position: "absolute",
            top: "8px", left: "8px", right: "-8px", bottom: "-8px",
            background: "rgba(255,255,255,0.65)",
            borderRadius: "0",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 6px 20px rgba(26,24,20,0.08)",
            animation: "heroTilt2 0.7s cubic-bezier(0.34,1.56,0.64,1) .9s both",
            zIndex: 1,
          }} />

          <div
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(5px)",
              borderRadius: "0",
              boxShadow:
                "0 16px 50px rgba(26,24,20,0.18), 0 4px 12px rgba(26,24,20,0.08)",
              overflow: "hidden",
              border: "1px solid var(--paper3)",
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Real no-photo resume template preview (top portion) */}
            <div style={{ position: "relative", maxHeight: "680px", overflow: "hidden", background: "#ffffff" }}>
              <TemplateThumbnail template={getTemplate("classic-pro")} fillWidth data={heroSample} />
              {/* Soften the bottom clip so the page looks like it continues */}
              <div style={{
                position: "absolute", left: 0, right: 0, bottom: 0, height: "90px",
                background: "linear-gradient(rgba(255,255,255,0), #ffffff)",
                pointerEvents: "none",
              }} />
            </div>
          </div>

          <div
            className="animate-float"
            style={{
              position: "absolute",
              zIndex: 5,
              top: "150px",
              right: "-16px",
              background: "linear-gradient(90deg, #ff6b35, #ef4444)",
              color: "var(--paper)",
              padding: "10px 14px",
              border: "1px white solid",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 500,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(26,24,20,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pencil
              size={15}
              style={{
                display: "inline",
                verticalAlign: "middle",
                marginRight: "4px",
              }}
            />{" "}
            Click any block to start editing
            {/* Arrow: rotated square with consistent 1px white border */}
            <div style={{
              position: "absolute",
              left: "-7px",
              top: "50%",
              transform: "translateY(-50%) rotate(45deg)",
              width: "12px",
              height: "12px",
              background: "#ff6b35",
              borderLeft: "1px solid white",
              borderBottom: "1px solid white",
              borderRadius: "1px",
            }} />
          </div>

          <div
            style={{
              position: "absolute",
              zIndex: 5,
              bottom: "-20px",
              left: "50%",
              transform: "translateX(-50%)",
              background:
                "linear-gradient(135deg, var(--ai-color-1), var(--theme-blue))",
              color: "white",
              padding: "8px 18px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 20px rgba(45,125,110,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            <div
              className="animate-pulse-dot"
              style={{
                width: "6px",
                height: "6px",
                background: "white",
                borderRadius: "50%",
              }}
            />
            Optimizing your experience…
          </div>
        </div>
      </section>
    </div>
  );
}
