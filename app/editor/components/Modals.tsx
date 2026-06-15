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
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Lightbulb,
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
import {
  addPayment,
  generateOrderId,
  PRICES,
  PLAN_DURATION_MS,
  setStudentRecord,
  hasRedeemedCode,
  markCodeRedeemed,
} from "../../lib/payment";
import type { PlanType, PayMethod } from "../../lib/payment";

export function ContinueModal({
  docTitle,
  savedAt,
  onContinue,
  onNew,
}: {
  docTitle: string;
  savedAt: number;
  onContinue: () => void;
  onNew: () => void;
}) {
  function fmt(ts: number) {
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return (
    <ModalWrap onClose={onNew} disableBackdropClose>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          继续上次编辑？
        </div>
        <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
          发现上次未完成的简历，是否继续编辑？
        </div>
      </div>

      <div
        style={{
          padding: "14px 16px",
          borderRadius: "14px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontSize: "13.5px",
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: "4px",
          }}
        >
          {docTitle || "我的简历"}
        </div>
        <div style={{ fontSize: "12px", color: "#94a3b8" }}>
          上次编辑：{fmt(savedAt)}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={onContinue}
          style={{
            flex: 1,
            padding: "12px",
            background: "#0f172a",
            color: "white",
            border: "none",
            borderRadius: "14px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <FilePen size={15} /> 继续编辑
        </button>
        <button
          onClick={onNew}
          style={{
            flex: 1,
            padding: "12px",
            background: "white",
            color: "#334155",
            border: "1.5px solid #e2e8f0",
            borderRadius: "14px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <Plus size={15} /> 创建新简历
        </button>
      </div>
    </ModalWrap>
  );
}

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
      label: "PNG 图片",
      sub: isPaid ? "高清图片 · 适合直接分享" : "Pro 功能",
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
        下载简历
      </div>
      <p
        style={{
          fontSize: "13.5px",
          color: "#64748b",
          marginBottom: "20px",
          lineHeight: 1.5,
        }}
      >
        选择下载格式，生成后自动保存到本地
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
            PDF 格式
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            推荐 · 适合投递使用
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
            Pro 模板 · 当前下载含水印
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
            解锁无水印 ¥19
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
        取消
      </button>
    </ModalWrap>
  );
}

function formatSkillTag(s: string): string {
  return s
    .replace(/^无([^\s])/, "需$1")
    .replace(/^不会/, "需掌握")
    .replace(/^[缺欠]乏?/, "需")
    .replace(/^需需/, "需");
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
  interviewData?: { questions: string[]; answers: string[] } | null;
  interviewLoading?: boolean;
  onGenerateInterview?: () => void;
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
    label: "高级前端工程师",
    text: `岗位职责：
1. 负责核心产品前端架构设计与开发，推动工程化体系建设
2. 与产品/设计/后端协作，推动功能高质量落地
3. 持续优化页面性能，关注核心 Web 指标（LCP/FID/CLS）

任职要求：
- 3年以上前端经验，精通 React/Vue3，熟练 TypeScript
- 熟悉 Webpack/Vite，有性能调优经验
- 了解 Node.js，有微前端、移动端 H5/小程序开发经验优先`,
  },
  {
    label: "产品经理",
    text: `岗位职责：
1. 负责产品从 0 到 1 规划与迭代，驱动业务目标达成
2. 深入业务场景，洞察用户需求，输出 PRD 和原型
3. 跨部门推动项目落地，跟踪数据并持续优化

任职要求：
- 3年以上互联网产品经验，有完整 C 端或 B 端产品经历
- 熟练使用 Figma/Axure，具备数据分析能力
- 有 AI 产品、SaaS 或电商平台经验者优先`,
  },
  {
    label: "全栈工程师",
    text: `岗位职责：
1. 独立完成 Web 应用前后端开发，快速验证业务需求
2. 设计 RESTful API，参与数据库建模与性能优化
3. 参与技术选型，推动工程规范落地

任职要求：
- 掌握 React/Vue 前端框架，熟悉 Node.js/Python 后端
- 熟悉 MySQL/PostgreSQL，了解 Redis 缓存机制
- 有 Docker/云服务使用经验，有独立产品者加分`,
  },
  {
    label: "UI/UX 设计师",
    text: `岗位职责：
1. 负责 App/Web 端交互设计与视觉输出，参与设计系统建设
2. 深入理解用户需求，通过研究和测试持续迭代产品体验
3. 与研发协作，确保设计还原度和交互一致性

任职要求：
- 3年以上互联网 UI/UX 设计经验
- 熟练使用 Figma，能输出完整设计规范和组件库
- 作品集需包含完整设计项目，从研究到交付`,
  },
];

export function AIPanel({
  phase,
  analysis,
  appliedSuggestionIds,
  jobDesc,
  currentSkills,
  currentSummary,
  interviewData,
  interviewLoading,
  onGenerateInterview,
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
  const [showInterviewQ, setShowInterviewQ] = useState(false);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(
    new Set(),
  );
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
    { after: 0, msg: "正在分析简历结构与亮点…" },
    { after: 3500, msg: "评估工作经历与技能水平…" },
    { after: 7000, msg: "评估岗位匹配度…" },
    { after: 11000, msg: "生成优化建议…" },
  ];

  const toggleAnswer = (i: number) => {
    setExpandedAnswers((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  // Collapse interview questions whenever new analysis arrives
  useEffect(() => {
    setShowInterviewQ(false);
    setExpandedAnswers(new Set());
  }, [analysis]);

  // Auto-expand when interview generation completes
  useEffect(() => {
    if (interviewData && interviewData.questions.length > 0) {
      setShowInterviewQ(true);
    }
  }, [interviewData]);

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
  const interviewQuestions = interviewData?.questions ?? [];
  const interviewAnswers = interviewData?.answers ?? [];
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
          AI 解析 & 定向优化
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
              AI 扫描识别中...
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              正在匹配模板并填入简历内容
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
                目标职位描述{" "}
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: "11px",
                    letterSpacing: 0,
                    textTransform: "none",
                    color: "#94a3b8",
                  }}
                >
                  （可选，但强烈推荐）
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <textarea
                  value={jobDesc}
                  onChange={(e) => onJobDescChange(e.target.value)}
                  placeholder="粘贴目标岗位详情，AI 将精准命中岗位关键词..."
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
                  内容过长，请删减至 3000 字以内
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
                  试试：
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
                为什么强烈建议添加目标职位？
              </div>
              <div
                style={{
                  fontSize: "11.5px",
                  color: "#475569",
                  lineHeight: 1.65,
                }}
              >
                AI 将根据目标岗位的硬核技术栈与关键词进行
                <strong style={{ color: "#6d28d9" }}>精准定向微调</strong>，直击
                HR 痛点，匹配率暴增。
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
              {jobDesc.trim() ? <>开始精准定向优化</> : "开始常规智能优化"}
            </button>

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
                  次数已用完 · 升级 Pro <strong>每日 20 次</strong>
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
                  {analyzeLoggedIn ? "升级 Pro" : "登录升级 Pro"}
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
                  今日 20 次已用完 · 明日 00:00 自动重置
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
                const offerColor =
                  offerRate >= 70
                    ? "var(--theme-blue)"
                    : offerRate >= 50
                      ? "#eab308"
                      : offerRate >= 30
                        ? "#f97316"
                        : "#ef4444";
                return (
                  <div
                    style={{
                      background: "#0a0a0f",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        color: "var(--theme-blue)",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Target size={9} color="var(--theme-blue)" />{" "}
                      工作匹配率
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
                            color: "rgba(255,255,255,0.35)",
                            marginBottom: "4px",
                          }}
                        >
                          当前预计
                        </div>
                        <div
                          style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "30px",
                            fontWeight: 800,
                            color: offerColor,
                            lineHeight: 1,
                          }}
                        >
                          {offerRate}%
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          color: "rgba(255,255,255,0.2)",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        →<br />
                        AI优化
                      </div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: "9px",
                            color: "rgba(255,255,255,0.35)",
                            marginBottom: "4px",
                          }}
                        >
                          优化后预计
                        </div>
                        <div
                          style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: "30px",
                            fontWeight: 800,
                            color: "var(--theme-blue)",
                            lineHeight: 1,
                          }}
                        >
                          {optimizedRate}%
                        </div>
                        <div
                          style={{
                            fontSize: "9px",
                            color: "var(--theme-blue)",
                            fontWeight: 600,
                            marginTop: "3px",
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
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${editorAnimRate}%`,
                          height: "100%",
                          background:
                            "linear-gradient(90deg, var(--theme-blue), #0f5fc2)",
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
                总体评估
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
                  "简历结构清晰，工作经历描述详实。核心技能匹配度良好，建议进一步量化成果指标，突出差异化优势。"}
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
                    职位不符部分
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

            {/* Interview questions — on-demand */}
            {analysis && (
              <div style={{ marginBottom: "12px" }}>
                <style>{`
                  @keyframes answerSlide { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
                  @keyframes spin { to { transform: rotate(360deg) } }
                `}</style>
                {interviewQuestions.length === 0 ? (
                  <button
                    onClick={() => !interviewLoading && onGenerateInterview?.()}
                    disabled={interviewLoading}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                      padding: "10px 12px",
                      background: interviewLoading
                        ? "#f8fafc"
                        : "rgba(13,148,136,0.06)",
                      border: `1px solid ${interviewLoading ? "#e2e8f0" : "rgba(13,148,136,0.3)"}`,
                      borderRadius: "12px",
                      cursor: interviewLoading ? "default" : "pointer",
                      fontFamily: "var(--font-sans)",
                      transition: "all 0.2s",
                    }}
                  >
                    {interviewLoading ? (
                      <>
                        <span
                          style={{
                            width: "12px",
                            height: "12px",
                            border: "2px solid #e2e8f0",
                            borderTopColor: "var(--teal)",
                            borderRadius: "50%",
                            animation: "spin 0.7s linear infinite",
                            display: "inline-block",
                          }}
                        />
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          正在生成面试题…
                        </span>
                      </>
                    ) : (
                      <>
                        <MessageSquare size={11} color="var(--teal)" />
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--teal)",
                          }}
                        >
                          生成面试题预测
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowInterviewQ((v) => !v)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: showInterviewQ ? "12px 12px 0 0" : "12px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                        }}
                      >
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "12px",
                            background: "var(--teal)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MessageSquare size={9} color="white" />
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#334155",
                          }}
                        >
                          预测面试题
                        </span>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                          ({interviewQuestions.length} 道)
                        </span>
                      </div>
                      {showInterviewQ ? (
                        <ChevronUp size={13} color="#64748b" />
                      ) : (
                        <ChevronDown size={13} color="#64748b" />
                      )}
                    </button>
                    {showInterviewQ && (
                      <div
                        style={{
                          border: "1px solid #e2e8f0",
                          borderTop: "none",
                          borderRadius: "0 0 12px 12px",
                          background: "#f8fafc",
                          maxHeight: "320px",
                          overflowY: "auto",
                        }}
                      >
                        {interviewQuestions.map((q, i) => {
                          const hasAnswer = !!interviewAnswers[i];
                          const answerExpanded = expandedAnswers.has(i);
                          return (
                            <div
                              key={i}
                              style={{
                                borderTop:
                                  i > 0
                                    ? "1px solid rgba(14,165,233,0.12)"
                                    : "none",
                              }}
                            >
                              <div
                                onClick={() => hasAnswer && toggleAnswer(i)}
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  alignItems: "flex-start",
                                  padding: "8px 12px",
                                  cursor: hasAnswer ? "pointer" : "default",
                                }}
                              >
                                <span
                                  style={{
                                    minWidth: "17px",
                                    height: "17px",
                                    borderRadius: "50%",
                                    background: "rgba(13,148,136,0.12)",
                                    color: "var(--teal)",
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    marginTop: "2px",
                                  }}
                                >
                                  {i + 1}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span
                                    style={{
                                      fontSize: "11.5px",
                                      color: "#334155",
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    {q}
                                  </span>
                                  {hasAnswer && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "3px",
                                        marginTop: "3px",
                                      }}
                                    >
                                      <Lightbulb size={9} color="var(--teal)" />
                                      <span
                                        style={{
                                          fontSize: "9.5px",
                                          color: "var(--teal)",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {answerExpanded ? "收起" : "回答建议"}
                                      </span>
                                      {answerExpanded ? (
                                        <ChevronUp
                                          size={9}
                                          color="var(--teal)"
                                        />
                                      ) : (
                                        <ChevronDown
                                          size={9}
                                          color="var(--teal)"
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {hasAnswer && answerExpanded && (
                                <div
                                  style={{
                                    margin: "0 12px 8px 37px",
                                    padding: "8px 10px",
                                    background: "rgba(13,148,136,0.07)",
                                    borderRadius: "10px",
                                    borderLeft: "2px solid var(--teal)",
                                    animation: "answerSlide 0.2s ease",
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "10.5px",
                                      color: "#334155",
                                      lineHeight: 1.65,
                                    }}
                                  >
                                    {interviewAnswers[i]}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
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
                  优化方向
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
                    （✦ 标注处）
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
                            {applied ? <><CheckCircle2 size={12} color="#16a34a" /> 已移除</> : <>✕ AI 建议移除</>}
                          </div>
                          <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#0f172a", marginBottom: "2px" }}>{s.label}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, marginBottom: s.changeDescription ? "6px" : "0" }}>{s.tip}</div>
                          {s.changeDescription && <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#7f1d1d", lineHeight: 1.55, padding: "6px 10px", background: "rgba(239,68,68,0.07)", borderRadius: "8px" }}>{s.changeDescription}</p>}
                          {!applied && (
                            <button onClick={() => onApplySuggestion(s)} style={{ width: "100%", marginTop: "6px", padding: "7px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                              确认移除此段经历
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
                            {applied ? <><CheckCircle2 size={12} color="#16a34a" /> 已添加</> : isAdd ? <>＋ AI 建议新增项目</> : <>○ AI 建议补充框架</>}
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
                          {!applied && s.action === "fill" && <p style={{ margin: "0 0 6px", fontSize: "10px", color: "#94a3b8", lineHeight: 1.4 }}>添加后请在编辑器中替换占位符</p>}
                          {!applied && (
                            <button onClick={() => onApplySuggestion(s)} style={{ width: "100%", padding: "7px", background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, color: "white", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                              {isAdd ? "添加到项目经历" : "以草稿形式添加"}
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
                              <CheckCircle2 size={12} color="#16a34a" /> 已应用
                            </>
                          ) : (
                            <>✦ AI 优化建议</>
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
                                      是否添加以下技能
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
                                    建议中的技能您已全部添加
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
                                    另有 {alreadyCount}{" "}
                                    项技能您的简历中已有，无需重复添加
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
                                    ✓ 添加所选技能
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
                              改动预览（
                              <span style={{ color: "var(--ai-highlight)" }}>
                                紫色
                              </span>
                              新增 ·{" "}
                              <span
                                style={{
                                  color: "#94a3b8",
                                  textDecoration: "line-through",
                                }}
                              >
                                删除
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
                            ✓ 应用优化
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
                全部应用（{unappliedCount} 条）
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
              关闭
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
            AI 正在识别简历
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
            取消
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
              导入简历
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
                将使用默认免费模版导入简历内容
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
              取消
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
              开始导入
            </button>
          </div>
        </>
      )}
    </ModalWrap>
  );
}

export function PaymentModal({
  templateName,
  onClose,
  onSuccess,
}: {
  templateName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPaid(true);
    }, 2000);
  };

  return (
    <ModalWrap onClose={onClose}>
      {paid ? (
        <>
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <CheckCircle2
              size={48}
              color="var(--theme-blue)"
              style={{ margin: "0 auto 12px" }}
            />
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "6px",
              }}
            >
              支付成功！
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
                marginBottom: "20px",
              }}
            >
              已解锁「{templateName}」无水印下载
            </p>
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                background: "var(--theme-blue)",
                color: "white",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              立即下载无水印版
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "4px",
              color: "#0f172a",
            }}
          >
            解锁模板
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "20px",
              lineHeight: 1.5,
            }}
          >
            解锁「{templateName}」· 永久使用 · 无水印下载
          </p>
          {/* Mock WeChat QR code */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "20px",
              background: "#f8fafc",
              borderRadius: "12px",
              marginBottom: "14px",
              border: "1px solid #e2e8f0",
            }}
          >
            <Smartphone
              size={16}
              color="#64748b"
              style={{ marginBottom: "8px" }}
            />
            <div
              style={{
                fontSize: "12px",
                color: "#64748b",
                marginBottom: "12px",
              }}
            >
              微信扫码支付
            </div>
            {/* QR code placeholder */}
            <div
              style={{
                width: "140px",
                height: "140px",
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <QrCode size={100} color="#0f172a" />
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#0f172a",
                marginTop: "12px",
              }}
            >
              ¥19
            </div>
          </div>
          <button
            onClick={handlePay}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              background: loading ? "#94a3b8" : "#07c160",
              color: "white",
              border: "none",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              fontFamily: "var(--font-sans)",
              marginBottom: "8px",
            }}
          >
            {loading ? "支付确认中..." : "模拟支付（测试）"}
          </button>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: "transparent",
              fontSize: "13px",
              cursor: "pointer",
              color: "#64748b",
              fontFamily: "var(--font-sans)",
            }}
          >
            取消
          </button>
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
    ? "加载中…"
    : baseH > previewH + 1 && baseW > previewW + 1
      ? "拖拽移动 · 滚轮或滑块缩放"
      : baseH > previewH + 1
        ? "上下拖拽调整位置 · 缩放查看更多"
        : baseW > previewW + 1
          ? "左右拖拽调整位置 · 缩放查看更多"
          : "拖拽移动 · 滚轮或滑块缩放";

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
        调整照片
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        {loading ? "正在处理照片，请稍候…" : hint}
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
            label: "圆形",
            swatchW: 32,
            swatchH: 32,
            radius: "50%",
          },
          {
            key: "rounded" as const,
            label: "证件照",
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
          <span>缩放</span>
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
          移除
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
          更换照片
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
          确认
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
  | "ai_translate" // Chinese→English resume generation locked
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

const TRIGGER_COPY: Record<PaywallTrigger, { title: string; sub: string }> = {
  download_free: {
    title: "升级 Pro 享无水印下载",
    sub: "去掉简历底部水印，更专业地投递",
  },
  download_pro: {
    title: "升级 Pro 享无水印下载",
    sub: "去掉简历底部水印，更专业地投递",
  },
  ai_translate: {
    title: "一键生成英文简历",
    sub: "订阅 Pro 会员，将中文简历智能翻译为英文版",
  },
  ai_analyze: {
    title: "解锁岗位匹配分析",
    sub: "分析简历与目标职位的匹配度，获得针对性建议",
  },
  compress: {
    title: "压缩至 1 页",
    sub: "订阅 Pro 会员，AI 自动精简描述 · 智能字号缩放",
  },
  import_limit: {
    title: "今日导入次数已用完",
    sub: "免费用户每天可导入 2 份，升级 Pro 每天 10 份",
  },
  upgrade: {
    title: "升级 Pro 会员",
    sub: "解锁全部功能 · 无水印下载 · AI 分析每日 20 次",
  },
};

const PLAN_META = {
  monthly: { label: "月卡", period: "月", badge: "", saving: "" },
  quarterly: {
    label: "季卡",
    period: "季",
    badge: "求职季首选",
    saving: "省21%",
  },
  yearly: { label: "年卡", period: "年", badge: "", saving: "省52%" },
};

const SUB_BENEFITS = [
  "无水印 PDF 下载",
  "AI 简历优化 20 次/天",
  "ATS 检测 5 次/天",
  "岗位匹配分析 & 面试题预测",
  "一键生成英文简历（5 次/天）",
  "一键压缩至 1 页",
  "简历智能导入（10 次/天）",
];

const SINGLE_BENEFITS = ["本份简历无水印下载", "AI 优化 5次", "ATS 检测 5次", "永久重新下载"];

function fmtFen(fen: number): string {
  const y = fen / 100;
  return `¥${y % 1 === 0 ? y : y.toFixed(2)}`;
}

type PaywallPhase = "plans" | "paying" | "success";
type ActiveTab = "single" | "sub";

export function PaywallModal({
  trigger,
  resumeId,
  templateId,
  hideSingle = false,
  deviceId,
  isStudent,
  isFirstOrder,
  onClose,
  onSuccess,
  onFreeDownload,
  onOpenStudent,
}: PaywallModalProps) {
  const [tab, setTab] = useState<ActiveTab>("sub");
  const [phase, setPhase] = useState<PaywallPhase>("plans");
  const [selectedPlan, setSelectedPlan] = useState<
    "monthly" | "quarterly" | "yearly"
  >("quarterly");
  const [pendingType, setPendingType] = useState<PlanType | null>(null);
  const [pendingOrder, setPendingOrder] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confirmedRef = useRef(false);
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoOk, setPromoOk] = useState("");
  // Server-authoritative amount — overrides client estimate once QR is created
  const [serverAmountFen, setServerAmountFen] = useState<number | null>(null);

  const copy = TRIGGER_COPY[trigger];
  const showFreeOption = trigger === "download_free" && !!onFreeDownload;

  const singlePrice = isFirstOrder
    ? PRICES.singleFirst.normal
    : isStudent
      ? PRICES.single.student
      : PRICES.single.normal;

  const subPrice = (p: "monthly" | "quarterly" | "yearly") =>
    isStudent ? PRICES[p].student : PRICES[p].normal;

  const PLAN_TITLE: Record<string, string> = {
    trial7: "7天体验卡",
    monthly: "月卡",
    quarterly: "季卡",
    yearly: "年卡",
    single: "单次解锁",
  };

  function confirmPaid(planType: PlanType, orderId: string, amountFen: number) {
    const now = Date.now();
    const expiresAt =
      planType !== "single" ? now + PLAN_DURATION_MS[planType] : undefined;
    addPayment({
      orderId,
      deviceId,
      planType,
      amount: amountFen,
      isStudent,
      resumeId: planType === "single" ? resumeId : undefined,
      templateId: planType === "single" ? templateId : undefined,
      paidAt: now,
      expiresAt,
      payMethod: "wechat",
      aiAnalyzeUsed: 0,
    });
    setPhase("success");
    setTimeout(() => {
      onSuccess(planType, orderId);
      onClose();
    }, 1200);
  }

  function stopPoll() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPoll(orderId: string, planType: PlanType, amountFen: number) {
    stopPoll();
    confirmedRef.current = false;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/query?orderId=${orderId}`);
        const data = await res.json();
        if (data.paid && !confirmedRef.current) {
          confirmedRef.current = true;
          stopPoll();
          confirmPaid(planType, orderId, amountFen);
        }
      } catch {
        /* network hiccup, keep polling */
      }
    }, 2500);
  }

  async function startPay(planType: PlanType) {
    const orderId = generateOrderId();
    const amountFen =
      planType === "single"
        ? singlePrice
        : planType === "monthly"
          ? subPrice("monthly")
          : planType === "quarterly"
            ? subPrice("quarterly")
            : subPrice("yearly");
    setPendingType(planType);
    setPendingOrder(orderId);
    setQrError("");
    setQrDataUrl(null);
    setQrLoading(true);
    setPhase("paying");

    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          planType,
          amountFen,
          isStudent,
          deviceId,
          resumeId,
          templateId,
          title: `简力全开 ${PLAN_TITLE[planType]}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setQrError(data.error ?? "创建支付失败");
        setQrLoading(false);
        return;
      }
      const actualFen: number = data.amountFen ?? amountFen;
      setServerAmountFen(actualFen);
      setQrDataUrl(data.qrDataUrl);
      setQrLoading(false);
      startPoll(orderId, planType, actualFen);
    } catch {
      setQrError("网络错误，请重试");
      setQrLoading(false);
    }
  }

  // Clean up polling when modal unmounts
  useEffect(() => () => stopPoll(), []);

  async function redeemPromo() {
    const trimmed = promoCode.trim();
    if (!trimmed) return;
    if (hasRedeemedCode(trimmed)) {
      setPromoError("此兑换码已使用过");
      return;
    }
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (!data.valid) {
        setPromoError(data.error ?? "兑换码无效");
        return;
      }
      const planType = data.plan as PlanType;
      const now = Date.now();
      const orderId = generateOrderId();
      const expiresAt = PLAN_DURATION_MS[planType]
        ? now + PLAN_DURATION_MS[planType]
        : undefined;
      addPayment({
        orderId,
        deviceId,
        planType,
        amount: 0,
        isStudent,
        paidAt: now,
        expiresAt,
        payMethod: "wechat",
        aiAnalyzeUsed: 0,
      });
      markCodeRedeemed(trimmed);
      const PLAN_ZH: Record<string, string> = {
        trial7: "7天体验卡",
        monthly: "月卡",
        quarterly: "季卡",
        yearly: "年卡",
      };
      setPromoOk(`🎉 ${data.label ?? PLAN_ZH[planType] ?? planType}已激活！`);
      setTimeout(() => {
        onSuccess(planType, orderId);
        onClose();
      }, 1200);
    } catch {
      setPromoError("网络错误，请重试");
    } finally {
      setPromoLoading(false);
    }
  }

  // ── Success overlay ──────────────────────────────────────────
  if (phase === "success") {
    return (
      <ModalWrap onClose={() => {}}>
        <style>{`@keyframes pwSuccess{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}`}</style>
        <div style={{ textAlign: "center", padding: "28px 16px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              animation: "pwSuccess 0.4s ease",
            }}
          >
            <CheckCircle2 size={34} color="#16a34a" />
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "6px",
            }}
          >
            支付成功！
          </div>
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            正在为你解锁权益…
          </div>
        </div>
      </ModalWrap>
    );
  }

  // ── QR / paying phase ────────────────────────────────────────
  if (phase === "paying") {
    const clientAmount = !pendingType
      ? 0
      : pendingType === "single"
        ? singlePrice
        : pendingType === "monthly"
          ? subPrice("monthly")
          : pendingType === "quarterly"
            ? subPrice("quarterly")
            : subPrice("yearly");
    // Use server-authoritative amount once available; fall back to client estimate while loading
    const payingAmount = serverAmountFen ?? clientAmount;

    return (
      <ModalWrap
        onClose={() => {
          stopPoll();
          onClose();
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => {
              stopPoll();
              setServerAmountFen(null);
              setPhase("plans");
            }}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "12px",
              flexShrink: 0,
              border: "1.5px solid #e2e8f0",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              fontSize: "16px",
              fontFamily: "var(--font-sans)",
            }}
          >
            ←
          </button>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>
            微信扫码支付
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "22px",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              minWidth: "220px",
              minHeight: "200px",
              justifyContent: "center",
            }}
          >
            {qrLoading && (
              <>
                <style>{`@keyframes pwSpin{to{transform:rotate(360deg)}}`}</style>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "3px solid #e2e8f0",
                    borderTopColor: "var(--theme-blue)",
                    animation: "pwSpin 0.8s linear infinite",
                    marginBottom: "12px",
                  }}
                />
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  正在生成支付码…
                </div>
              </>
            )}
            {qrError && (
              <div
                style={{ color: "#dc2626", fontSize: "13px", padding: "12px" }}
              >
                {qrError}
              </div>
            )}
            {qrDataUrl && !qrLoading && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="微信支付二维码"
                  style={{ width: "180px", height: "180px" }}
                />
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#0f172a",
                    marginTop: "12px",
                  }}
                >
                  {fmtFen(payingAmount)}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    marginTop: "4px",
                  }}
                >
                  {PLAN_TITLE[pendingType!] ?? ""} · 订单 {pendingOrder}
                </div>
              </>
            )}
          </div>
          {qrDataUrl && !qrLoading && (
            <div
              style={{
                fontSize: "12px",
                color: "#64748b",
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#16a34a",
                  animation: "pwSpin 1.5s linear infinite",
                  border: "2px solid #bbf7d0",
                }}
              />
              微信扫码 · 支付后自动解锁
            </div>
          )}
        </div>

        <button
          onClick={() => {
            stopPoll();
            setPhase("plans");
          }}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "12px",
            border: "1.5px solid #e2e8f0",
            background: "white",
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          取消
        </button>
      </ModalWrap>
    );
  }

  // ── Plans phase ──────────────────────────────────────────────
  return (
    <ModalWrap onClose={onClose} wide>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "18px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "19px",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "4px",
            }}
          >
            {copy.title}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
            {copy.sub}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: "28px",
            height: "28px",
            flexShrink: 0,
            marginLeft: "12px",
            borderRadius: "12px",
            border: "1.5px solid #e2e8f0",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            fontSize: "16px",
            fontFamily: "var(--font-sans)",
          }}
        >
          ×
        </button>
      </div>

      {/* Tab bar — hidden on landing page where single-unlock is not applicable */}
      {!hideSingle && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "20px",
            background: "#f1f5f9",
            borderRadius: "14px",
            padding: "4px",
          }}
        >
          {(["single", "sub"] as ActiveTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: "12px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                transition: "all 0.15s",
                background: tab === t ? "white" : "transparent",
                color: tab === t ? "#0f172a" : "#64748b",
                boxShadow: tab === t ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {t === "single" ? "单次解锁" : "订阅 Pro"}
            </button>
          ))}
        </div>
      )}

      {/* ── Single tab ────────────────────────────────────── */}
      {tab === "single" && (
        <>
          <div
            style={{
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1.5px solid #e2e8f0",
              padding: "18px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <div
                style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}
              >
                {fmtFen(singlePrice)}
              </div>
              {isFirstOrder && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "white",
                    background: "#ef4444",
                    borderRadius: "10px",
                    padding: "2px 8px",
                  }}
                >
                  首单特惠
                </span>
              )}
              {isStudent && !isFirstOrder && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "white",
                    background: "var(--teal)",
                    borderRadius: "10px",
                    padding: "2px 8px",
                  }}
                >
                  学生价
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                marginBottom: "14px",
              }}
            >
              本份简历 · 永久使用 · 不过期
            </div>
            {SINGLE_BENEFITS.map((b) => (
              <div
                key={b}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <CheckCircle2 size={13} color="#16a34a" />
                <span style={{ fontSize: "13px", color: "#334155" }}>{b}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: showFreeOption ? "10px" : 0 }}>
            <button
              onClick={() => startPay("single")}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "14px",
                border: "none",
                background: "#07c160",
                color: "white",
                fontFamily: "var(--font-sans)",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              微信支付
            </button>
          </div>

          {showFreeOption && (
            <button
              onClick={onFreeDownload}
              style={{
                width: "100%",
                padding: "10px",
                border: "none",
                background: "transparent",
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                color: "#94a3b8",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              免费下载（带水印）
            </button>
          )}
        </>
      )}

      {/* ── Sub tab ───────────────────────────────────────── */}
      {tab === "sub" && (
        <>
          {/* Plan cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            {(["monthly", "quarterly", "yearly"] as const).map((plan) => {
              const meta = PLAN_META[plan];
              const price = subPrice(plan);
              const active = selectedPlan === plan;
              const isHighlight = plan === "quarterly";
              return (
                <div
                  key={plan}
                  onClick={() => setSelectedPlan(plan)}
                  style={{
                    padding: "13px 16px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    border: `2px solid ${active ? (isHighlight ? "var(--theme-blue)" : "#334155") : "#e2e8f0"}`,
                    background: active
                      ? isHighlight
                        ? "#e0f0fd"
                        : "#f8fafc"
                      : "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    transition: "all 0.15s",
                  }}
                >
                  {/* Radio */}
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      border: `2px solid ${active ? (isHighlight ? "var(--theme-blue)" : "#334155") : "#cbd5e1"}`,
                      background: active
                        ? isHighlight
                          ? "var(--theme-blue)"
                          : "#334155"
                        : "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {active && (
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "white",
                        }}
                      />
                    )}
                  </div>
                  {/* Labels */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "2px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {meta.label}
                      </span>
                      {meta.badge && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "white",
                            background: "var(--theme-blue)",
                            borderRadius: "12px",
                            padding: "1px 7px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <Star size={8} fill="white" strokeWidth={0} />
                          {meta.badge}
                        </span>
                      )}
                      {isStudent && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "white",
                            background: "var(--teal)",
                            borderRadius: "12px",
                            padding: "1px 7px",
                          }}
                        >
                          学生价
                        </span>
                      )}
                    </div>
                    {meta.saving && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#16a34a",
                          fontWeight: 600,
                        }}
                      >
                        {meta.saving}
                      </span>
                    )}
                  </div>
                  {/* Price */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: "21px",
                        fontWeight: 800,
                        color:
                          active && isHighlight
                            ? "var(--theme-blue)"
                            : "#0f172a",
                      }}
                    >
                      {fmtFen(price)}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      /{meta.period}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pro benefits */}
          <div
            style={{
              background: "#f8fafc",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "14px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.5px",
                marginBottom: "10px",
              }}
            >
              Pro 会员权益
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px 0" }}>
              {SUB_BENEFITS.map((b, i) => (
                <div
                  key={b}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    width: "50%",
                    paddingRight: i % 2 === 0 ? "8px" : 0,
                  }}
                >
                  <CheckCircle2
                    size={12}
                    color="#16a34a"
                    style={{ flexShrink: 0 }}
                  />
                  <span style={{ fontSize: "12px", color: "#334155" }}>
                    {b}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pay button */}
          <div style={{ marginBottom: showFreeOption ? "6px" : "10px" }}>
            <button
              onClick={() => startPay(selectedPlan)}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "14px",
                border: "none",
                background: "#07c160",
                color: "white",
                fontFamily: "var(--font-sans)",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              微信支付
            </button>
          </div>

          {showFreeOption && (
            <button
              onClick={onFreeDownload}
              style={{
                width: "100%",
                padding: "10px",
                border: "none",
                background: "transparent",
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                color: "#94a3b8",
                cursor: "pointer",
                textDecoration: "underline",
                marginBottom: "4px",
              }}
            >
              免费下载（带水印）
            </button>
          )}

          {/* Student link — hidden once verified */}
          {!isStudent && (
            <button
              onClick={onOpenStudent}
              style={{
                width: "100%",
                padding: "9px",
                border: "none",
                background: "transparent",
                fontFamily: "var(--font-sans)",
                fontSize: "12.5px",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <GraduationCap size={16} />
                学生认证享全场5折 →
              </span>
            </button>
          )}
        </>
      )}

      {/* ── Promo / gift code section (both tabs) ─────────────── */}
      <div
        style={{
          borderTop: "1px solid #f1f5f9",
          marginTop: "8px",
          paddingTop: "10px",
        }}
      >
        <button
          onClick={() => {
            setPromoExpanded((v) => !v);
            setPromoError("");
            setPromoOk("");
          }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 0",
            border: "none",
            background: "transparent",
            fontFamily: "var(--font-sans)",
            fontSize: "12.5px",
            color: "#64748b",
            cursor: "pointer",
          }}
        >
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            🎟️ 使用兑换码？
          </span>
          {promoExpanded ? (
            <ChevronUp size={13} color="#94a3b8" />
          ) : (
            <ChevronDown size={13} color="#94a3b8" />
          )}
        </button>

        {promoExpanded && (
          <div style={{ marginTop: "6px" }}>
            {promoOk ? (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "12px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  fontSize: "13px",
                  color: "#15803d",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {promoOk}
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoError("");
                    }}
                    placeholder="输入兑换码"
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: "12px",
                      border: `1.5px solid ${promoError ? "#fca5a5" : "#e2e8f0"}`,
                      fontFamily: "var(--font-sans)",
                      fontSize: "13px",
                      color: "#0f172a",
                      background: "#f8fafc",
                      outline: "none",
                      boxSizing: "border-box",
                      letterSpacing: "0.5px",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--theme-blue)";
                      e.target.style.background = "white";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = promoError
                        ? "#fca5a5"
                        : "#e2e8f0";
                      e.target.style.background = "#f8fafc";
                    }}
                    onKeyDown={(e) => e.key === "Enter" && redeemPromo()}
                  />
                  <button
                    onClick={redeemPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    style={{
                      padding: "9px 16px",
                      borderRadius: "12px",
                      border: "none",
                      flexShrink: 0,
                      background: promoCode.trim()
                        ? "var(--theme-blue)"
                        : "#e2e8f0",
                      color: promoCode.trim() ? "white" : "#94a3b8",
                      fontFamily: "var(--font-sans)",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor:
                        promoCode.trim() && !promoLoading
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    {promoLoading ? "…" : "兑换"}
                  </button>
                </div>
                {promoError && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#dc2626",
                      marginTop: "6px",
                    }}
                  >
                    {promoError}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </ModalWrap>
  );
}

// ─────────────────────────────────────────────────────────────
// Student verification modal
// ─────────────────────────────────────────────────────────────

export function StudentModal({
  deviceId,
  onClose,
  onSuccess,
}: {
  deviceId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);

  function confirm() {
    if (!checked) return;
    const now = Date.now();
    setStudentRecord({ deviceId, certifiedAt: now, expiresAt: now + 365 * 86_400_000 });
    fetch("/api/auth/student", { method: "POST" }).catch(() => {});
    setDone(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1200);
  }

  if (done) {
    return (
      <ModalWrap onClose={() => {}}>
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <GraduationCap size={44} color="var(--theme-blue)" />
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
            认证成功！
          </div>
          <div style={{ fontSize: "13px", color: "#16a34a" }}>已开启全场 5 折学生优惠</div>
        </div>
      </ModalWrap>
    );
  }

  return (
    <ModalWrap onClose={onClose}>
      <div style={{ fontSize: "19px", fontWeight: 700, color: "#0f172a", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
        <GraduationCap size={20} color="var(--theme-blue)" /> 学生认证
      </div>
      <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "22px", lineHeight: 1.5 }}>
        认证成功后享全场 5 折，有效期 1 年
      </div>

      {/* Honor declaration */}
      <label
        style={{
          display: "flex", alignItems: "flex-start", gap: "10px",
          padding: "14px", borderRadius: "14px",
          border: `1.5px solid ${checked ? "var(--theme-blue)" : "#e2e8f0"}`,
          background: checked ? "rgba(0,175,185,0.05)" : "#f8fafc",
          cursor: "pointer", marginBottom: "16px",
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ marginTop: "2px", accentColor: "var(--theme-blue)", flexShrink: 0, width: "15px", height: "15px" }}
        />
        <span style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6 }}>
          我承诺目前是在校学生（包括本科、硕士、博士及大专），并了解虚假认证将导致账号封禁。
        </span>
      </label>

      <button
        onClick={confirm}
        disabled={!checked}
        style={{
          width: "100%", padding: "13px", borderRadius: "14px", border: "none",
          marginBottom: "14px",
          background: checked ? "var(--theme-blue)" : "#e2e8f0",
          color: checked ? "white" : "#94a3b8",
          fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 700,
          cursor: checked ? "pointer" : "not-allowed",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        立即认证
      </button>

      <div style={{ padding: "12px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0", fontSize: "12px", color: "#15803d", lineHeight: 1.8 }}>
        ✓ 全场 5 折&nbsp;·&nbsp;✓ 月卡 ¥14.9&nbsp;·&nbsp;年卡 ¥84&nbsp;·&nbsp;✓ 一次认证有效期 1 年
      </div>
    </ModalWrap>
  );
}

export function GuestModeModal({
  onGuest,
  onLogin,
}: {
  onGuest: () => void;
  onLogin: () => void;
}) {
  return (
    <ModalWrap onClose={onGuest} disableBackdropClose>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          游客模式
        </div>
        <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.65 }}>
          当前以游客身份使用，退出编辑器后简历将自动清除。如需永久保存，请登录账号。
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={onGuest}
          style={{
            flex: 1,
            padding: "12px",
            background: "white",
            color: "#334155",
            border: "1.5px solid #e2e8f0",
            borderRadius: "14px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          继续游客模式
        </button>
        <button
          onClick={onLogin}
          style={{
            flex: 1,
            padding: "12px",
            background: "#0f172a",
            color: "white",
            border: "none",
            borderRadius: "14px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          立即登录
        </button>
      </div>
    </ModalWrap>
  );
}

export function SyncModal({
  entries,
  onSync,
  onDiscardAll,
}: {
  entries: Array<{ id: string; name: string; savedAt: number }>;
  onSync: (idsToSync: string[]) => void;
  onDiscardAll: () => void;
}) {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(entries.map((e) => e.id)),
  );
  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  return (
    <ModalWrap onClose={onDiscardAll} disableBackdropClose>
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "6px",
          }}
        >
          检测到本地简历
        </div>
        <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
          登录前在本设备编辑了{" "}
          <strong style={{ color: "#0f172a" }}>{entries.length}</strong>{" "}
          份简历，勾选后可同步到账户
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "20px",
          maxHeight: "220px",
          overflowY: "auto",
        }}
      >
        {entries.map((e) => (
          <label
            key={e.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "12px",
              border: `1.5px solid ${checked.has(e.id) ? "#0f172a" : "#e2e8f0"}`,
              background: checked.has(e.id) ? "#f8fafc" : "white",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <input
              type="checkbox"
              checked={checked.has(e.id)}
              onChange={() => toggle(e.id)}
              style={{
                width: "15px",
                height: "15px",
                accentColor: "#0f172a",
                flexShrink: 0,
                cursor: "pointer",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0f172a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {e.name}
              </div>
              <div
                style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}
              >
                {fmt(e.savedAt)}
              </div>
            </div>
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => onSync(Array.from(checked))}
          disabled={checked.size === 0}
          style={{
            flex: 2,
            padding: "12px",
            background: checked.size > 0 ? "#0f172a" : "#e2e8f0",
            color: checked.size > 0 ? "white" : "#94a3b8",
            border: "none",
            borderRadius: "14px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: checked.size > 0 ? "pointer" : "not-allowed",
            fontFamily: "var(--font-sans)",
          }}
        >
          同步选中 {checked.size > 0 && `(${checked.size})`}
        </button>
        <button
          onClick={onDiscardAll}
          style={{
            flex: 1,
            padding: "12px",
            background: "white",
            color: "#64748b",
            border: "1.5px solid #e2e8f0",
            borderRadius: "14px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          全部丢弃
        </button>
      </div>
    </ModalWrap>
  );
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
  { key: 'student',     icon: <GraduationCap size={20} />, label: '在校学生',   desc: '实习 · 校园项目 · 求职初探' },
  { key: 'fresh',       icon: <Rocket size={20} />,        label: '应届毕业',   desc: '校招 · 初入职场 · 全新起点' },
  { key: 'experienced', icon: <Briefcase size={20} />,     label: '有工作经验', desc: '跳槽 · 晋升 · 职场进阶' },
]

const INDUSTRIES: { key: Industry; icon: React.ReactNode; label: string }[] = [
  { key: 'tech',      icon: <Code2 size={18} />,      label: '技术 / 开发' },
  { key: 'product',   icon: <Layers size={18} />,     label: '产品 / 设计' },
  { key: 'marketing', icon: <Megaphone size={18} />,  label: '市场 / 运营' },
  { key: 'finance',   icon: <TrendingUp size={18} />, label: '金融 / 财务' },
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
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>第 {step} 步 / 共 2 步</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', lineHeight: 1 }}>
            <X size={18} />
          </button>
        </div>

        {step === 1 && (
          <>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>你现在的情况是？</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>根据你的阶段提供合适的模板内容</div>
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
              下一步
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>目标方向是？</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>会注入对应行业的示例内容，随时可以修改</div>
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
              跳过，使用通用模板
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(1)} style={{ padding: '13px 20px', borderRadius: '9999px', fontSize: '14px', fontWeight: 600, border: '1.5px solid #e2e8f0', background: 'white', color: '#334155', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                返回
              </button>
              <button
                onClick={() => confirm(industry)}
                disabled={!industry}
                style={{ flex: 1, padding: '13px', borderRadius: '9999px', fontSize: '15px', fontWeight: 700, border: 'none', cursor: industry ? 'pointer' : 'not-allowed', background: industry ? 'linear-gradient(135deg, #0789ec, #0f5fc2)' : '#e2e8f0', color: industry ? 'white' : '#94a3b8', transition: 'all 0.15s', fontFamily: 'var(--font-sans)' }}
              >
                开始创建
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
