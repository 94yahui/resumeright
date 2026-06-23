"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  FileDown,
  FileType,
  ImageIcon,
  FileUp,
  CheckCircle2,
  Sparkles,
  X,
  QrCode,
  Smartphone,
  FilePen,
  Plus,
  Target,
  GraduationCap,
  Star,
  Briefcase,
  Rocket,
  Code2,
  Layers,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import type { AISuggestion, ResumeData } from "../../lib/types";
import { hasDiffMarkup, parseDiffBullet, DEMO_DATA } from "../../lib/types";
import { getStarterData, type UserType, type Industry } from "../../lib/starter-templates";
const STRAY_RE = /\[\[[\+~]|[\+~]\]\]|\[\[|\]\]/g;
const stripStray = (s: string) => s.replace(STRAY_RE, "");

// Returns true if a word token looks like a skill/tech term (CamelCase, version number, acronym, etc.)
function isTechWord(word: string, skills: string[]): boolean {
  const w = word.trim();
  if (!w || w.length < 2 || w.length > 25) return false;
  if (skills.some((s) => s.toLowerCase() === w.toLowerCase())) return true;
  if (!/^[A-Za-z0-9./+\-_#@]+$/.test(w)) return false; // must be ASCII-like chars only
  return (
    /[A-Z]/.test(w.slice(1)) || // CamelCase: TypeScript, JavaScript
    /[A-Za-z]\d|\d[A-Za-z]/.test(w) || // alphanumeric mix: Vue3, H5, ES6, CSS3
    /^[A-Z]{2,}$/.test(w) || // all-caps abbreviation: API, AWS, SQL, UI
    /[./+#@]/.test(w) // notation: Node.js, C++, @scope
  );
}
import ImportLoadingBar from "../../components/ImportLoadingBar";
import LogoSweepLoader from "../../components/LogoSweepLoader";
import type { PlanType } from "../../lib/payment";
import { getDeviceId } from "../../lib/payment";

export function DownloadModal({
  onClose,
  onPrintPDF,
  onDownloadPNG,
  isPro,
  isPaid,
  onUnlockPro,
}: {
  onClose: () => void;
  onPrintPDF: () => void;
  onDownloadPNG?: () => void;
  isPro?: boolean;
  isPaid?: boolean;
  onUnlockPro?: () => void;
}) {
  const proRows = [
    {
      icon: <ImageIcon size={22} />,
      label: "PNG image",
      sub: "High-res image, great for sharing",
      onClick: onDownloadPNG,
    },
  ];

  return (
    <ModalWrap onClose={onClose}>
      <div
        style={{
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "6px",
          color: "#0f172a",
        }}
      >
        Download resume
      </div>
      <p
        style={{
          fontSize: "13.5px",
          color: "#64748b",
          marginBottom: "20px",
          lineHeight: 1.5,
        }}
      >
        Choose a format — it will be saved to your device
      </p>

      {/* PDF — always available */}
      <div
        onClick={onPrintPDF}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "14px 16px",
          border: "2px solid var(--theme-blue)",
          borderRadius: "14px",
          cursor: "pointer",
          marginBottom: "10px",
          background: "#e0f0fd",
          transition: "all 0.2s",
        }}
      >
        <FileDown size={22} color="var(--theme-blue)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
            PDF
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            Recommended for applications
          </div>
        </div>
        <span style={{ fontSize: "14px", color: "var(--theme-blue)" }}>→</span>
      </div>

      {isPro && !isPaid && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "12px",
            background: "#fef3c7",
            border: "1px solid #fbbf24",
            marginBottom: "10px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#92400e", flex: 1 }}>
            This download includes a watermark
          </span>
          <button
            onClick={onUnlockPro}
            style={{
              padding: "4px 12px",
              borderRadius: "10px",
              fontSize: "12px",
              background: "#d4a017",
              color: "#1a1814",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Remove watermark
          </button>
        </div>
      )}

      {/* Word and PNG — enabled for Pro, locked for free */}
      {proRows.map((row) => {
        const enabled = isPaid && !!row.onClick;
        return (
          <div
            key={row.label}
            onClick={enabled ? row.onClick : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "14px 16px",
              border: `1.5px solid ${enabled ? "#e2e8f0" : "#f1f5f9"}`,
              borderRadius: "14px",
              marginBottom: "10px",
              background: "white",
              cursor: enabled ? "pointer" : "default",
              opacity: enabled ? 1 : 0.55,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (enabled)
                (e.currentTarget as HTMLElement).style.borderColor = "#cbd5e1";
            }}
            onMouseLeave={(e) => {
              if (enabled)
                (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
            }}
          >
            <span style={{ color: enabled ? "#334155" : "#94a3b8" }}>
              {row.icon}
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}
              >
                {row.label}
              </div>
              <div
                style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}
              >
                {row.sub}
              </div>
            </div>
            {enabled ? (
              <span style={{ fontSize: "14px", color: "#64748b" }}>→</span>
            ) : (
              <span
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  background: "#f1f5f9",
                  padding: "2px 8px",
                  borderRadius: "10px",
                }}
              >
                🔒 Pro
              </span>
            )}
          </div>
        );
      })}

      <button
        onClick={onClose}
        style={{
          width: "100%",
          marginTop: "4px",
          padding: "11px",
          border: "1px solid #e2e8f0",
          background: "transparent",
          borderRadius: "12px",
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          cursor: "pointer",
          color: "#64748b",
        }}
      >
        Cancel
      </button>
    </ModalWrap>
  );
}

function formatSkillTag(s: string): string {
  // Defensively strip a leading Chinese "需"/"需要" prefix the model sometimes adds.
  return s.replace(/^\s*需要?\s*/, "").trim();
}

type AIPanelPhase = "entry" | "analyzing" | "result" | "applying";

interface AIPanelProps {
  phase: AIPanelPhase;
  optimizing?: boolean;
  analysis?: {
    hasOfferRate?: boolean;
    offerRate?: number;
    overview: string;
    suggestions: AISuggestion[];
    missingSkills?: string[];
    jobInfo?: {
      title: string | null;
      company: string | null;
      location: string | null;
      type: string | null;
    } | null;
    matchBreakdown?: {
      overall?: number;
      experience: number;
      skills: number;
      other: number;
    } | null;
  } | null;
  appliedSuggestionIds?: Set<string>;
  jobDesc: string;
  currentSkills?: string[];
  currentSummary?: string;
  onJobDescChange: (v: string) => void;
  onAnalyzeCurrent: (jobDesc: string) => void;
  onApplySuggestion: (s: AISuggestion, checkedSkills?: string[]) => void;
  onApplyAll: () => void;
  onClose: () => void;
  onSkillChecksChange?: (skills: string[]) => void;
  analyzeExhausted?: boolean;
  analyzeExhaustedKind?: "upgrade" | "daily_reset";
  analyzeLoggedIn?: boolean;
  onAnalyzeExhaustedCTA?: () => void;
}

const SAMPLE_JDS = [
  {
    label: "Senior Frontend Engineer",
    text: `Responsibilities:
1. Own frontend architecture and development for core products
2. Collaborate with product/design/backend to ship high-quality features
3. Continuously optimize performance and Core Web Vitals (LCP/FID/CLS)

Requirements:
- 3+ years of frontend experience, expert in React/Vue 3, proficient in TypeScript
- Familiar with Webpack/Vite and performance tuning
- Knowledge of Node.js; micro-frontend or mobile web experience a plus`,
  },
  {
    label: "Product Manager",
    text: `Responsibilities:
1. Drive product planning and iteration from 0 to 1 to hit business goals
2. Dive into user scenarios, uncover needs, and produce PRDs and prototypes
3. Coordinate cross-functional delivery, track metrics, and iterate

Requirements:
- 3+ years of product experience with end-to-end B2C or B2B ownership
- Proficient with Figma/Axure and strong data analysis skills
- Experience with AI products, SaaS, or e-commerce a plus`,
  },
  {
    label: "Full-Stack Engineer",
    text: `Responsibilities:
1. Independently build frontend and backend of web apps to validate ideas fast
2. Design RESTful APIs and contribute to data modeling and performance work
3. Participate in tech selection and drive engineering standards

Requirements:
- Strong in React/Vue, familiar with Node.js/Python backends
- Familiar with MySQL/PostgreSQL and Redis caching
- Experience with Docker/cloud; shipped side projects a plus`,
  },
  {
    label: "UI/UX Designer",
    text: `Responsibilities:
1. Own interaction and visual design for app/web and the design system
2. Understand user needs and iterate the experience through research and testing
3. Work with engineering to ensure design fidelity and consistency

Requirements:
- 3+ years of UI/UX design experience
- Proficient with Figma; able to deliver full specs and component libraries
- Portfolio with complete projects from research to delivery`,
  },
];

export function AIPanel({
  phase,
  analysis,
  appliedSuggestionIds,
  jobDesc,
  currentSkills,
  currentSummary,
  onJobDescChange,
  onAnalyzeCurrent,
  onApplySuggestion,
  onApplyAll,
  onClose,
  onSkillChecksChange,
  analyzeExhausted,
  analyzeExhaustedKind,
  analyzeLoggedIn,
  onAnalyzeExhaustedCTA,
}: AIPanelProps) {
  const [editorAnimRate, setEditorAnimRate] = useState(0);
  const [skillChecks, setSkillChecks] = useState<Record<string, boolean>>({});
  const onSkillChecksChangeRef = useRef(onSkillChecksChange);
  useEffect(() => {
    onSkillChecksChangeRef.current = onSkillChecksChange;
  });
  useEffect(() => {
    const checked = Object.entries(skillChecks)
      .filter(([, v]) => v)
      .map(([k]) => k);
    onSkillChecksChangeRef.current?.(checked);
  }, [skillChecks]);

  const CURRENT_STAGES = [
    { after: 0, msg: "Analyzing resume structure and highlights…" },
    { after: 3500, msg: "Assessing experience and skills…" },
    { after: 7000, msg: "Evaluating job fit…" },
    { after: 11000, msg: "Generating suggestions…" },
  ];


  const showOfferRate = analysis?.hasOfferRate === true;
  const offerRate = analysis?.offerRate ?? 0;
  const rawSuggestions = useMemo(() => {
    const normalize = (s: string) => s.toLowerCase().trim();
    const existingSet = new Set((currentSkills ?? []).map(normalize));
    return (analysis?.suggestions ?? []).filter((s) => {
      // Always pass through special action cards
      if (s.action === "remove" || s.action === "add" || s.action === "fill") return true;
      // Drop exp/project bullet suggestions where no bullet carries diff markup (nothing changed)
      if (
        (s.section === "exp" || s.section === "project") &&
        s.field === "bullets" &&
        Array.isArray(s.optimizedContent)
      ) {
        return (s.optimizedContent as string[]).some(hasDiffMarkup);
      }
      // Drop skills suggestions where every suggested skill already exists
      if (s.section === "skills" && Array.isArray(s.optimizedContent)) {
        return (s.optimizedContent as string[]).some(
          (sk) => !existingSet.has(normalize(sk)),
        );
      }
      // Drop summary suggestions where content is identical to the current summary
      if (s.section === "summary") {
        const content = Array.isArray(s.optimizedContent)
          ? stripStray(
              (s.optimizedContent as string[]).filter(Boolean).join(" "),
            )
          : typeof s.optimizedContent === "string"
            ? stripStray(s.optimizedContent as string)
            : "";
        return content.trim() !== (currentSummary ?? "").trim();
      }
      return true;
    });
  }, [analysis, currentSkills, currentSummary]);
  // Summary first, then regular, then action cards (remove/add/fill) at the end
  const ACTION_ORDER: Record<string, number> = { remove: 1, add: 2, fill: 3 }
  const suggestions = [...rawSuggestions].sort((a, b) => {
    if (a.section === "summary" && !a.action) return -1
    if (b.section === "summary" && !b.action) return 1
    const aOrder = a.action ? ACTION_ORDER[a.action] ?? 0 : 0
    const bOrder = b.action ? ACTION_ORDER[b.action] ?? 0 : 0
    return aOrder - bOrder
  });
  const unappliedCount = suggestions.filter(
    (s) => !appliedSuggestionIds?.has(s.id),
  ).length;

  // Initialize skill checkboxes when suggestions arrive — pre-check new skills only
  useEffect(() => {
    const normalize = (s: string) => s.toLowerCase().trim();
    const existingSet = new Set((currentSkills ?? []).map(normalize));
    const checks: Record<string, boolean> = {};
    for (const s of rawSuggestions) {
      if (s.section === "skills" && Array.isArray(s.optimizedContent)) {
        for (const skill of s.optimizedContent as string[]) {
          checks[skill] = !existingSet.has(normalize(skill));
        }
      }
    }
    setSkillChecks(checks);
  }, [rawSuggestions, currentSkills]);

  useEffect(() => {
    if (!showOfferRate) {
      setEditorAnimRate(0);
      return;
    }
    const t = setTimeout(() => setEditorAnimRate(offerRate), 80);
    return () => clearTimeout(t);
  }, [showOfferRate, offerRate]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "white",
        borderLeft: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes aipB{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-8px);opacity:1}}
        @keyframes scanLine{0%{top:0%;opacity:0}5%{opacity:1}95%{opacity:1}100%{top:100%;opacity:0}}
        @keyframes scanPulse{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes aiSpin{to{transform:rotate(360deg)}}
      `}</style>
      {/* Header */}
      <div
        style={{
          padding: "14px 18px 12px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "10px",
            background:
              "linear-gradient(135deg,var(--ai-color-1),var(--ai-color-2))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Sparkles size={11} color="white" />
        </div>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#334155",
            flex: 1,
          }}
        >
          AI parse & targeted optimization
        </span>
        <button
          onClick={onClose}
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            fontFamily: "var(--font-sans)",
            fontSize: "14px",
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.color = "#475569";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#94a3b8";
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          position: "relative",
        }}
      >
        {/* Analyzing — dark overlay with LogoSweepLoader */}
        {phase === "analyzing" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 50% 40%, #111a3e 0%, #0a0d24 45%, #060812 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <LogoSweepLoader stages={CURRENT_STAGES} />
          </div>
        )}

        {/* Applying template — dark-bg centered overlay */}
        {phase === "applying" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "white",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "96px",
                height: "124px",
                margin: "0 auto 22px",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#f8fafc",
              }}
            >
              {[14, 26, 38, 54, 64, 74, 84, 96, 108].map((top, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: `${top}px`,
                    width:
                      i === 0
                        ? "44px"
                        : i % 3 === 0
                          ? "66px"
                          : i % 3 === 1
                            ? "54px"
                            : "48px",
                    height: i === 0 ? "5px" : "3px",
                    background: i === 0 ? "var(--theme-blue)" : "#e2e8f0",
                    borderRadius: "2px",
                    animation: `scanPulse 1.8s ${i * 0.08}s infinite`,
                  }}
                />
              ))}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: "2px",
                  background:
                    "linear-gradient(90deg, transparent 0%, var(--theme-blue) 30%, var(--theme-blue) 50%, var(--theme-blue) 70%, transparent 100%)",
                  boxShadow: "0 0 8px 3px rgba(7,137,236,0.35)",
                  animation: "scanLine 1.8s ease-in-out infinite",
                }}
              />
            </div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: "6px",
              }}
            >
              Scanning your resume…
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Matching a template and filling in your content
            </div>
          </div>
        )}

        {/* Entry */}
        {phase === "entry" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* JD textarea */}
            <div>
              <label
                style={{
                  ...aiPanelLabel,
                  marginBottom: "7px",
                  display: "block",
                }}
              >
                Target job description{" "}
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: "11px",
                    letterSpacing: 0,
                    textTransform: "none",
                    color: "#94a3b8",
                  }}
                >
                  (optional, but strongly recommended)
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <textarea
                  value={jobDesc}
                  onChange={(e) => onJobDescChange(e.target.value)}
                  placeholder="Paste the target job — AI will target its keywords..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    paddingRight: jobDesc ? "32px" : "12px",
                    paddingBottom: "20px",
                    boxSizing: "border-box",
                    border: `1.5px solid ${jobDesc.length > 3000 ? "#ef4444" : "#e2e8f0"}`,
                    borderRadius: "12px",
                    fontFamily: "var(--font-sans)",
                    fontSize: "12.5px",
                    color: "#0f172a",
                    background: "#f8fafc",
                    outline: "none",
                    resize: "none",
                    lineHeight: 1.6,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor =
                      jobDesc.length > 3000 ? "#ef4444" : "var(--theme-blue)";
                    e.target.style.background = "white";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor =
                      jobDesc.length > 3000 ? "#ef4444" : "#e2e8f0";
                    e.target.style.background = "#f8fafc";
                  }}
                />
                {jobDesc && (
                  <button
                    onClick={() => onJobDescChange("")}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "rgba(100,116,139,0.15)",
                      border: "none",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#94a3b8",
                      padding: 0,
                      transition: "background 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(100,116,139,0.3)";
                      e.currentTarget.style.color = "#475569";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(100,116,139,0.15)";
                      e.currentTarget.style.color = "#94a3b8";
                    }}
                  >
                    <X size={10} />
                  </button>
                )}
                {jobDesc.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "5px",
                      right: "8px",
                      fontSize: "10px",
                      color: jobDesc.length > 3000 ? "#ef4444" : "#94a3b8",
                      pointerEvents: "none",
                    }}
                  >
                    {jobDesc.length}/3000
                  </div>
                )}
              </div>
              {jobDesc.length > 3000 && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#ef4444",
                    marginTop: "4px",
                  }}
                >
                  Too long — please keep it under 3000 characters
                </div>
              )}
              {/* Sample JD chips */}
              <div style={{ marginTop: "8px" }}>
                <span
                  style={{
                    fontSize: "10.5px",
                    color: "#94a3b8",
                    fontWeight: 500,
                    marginRight: "6px",
                  }}
                >
                  Try:
                </span>
                <div
                  style={{
                    display: "inline-flex",
                    flexWrap: "wrap",
                    gap: "5px",
                    verticalAlign: "middle",
                  }}
                >
                  {SAMPLE_JDS.map((jd) => (
                    <button
                      key={jd.label}
                      onClick={() => onJobDescChange(jd.text)}
                      style={{
                        padding: "3px 9px",
                        borderRadius: "24px",
                        border: "1px solid #e2e8f0",
                        background:
                          jobDesc === jd.text
                            ? "linear-gradient(135deg, #ede9fe, #fce7f3)"
                            : "#f8fafc",
                        color: jobDesc === jd.text ? "#7c3aed" : "#475569",
                        fontSize: "10.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        transition: "all 0.15s",
                        borderColor:
                          jobDesc === jd.text ? "#c4b5fd" : "#e2e8f0",
                      }}
                      onMouseEnter={(e) => {
                        if (jobDesc !== jd.text) {
                          e.currentTarget.style.background = "#f1f5f9";
                          e.currentTarget.style.borderColor = "#cbd5e1";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (jobDesc !== jd.text) {
                          e.currentTarget.style.background = "#f8fafc";
                          e.currentTarget.style.borderColor = "#e2e8f0";
                        }
                      }}
                    >
                      {jd.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Value proposition card */}
            <div
              style={{
                background: "linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 100%)",
                border: "1px solid #ede9fe",
                borderRadius: "14px",
                padding: "11px 13px",
              }}
            >
              <div
                style={{
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "#6d28d9",
                  marginBottom: "5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Sparkles size={11} color="#8b5cf6" />
                Why add a target job?
              </div>
              <div
                style={{
                  fontSize: "11.5px",
                  color: "#475569",
                  lineHeight: 1.65,
                }}
              >
                AI uses the target role's key skills and keywords to make
                <strong style={{ color: "#6d28d9" }}>precise, targeted tweaks</strong> that hit
                what recruiters look for, boosting your match rate.
              </div>
            </div>

            {/* Main CTA button — dynamic based on jobDesc */}
            <button
              onClick={() => !analyzeExhausted && onAnalyzeCurrent(jobDesc)}
              disabled={jobDesc.length > 3000 || !!analyzeExhausted}
              style={{
                width: "100%",
                padding: "13px",
                background:
                  jobDesc.length > 3000 || analyzeExhausted
                    ? "#e2e8f0"
                    : jobDesc.trim()
                      ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)"
                      : "linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))",
                color:
                  jobDesc.length > 3000 || analyzeExhausted
                    ? "#94a3b8"
                    : "white",
                border: "none",
                borderRadius: "14px",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                fontWeight: 700,
                cursor:
                  jobDesc.length > 3000 || analyzeExhausted
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                boxShadow:
                  jobDesc.length > 3000 || analyzeExhausted
                    ? "none"
                    : jobDesc.trim()
                      ? "0 4px 16px rgba(124,58,237,0.35)"
                      : "0 2px 8px rgba(0,0,0,0.12)",
                transition: "background 0.3s, box-shadow 0.3s",
              }}
            >
              {jobDesc.trim() ? (
                <><Target size={14} /> Start targeted optimization</>
              ) : (
                <> Start general optimization</>
              )}
            </button>

            {/* Mode hint — distinguishes JD vs no-JD analysis */}
            {!analyzeExhausted && jobDesc.length <= 3000 && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "10px",
                  fontSize: "11px",
                  color: "#94a3b8",
                  lineHeight: 1.6,
                }}
              >
                {jobDesc.trim() ? (
                  <>Scores your job-match rate &amp; applies JD-targeted fixes</>
                ) : (
                  <>
                    General writing &amp; quality fixes ·{" "}
                    <span style={{ color: "#7c3aed", fontWeight: 600 }}>
                      paste a JD
                    </span>{" "}
                    for match scoring
                  </>
                )}
              </div>
            )}

            {/* Quota exhausted hint — upgrade CTA (non-subscriber) */}
            {analyzeExhausted && analyzeExhaustedKind === "upgrade" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  padding: "10px 12px",
                  background: "#fef9c3",
                  border: "1px solid #fde047",
                  borderRadius: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#854d0e",
                    lineHeight: 1.5,
                  }}
                >
                  Limit reached
                </span>
                <button
                  onClick={onAnalyzeExhaustedCTA}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#0f172a",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {"Try again later"}
                </button>
              </div>
            )}

            {/* Quota exhausted hint — daily reset (subscriber) */}
            {analyzeExhausted && analyzeExhaustedKind === "daily_reset" && (
              <div
                style={{
                  padding: "9px 12px",
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: "12px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#0369a1" }}>
                  Daily limit reached, resets at midnight
                </span>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {phase === "result" && (
          <>
            {/* Offer rate — current vs post-optimization */}
            {showOfferRate &&
              (() => {
                const optimizedRate = Math.min(95, offerRate + 15);
                // Bright, tiered gradients for the match score — green at the top, warm-bright lower down.
                const offerGradient =
                  offerRate >= 70
                    ? "linear-gradient(135deg, #06d6a0, #34e0b8)"
                    : offerRate >= 50
                      ? "linear-gradient(135deg, #f59e0b, #fde047)"
                      : offerRate >= 30
                        ? "linear-gradient(135deg, #fb7a3c, #fdba74)"
                        : "linear-gradient(135deg, #f43f5e, #fb7185)";
                const optGradient = "linear-gradient(135deg, #06d6a0, #34e0b8)";
                const gradientText = (g: string): React.CSSProperties => ({
                  background: g,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                });
                return (
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 45%, #effdfa 100%)",
                      border: "1px solid #c7f0e2",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        color: "#059669",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Target size={9} color="#059669" />{" "}
                      Job match rate
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: "9px",
                            color: "#94a3b8",
                            marginBottom: "4px",
                          }}
                        >
                          Current
                        </div>
                        <div
                          style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "30px",
                            fontWeight: 800,
                            lineHeight: 1,
                            ...gradientText(offerGradient),
                          }}
                        >
                          {offerRate}%
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          color: "#cbd5e1",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        →
                      </div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: "9px",
                            color: "#94a3b8",
                            marginBottom: "4px",
                          }}
                        >
                          After optimization
                        </div>
                        <div
                          style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "30px",
                            fontWeight: 800,
                            lineHeight: 1,
                            ...gradientText(optGradient),
                          }}
                        >
                          {optimizedRate}%
                        </div>
                        <div
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            marginTop: "3px",
                            ...gradientText(optGradient),
                          }}
                        >
                          +{optimizedRate - offerRate}%
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: "10px",
                        height: "4px",
                        background: "rgba(15,23,42,0.06)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${editorAnimRate}%`,
                          height: "100%",
                          background: offerGradient,
                          borderRadius: "2px",
                          transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })()}

            {/* Overview */}
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                Overall assessment
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "#475569",
                  lineHeight: 1.7,
                  margin: 0,
                  padding: "10px 12px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                {analysis?.overview ??
                  "Clear structure with detailed experience. Core skills are a good match; consider quantifying results further to stand out."}
              </p>
            </div>

            {/* Missing skills tags */}
            {showOfferRate &&
              analysis?.missingSkills &&
              analysis.missingSkills.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#64748b",
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    Skills needed
                  </div>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}
                  >
                    {analysis.missingSkills.map((skill, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "#dc2626",
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          padding: "3px 9px",
                          borderRadius: "12px",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        {formatSkillTag(skill)}
                      </span>
                    ))}
                  </div>
                </div>
              )}


            {/* Per-suggestion cards */}
            {suggestions.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  Where to improve
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "10px",
                      color: "#94a3b8",
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    (✦ marked)
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {suggestions.map((s) => {
                    const applied = appliedSuggestionIds?.has(s.id);
                    const canApply = !applied;
                    const isSkills =
                      s.section === "skills" &&
                      s.field === "skills" &&
                      Array.isArray(s.optimizedContent);
                    const normalize = (str: string) => str.toLowerCase().trim();
                    const existingSet = new Set(
                      (currentSkills ?? []).map(normalize),
                    );
                    // ── Action cards: remove / add / fill ──
                    if (s.action === "remove") {
                      return (
                        <div key={s.id} style={{
                          padding: "10px 12px", borderRadius: "14px", transition: "all 0.2s",
                          border: applied ? "1px solid #bbf7d0" : "1px solid rgba(239,68,68,0.25)",
                          background: applied ? "#f0fdf4" : "rgba(254,242,242,0.6)",
                        }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px", color: applied ? "#16a34a" : "#dc2626" }}>
                            {applied ? <><CheckCircle2 size={12} color="#16a34a" /> Removed</> : <>✕ AI suggests removing</>}
                          </div>
                          <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#0f172a", marginBottom: "2px" }}>{s.label}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, marginBottom: s.changeDescription ? "6px" : "0" }}>{s.tip}</div>
                          {s.changeDescription && <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#7f1d1d", lineHeight: 1.55, padding: "6px 10px", background: "rgba(239,68,68,0.07)", borderRadius: "8px" }}>{s.changeDescription}</p>}
                          {!applied && (
                            <button onClick={() => onApplySuggestion(s)} style={{ width: "100%", marginTop: "6px", padding: "7px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                              Confirm removing this entry
                            </button>
                          )}
                        </div>
                      )
                    }
                    if (s.action === "add" || s.action === "fill") {
                      const isAdd = s.action === "add"
                      const accentColor = isAdd ? "#0d9488" : "#7c3aed"
                      const bgColor = isAdd ? "rgba(240,253,250,0.8)" : "rgba(245,243,255,0.8)"
                      const borderColor = isAdd ? "rgba(13,148,136,0.25)" : "rgba(124,58,237,0.25)"
                      const bullets = s.newEntry?.bullets ?? []
                      return (
                        <div key={s.id} style={{ padding: "10px 12px", borderRadius: "14px", transition: "all 0.2s", border: applied ? "1px solid #bbf7d0" : `1px solid ${borderColor}`, background: applied ? "#f0fdf4" : bgColor }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px", color: applied ? "#16a34a" : accentColor }}>
                            {applied ? <><CheckCircle2 size={12} color="#16a34a" /> Added</> : isAdd ? <>＋ AI suggests adding a project</> : <>○ AI suggests a framework</>}
                          </div>
                          <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#0f172a", marginBottom: "2px" }}>{s.label}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, marginBottom: "6px" }}>{s.tip}</div>
                          {s.changeDescription && <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#475569", lineHeight: 1.55, padding: "6px 10px", background: "rgba(0,0,0,0.03)", borderRadius: "8px" }}>{s.changeDescription}</p>}
                          {s.newEntry && (
                            <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: "8px", padding: "8px 10px", marginBottom: "8px" }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a", marginBottom: "1px" }}>{s.newEntry.title}</div>
                              <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "6px" }}>{s.newEntry.sub}{s.newEntry.date ? ` · ${s.newEntry.date}` : ""}</div>
                              <ul style={{ margin: 0, paddingLeft: "14px" }}>
                                {bullets.map((b, bi) => (
                                  <li key={bi} style={{ fontSize: "11px", lineHeight: 1.6, marginBottom: "2px", color: "#475569" }}>
                                    {b.includes("[[?")
                                      ? b.split(/(\[\[\?.+?\?\]\])/g).map((seg, si) => {
                                          const m = seg.match(/^\[\[\?(.+?)\?\]\]$/)
                                          return m
                                            ? <span key={si} style={{ color: "#94a3b8", fontStyle: "italic" }}>「{m[1]}」</span>
                                            : <span key={si}>{seg}</span>
                                        })
                                      : b}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {!applied && s.action === "fill" && <p style={{ margin: "0 0 6px", fontSize: "10px", color: "#94a3b8", lineHeight: 1.4 }}>After adding, replace the placeholders in the editor</p>}
                          {!applied && (
                            <button onClick={() => onApplySuggestion(s)} style={{ width: "100%", padding: "7px", background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, color: "white", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                              {isAdd ? "Add to Projects" : "Add as draft"}
                            </button>
                          )}
                        </div>
                      )
                    }

                    return (
                      <div
                        key={s.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "14px",
                          border: applied
                            ? "1px solid #bbf7d0"
                            : "1px solid rgba(28,53,240,0.12)",
                          background: applied
                            ? "#f0fdf4"
                            : "linear-gradient(135deg, rgba(28,53,240,0.06), rgba(7,137,236,0.04))",
                          transition: "all 0.2s",
                        }}
                      >
                        {/* Header */}
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            marginBottom: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            color: applied ? "#16a34a" : "var(--ai-color-1)",
                          }}
                        >
                          {applied ? (
                            <>
                              <CheckCircle2 size={12} color="#16a34a" /> Applied
                            </>
                          ) : (
                            <>✦ AI suggestion</>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 600,
                            color: "#0f172a",
                            marginBottom: "2px",
                          }}
                        >
                          {s.label}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            fontWeight: 500,
                            marginBottom: "8px",
                          }}
                        >
                          {s.tip}
                        </div>
                        {/* Optimized content */}
                        {isSkills ? (
                          (() => {
                            const allSkills = s.optimizedContent as string[];
                            const newSkills = allSkills.filter(
                              (sk) => !existingSet.has(normalize(sk)),
                            );
                            const alreadyCount =
                              allSkills.length - newSkills.length;
                            const anyChecked = newSkills.some(
                              (sk) => !!skillChecks[sk],
                            );
                            return (
                              <div>
                                {newSkills.length > 0 ? (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        color: "#475569",
                                        marginBottom: "6px",
                                        letterSpacing: "0.3px",
                                      }}
                                    >
                                      Add these skills?
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "2px",
                                      }}
                                    >
                                      {newSkills.map((skill) => (
                                        <label
                                          key={skill}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "5px 8px",
                                            borderRadius: "10px",
                                            cursor: !applied
                                              ? "pointer"
                                              : "default",
                                            background:
                                              skillChecks[skill] && !applied
                                                ? "rgba(7,137,236,0.07)"
                                                : "rgba(0,0,0,0.02)",
                                            transition: "background 0.15s",
                                            border: "1px solid",
                                            borderColor:
                                              skillChecks[skill] && !applied
                                                ? "rgba(7,137,236,0.2)"
                                                : "transparent",
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={!!skillChecks[skill]}
                                            disabled={!!applied}
                                            onChange={(e) =>
                                              setSkillChecks((prev) => ({
                                                ...prev,
                                                [skill]: e.target.checked,
                                              }))
                                            }
                                            style={{
                                              accentColor: "var(--theme-blue)",
                                              width: "13px",
                                              height: "13px",
                                              flexShrink: 0,
                                              cursor: !applied
                                                ? "pointer"
                                                : "default",
                                            }}
                                          />
                                          <span
                                            style={{
                                              fontSize: "12px",
                                              color: "#0f172a",
                                              fontWeight: 600,
                                              flex: 1,
                                            }}
                                          >
                                            {skill}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "11px",
                                      color: "#94a3b8",
                                    }}
                                  >
                                    You've already added all suggested skills
                                  </p>
                                )}
                                {alreadyCount > 0 && (
                                  <p
                                    style={{
                                      margin: "8px 0 0",
                                      fontSize: "10px",
                                      color: "#94a3b8",
                                    }}
                                  >
                                    {alreadyCount}{" "}
                                    skill(s) are already in your resume
                                  </p>
                                )}
                                {/* Apply button inline for skills — disabled when nothing checked */}
                                {!applied && newSkills.length > 0 && (
                                  <button
                                    onClick={
                                      canApply && anyChecked
                                        ? () => {
                                            const selected = newSkills.filter(
                                              (sk) => skillChecks[sk],
                                            );
                                            onApplySuggestion(s, selected);
                                          }
                                        : undefined
                                    }
                                    disabled={!canApply || !anyChecked}
                                    style={{
                                      width: "100%",
                                      marginTop: "10px",
                                      padding: "7px",
                                      background:
                                        canApply && anyChecked
                                          ? "linear-gradient(135deg, var(--ai-color-1), var(--theme-blue))"
                                          : "#e2e8f0",
                                      color:
                                        canApply && anyChecked
                                          ? "white"
                                          : "#94a3b8",
                                      border: "none",
                                      borderRadius: "10px",
                                      fontFamily: "var(--font-sans)",
                                      fontSize: "12px",
                                      cursor:
                                        canApply && anyChecked
                                          ? "pointer"
                                          : "not-allowed",
                                      fontWeight: 600,
                                    }}
                                  >
                                    ✓ Add selected skills
                                  </button>
                                )}
                              </div>
                            );
                          })()
                        ) : s.section === "summary" ? (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "11px",
                              color: "#475569",
                              lineHeight: 1.65,
                              padding: "8px 10px",
                              background: "rgba(0,0,0,0.03)",
                              borderRadius: "10px",
                            }}
                          >
                            {Array.isArray(s.optimizedContent)
                              ? stripStray(
                                  (s.optimizedContent as string[])
                                    .filter(Boolean)
                                    .join(" "),
                                )
                              : stripStray(
                                  (s.optimizedContent as string).replace(
                                    /\n+/g,
                                    " ",
                                  ),
                                )}
                          </p>
                        ) : (s.section === "exp" || s.section === "project") &&
                          Array.isArray(s.optimizedContent) &&
                          (s.optimizedContent as string[]).some(
                            hasDiffMarkup,
                          ) ? (
                          // Inline diff format: show changeDescription + each bullet with coloured segments
                          <div>
                            {s.changeDescription && (
                              <p
                                style={{
                                  margin: "0 0 8px",
                                  fontSize: "11px",
                                  color: "#475569",
                                  lineHeight: 1.55,
                                  padding: "6px 10px",
                                  background: "rgba(0,0,0,0.03)",
                                  borderRadius: "10px",
                                }}
                              >
                                {s.changeDescription}
                              </p>
                            )}
                            <div
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#64748b",
                                marginBottom: "4px",
                                letterSpacing: "0.3px",
                              }}
                            >
                              Change preview (
                              <span style={{ color: "var(--ai-highlight)" }}>
                                purple
                              </span>
                              added ·{" "}
                              <span
                                style={{
                                  color: "#94a3b8",
                                  textDecoration: "line-through",
                                }}
                              >
                                removed
                              </span>
                              ）
                            </div>
                            <ul style={{ margin: 0, paddingLeft: "14px" }}>
                              {(s.optimizedContent as string[]).map((b, bi) => {
                                const segs = hasDiffMarkup(b)
                                  ? parseDiffBullet(b)
                                  : null;
                                return (
                                  <li
                                    key={bi}
                                    style={{
                                      fontSize: "11px",
                                      lineHeight: 1.6,
                                      marginBottom: "3px",
                                      color: "#475569",
                                    }}
                                  >
                                    {segs
                                      ? segs.map((seg, si) => {
                                          if (seg.type === "del")
                                            return (
                                              <span
                                                key={si}
                                                style={{
                                                  color: "#94a3b8",
                                                  textDecoration:
                                                    "line-through",
                                                }}
                                              >
                                                {seg.text}
                                              </span>
                                            );
                                          if (seg.type === "add") {
                                            // Split into space-separated tokens; tech terms get a border
                                            const parts =
                                              seg.text.split(/(\s+)/);
                                            return (
                                              <span key={si}>
                                                {parts.map((part, pi) =>
                                                  /^\s+$/.test(part) ? (
                                                    part
                                                  ) : (
                                                    <span
                                                      key={pi}
                                                      style={{
                                                        color:
                                                          "var(--ai-highlight)",
                                                        fontWeight: 600,
                                                        ...(isTechWord(
                                                          part,
                                                          currentSkills ?? [],
                                                        )
                                                          ? {
                                                              border:
                                                                "1px solid var(--ai-highlight)",
                                                              borderRadius:
                                                                "3px",
                                                              padding: "0 3px",
                                                              marginRight:
                                                                "1px",
                                                            }
                                                          : {}),
                                                      }}
                                                    >
                                                      {part}
                                                    </span>
                                                  ),
                                                )}
                                              </span>
                                            );
                                          }
                                          return (
                                            <span
                                              key={si}
                                              style={{ color: "#475569" }}
                                            >
                                              {seg.text}
                                            </span>
                                          );
                                        })
                                      : stripStray(b)}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : Array.isArray(s.optimizedContent) ? (
                          <ul style={{ margin: 0, paddingLeft: "14px" }}>
                            {(s.optimizedContent as string[]).map((b, bi) => (
                              <li
                                key={bi}
                                style={{
                                  fontSize: "11px",
                                  color: "#475569",
                                  lineHeight: 1.6,
                                  marginBottom: "2px",
                                }}
                              >
                                {stripStray(b)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "11px",
                              color: "#475569",
                              lineHeight: 1.55,
                            }}
                          >
                            {stripStray(
                              (s.optimizedContent as string).replace(
                                /\n+/g,
                                " ",
                              ),
                            )}
                          </p>
                        )}
                        {/* Apply button — skills have their own inline button above */}
                        {!applied && !isSkills && (
                          <button
                            onClick={
                              canApply ? () => onApplySuggestion(s) : undefined
                            }
                            disabled={!canApply}
                            style={{
                              width: "100%",
                              marginTop: "10px",
                              padding: "7px",
                              background: canApply
                                ? "linear-gradient(135deg, var(--ai-color-1), var(--theme-blue))"
                                : "#e2e8f0",
                              color: canApply ? "white" : "#94a3b8",
                              border: "none",
                              borderRadius: "10px",
                              fontFamily: "var(--font-sans)",
                              fontSize: "12px",
                              cursor: canApply ? "pointer" : "not-allowed",
                              fontWeight: 600,
                            }}
                          >
                            ✓ Apply
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Apply all */}
            {unappliedCount > 0 && (
              <button
                onClick={onApplyAll}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "10px",
                  background:
                    "linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))",
                  color: "white",
                  border: "none",
                  borderRadius: "14px",
                  fontFamily: "var(--font-sans)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                }}
              >
                Apply all ({unappliedCount})
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "12px",
                border: "1.5px solid #e2e8f0",
                background: "transparent",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const aiPanelLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "#64748b",
  display: "block",
  marginBottom: "6px",
};

export function ImportModal({
  filename,
  loading,
  onStart,
  onClose,
  onCancel,
}: {
  filename: string;
  loading: boolean;
  onStart: () => void;
  onClose: () => void;
  onCancel?: () => void;
}) {
  return (
    <ModalWrap onClose={loading ? () => {} : onClose}>
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: "28px",
            }}
          >
            Reading your resume
          </div>
          <ImportLoadingBar />
          <button
            onClick={onCancel}
            style={{
              marginTop: "24px",
              padding: "8px 24px",
              borderRadius: "12px",
              border: "1.5px solid #e2e8f0",
              background: "transparent",
              color: "#64748b",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "12px",
                background: "#e0f0fd",
                border: "1px solid rgba(13,148,136,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FileUp size={15} color="var(--theme-blue)" />
            </div>
            <div
              style={{ fontSize: "19px", fontWeight: 700, color: "#0f172a" }}
            >
              Import resume
            </div>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "14px 16px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <CheckCircle2 size={18} color="var(--theme-blue)" />
            <div>
              <div
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                {filename}
              </div>
              <div
                style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}
              >
                Your content will be imported into the default template
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                border: "1.5px solid #e2e8f0",
                background: "transparent",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onStart}
              style={{
                flex: 2,
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                background:
                  "linear-gradient(135deg, var(--theme-blue), #0c5cbd)",
                color: "white",
                fontFamily: "var(--font-sans)",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Start import
            </button>
          </div>
        </>
      )}
    </ModalWrap>
  );
}

// ─────────────────────────────────────────────────────────────
// Photo crop / position modal
// ─────────────────────────────────────────────────────────────
export function PhotoCropModal({
  src,
  loading,
  initialMeta,
  onConfirm,
  onReplace,
  onRemove,
  onClose,
}: {
  src: string;
  loading?: boolean;
  initialMeta?: {
    x: number;
    y: number;
    scale: number;
    natW?: number;
    natH?: number;
    shape?: "circle" | "rounded";
  };
  onConfirm: (meta: {
    x: number;
    y: number;
    scale: number;
    natW: number;
    natH: number;
    shape: "circle" | "rounded";
  }) => void;
  onReplace: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const PORTRAIT_RATIO = 4 / 3;

  const [shape, setShape] = useState<"circle" | "rounded">(
    initialMeta?.shape ?? "circle",
  );
  // Portrait shape uses a 3:4 ratio preview; circle uses a square.
  const previewW = shape === "rounded" ? 180 : 240;
  const previewH = shape === "rounded" ? Math.round(180 * PORTRAIT_RATIO) : 240;

  const [scale, setScale] = useState(initialMeta?.scale ?? 1);
  const [pos, setPos] = useState({
    x: initialMeta?.x ?? 0,
    y: initialMeta?.y ?? 0,
  });
  const [natSize, setNatSize] = useState<{ w: number; h: number } | null>(
    initialMeta?.natW ? { w: initialMeta.natW, h: initialMeta.natH! } : null,
  );
  const dragRef = useRef<{
    sx: number;
    sy: number;
    px: number;
    py: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Reset crop position and zoom when the user switches shape (different aspect ratio)
  useEffect(() => {
    setPos({ x: 0, y: 0 });
    setScale(1);
  }, [shape]);

  // Load natural dimensions whenever src changes (e.g. user replaces photo)
  useEffect(() => {
    const img = new Image();
    img.onload = () =>
      setNatSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  // Compute cover-fit base dimensions that preserve the image's natural aspect ratio.
  // At scale=1 the image exactly covers the preview; at scale>1 it's proportionally larger.
  const nat = natSize ?? { w: previewW, h: previewH };
  const coverScale = Math.max(previewW / nat.w, previewH / nat.h);
  const baseW = nat.w * coverScale;
  const baseH = nat.h * coverScale;
  const renderedW = Math.round(baseW * scale);
  const renderedH = Math.round(baseH * scale);

  // Per-axis pan limits: image must always fully cover the preview in both dimensions.
  const maxOffX = Math.max(0, (renderedW - previewW) / (2 * previewW));
  const maxOffY = Math.max(0, (renderedH - previewH) / (2 * previewH));
  const cx = Math.max(-maxOffX, Math.min(maxOffX, pos.x));
  const cy = Math.max(-maxOffY, Math.min(maxOffY, pos.y));

  const imgLeft = Math.round((previewW - renderedW) / 2 + cx * previewW);
  const imgTop = Math.round((previewH - renderedH) / 2 + cy * previewH);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: cx, py: cy };
    setDragging(true);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.sx) / previewW;
    const dy = (e.clientY - dragRef.current.sy) / previewH;
    setPos({ x: dragRef.current.px + dx, y: dragRef.current.py + dy });
  };
  const onUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.max(1, Math.min(3, s - e.deltaY * 0.001)));
  };

  // Hint text that adapts to image orientation
  const hint = !natSize
    ? "Loading…"
    : baseH > previewH + 1 && baseW > previewW + 1
      ? "Drag to move · scroll or slider to zoom"
      : baseH > previewH + 1
        ? "Drag up/down to reposition · zoom for more"
        : baseW > previewW + 1
          ? "Drag left/right to reposition · zoom for more"
          : "Drag to move · scroll or slider to zoom";

  const btnBase: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    transition: "background 0.15s",
  };

  return (
    <ModalWrap onClose={onClose}>
      <div
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: "6px",
          textAlign: "center",
        }}
      >
        Adjust photo
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        {loading ? "Processing photo, please wait…" : hint}
      </div>

      {/* Shape selector */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        {[
          {
            key: "circle" as const,
            label: "Circle",
            swatchW: 32,
            swatchH: 32,
            radius: "50%",
          },
          {
            key: "rounded" as const,
            label: "3:4",
            swatchW: 24,
            swatchH: 32,
            radius: "3px",
          },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setShape(opt.key)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              borderRadius: "14px",
              cursor: "pointer",
              border: `2px solid ${shape === opt.key ? "#6366f1" : "#e2e8f0"}`,
              background: shape === opt.key ? "#f5f3ff" : "white",
              transition: "all 0.15s",
              fontFamily: "var(--font-sans)",
            }}
          >
            <div
              style={{
                width: `${opt.swatchW}px`,
                height: `${opt.swatchH}px`,
                borderRadius: opt.radius,
                background: shape === opt.key ? "#6366f1" : "#e2e8f0",
                transition: "all 0.15s",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: shape === opt.key ? "#6366f1" : "#64748b",
              }}
            >
              {opt.label}
            </span>
          </button>
        ))}
      </div>

      {/* Crop preview */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <div
          onPointerDown={loading ? undefined : onDown}
          onPointerMove={loading ? undefined : onMove}
          onPointerUp={loading ? undefined : onUp}
          onWheel={loading ? undefined : onWheel}
          style={{
            width: previewW,
            height: previewH,
            borderRadius:
              shape === "rounded" ? "0" : "50%",
            overflow: "hidden",
            position: "relative",
            cursor: loading ? "default" : dragging ? "grabbing" : "grab",
            userSelect: "none",
            touchAction: "none",
            boxShadow: "0 0 0 3px #6366f130, 0 4px 20px rgba(0,0,0,0.12)",
            transition: "width 0.2s, height 0.2s, border-radius 0.2s",
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <>
              <style>{`@keyframes photoCropSpin{to{transform:rotate(360deg)}}`}</style>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                border: "3px solid rgba(99,102,241,0.2)",
                borderTopColor: "#6366f1",
                animation: "photoCropSpin 0.8s linear infinite",
              }} />
            </>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                width: `${renderedW}px`,
                height: `${renderedH}px`,
                left: `${imgLeft}px`,
                top: `${imgTop}px`,
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
          )}
        </div>
      </div>

      {/* Zoom slider */}
      <div style={{ marginBottom: "24px", opacity: loading ? 0.4 : 1, pointerEvents: loading ? "none" : "auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
            color: "#64748b",
            marginBottom: "8px",
          }}
        >
          <span>Zoom</span>
          <span style={{ fontWeight: 600, color: "#334155" }}>
            {Math.round(scale * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.02}
          value={scale}
          onChange={(e) => setScale(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "#6366f1", cursor: "pointer" }}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "8px", opacity: loading ? 0.4 : 1, pointerEvents: loading ? "none" : "auto" }}>
        <button
          onClick={onRemove}
          style={{
            ...btnBase,
            border: "1.5px solid #fee2e2",
            background: "#fff5f5",
            color: "#ef4444",
          }}
        >
          Remove
        </button>
        <button
          onClick={onReplace}
          style={{
            ...btnBase,
            flex: 1,
            border: "1.5px solid #e2e8f0",
            background: "white",
            color: "#334155",
          }}
        >
          Replace photo
        </button>
        <button
          disabled={!natSize}
          onClick={() =>
            natSize &&
            onConfirm({
              x: cx,
              y: cy,
              scale,
              natW: natSize.w,
              natH: natSize.h,
              shape,
            })
          }
          style={{
            ...btnBase,
            flex: 1,
            border: "none",
            background: natSize ? "#0f172a" : "#94a3b8",
            color: "white",
            fontWeight: 600,
          }}
        >
          Confirm
        </button>
      </div>
    </ModalWrap>
  );
}

// ─────────────────────────────────────────────────────────────
// Paywall modal
// ─────────────────────────────────────────────────────────────

export type PaywallTrigger =
  | "download_free" // free template, offer watermark-free upgrade + free download option
  | "download_pro" // pro template, must pay (no free option)
  | "ai_analyze" // job match analysis locked
  | "import_limit" // daily import quota hit
  | "compress" // one-page compress locked
  | "upgrade"; // direct upgrade from pricing page

export interface PaywallModalProps {
  trigger: PaywallTrigger;
  resumeId?: string; // current resume ID (for single purchase binding)
  templateId?: string; // current template ID (for single purchase binding)
  hideSingle?: boolean; // hide the single-unlock tab (e.g. landing page)
  deviceId: string;
  isStudent: boolean;
  isFirstOrder: boolean; // true → show ¥0.99 first-order price
  onClose: () => void;
  onSuccess: (planType: PlanType, orderId: string) => void;
  onFreeDownload?: () => void; // only for 'download_free'
  onOpenStudent: () => void;
}


type PaywallPhase = "plans" | "paying" | "success";
type ActiveTab = "single" | "sub";

export function PaywallModal(_props: PaywallModalProps) {
  // Payment removed — the app is free. This modal no longer renders anything.
  return null;
}

// ─────────────────────────────────────────────────────────────
// Student verification modal
// ─────────────────────────────────────────────────────────────

export function StudentModal(_props: { deviceId: string; onClose: () => void; onSuccess: () => void }) {
  // Student discount removed along with payment. No-op.
  return null;
}

function ModalWrap({
  children,
  onClose,
  wide,
  disableBackdropClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
  disableBackdropClose?: boolean;
}) {
  return (
    <div
      onClick={
        disableBackdropClose
          ? undefined
          : (e) => e.target === e.currentTarget && onClose()
      }
      className="no-print"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)",
        zIndex: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          padding: "28px",
          width: wide ? "480px" : "420px",
          maxWidth: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.25)",
          animation: "fadeUp 0.2s ease",
        }}
      >
        <style>{`@keyframes fadeUp{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
        {children}
      </div>
    </div>
  );
}

// ── New Resume Wizard ─────────────────────────────────────────────────────────
const USER_TYPES: { key: UserType; icon: React.ReactNode; label: string; desc: string }[] = [
  { key: 'student',     icon: <GraduationCap size={20} />, label: 'Student',   desc: 'Internships · campus projects · first job search' },
  { key: 'fresh',       icon: <Rocket size={20} />,        label: 'New graduate',   desc: 'Campus recruiting · first role · fresh start' },
  { key: 'experienced', icon: <Briefcase size={20} />,     label: 'Experienced', desc: 'Switching jobs · promotion · career growth' },
]

const INDUSTRIES: { key: Industry; icon: React.ReactNode; label: string }[] = [
  { key: 'tech',      icon: <Code2 size={18} />,      label: 'Tech / Dev' },
  { key: 'product',   icon: <Layers size={18} />,     label: 'Product / Design' },
  { key: 'marketing', icon: <Megaphone size={18} />,  label: 'Marketing / Ops' },
  { key: 'finance',   icon: <TrendingUp size={18} />, label: 'Finance' },
]

export function NewResumeWizardModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (data: ResumeData) => void
  onClose: () => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [industry, setIndustry] = useState<Industry | null>(null)

  function confirm(ind: Industry | null) {
    if (!userType) return
    const data = ind ? getStarterData(userType, ind) : DEMO_DATA
    onConfirm(data)
  }

  const cardBase: React.CSSProperties = {
    border: '1.5px solid #e2e8f0', borderRadius: '20px',
    padding: '16px 14px', cursor: 'pointer', transition: 'all 0.15s',
    background: 'white', textAlign: 'left' as const,
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
  }
  const cardSelected: React.CSSProperties = { border: '1.5px solid #0789ec', background: '#f0f9ff' }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="no-print"
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div style={{ background: 'white', borderRadius: '24px', padding: '32px 28px 28px', width: '480px', maxWidth: '100%', boxShadow: '0 20px 60px rgba(15,23,42,0.25)', animation: 'fadeUp 0.2s ease' }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>Step {step} of 2</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', lineHeight: 1 }}>
            <X size={18} />
          </button>
        </div>

        {step === 1 && (
          <>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Where are you in your career?</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>We'll suggest template content for your stage</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {USER_TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setUserType(t.key)}
                  style={{ ...cardBase, ...(userType === t.key ? cardSelected : {}) }}
                  onMouseEnter={e => { if (userType !== t.key) (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1' }}
                  onMouseLeave={e => { if (userType !== t.key) (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: userType === t.key ? '#0789ec' : '#475569', flexShrink: 0 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: userType === t.key ? '#0789ec' : '#0f172a' }}>{t.label}</div>
                      <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '1px' }}>{t.desc}</div>
                    </div>
                    {userType === t.key && (
                      <div style={{ marginLeft: 'auto', width: '18px', height: '18px', borderRadius: '50%', background: '#0789ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => userType && setStep(2)}
              disabled={!userType}
              style={{ width: '100%', padding: '13px', borderRadius: '9999px', fontSize: '15px', fontWeight: 700, border: 'none', cursor: userType ? 'pointer' : 'not-allowed', background: userType ? 'linear-gradient(135deg, #0789ec, #0f5fc2)' : '#e2e8f0', color: userType ? 'white' : '#94a3b8', transition: 'all 0.15s', fontFamily: 'var(--font-sans)' }}
            >
              Next
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>What's your target direction?</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>We'll add example content for that field — edit it anytime</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              {INDUSTRIES.map(ind => (
                <button
                  key={ind.key}
                  onClick={() => setIndustry(ind.key)}
                  style={{ ...cardBase, alignItems: 'center', flexDirection: 'row' as const, gap: '10px', ...(industry === ind.key ? cardSelected : {}) }}
                  onMouseEnter={e => { if (industry !== ind.key) (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1' }}
                  onMouseLeave={e => { if (industry !== ind.key) (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0' }}
                >
                  <span style={{ color: industry === ind.key ? '#0789ec' : '#475569', flexShrink: 0 }}>{ind.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: industry === ind.key ? '#0789ec' : '#0f172a' }}>{ind.label}</span>
                  {industry === ind.key && (
                    <div style={{ marginLeft: 'auto', width: '16px', height: '16px', borderRadius: '50%', background: '#0789ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => confirm(null)}
              style={{ width: '100%', padding: '10px', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', marginBottom: '10px', fontFamily: 'var(--font-sans)' }}
            >
              Skip, use a general template
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(1)} style={{ padding: '13px 20px', borderRadius: '9999px', fontSize: '14px', fontWeight: 600, border: '1.5px solid #e2e8f0', background: 'white', color: '#334155', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                Back
              </button>
              <button
                onClick={() => confirm(industry)}
                disabled={!industry}
                style={{ flex: 1, padding: '13px', borderRadius: '9999px', fontSize: '15px', fontWeight: 700, border: 'none', cursor: industry ? 'pointer' : 'not-allowed', background: industry ? 'linear-gradient(135deg, #0789ec, #0f5fc2)' : '#e2e8f0', color: industry ? 'white' : '#94a3b8', transition: 'all 0.15s', fontFamily: 'var(--font-sans)' }}
              >
                Create
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Cover Letter (Pro) ────────────────────────────────────────────────────────
// Placeholder panel: collects a job description + tone/length, then produces a
// local draft. The real generation will call /api/ai/cover-letter (resume + JD).
type CLTone = 'professional' | 'enthusiastic' | 'concise'
type CLLength = 'short' | 'standard'

const CL_TONES: { key: CLTone; label: string }[] = [
  { key: 'professional', label: 'Professional' },
  { key: 'enthusiastic', label: 'Enthusiastic' },
  { key: 'concise',      label: 'Concise' },
]
const CL_LENGTHS: { key: CLLength; label: string }[] = [
  { key: 'short',    label: 'Half page' },
  { key: 'standard', label: 'One page' },
]
const CL_MAX_JD = 5000

export function CoverLetterModal({
  data,
  onClose,
}: {
  data: ResumeData
  onClose: () => void
}) {
  const [jd, setJd] = useState('')
  const [tone, setTone] = useState<CLTone>('professional')
  const [length, setLength] = useState<CLLength>('standard')
  const [phase, setPhase] = useState<'input' | 'generating' | 'result'>('input')
  const [letter, setLetter] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  // Applicant header shown above the letter body — mirrors the resume's contact
  // visibility so the user can edit name / contact directly in the result box.
  const contactLine = [
    !data.hideEmail && data.email,
    !data.hidePhone && data.phone,
    !data.hideCity && data.city,
    !data.hideWebsite && data.website,
    ...(data.extraWebsites ?? []),
    ...(data.customContacts ?? []).filter((c) => !c.hidden).map((c) => c.value),
  ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0).join('  ·  ')
  const todayStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  function composeFullLetter(body: string): string {
    const lines: string[] = []
    if (data.name?.trim()) lines.push(data.name.trim())
    if (data.jobtitle?.trim()) lines.push(data.jobtitle.trim())
    if (contactLine) lines.push(contactLine)
    lines.push('', todayStr, '', '')
    return lines.join('\n') + body.trim()
  }

  async function generate() {
    if (!jd.trim()) {
      setError('Please paste the job description first — a cover letter needs a target role to tailor to.')
      return
    }
    setError('')
    setPhase('generating')
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: { ...data, photo: '', photoMeta: undefined },
          jobDesc: jd,
          tone,
          length,
          deviceId: getDeviceId(),
        }),
      })
      if (res.ok) {
        const json = await res.json()
        const body = typeof json.letter === 'string' ? json.letter : ''
        setLetter(composeFullLetter(body))
        setPhase('result')
      } else if (res.status === 429) {
        setError('Usage limit reached — please try again later.')
        setPhase('input')
      } else if (res.status === 413) {
        setError('That job description is too long — please shorten it and retry.')
        setPhase('input')
      } else {
        setError('Something went wrong. Please try again.')
        setPhase('input')
      }
    } catch {
      setError('Network error. Please try again.')
      setPhase('input')
    }
  }

  function copy() {
    navigator.clipboard?.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function downloadPDF() {
    const name = data.name?.trim() || 'Cover Letter'
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // The editable letter already carries the applicant header, contact and date,
    // so render it as-is. The first block is treated as a letterhead (name big,
    // the rest muted); everything after is body paragraphs.
    const paragraphs = letter.trim().split(/\n{2,}/).map((p, i) => {
      if (i === 0) {
        const ls = p.split('\n').filter((l) => l.trim().length > 0)
        return `<div class="head">${esc(ls[0] ?? '')}</div>` +
          ls.slice(1).map((l) => `<div class="sub">${esc(l)}</div>`).join('')
      }
      return `<p>${esc(p).replace(/\n/g, '<br>')}</p>`
    }).join('')
    const w = window.open('', '_blank', 'width=900,height=1100')
    if (!w) return
    w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(name)} — Cover Letter</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#e2e8f0; font-family:Inter,'Noto Sans SC',sans-serif; color:#1e293b; }
  .page { width:210mm; min-height:297mm; margin:0 auto; background:#fff; padding:28mm 24mm; }
  .head { font-size:22px; font-weight:700; color:#0f172a; }
  .sub { font-size:12.5px; color:#64748b; margin-top:3px; }
  .sub + p { margin-top:22px; }
  p { font-size:13.5px; line-height:1.7; margin-bottom:13px; }
  @media print { @page{ size:A4; margin:0; } body{ background:#fff; } .page{ margin:0; box-shadow:none; } }
</style>
</head>
<body>
<div class="page">
  ${paragraphs}
</div>
<script>
  (document.fonts ? document.fonts.ready : Promise.resolve())
    .then(function(){ setTimeout(function(){ window.print(); }, 150); })
    .catch(function(){ setTimeout(function(){ window.print(); }, 1200); });
<\/script>
</body>
</html>`)
    w.document.close()
  }

  const proPill: React.CSSProperties = {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
    background: 'linear-gradient(135deg, #0789ec, #0f5fc2)', color: '#fff',
    padding: '2px 8px', borderRadius: '9999px', textTransform: 'uppercase',
  }
  const chip = (active: boolean): React.CSSProperties => ({
    padding: '7px 13px', borderRadius: '9999px', fontSize: '12.5px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
    border: `1.5px solid ${active ? '#0789ec' : '#e2e8f0'}`,
    background: active ? 'rgba(7,137,236,0.08)' : '#fff',
    color: active ? '#0789ec' : '#64748b', transition: 'all 0.15s',
  })

  return (
    <ModalWrap onClose={onClose} wide disableBackdropClose={phase !== 'input'}>
      <style>{`@keyframes clSpin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '6px' }}>
        <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Cover Letter</h2>
        <span style={proPill}>Pro</span>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ marginLeft: 'auto', width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}
        >
          <X size={16} />
        </button>
      </div>
      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 18px', lineHeight: 1.5 }}>
        Paste the job description and we&apos;ll draft a tailored letter from your resume.
      </p>

      {error && (
        <div style={{ fontSize: '12.5px', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '9px 12px', marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {phase === 'input' && (
        <>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              maxLength={CL_MAX_JD}
              placeholder="Paste the job description here…"
              style={{
                width: '100%', minHeight: '120px', boxSizing: 'border-box', resize: 'vertical',
                padding: '12px', paddingRight: jd ? '34px' : '12px', borderRadius: '12px',
                border: `1.5px solid ${jd.length >= CL_MAX_JD ? '#f59e0b' : '#e2e8f0'}`,
                fontSize: '13px', fontFamily: 'var(--font-sans)', color: '#334155', outline: 'none',
                lineHeight: 1.5,
              }}
            />
            {jd && (
              <button
                onClick={() => setJd('')}
                aria-label="Clear"
                style={{ position: 'absolute', top: '8px', right: '8px', width: '22px', height: '22px', borderRadius: '6px', border: 'none', background: 'rgba(100,116,139,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(100,116,139,0.25)'; e.currentTarget.style.color = '#475569' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(100,116,139,0.12)'; e.currentTarget.style.color = '#94a3b8' }}
              >
                <X size={12} />
              </button>
            )}
            <div style={{ position: 'absolute', bottom: '8px', right: '10px', fontSize: '11px', color: jd.length >= CL_MAX_JD ? '#f59e0b' : '#94a3b8', pointerEvents: 'none' }}>
              {jd.length}/{CL_MAX_JD}
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '7px' }}>Tone</div>
            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
              {CL_TONES.map((t) => (
                <button key={t.key} onClick={() => setTone(t.key)} style={chip(tone === t.key)}>{t.label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '7px' }}>Length</div>
            <div style={{ display: 'flex', gap: '7px' }}>
              {CL_LENGTHS.map((l) => (
                <button key={l.key} onClick={() => setLength(l.key)} style={chip(length === l.key)}>{l.label}</button>
              ))}
            </div>
          </div>
          <button
            onClick={generate}
            style={{
              width: '100%', padding: '13px', borderRadius: '9999px', fontSize: '15px', fontWeight: 700,
              border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #0789ec, #0f5fc2)', color: '#fff',
              fontFamily: 'var(--font-sans)',
            }}
          >
            ✦ Generate cover letter
          </button>
        </>
      )}

      {phase === 'generating' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '48px 0' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0789ec', animation: 'clSpin 0.8s linear infinite' }} />
          <div style={{ fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>Generating your cover letter…</div>
        </div>
      )}

      {phase === 'result' && (
        <>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
            Edit anything below — your name, contact details, date and the letter body.
          </div>
          <textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            style={{
              width: '100%', minHeight: '320px', boxSizing: 'border-box', resize: 'vertical',
              padding: '16px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
              fontSize: '13.5px', fontFamily: 'var(--font-sans)', color: '#1e293b', outline: 'none',
              lineHeight: 1.65, marginBottom: '16px', whiteSpace: 'pre-wrap',
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setPhase('input')}
              style={{ padding: '11px 18px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              Back
            </button>
            <button
              onClick={copy}
              style={{ padding: '11px 18px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
            <button
              onClick={downloadPDF}
              style={{ flex: 1, padding: '11px', borderRadius: '9999px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #0789ec, #0f5fc2)', color: '#fff', fontFamily: 'var(--font-sans)' }}
            >
              Download PDF
            </button>
          </div>
        </>
      )}
    </ModalWrap>
  )
}
