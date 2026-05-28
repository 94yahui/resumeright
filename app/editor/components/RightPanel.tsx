"use client";
import { useState, useEffect, useRef } from "react";
import { Trash2, Lightbulb, ArrowUp, ArrowDown, Plus, Eye, EyeOff, X } from "lucide-react";
import {
  ResumeData,
  SelectionType,
  SectionKey,
  Entry,
  bulletsToText,
  textToBullets,
} from "../../lib/types";


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
  onMoveEntry?: (sec: SectionKey, idx: number, dir: 'up' | 'down') => void;
}

export default function RightPanel({
  selection,
  data,
  onUpdate,
  onUpdateEntry,
  onDeleteEntry,
  onAddEntry,
  onClose,
  onMoveEntry,
}: Props) {

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
        height: "100%",
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
            background: "var(--theme-blue)",
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
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Lightbulb size={12} color="#64748b" />
                职位简洁有力，例如"高级前端工程师 · 5年经验"
              </div>
            </div>
          </>
        )}

        {/* Contact */}
        {selection.kind === "contact" && (
          <>
            <ToggleField
              label="邮箱"
              value={data.email}
              onChange={(v) => onUpdate({ email: v })}
              hidden={!!data.hideEmail}
              onToggleHide={() => onUpdate({ hideEmail: !data.hideEmail })}
            />
            <ToggleField
              label="手机"
              value={data.phone}
              onChange={(v) => onUpdate({ phone: v })}
              hidden={!!data.hidePhone}
              onToggleHide={() => onUpdate({ hidePhone: !data.hidePhone })}
            />
            <ToggleField
              label="城市"
              value={data.city}
              onChange={(v) => onUpdate({ city: v })}
              hidden={!!data.hideCity}
              onToggleHide={() => onUpdate({ hideCity: !data.hideCity })}
            />
            {/* Primary website + eye toggle + add-more button */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={labelStyle}>网站</label>
                <button
                  onClick={() => onUpdate({ hideWebsite: !data.hideWebsite })}
                  title={data.hideWebsite ? "点击在简历中显示" : "点击在简历中隐藏"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: data.hideWebsite ? "#94a3b8" : "var(--theme-blue)", display: "flex", alignItems: "center", padding: 0 }}
                >
                  {data.hideWebsite ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <input
                value={data.website}
                onChange={(e) => onUpdate({ website: e.target.value })}
                style={{ ...inputStyle, opacity: data.hideWebsite ? 0.5 : 1 } as React.CSSProperties}
                onFocus={(e) => { e.target.style.borderColor = "var(--theme-blue)"; e.target.style.background = "white" }}
                onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                <button
                  onClick={() => onUpdate({ extraWebsites: [...(data.extraWebsites || []), ""] })}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--theme-blue)", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-sans)" }}
                >
                  <Plus size={12} /> 添加链接
                </button>
              </div>
            </div>
            {/* Extra websites */}
            {(data.extraWebsites || []).map((url, i) => (
              <div key={i} style={{ marginBottom: "10px", display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  value={url}
                  onChange={(e) => {
                    const updated = [...(data.extraWebsites || [])]
                    updated[i] = e.target.value
                    onUpdate({ extraWebsites: updated })
                  }}
                  placeholder="https://..."
                  style={{ ...inputStyle, flex: 1 } as React.CSSProperties}
                  onFocus={(e) => { e.target.style.borderColor = "var(--theme-blue)"; e.target.style.background = "white" }}
                  onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc" }}
                />
                <button
                  onClick={() => onUpdate({ extraWebsites: (data.extraWebsites || []).filter((_, j) => j !== i) })}
                  style={{ padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  <X size={13} color="#94a3b8" />
                </button>
              </div>
            ))}
            {/* Custom fields */}
            <div style={{ height: '1px', background: '#e2e8f0', margin: '6px 0 12px' }} />
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>自定义字段</div>
            {(data.customContacts || []).map((cc, i) => (
              <div key={i} style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    value={cc.label}
                    onChange={(e) => {
                      const updated = [...(data.customContacts || [])]
                      updated[i] = { ...updated[i], label: e.target.value }
                      onUpdate({ customContacts: updated })
                    }}
                    placeholder="标题（如：GitHub）"
                    style={{ ...inputStyle, flex: 1 } as React.CSSProperties}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--theme-blue)'; e.target.style.background = 'white' }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                  />
                  <button
                    onClick={() => {
                      const updated = [...(data.customContacts || [])]
                      updated[i] = { ...updated[i], hidden: !cc.hidden }
                      onUpdate({ customContacts: updated })
                    }}
                    title={cc.hidden ? '点击在简历中显示' : '点击在简历中隐藏'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: cc.hidden ? '#94a3b8' : 'var(--theme-blue)', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0 }}
                  >
                    {cc.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => onUpdate({ customContacts: (data.customContacts || []).filter((_, j) => j !== i) })}
                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    <X size={12} color="#94a3b8" />
                  </button>
                </div>
                <input
                  value={cc.value}
                  onChange={(e) => {
                    const updated = [...(data.customContacts || [])]
                    updated[i] = { ...updated[i], value: e.target.value }
                    onUpdate({ customContacts: updated })
                  }}
                  placeholder="内容或链接"
                  style={{ ...inputStyle, opacity: cc.hidden ? 0.5 : 1 } as React.CSSProperties}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--theme-blue)'; e.target.style.background = 'white' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                />
              </div>
            ))}
            <button
              onClick={() => onUpdate({ customContacts: [...(data.customContacts || []), { label: '', value: '', hidden: false }] })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-blue)', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-sans)', marginTop: '4px' }}
            >
              <Plus size={12} /> 添加自定义字段
            </button>
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
            <div style={{ height: "1px", background: "#e2e8f0", margin: "14px 0" }} />
            <button
              onClick={() => { onUpdate({ hasSummary: false }); onClose() }}
              style={{ ...btnDanger, display: "flex", alignItems: "center", justifyContent: 'center', gap: "6px" }}
            >
              <Trash2 size={13} /> 删除"个人简介"模块
            </button>
          </>
        )}

        {/* Skills */}
        {selection.kind === "skills" && (
          <>
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>技能标签（逗号分隔）</label>
              <SkillsTextarea skills={data.skills} onCommit={(v) => onUpdate({ skills: v })} />
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
              style={{ ...btnDanger, display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Trash2 size={13} /> 删除"专业技能"模块
            </button>
          </>
        )}

        {/* Entry */}
        {selection.kind === "entry" &&
          (() => {
            const { sec, idx } = selection;
            const entry = data[sec]?.[idx];
            if (!entry) return null;

            const SECTION_META: Record<string, { title: string; sub: string; date: string }> = {
              exp:       { title: "职位 / 标题", sub: "公司 / 机构",  date: "时间段" },
              edu:       { title: "专业 / 学位", sub: "学校名称",     date: "时间段" },
              project:   { title: "项目名称",   sub: "项目角色",     date: "时间段" },
              language:  { title: "语言",       sub: "语言能力",     date: "时间段" },
              award:     { title: "奖项名称",   sub: "颁奖机构",     date: "时间 / 年份" },
              cert:      { title: "证书名称",   sub: "颁发机构",     date: "时间 / 年份" },
              volunteer: { title: "活动名称",   sub: "机构名称",     date: "时间段" },
              interest:  { title: "兴趣名称",   sub: "简短描述",     date: "时间段" },
            }
            const meta = SECTION_META[sec] ?? { title: "标题", sub: "副标题", date: "时间段" }

            return (
              <>
                <Field
                  label={meta.title}
                  value={entry.title}
                  onChange={(v) => onUpdateEntry(sec, idx, { title: v })}
                />
                {/* Language proficiency: free-text input with preset suggestions */}
                {sec === "language" ? (
                  <div style={{ marginBottom: "14px" }}>
                    <label style={labelStyle}>{meta.sub}</label>
                    <input
                      type="text"
                      list={`proficiency-opts-${entry.id}`}
                      value={entry.sub}
                      onChange={(e) => onUpdateEntry(sec, idx, { sub: e.target.value })}
                      placeholder="输入或选择流利程度"
                      style={inputStyle as React.CSSProperties}
                      onFocus={(e) => { e.target.style.borderColor = "var(--theme-blue)"; e.target.style.background = "white" }}
                      onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc" }}
                    />
                    <datalist id={`proficiency-opts-${entry.id}`}>
                      <option value="母语" />
                      <option value="精通" />
                      <option value="流利" />
                      <option value="基础" />
                      <option value="初级" />
                    </datalist>
                  </div>
                ) : (
                  <Field
                    label={meta.sub}
                    value={entry.sub}
                    onChange={(v) => onUpdateEntry(sec, idx, { sub: v })}
                  />
                )}
                {sec !== "language" && (
                  <Field
                    label={meta.date}
                    value={entry.date}
                    onChange={(v) => onUpdateEntry(sec, idx, { date: v })}
                  />
                )}

                {sec !== "language" && (
                  <AreaField
                    label="描述（每行一条）"
                    value={bulletsToText(entry.bullets)}
                    onChange={(v) => onUpdateEntry(sec, idx, { bullets: textToBullets(v) })}
                    rows={5}
                    hint="每按一次回车，就会显示成新的一条"
                  />
                )}

                <div style={{ height: "1px", background: "#e2e8f0", margin: "16px 0" }} />
                <button onClick={() => onAddEntry(sec)} style={btnSmallFull}>
                  + 添加 {SEC_NAMES[sec]}
                </button>

                {(() => {
                  const sectionLen = (data[sec] as Entry[]).length
                  const isFirst = idx === 0
                  const isLast = idx === sectionLen - 1
                  return (
                    <div style={{ display: "flex", gap: "6px", marginBottom: "8px", marginTop: "8px" }}>
                      <button
                        onClick={() => !isFirst && onMoveEntry?.(sec, idx, "up")}
                        disabled={isFirst}
                        style={{ ...btnSmall, display: "flex", alignItems: "center", gap: "4px", flex: 1, justifyContent: 'center', opacity: isFirst ? 0.35 : 1, cursor: isFirst ? 'not-allowed' : 'pointer' }}
                      >
                        <ArrowUp size={12} /> 上移
                      </button>
                      <button
                        onClick={() => !isLast && onMoveEntry?.(sec, idx, "down")}
                        disabled={isLast}
                        style={{ ...btnSmall, display: "flex", alignItems: "center", gap: "4px", flex: 1, justifyContent: 'center', opacity: isLast ? 0.35 : 1, cursor: isLast ? 'not-allowed' : 'pointer' }}
                      >
                        <ArrowDown size={12} /> 下移
                      </button>
                    </div>
                  )
                })()}

                <button
                  onClick={() => onDeleteEntry(sec, idx)}
                  style={{ ...btnDanger, display: "flex", alignItems: "center", gap: "6px", justifyContent: 'center' }}
                >
                  <Trash2 size={13} /> 删除此条
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
  display: "flex", alignItems: "center", gap: "6px",
};
const tipBox: React.CSSProperties = {
  marginTop: "14px", padding: "10px 12px",
  background: "#f8fafc", borderRadius: "6px",
  fontSize: "11.5px", color: "#64748b", lineHeight: 1.5,
};

// ============ FIELD COMPONENTS ============
function ToggleField({ label, value, onChange, hidden, onToggleHide }: {
  label: string; value: string; onChange: (v: string) => void; hidden: boolean; onToggleHide: () => void
}) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <label style={labelStyle}>{label}</label>
        <button
          onClick={onToggleHide}
          title={hidden ? "点击在简历中显示" : "点击在简历中隐藏"}
          style={{ background: "none", border: "none", cursor: "pointer", color: hidden ? "#94a3b8" : "var(--theme-blue)", display: "flex", alignItems: "center", padding: 0 }}
        >
          {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, opacity: hidden ? 0.5 : 1 } as React.CSSProperties}
        onFocus={(e) => { e.target.style.borderColor = "var(--theme-blue)"; e.target.style.background = "white" }}
        onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc" }}
      />
    </div>
  )
}

// Skills textarea: real-time sync to parent while preserving cursor position.
// Strategy: commit on every keystroke, but block external value from overwriting
// raw while the textarea is focused (prevents cursor-jump caused by the round-trip
// raw → parse → join → extStr changing → setState → cursor reset).
function SkillsTextarea({ skills, onCommit }: { skills: string[]; onCommit: (v: string[]) => void }) {
  const extStr = skills.join('，')
  const [raw, setRaw] = useState(extStr)
  const focused = useRef(false)
  // Tracks the extStr we produced on the last onChange so we can distinguish
  // "our own" external updates from user-initiated ones (tag deletion, etc.)
  const lastCommittedExt = useRef(extStr)

  // Sync external changes only when not focused (e.g., tag deleted via ×)
  useEffect(() => {
    if (!focused.current && extStr !== lastCommittedExt.current) {
      setRaw(extStr)
      lastCommittedExt.current = extStr
    }
  }, [extStr])

  return (
    <textarea
      value={raw}
      onChange={(e) => {
        const newRaw = e.target.value
        setRaw(newRaw)
        const parsed = newRaw.split(/[,，]+/).map(s => s.trim()).filter(Boolean)
        // Record what extStr will become so the effect doesn't overwrite raw
        lastCommittedExt.current = parsed.join('，')
        onCommit(parsed)
      }}
      onFocus={(e) => {
        focused.current = true
        e.target.style.borderColor = "var(--theme-blue)"
        e.target.style.background = "white"
      }}
      onBlur={(e) => {
        focused.current = false
        e.target.style.borderColor = "#e2e8f0"
        e.target.style.background = "#f8fafc"
      }}
      style={{ ...inputStyle, height: "76px", resize: "none" } as React.CSSProperties}
    />
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        onFocus={(e) => { e.target.style.borderColor = "var(--theme-blue)"; e.target.style.background = "white" }}
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
        onFocus={(e) => { e.target.style.borderColor = "var(--theme-blue)"; e.target.style.background = "white" }}
        onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc" }}
      />
      {hint && <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{hint}</div>}
    </div>
  );
}
