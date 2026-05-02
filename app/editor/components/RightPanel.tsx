"use client";
import { useState } from "react";
import {
  ResumeData,
  SelectionType,
  SectionKey,
  Entry,
  bulletsToText,
  textToBullets,
} from "../../lib/types";

const AI_SAMPLES: Record<string, string[]> = {
  "exp-0": [
    "主导直播间互动功能模块全面架构重构，成功将首屏渲染性能提升 40%",
    "从零设计并落地可视化低代码搭建平台，赋能 200+ 内部产品团队",
    "日活跃用户规模突破 5 万+，团队 NPS 评分 9.2/10",
  ],
  "exp-1": [
    "深度参与外卖 App H5 核心交互模块研发",
    "构建并完善前端性能监控体系，驱动页面加载速度提升 25%",
    "端侧异常错误率同比下降 30%，显著提升用户体验",
  ],
};

const SEC_NAMES: Record<SectionKey, string> = {
  exp: "工作经历",
  edu: "教育背景",
  project: "项目经历",
  award: "荣誉奖项",
  cert: "资质证书",
  volunteer: "志愿服务",
  interest: "兴趣爱好",
  language: "语言能力",
};

interface Props {
  selection: SelectionType;
  data: ResumeData;
  onUpdate: (patch: Partial<ResumeData>) => void;
  onUpdateEntry: (sec: SectionKey, idx: number, patch: Partial<Entry>) => void;
  onDeleteEntry: (sec: SectionKey, idx: number) => void;
  onAddEntry: (sec: SectionKey) => void;
  onClose: () => void;
}

export default function RightPanel({
  selection,
  data,
  onUpdate,
  onUpdateEntry,
  onDeleteEntry,
  onAddEntry,
  onClose,
}: Props) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string[] | null>(null);
  const [aiKey, setAiKey] = useState("");

  const runAI = (key: string, currentBullets: string[]) => {
    setAiKey(key);
    setAiLoading(true);
    setAiResult(null);
    setTimeout(() => {
      setAiLoading(false);
      setAiResult(
        AI_SAMPLES[key] || currentBullets.map((b) => b + "（AI 优化版本）"),
      );
    }, 1600);
  };

  const applyAI = (sec: SectionKey, idx: number) => {
    if (!aiResult) return;
    onUpdateEntry(sec, idx, { bullets: aiResult });
    setAiResult(null);
    setAiKey("");
  };

  const headerTitle =
    selection.kind === "field" && selection.field === "name"
      ? "个人信息"
      : selection.kind === "field" && selection.field === "summary"
        ? "个人简介"
        : selection.kind === "contact"
          ? "联系方式"
          : selection.kind === "skills"
            ? "专业技能"
            : selection.kind === "entry"
              ? SEC_NAMES[selection.sec]
              : "编辑";

  return (
    <div
      style={{
        width: "288px",
        background: "white",
        borderLeft: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px 12px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#0d9488",
          }}
        />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155", flex: 1 }}>
          {headerTitle}
        </span>
        <button
          onClick={onClose}
          style={{
            width: "24px", height: "24px",
            borderRadius: "6px", border: "1px solid #e2e8f0",
            background: "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", color: "#94a3b8", lineHeight: 1,
            fontFamily: "var(--font-sans)",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
        >
          ×
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

        {/* Name + Job */}
        {selection.kind === "field" && selection.field === "name" && (
          <>
            <Field
              label="姓名"
              value={data.name}
              onChange={(v) => onUpdate({ name: v })}
            />
            <Field
              label="职位 / 标题"
              value={data.jobtitle}
              onChange={(v) => onUpdate({ jobtitle: v })}
            />
            <div style={tipBox}>
              💡 职位简洁有力，例如"高级前端工程师 · 5年经验"
            </div>
          </>
        )}

        {/* Contact */}
        {selection.kind === "contact" && (
          <>
            <Field
              label="邮箱"
              value={data.email}
              onChange={(v) => onUpdate({ email: v })}
            />
            <Field
              label="手机"
              value={data.phone}
              onChange={(v) => onUpdate({ phone: v })}
            />
            <Field
              label="城市"
              value={data.city}
              onChange={(v) => onUpdate({ city: v })}
            />
            <Field
              label="网站 / GitHub"
              value={data.website}
              onChange={(v) => onUpdate({ website: v })}
            />
          </>
        )}

        {/* Summary */}
        {selection.kind === "field" && selection.field === "summary" && (
          <>
            <AreaField
              label="个人简介"
              value={data.summary}
              onChange={(v) => onUpdate({ summary: v })}
              rows={6}
              hint="一段简短的自我介绍"
            />
            <button
              onClick={() => { onUpdate({ hasSummary: false }); onClose() }}
              style={btnDanger}
            >
              🗑 删除"个人简介"模块
            </button>
          </>
        )}

        {/* Skills */}
        {selection.kind === "skills" && (
          <>
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>技能标签（逗号分隔）</label>
              <textarea
                value={data.skills.join("，")}
                onChange={(e) =>
                  onUpdate({
                    skills: e.target.value
                      .split(/[,，]+/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                style={{ ...inputStyle, height: "76px", resize: "none" } as React.CSSProperties}
              />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>快速添加</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  id="newSkill"
                  style={{ ...inputStyle, flex: 1 } as React.CSSProperties}
                  placeholder="输入技能"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const el = e.target as HTMLInputElement;
                      if (el.value.trim()) {
                        onUpdate({ skills: [...data.skills, el.value.trim()] });
                        el.value = "";
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const el = document.getElementById("newSkill") as HTMLInputElement;
                    if (el?.value.trim()) {
                      onUpdate({ skills: [...data.skills, el.value.trim()] });
                      el.value = "";
                    }
                  }}
                  style={btnSmall}
                >
                  添加
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
              {data.skills.map((s, i) => (
                <span
                  key={i}
                  onClick={() => onUpdate({ skills: data.skills.filter((_, j) => j !== i) })}
                  style={{
                    padding: "4px 11px", borderRadius: "20px", fontSize: "12px",
                    background: "#f1f5f9", color: "#334155",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#334155" }}
                >
                  {s} ×
                </span>
              ))}
            </div>
            <button
              onClick={() => { onUpdate({ hasSkills: false, skills: [] }); onClose() }}
              style={btnDanger}
            >
              🗑 删除"专业技能"模块
            </button>
          </>
        )}

        {/* Entry */}
        {selection.kind === "entry" &&
          (() => {
            const { sec, idx } = selection;
            const entry = data[sec]?.[idx];
            if (!entry) return null;
            const isEdu = sec === "edu";
            const aiKeyId = `${sec}-${idx}`;

            return (
              <>
                <Field
                  label={isEdu ? "专业 / 学位" : "职位 / 标题"}
                  value={entry.title}
                  onChange={(v) => onUpdateEntry(sec, idx, { title: v })}
                />
                <Field
                  label={isEdu ? "学校名称" : "公司 / 机构"}
                  value={entry.sub}
                  onChange={(v) => onUpdateEntry(sec, idx, { sub: v })}
                />
                <Field
                  label="时间段"
                  value={entry.date}
                  onChange={(v) => onUpdateEntry(sec, idx, { date: v })}
                />

                <AreaField
                  label="描述（每行一条）"
                  value={bulletsToText(entry.bullets)}
                  onChange={(v) => onUpdateEntry(sec, idx, { bullets: textToBullets(v) })}
                  rows={5}
                  hint="每按一次回车，就会显示成新的一条"
                />

                {(["exp", "project", "edu", "volunteer", "award", "cert"].includes(sec)) && (
                  <>
                    <button
                      onClick={() => runAI(aiKeyId, entry.bullets)}
                      disabled={aiLoading}
                      style={btnAI(aiLoading)}
                    >
                      <div
                        className="animate-pulse-dot"
                        style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fde047" }}
                      />
                      {aiLoading ? "AI 优化中..." : "AI 优化描述"}
                    </button>

                    {aiResult && aiKey === aiKeyId && (
                      <div style={{
                        marginTop: "10px", padding: "12px",
                        background: "#ccfbf1", border: "1px solid rgba(13, 148, 136, 0.25)",
                        borderRadius: "8px",
                      }}>
                        <div style={{
                          fontSize: "10px", fontWeight: 700, color: "#0d9488",
                          marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px",
                        }}>
                          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#0d9488" }} />
                          AI 优化结果
                        </div>
                        <ul style={{ margin: 0, paddingLeft: "14px" }}>
                          {aiResult.map((b, i) => (
                            <li key={i} style={{ fontSize: "12px", color: "#334155", lineHeight: 1.55, marginBottom: "4px" }}>
                              {b}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => applyAI(sec, idx)}
                          style={{
                            width: "100%", marginTop: "10px", padding: "7px",
                            background: "#0d9488", color: "white",
                            border: "none", borderRadius: "6px",
                            fontFamily: "var(--font-sans)", fontSize: "12px",
                            cursor: "pointer", fontWeight: 500,
                          }}
                        >
                          ✓ 应用优化
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div style={{ height: "1px", background: "#e2e8f0", margin: "16px 0" }} />
                <button onClick={() => onAddEntry(sec)} style={btnSmallFull}>
                  + 添加 {SEC_NAMES[sec]}
                </button>
                <button
                  onClick={() => onDeleteEntry(sec, idx)}
                  style={{ ...btnDanger, marginTop: "8px" }}
                >
                  🗑 删除此条
                </button>
              </>
            );
          })()}
      </div>
    </div>
  );
}

// ============ STYLES ============
const labelStyle: React.CSSProperties = {
  fontSize: "10px", fontWeight: 700, letterSpacing: "1px",
  textTransform: "uppercase", color: "#64748b",
  display: "block", marginBottom: "6px",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 11px",
  border: "1.5px solid #e2e8f0", borderRadius: "7px",
  fontFamily: "var(--font-sans)", fontSize: "13px",
  color: "#0f172a", background: "#f8fafc",
  outline: "none", transition: "border-color 0.15s, background 0.15s",
};
const btnSmall: React.CSSProperties = {
  padding: "8px 14px", borderRadius: "7px",
  border: "1px solid #e2e8f0", background: "white",
  fontSize: "12px", cursor: "pointer", fontWeight: 500,
  fontFamily: "var(--font-sans)", color: "#334155",
  display: "flex", alignItems: "center", gap: "4px",
};
const btnSmallFull: React.CSSProperties = { ...btnSmall, width: "100%", justifyContent: "center" };
const btnDanger: React.CSSProperties = {
  width: "100%", padding: "9px", borderRadius: "7px",
  border: "1px solid rgba(220, 38, 38, 0.3)",
  background: "transparent", color: "#dc2626",
  fontFamily: "var(--font-sans)", fontSize: "12px",
  cursor: "pointer", fontWeight: 500,
};
const btnAI = (loading: boolean): React.CSSProperties => ({
  width: "100%", padding: "10px",
  background: "linear-gradient(135deg, #0d9488, #115e59)",
  color: "white", border: "none", borderRadius: "8px",
  fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500,
  cursor: loading ? "not-allowed" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
  marginTop: "6px", opacity: loading ? 0.7 : 1,
});
const tipBox: React.CSSProperties = {
  marginTop: "14px", padding: "10px 12px",
  background: "#f8fafc", borderRadius: "6px",
  fontSize: "11.5px", color: "#64748b", lineHeight: 1.5,
};

// ============ FIELD COMPONENTS ============
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        onFocus={(e) => { e.target.style.borderColor = "#0d9488"; e.target.style.background = "white" }}
        onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc" }}
      />
    </div>
  );
}

function AreaField({ label, value, onChange, rows, hint }: {
  label: string; value: string; onChange: (v: string) => void; rows: number; hint?: string
}) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={labelStyle}>{label}</label>
      <textarea
        onKeyDown={(e) => { if (e.key === "Enter") e.stopPropagation() }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={{ ...inputStyle, resize: "none", lineHeight: "1.6" } as React.CSSProperties}
        onFocus={(e) => { e.target.style.borderColor = "#0d9488"; e.target.style.background = "white" }}
        onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc" }}
      />
      {hint && <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{hint}</div>}
    </div>
  );
}
