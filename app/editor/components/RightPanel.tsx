"use client";
import { useState, useEffect, useRef } from "react";
import { Trash2, ArrowUp, ArrowDown, Plus, Eye, EyeOff, X } from "lucide-react";
import {
  ResumeData,
  SelectionType,
  SectionKey,
  Entry,
  SkillCategory,
  bulletsToText,
  textToBullets,
} from "../../lib/types";


const SEC_NAMES: Record<SectionKey, string> = {
  exp: "Work Experience",
  edu: "Education",
  project: "Projects",
  award: "Awards",
  cert: "Certifications",
  volunteer: "Volunteering",
  interest: "Interests",
  language: "Languages",
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
    selection.kind === "field" && selection.field === "summary"
      ? "Summary"
      : selection.kind === "contact"
        ? "Basic info & contact"
          : selection.kind === "skills"
            ? "Skills"
            : selection.kind === "entry"
              ? SEC_NAMES[selection.sec]
              : "Edit";

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
            borderRadius: "10px", border: "1px solid #e2e8f0",
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

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px" }}>

        {/* Basic info & contact panel */}
        {selection.kind === "contact" && (
          <>
            {/* ── Basic info ── */}
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' as const, color: '#94a3b8', marginBottom: '10px' }}>Basic info</div>
            <Field label="Name" value={data.name} onChange={(v) => onUpdate({ name: v })} />
            <Field label="Title / Role" value={data.jobtitle} onChange={(v) => onUpdate({ jobtitle: v })} />
            {(data.customContacts || []).map((cc, i) => !cc.isInfo ? null : (
              <div key={i} style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input value={cc.label} onChange={(e) => { const u=[...(data.customContacts||[])]; u[i]={...u[i],label:e.target.value}; onUpdate({customContacts:u}) }} placeholder="Label (e.g. Nationality)" style={{ ...inputStyle, flex: 1 } as React.CSSProperties} onFocus={e=>{e.target.style.borderColor='var(--theme-blue)';e.target.style.background='white'}} onBlur={e=>{e.target.style.borderColor='#e2e8f0';e.target.style.background='#f8fafc'}} />
                  <button onClick={() => { const u=[...(data.customContacts||[])]; u[i]={...u[i],hidden:!cc.hidden}; onUpdate({customContacts:u}) }} title={cc.hidden?'Show':'Hide'} style={{background:'none',border:'none',cursor:'pointer',color:cc.hidden?'#94a3b8':'var(--theme-blue)',display:'flex',alignItems:'center',padding:0,flexShrink:0}}>{cc.hidden?<EyeOff size={14}/>:<Eye size={14}/>}</button>
                  <button onClick={() => onUpdate({customContacts:(data.customContacts||[]).filter((_,j)=>j!==i)})} style={{padding:'6px',borderRadius:'10px',border:'1px solid #e2e8f0',background:'white',cursor:'pointer',display:'flex',alignItems:'center',flexShrink:0}}><X size={12} color="#94a3b8"/></button>
                </div>
                <input value={cc.value} onChange={(e) => { const u=[...(data.customContacts||[])]; u[i]={...u[i],value:e.target.value}; onUpdate({customContacts:u}) }} placeholder="Value" style={{ ...inputStyle, opacity: cc.hidden ? 0.5 : 1 } as React.CSSProperties} onFocus={e=>{e.target.style.borderColor='var(--theme-blue)';e.target.style.background='white'}} onBlur={e=>{e.target.style.borderColor='#e2e8f0';e.target.style.background='#f8fafc'}} />
              </div>
            ))}

            {/* ── Contact ── */}
            <div style={{ height: '1px', background: '#e2e8f0', margin: '14px 0 12px' }} />
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' as const, color: '#94a3b8', marginBottom: '10px' }}>Contact</div>
            <ToggleField label="Email" value={data.email} onChange={(v) => onUpdate({ email: v })} hidden={!!data.hideEmail} onToggleHide={() => onUpdate({ hideEmail: !data.hideEmail })} />
            <ToggleField label="Phone" value={data.phone} onChange={(v) => onUpdate({ phone: v })} hidden={!!data.hidePhone} onToggleHide={() => onUpdate({ hidePhone: !data.hidePhone })} />
            <ToggleField label="City" value={data.city} onChange={(v) => onUpdate({ city: v })} hidden={!!data.hideCity} onToggleHide={() => onUpdate({ hideCity: !data.hideCity })} />
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={labelStyle}>Website</label>
                <button onClick={() => onUpdate({ hideWebsite: !data.hideWebsite })} title={data.hideWebsite ? "Click to show on resume" : "Click to hide on resume"} style={{ background: "none", border: "none", cursor: "pointer", color: data.hideWebsite ? "#94a3b8" : "var(--theme-blue)", display: "flex", alignItems: "center", padding: 0 }}>
                  {data.hideWebsite ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <input value={data.website} onChange={(e) => onUpdate({ website: e.target.value })} style={{ ...inputStyle, opacity: data.hideWebsite ? 0.5 : 1 } as React.CSSProperties} onFocus={(e) => { e.target.style.borderColor = "var(--theme-blue)"; e.target.style.background = "white" }} onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                <button onClick={() => onUpdate({ extraWebsites: [...(data.extraWebsites || []), ""] })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--theme-blue)", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-sans)" }}>
                  <Plus size={12} /> Add link
                </button>
              </div>
            </div>
            {(data.extraWebsites || []).map((url, i) => (
              <div key={i} style={{ marginBottom: "10px", display: "flex", gap: "6px", alignItems: "center" }}>
                <input value={url} onChange={(e) => { const u=[...(data.extraWebsites||[])]; u[i]=e.target.value; onUpdate({extraWebsites:u}) }} placeholder="https://..." style={{ ...inputStyle, flex: 1 } as React.CSSProperties} onFocus={(e) => { e.target.style.borderColor="var(--theme-blue)"; e.target.style.background="white" }} onBlur={(e) => { e.target.style.borderColor="#e2e8f0"; e.target.style.background="#f8fafc" }} />
                <button onClick={() => onUpdate({ extraWebsites: (data.extraWebsites||[]).filter((_,j)=>j!==i) })} style={{ padding:"8px", borderRadius:"10px", border:"1px solid #e2e8f0", background:"white", cursor:"pointer", display:"flex", alignItems:"center" }}>
                  <X size={13} color="#94a3b8" />
                </button>
              </div>
            ))}
            {(data.customContacts || []).map((cc, i) => cc.isInfo ? null : (
              <div key={i} style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input value={cc.label} onChange={(e) => { const u=[...(data.customContacts||[])]; u[i]={...u[i],label:e.target.value}; onUpdate({customContacts:u}) }} placeholder="Label (e.g. GitHub)" style={{ ...inputStyle, flex: 1 } as React.CSSProperties} onFocus={e=>{e.target.style.borderColor='var(--theme-blue)';e.target.style.background='white'}} onBlur={e=>{e.target.style.borderColor='#e2e8f0';e.target.style.background='#f8fafc'}} />
                  <button onClick={() => { const u=[...(data.customContacts||[])]; u[i]={...u[i],hidden:!cc.hidden}; onUpdate({customContacts:u}) }} title={cc.hidden?'Show':'Hide'} style={{background:'none',border:'none',cursor:'pointer',color:cc.hidden?'#94a3b8':'var(--theme-blue)',display:'flex',alignItems:'center',padding:0,flexShrink:0}}>{cc.hidden?<EyeOff size={14}/>:<Eye size={14}/>}</button>
                  <button onClick={() => onUpdate({customContacts:(data.customContacts||[]).filter((_,j)=>j!==i)})} style={{padding:'6px',borderRadius:'10px',border:'1px solid #e2e8f0',background:'white',cursor:'pointer',display:'flex',alignItems:'center',flexShrink:0}}><X size={12} color="#94a3b8"/></button>
                </div>
                <input value={cc.value} onChange={(e) => { const u=[...(data.customContacts||[])]; u[i]={...u[i],value:e.target.value}; onUpdate({customContacts:u}) }} placeholder="Value or link" style={{ ...inputStyle, opacity: cc.hidden ? 0.5 : 1 } as React.CSSProperties} onFocus={e=>{e.target.style.borderColor='var(--theme-blue)';e.target.style.background='white'}} onBlur={e=>{e.target.style.borderColor='#e2e8f0';e.target.style.background='#f8fafc'}} />
              </div>
            ))}
          </>
        )}

        {/* Summary */}
        {selection.kind === "field" && selection.field === "summary" && (
          <>
            <AreaField
              label="Summary"
              value={data.summary}
              onChange={(v) => onUpdate({ summary: v })}
              rows={6}
              hint="A short self-introduction"
            />
            <div style={{ height: "1px", background: "#e2e8f0", margin: "14px 0" }} />
            <button
              onClick={() => { onUpdate({ hasSummary: false }); onClose() }}
              style={{ ...btnDanger, display: "flex", alignItems: "center", justifyContent: 'center', gap: "6px" }}
            >
              <Trash2 size={13} /> Delete "Summary" module
            </button>
          </>
        )}

        {/* Skills */}
        {selection.kind === "skills" && (
          <SkillsPanel data={data} onUpdate={onUpdate} onClose={onClose} />
        )}

        {/* Entry */}
        {selection.kind === "entry" &&
          (() => {
            const { sec, idx } = selection;
            const entry = data[sec]?.[idx];
            if (!entry) return null;

            const SECTION_META: Record<string, { title: string; sub: string; date: string }> = {
              exp:       { title: "Title / Role", sub: "Company / Org",  date: "Dates" },
              edu:       { title: "Major / Degree", sub: "School",     date: "Dates" },
              project:   { title: "Project name",   sub: "Your role",     date: "Dates" },
              language:  { title: "Language",       sub: "Proficiency",     date: "Dates" },
              award:     { title: "Award name",   sub: "Issuer",     date: "Date / Year" },
              cert:      { title: "Certificate name",   sub: "Issuer",     date: "Date / Year" },
              volunteer: { title: "Activity name",   sub: "Organization",     date: "Dates" },
              interest:  { title: "Interest",   sub: "Short description",     date: "Dates" },
            }
            const meta = SECTION_META[sec] ?? { title: "Title", sub: "Subtitle", date: "Dates" }

            return (
              <>
                {/* Language style picker */}
                {sec === "language" && (
                  <div style={{ marginBottom: "14px" }}>
                    <label style={labelStyle}>Display style</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {(["pills", "plain", "list"] as const).map((s) => {
                        const labels = { pills: "Pills", plain: "Plain", list: "List" }
                        const active = (data.languageStyle ?? "pills") === s
                        const borderColor = active ? "var(--theme-blue)" : "#94a3b8"
                        const textClr = active ? "var(--theme-blue)" : "#64748b"
                        const preview =
                          s === "pills" ? (
                            <span style={{ display: "inline-flex", gap: "3px", alignItems: "center" }}>
                              {["English", "Spanish"].map(t => (
                                <span key={t} style={{
                                  padding: "1px 6px", borderRadius: "14px", fontSize: "8px",
                                  border: `1px solid ${borderColor}`, color: textClr,
                                  background: active ? "color-mix(in srgb, var(--theme-blue) 10%, white)" : "#f1f5f9",
                                }}>{t}</span>
                              ))}
                            </span>
                          ) : s === "plain" ? (
                            <span style={{ fontSize: "9px", color: textClr }}>English · Spanish · French</span>
                          ) : (
                            <span style={{ display: "flex", flexDirection: "column", gap: "1px", alignItems: "flex-start" }}>
                              <span style={{ fontSize: "8px", color: textClr, fontWeight: 600 }}>English</span>
                              <span style={{ fontSize: "8px", color: textClr, fontWeight: 600 }}>Spanish</span>
                            </span>
                          )
                        return (
                          <button key={s} onClick={() => onUpdate({ languageStyle: s })}
                            style={{
                              flex: 1, padding: "6px 4px", borderRadius: "10px", cursor: "pointer",
                              border: active ? "1.5px solid var(--theme-blue)" : "1.5px solid #e2e8f0",
                              background: active ? "color-mix(in srgb, var(--theme-blue) 10%, white)" : "#f8fafc",
                              fontSize: "11px", fontWeight: active ? 600 : 400,
                              color: active ? "var(--theme-blue)" : "#64748b",
                              display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                            }}>
                            {preview}
                            <span>{labels[s]}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
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
                      value={entry.sub}
                      onChange={(e) => onUpdateEntry(sec, idx, { sub: e.target.value })}
                      placeholder="e.g. Fluent, Proficient, Native"
                      style={inputStyle as React.CSSProperties}
                      onFocus={(e) => { e.target.style.borderColor = "var(--theme-blue)"; e.target.style.background = "white" }}
                      onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc" }}
                    />
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
                    label="Description (one per line)"
                    value={bulletsToText(entry.bullets)}
                    onChange={(v) => onUpdateEntry(sec, idx, { bullets: textToBullets(v) })}
                    rows={5}
                    hint="Each new line becomes a separate bullet"
                  />
                )}

                <div style={{ height: "1px", background: "#e2e8f0", margin: "16px 0" }} />
                <button onClick={() => onAddEntry(sec)} style={btnSmallFull}>
                  + Add {SEC_NAMES[sec]}
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
                        <ArrowUp size={12} /> Move up
                      </button>
                      <button
                        onClick={() => !isLast && onMoveEntry?.(sec, idx, "down")}
                        disabled={isLast}
                        style={{ ...btnSmall, display: "flex", alignItems: "center", gap: "4px", flex: 1, justifyContent: 'center', opacity: isLast ? 0.35 : 1, cursor: isLast ? 'not-allowed' : 'pointer' }}
                      >
                        <ArrowDown size={12} /> Move down
                      </button>
                    </div>
                  )
                })()}

                <button
                  onClick={() => onDeleteEntry(sec, idx)}
                  style={{ ...btnDanger, display: "flex", alignItems: "center", gap: "6px", justifyContent: 'center' }}
                >
                  <Trash2 size={13} /> Delete entry
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
  border: "1.5px solid #e2e8f0", borderRadius: "10px",
  fontFamily: "var(--font-sans)", fontSize: "13px",
  color: "#0f172a", background: "#f8fafc",
  outline: "none", transition: "border-color 0.15s, background 0.15s",
};
const btnSmall: React.CSSProperties = {
  padding: "8px 14px", borderRadius: "10px",
  border: "1px solid #e2e8f0", background: "white",
  fontSize: "12px", cursor: "pointer", fontWeight: 500,
  fontFamily: "var(--font-sans)", color: "#334155",
  display: "flex", alignItems: "center", gap: "4px",
};
const btnSmallFull: React.CSSProperties = { ...btnSmall, width: "100%", justifyContent: "center" };
const btnDanger: React.CSSProperties = {
  width: "100%", padding: "9px", borderRadius: "10px",
  border: "1px solid rgba(220, 38, 38, 0.3)",
  background: "transparent", color: "#dc2626",
  fontFamily: "var(--font-sans)", fontSize: "12px",
  cursor: "pointer", fontWeight: 500,
  display: "flex", alignItems: "center", gap: "6px",
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
          title={hidden ? "Click to show on resume" : "Click to hide on resume"}
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

// ─── Skills Panel ────────────────────────────────────────────────────────────
function SkillsPanel({ data, onUpdate, onClose }: {
  data: ResumeData
  onUpdate: (patch: Partial<ResumeData>) => void
  onClose: () => void
}) {
  const isCategoryMode = data.skillCategories !== undefined
  const cats = data.skillCategories ?? []

  const enableCategories = () => {
    // Restore stashed categories if available; otherwise migrate flat skills
    if (data.skillCategoriesStash && data.skillCategoriesStash.length > 0) {
      onUpdate({ skillCategories: data.skillCategoriesStash, skillCategoriesStash: undefined })
    } else {
      const initItems = data.skills.length > 0 ? [...data.skills] : []
      onUpdate({ skillCategories: [{ id: Date.now().toString(), name: 'Skills', items: initItems }] })
    }
  }

  const disableCategories = () => {
    // Stash current categories so they can be restored on re-enable
    const flat = cats.flatMap(c => c.items)
    onUpdate({
      skillCategories: undefined,
      skillCategoriesStash: cats,
      skills: flat.length > 0 ? flat : data.skills,
    })
  }

  const updateCat = (id: string, patch: Partial<SkillCategory>) => {
    onUpdate({ skillCategories: cats.map(c => c.id === id ? { ...c, ...patch } : c) })
  }

  const deleteCat = (id: string) => {
    onUpdate({ skillCategories: cats.filter(c => c.id !== id) })
  }

  const addCat = () => {
    onUpdate({ skillCategories: [...cats, { id: Date.now().toString(), name: 'New category', items: [] }] })
  }

  const addItemsToCat = (catId: string, newItems: string[]) => {
    const cat = cats.find(c => c.id === catId)!
    updateCat(catId, { items: [...cat.items, ...newItems] })
  }

  const removeItemFromCat = (catId: string, idx: number) => {
    const cat = cats.find(c => c.id === catId)!
    updateCat(catId, { items: cat.items.filter((_, i) => i !== idx) })
  }

  return (
    <>
      {/* Display style */}
      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>Display style</label>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["tags", "plain", "dots"] as const).map((s) => {
            const labels = { tags: "Tags", plain: "Plain", dots: "Dots" }
            const active = (data.skillsStyle ?? "tags") === s
            const borderColor = active ? "var(--theme-blue)" : "#94a3b8"
            const textClr = active ? "var(--theme-blue)" : "#64748b"
            const preview =
              s === "tags" ? (
                <div style={{ display: "flex", gap: "3px" }}>
                  {["React", "Vue"].map(t => (
                    <span key={t} style={{
                      padding: "1px 5px", borderRadius: "8px", fontSize: "9px",
                      border: `1px solid ${borderColor}`,
                      color: textClr,
                      background: active ? "color-mix(in srgb, var(--theme-blue) 10%, white)" : "#f1f5f9",
                    }}>{t}</span>
                  ))}
                </div>
              ) : s === "plain" ? (
                <span style={{ fontSize: "9px", color: textClr, fontFamily: "monospace" }}>React, Vue, Node</span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "9px", color: textClr }}>
                  {["React", "Vue"].map(t => (
                    <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: textClr, flexShrink: 0, display: "inline-block" }} />
                      {t}
                    </span>
                  ))}
                </span>
              )
            return (
              <button key={s} onClick={() => onUpdate({ skillsStyle: s })}
                style={{
                  flex: 1, padding: "6px 4px", borderRadius: "10px", cursor: "pointer",
                  border: active ? "1.5px solid var(--theme-blue)" : "1.5px solid #e2e8f0",
                  background: active ? "color-mix(in srgb, var(--theme-blue) 10%, white)" : "#f8fafc",
                  fontSize: "11px", fontWeight: active ? 600 : 400,
                  color: active ? "var(--theme-blue)" : "#64748b",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                }}>
                {preview}
                <span>{labels[s]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Category mode toggle */}
      <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Organize by category</label>
        <div
          onClick={isCategoryMode ? disableCategories : enableCategories}
          style={{
            width: "40px", height: "22px", borderRadius: "11px", flexShrink: 0,
            background: isCategoryMode ? "var(--theme-blue)" : "#cbd5e1",
            position: "relative", cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          <div style={{
            width: "18px", height: "18px", borderRadius: "50%",
            background: "white",
            position: "absolute", top: "2px",
            left: isCategoryMode ? "20px" : "2px",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          }} />
        </div>
      </div>

      {isCategoryMode ? (
        /* ── Category mode ── */
        <>
          {cats.map((cat) => (
            <div key={cat.id} style={{
              marginBottom: "12px", border: "1px solid #e2e8f0",
              borderRadius: "12px", padding: "10px 12px", background: "#f8fafc",
            }}>
              {/* Category name + delete */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "8px", alignItems: "center" }}>
                <input
                  value={cat.name}
                  onChange={(e) => updateCat(cat.id, { name: e.target.value })}
                  placeholder="Category name"
                  style={{ ...inputStyle, flex: 1, fontWeight: 600, fontSize: "12px" } as React.CSSProperties}
                  onFocus={(e) => { e.target.style.borderColor = "var(--theme-blue)"; e.target.style.background = "white" }}
                  onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc" }}
                />
                <button onClick={() => deleteCat(cat.id)}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", padding: "2px", display: "flex", alignItems: "center" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#dc2626" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Skill chip list */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "8px" }}>
                {cat.items.map((item, idx) => (
                  <span key={idx} style={{
                    display: "inline-flex", alignItems: "center", gap: "3px",
                    padding: "3px 7px 3px 9px", borderRadius: "24px", fontSize: "12px",
                    background: "color-mix(in srgb, var(--theme-blue) 12%, white)", color: "var(--theme-blue)",
                  }}>
                    {item}
                    <button onClick={() => removeItemFromCat(cat.id, idx)}
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: "13px", lineHeight: 1, color: "var(--theme-blue)", padding: "0 1px", display: "flex", alignItems: "center" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#dc2626" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--theme-blue)" }}
                    >×</button>
                  </span>
                ))}
              </div>

              {/* Add skill */}
              <CatItemInput onAdd={(items) => addItemsToCat(cat.id, items)} />
            </div>
          ))}

          <button onClick={addCat}
            style={{ ...btnSmall, width: "100%", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
            <Plus size={12} /> Add category
          </button>
        </>
      ) : (
        /* ── Flat mode ── */
        <>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Skill tags (comma-separated)</label>
            <SkillsTextarea skills={data.skills} onCommit={(v) => onUpdate({ skills: v })} />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Quick add</label>
            <FlatSkillInput onAdd={(v) => onUpdate({ skills: [...data.skills, v] })} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
            {data.skills.map((s, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "4px 8px 4px 11px", borderRadius: "24px", fontSize: "12px",
                background: "#f1f5f9", color: "#334155",
              }}>
                {s}
                <button onClick={() => onUpdate({ skills: data.skills.filter((_, j) => j !== i) })}
                  style={{ border: "none", background: "none", padding: "0 2px", cursor: "pointer", fontSize: "13px", lineHeight: 1, color: "#94a3b8", borderRadius: "50%", display: "flex", alignItems: "center" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; (e.currentTarget as HTMLButtonElement).style.background = "none" }}
                >×</button>
              </span>
            ))}
          </div>
        </>
      )}

      <button
        onClick={() => { onUpdate({ hasSkills: false, skills: [], skillCategories: undefined }); onClose() }}
        style={{ ...btnDanger, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
      >
        <Trash2 size={13} /> Delete "Skills" module
      </button>
    </>
  )
}

function CatItemInput({ onAdd }: { onAdd: (items: string[]) => void }) {
  const [val, setVal] = useState("")
  const submit = () => {
    const items = val.split(/[,，]/).map(s => s.trim()).filter(Boolean)
    if (items.length === 0) return
    onAdd(items)
    setVal("")
  }
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit() } }}
        placeholder="Add skills, comma-separated for bulk"
        style={{ ...inputStyle, flex: 1, fontSize: "12px" } as React.CSSProperties}
        onFocus={(e) => { e.target.style.borderColor = "var(--theme-blue)"; e.target.style.background = "white" }}
        onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc" }}
      />
      <button onClick={submit} style={btnSmall}>Add</button>
    </div>
  )
}

function FlatSkillInput({ onAdd }: { onAdd: (v: string) => void }) {
  const [val, setVal] = useState("")
  const submit = () => {
    const t = val.trim()
    if (!t) return
    onAdd(t)
    setVal("")
  }
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit() } }}
        placeholder="Enter a skill"
        style={{ ...inputStyle, flex: 1 } as React.CSSProperties}
        onFocus={(e) => { e.target.style.borderColor = "var(--theme-blue)"; e.target.style.background = "white" }}
        onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc" }}
      />
      <button onClick={submit} style={btnSmall}>Add</button>
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

