'use client'
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import {
  DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import {
  Briefcase, GraduationCap, FileText, Zap, Globe, MessageSquare,
  Trophy, FileCheck, HandHelping, Sparkles, UserRound, Camera,
  Trash2, Lock, Lightbulb, X, Check, Copy, Pencil, GripVertical,
} from 'lucide-react'
import { TEMPLATES, TemplateConfig, AccentStyle, FontPair } from '../../lib/templates-config'
import TemplateThumbnail from '../../lib/TemplateThumbnail'
import { ResumeData, Entry, SectionKey } from '../../lib/types'
import { loadHistory, deleteHistory, HistoryEntry } from '../../lib/storage'

const FLAG_MAP: Partial<Record<string, keyof ResumeData>> = {
  exp: 'hasExp',
  edu: 'hasEdu',
  summary: 'hasSummary',
  skills: 'hasSkills',
  project: 'hasProject',
  language: 'hasLanguage',
  award: 'hasAward',
  cert: 'hasCert',
  volunteer: 'hasVolunteer',
  interest: 'hasInterest',
}

const MODULES_META: Record<string, { label: string; icon: React.ReactNode; bg: string; isEntry: boolean }> = {
  exp:       { label: '工作经历', icon: <Briefcase size={14} color="#334155" />,     bg: '#dbeafe', isEntry: true },
  edu:       { label: '教育背景', icon: <GraduationCap size={14} color="#334155" />,  bg: '#fef3c7', isEntry: true },
  summary:   { label: '个人简介', icon: <FileText size={14} color="#334155" />,       bg: '#f1f5f9', isEntry: false },
  skills:    { label: '专业技能', icon: <Zap size={14} color="#334155" />,            bg: '#fee2e2', isEntry: false },
  project:   { label: '项目经历', icon: <Globe size={14} color="#334155" />,          bg: '#dbeafe', isEntry: true },
  language:  { label: '语言能力', icon: <MessageSquare size={14} color="#334155" />,  bg: '#ede9fe', isEntry: true },
  award:     { label: '荣誉奖项', icon: <Trophy size={14} color="#334155" />,         bg: '#fef3c7', isEntry: true },
  cert:      { label: '资质证书', icon: <FileCheck size={14} color="#334155" />,      bg: '#dbeafe', isEntry: true },
  volunteer: { label: '志愿服务', icon: <HandHelping size={14} color="#334155" />,    bg: '#f1f5f9', isEntry: true },
  interest:  { label: '兴趣爱好', icon: <Sparkles size={14} color="#334155" />,       bg: '#fee2e2', isEntry: true },
}

const DEFAULT_SECTION_ORDER: SectionKey[] = ['exp', 'project', 'edu', 'language', 'award', 'cert', 'volunteer', 'interest']

// Keys that are orderable per layout type
function getOrderableKeys(layout: string): SectionKey[] {
  if (layout === 'two-column-balance') return ['exp', 'project', 'volunteer', 'interest']
  return DEFAULT_SECTION_ORDER
}

const COLORS = [
  '#0f172a', '#1e3a8a', '#0789ec', '#475569',
  '#991b1b', '#4f46e5', '#be185d', '#0e7490',
  '#c2410c', '#15803d',
]

interface SortableRowProps {
  id: string
  isOrderable: boolean
  data: ResumeData
  editingLabelKey: string | null
  editingLabelValue: string
  labelInputRef: React.RefObject<HTMLInputElement | null>
  onStartEdit: (key: string, label: string) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  onEditValueChange: (v: string) => void
  onAddModule: (key: string) => void
  onUpdate: (patch: Partial<ResumeData>) => void
}

function SortableModuleRow({ id, isOrderable, data, editingLabelKey, editingLabelValue, labelInputRef, onStartEdit, onCommitEdit, onCancelEdit, onEditValueChange, onAddModule, onUpdate }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isOrderable })
  const m = MODULES_META[id]
  if (!m) return null
  const flagKey = FLAG_MAP[id]
  const isEnabled = !flagKey || data[flagKey as keyof ResumeData] !== false
  const customLabel = data.sectionLabels?.[id]
  const displayLabel = customLabel ?? m.label

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex', alignItems: 'center',
        padding: '5px 8px 5px 14px', gap: '6px',
        opacity: isDragging ? 0.4 : (flagKey && !isEnabled ? 0.55 : 1),
        background: isDragging ? '#f8fafc' : 'transparent',
        zIndex: isDragging ? 10 : undefined,
        position: 'relative',
      }}
    >
      {/* Checkbox or spacer */}
      {flagKey ? (
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={e => {
            if (e.target.checked) {
              if (m.isEntry) {
                const existing = data[id as keyof ResumeData]
                if (!Array.isArray(existing) || (existing as Entry[]).length === 0) { onAddModule(id); return }
              }
              if (id === 'summary' && !data.summary) { onAddModule(id); return }
              if (id === 'skills' && data.skills.length === 0) { onAddModule(id); return }
              onUpdate({ [flagKey]: true } as Partial<ResumeData>)
            } else {
              onUpdate({ [flagKey]: false } as Partial<ResumeData>)
            }
          }}
          style={{ accentColor: '#0789ec', flexShrink: 0, width: '14px', height: '14px', cursor: 'pointer' }}
        />
      ) : (
        <div style={{ width: '14px', flexShrink: 0 }} />
      )}

      {/* Icon */}
      <div style={{
        width: '26px', height: '26px', borderRadius: '10px',
        background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>{m.icon}</div>

      {/* Label or inline edit */}
      {editingLabelKey === id ? (
        <input
          ref={labelInputRef}
          value={editingLabelValue}
          onChange={e => onEditValueChange(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') onCommitEdit()
            if (e.key === 'Escape') onCancelEdit()
          }}
          style={{
            flex: 1, fontSize: '12px', fontWeight: 500,
            border: '1px solid #0789ec', borderRadius: '6px',
            padding: '2px 5px', outline: 'none',
            fontFamily: 'var(--font-sans)', color: '#0f172a', minWidth: 0,
          }}
        />
      ) : (
        <span style={{
          flex: 1, fontSize: '12.5px',
          color: isEnabled ? '#0f172a' : '#94a3b8',
          fontWeight: 500, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayLabel}
          {customLabel && <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '3px' }}>*</span>}
        </span>
      )}

      {/* Pencil */}
      {editingLabelKey !== id && (
        <button
          onClick={() => onStartEdit(id, displayLabel)}
          title="重命名"
          style={{
            padding: '3px', border: 'none', background: 'transparent',
            color: '#94a3b8', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center',
          }}
        >
          <Pencil size={11} />
        </button>
      )}

      {/* Edit/Add button */}
      {editingLabelKey !== id && (
        <button
          onClick={() => onAddModule(id)}
          style={{
            padding: '3px 8px', borderRadius: '8px', fontSize: '12px',
            border: '1px solid #e2e8f0', background: 'white',
            color: 'var(--theme-blue)', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-sans)', flexShrink: 0,
          }}
        >
          {m.isEntry ? '+' : '编辑'}
        </button>
      )}

      {/* Drag handle */}
      <div
        {...(isOrderable ? { ...attributes, ...listeners } : {})}
        style={{
          width: '16px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isOrderable ? '#64748b' : 'transparent',
          cursor: isOrderable ? 'grab' : 'default',
          touchAction: 'none',
        }}
      >
        <GripVertical size={14} />
      </div>
    </div>
  )
}

interface Props {
  templateId: string
  onTemplateChange: (id: string) => void
  onColorChange: (c: string) => void
  currentColor: string
  currentAccentStyle?: AccentStyle
  onAccentStyleChange?: (s: AccentStyle) => void
  currentFontPair?: FontPair
  onFontPairChange?: (f: FontPair) => void
  onAddModule: (key: string) => void
  data: ResumeData
  onUpdate: (patch: Partial<ResumeData>) => void
  onLoadHistory?: (entry: HistoryEntry) => void
  onDuplicateHistory?: (entry: HistoryEntry) => void
  onHistoryDelete?: (id: string) => void
  historyRefreshKey?: number
  currentHistoryId?: string | null
  currentDocTitle?: string
  isMobile?: boolean
  onClose?: () => void
  forceTab?: 'tpl' | 'mod' | 'color' | 'hist'
  disabled?: boolean
  canUseProTemplate?: boolean
  unlockedProTemplateId?: string  // single-plan: only this one pro template is unlocked
  onProTemplateLocked?: () => void
  loggedIn?: boolean
  onShowLogin?: () => void
}

export default function LeftPanel({
  templateId, onTemplateChange, onColorChange, currentColor,
  currentAccentStyle, onAccentStyleChange, currentFontPair, onFontPairChange,
  onAddModule, data, onUpdate,
  onLoadHistory, onDuplicateHistory, onHistoryDelete, historyRefreshKey, currentHistoryId, currentDocTitle,
  isMobile, onClose, forceTab, disabled, canUseProTemplate = false, unlockedProTemplateId, onProTemplateLocked,
  loggedIn = false, onShowLogin,
}: Props) {
  const [tab, setTab] = useState<'tpl' | 'mod' | 'color' | 'hist'>('tpl')
  const [editingLabelKey, setEditingLabelKey] = useState<string | null>(null)
  const [editingLabelValue, setEditingLabelValue] = useState('')
  const labelInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [thumbW, setThumbW] = useState(0)

  useEffect(() => {
    if (forceTab) setTab(forceTab)
  }, [forceTab])
  const [showPro, setShowPro] = useState(false)
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const freeTpls = TEMPLATES.filter(t => t.free)
  const proTpls = TEMPLATES.filter(t => !t.free)

  const currentLayout = TEMPLATES.find(t => t.id === templateId)?.layout ?? 'single-classic'
  const orderableKeys = getOrderableKeys(currentLayout)

  // Build effective section order from stored order + missing defaults
  const effectiveSectionOrder: SectionKey[] = (() => {
    const stored = data.sectionOrder ?? []
    const storedSet = new Set(stored)
    return [...stored, ...DEFAULT_SECTION_ORDER.filter(k => !storedSet.has(k))]
  })()

  // Displayed module list: summary first, then sections in effectiveSectionOrder, skills last
  const orderedModuleKeys = ['summary', ...effectiveSectionOrder, 'skills']

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = effectiveSectionOrder.indexOf(active.id as SectionKey)
    const newIdx = effectiveSectionOrder.indexOf(over.id as SectionKey)
    if (oldIdx < 0 || newIdx < 0) return
    onUpdate({ sectionOrder: arrayMove([...effectiveSectionOrder], oldIdx, newIdx) })
  }

  function commitLabelEdit() {
    if (!editingLabelKey) return
    const trimmed = editingLabelValue.trim()
    const meta = MODULES_META[editingLabelKey]
    const defaultLabel = meta?.label ?? editingLabelKey
    const newLabels = { ...(data.sectionLabels ?? {}) }
    if (!trimmed || trimmed === defaultLabel) {
      delete newLabels[editingLabelKey]
    } else {
      newLabels[editingLabelKey] = trimmed
    }
    onUpdate({ sectionLabels: newLabels })
    setEditingLabelKey(null)
  }

  useEffect(() => {
    if (editingLabelKey) {
      labelInputRef.current?.focus()
      labelInputRef.current?.select()
    }
  }, [editingLabelKey])

  useEffect(() => {
    if (tab === 'hist') {
      setHistoryEntries(loadHistory())
    }
  }, [tab])

  useEffect(() => {
    if (historyRefreshKey && historyRefreshKey > 0) {
      setTab('hist')
      setHistoryEntries(loadHistory())
    }
  }, [historyRefreshKey])

  // Measure scroll container width so thumbnails get the right size without ResizeObserver lag.
  // scrollContainerRef is always visible (not display:none), so clientWidth is always accurate.
  useLayoutEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const measure = () => setThumbW(Math.floor((el.clientWidth - 28 - 10) / 2)) // 28=lr padding, 10=gap
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Scroll active template card to center — only when switching TO the tpl tab, not on template click.
  // prevTabRef starts as '' (not 'tpl') so the initial mount also triggers centering.
  const prevTabRef = useRef<string>('')
  useEffect(() => {
    const prevTab = prevTabRef.current
    prevTabRef.current = tab
    if (tab !== 'tpl') return
    if (prevTab === 'tpl') return  // already on tpl tab, templateId changed — don't scroll
    const isPro = proTpls.some(t => t.id === templateId)
    if (isPro) setShowPro(true)
    // Double rAF: first fires after display:block takes effect, second after React flushes setShowPro.
    // Faster and more reliable than a fixed 60ms timeout.
    let rafId: number
    const raf1 = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(() => {
        const container = scrollContainerRef.current
        if (!container) return
        const card = container.querySelector(`[data-tpl-id="${templateId}"]`) as HTMLElement | null
        if (!card) return
        const cardRect = card.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const target = container.scrollTop + cardRect.top - containerRect.top - container.clientHeight / 2 + card.offsetHeight / 2
        container.scrollTo({ top: Math.max(0, target), behavior: 'instant' as ScrollBehavior })
      })
    })
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(rafId) }
  }, [tab, templateId])

  function formatDate(ts: number): string {
    const d = new Date(ts)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${month}月${day}日 ${hh}:${mm}`
  }

  const TABS = ['tpl', 'mod', 'color', 'hist'] as const
  const TAB_LABELS = ['模板', '模块', '样式', '我的']

  return (
    <div style={{
      width: '264px', background: 'white',
      borderRight: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden',
      ...(isMobile ? { height: '100%' } : { flex: 1, minHeight: 0 }),
    }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px 4px',
            fontSize: '12px', fontWeight: 600,
            color: tab === t ? '#0f172a' : '#64748b',
            cursor: 'pointer', background: 'transparent',
            border: 'none', fontFamily: 'var(--font-sans)',
            borderBottom: `2px solid ${tab === t ? '#0f172a' : 'transparent'}`,
            transition: 'all 0.15s',
          }}>{TAB_LABELS[i]}</button>
        ))}
        {isMobile && (
          <button onClick={onClose} style={{
            padding: '8px 10px', cursor: 'pointer',
            background: 'transparent', border: 'none',
            color: '#64748b', display: 'flex', alignItems: 'center',
            flexShrink: 0,
          }}>
            <X size={16} />
          </button>
        )}
      </div>

      <div ref={scrollContainerRef} className="overlay-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

        {/* ===== TEMPLATE TAB ===== */}
        {/* Keep always mounted so thumbnails stay alive; CSS hides when inactive */}
        <div style={{ display: tab === 'tpl' ? 'block' : 'none' }}>
          <div style={disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
            <div style={{ padding: '14px 14px 6px', fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--theme-blue)' }}>
              免费模板 ({freeTpls.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 14px 14px' }}>
              {freeTpls.map(tpl => (
                <TplCard key={tpl.id} tpl={tpl} active={templateId === tpl.id} onClick={() => onTemplateChange(tpl.id)} thumbW={thumbW} />
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', padding: '10px 14px' }}>
              <button onClick={() => setShowPro(v => !v)} style={{
                width: '100%', padding: '10px',
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '1px solid #f59e0b',
                borderRadius: '12px',
                fontSize: '12px', fontWeight: 600, color: '#92400e',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <Lock size={11} /> Pro 模板 ({proTpls.length}) {showPro ? '▲' : '▼'}
              </button>
            </div>

            {showPro && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 14px 14px' }}>
                {proTpls.map(tpl => {
                  const unlocked = canUseProTemplate || tpl.id === unlockedProTemplateId
                  return (
                    <TplCard key={tpl.id} tpl={tpl} active={templateId === tpl.id}
                      onClick={() => onTemplateChange(tpl.id)}
                      isPro isLocked={!unlocked} thumbW={thumbW} />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ===== MODULE TAB ===== */}
        {tab === 'mod' && (
          <div style={disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
            {/* Personal info */}
            <div style={{ padding: '12px 14px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b' }}>
              个人信息
            </div>
            <div style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={() => onAddModule('contact')} style={infoBtn}>
                <UserRound size={13} /> 基本信息 & 联系方式
              </button>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => onAddModule('photo')} style={{ ...infoBtn, flex: 1 }}>
                  <Camera size={13} /> 上传照片
                </button>
                {data.photo && (
                  <button onClick={() => onAddModule('photo-clear')} style={{ ...infoBtn, flex: 1, color: '#dc2626', borderColor: 'rgba(220,38,38,0.25)' }}>
                    <Trash2 size={13} /> 移除照片
                  </button>
                )}
              </div>
            </div>

            <div style={{ height: '1px', background: '#e2e8f0', margin: '0 14px 4px' }} />

            {/* Section list */}
            <div style={{ padding: '10px 14px 6px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b' }}>
              内容模块
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={effectiveSectionOrder} strategy={verticalListSortingStrategy}>
                {orderedModuleKeys.map(key => (
                  <SortableModuleRow
                    key={key}
                    id={key}
                    isOrderable={DEFAULT_SECTION_ORDER.includes(key as SectionKey) && orderableKeys.includes(key as SectionKey)}
                    data={data}
                    editingLabelKey={editingLabelKey}
                    editingLabelValue={editingLabelValue}
                    labelInputRef={labelInputRef}
                    onStartEdit={(k, v) => { setEditingLabelKey(k); setEditingLabelValue(v) }}
                    onCommitEdit={commitLabelEdit}
                    onCancelEdit={() => setEditingLabelKey(null)}
                    onEditValueChange={setEditingLabelValue}
                    onAddModule={onAddModule}
                    onUpdate={onUpdate}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* ===== STYLE TAB ===== */}
        {tab === 'color' && (
          <div style={{ padding: '16px 16px 24px', ...(disabled ? { opacity: 0.4, pointerEvents: 'none' } : {}) }}>

            {/* Color */}
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px' }}>
              主题色
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => onColorChange(c)} style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: c, cursor: 'pointer',
                  border: '2px solid white',
                  boxShadow: currentColor === c ? `0 0 0 2.5px #0f172a` : '0 0 0 1.5px #e2e8f0',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', color: 'white',
                }}>
                  {currentColor === c ? <Check size={13} color="white" strokeWidth={3} /> : null}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
              <input type="color" defaultValue={currentColor} id="customColor"
                style={{ width: '36px', height: '36px', border: 'none', borderRadius: '12px', cursor: 'pointer', padding: '2px', background: '#f8fafc' }}
              />
              <button onClick={() => {
                const el = document.getElementById('customColor') as HTMLInputElement
                if (el) onColorChange(el.value)
              }} style={{
                padding: '7px 14px', borderRadius: '12px', border: '1px solid #e2e8f0',
                background: 'white', fontSize: '12px', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', color: '#334155', fontWeight: 500,
              }}>应用</button>
            </div>

            {/* Font pair */}
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px' }}>
              字体风格
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
              {FONT_PAIRS.map(fp => (
                <button key={fp.value} onClick={() => onFontPairChange?.(fp.value)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '12px', cursor: 'pointer',
                  border: `1.5px solid ${currentFontPair === fp.value ? '#0f172a' : '#e2e8f0'}`,
                  background: currentFontPair === fp.value ? '#f8fafc' : 'white',
                  fontFamily: 'var(--font-sans)', textAlign: 'left', width: '100%',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f1f5f9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: fp.cssFont, fontSize: '16px', fontWeight: 700, color: '#334155', lineHeight: 1 }}>A</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>{fp.label}</div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>{fp.desc}</div>
                  </div>
                  {currentFontPair === fp.value && (
                    <div style={{ marginLeft: 'auto', width: '16px', height: '16px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={10} color="white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Accent style */}
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px' }}>
              标题样式
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '20px' }}>
              {ACCENT_STYLES.map(as => (
                <button key={as.value} onClick={() => onAccentStyleChange?.(as.value)} style={{
                  padding: '8px 10px 8px', borderRadius: '12px', cursor: 'pointer',
                  border: `1.5px solid ${currentAccentStyle === as.value ? '#0f172a' : '#e2e8f0'}`,
                  background: currentAccentStyle === as.value ? '#f8fafc' : 'white',
                  fontFamily: 'var(--font-sans)', textAlign: 'left',
                  transition: 'all 0.15s', position: 'relative',
                }}>
                  <AccentStylePreview style={as.value} color={currentColor} />
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', fontWeight: 500 }}>{as.label}</div>
                  {currentAccentStyle === as.value && (
                    <div style={{ position: 'absolute', top: '5px', right: '5px', width: '14px', height: '14px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={9} color="white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div style={{
              padding: '12px',
              background: '#f8fafc', borderRadius: '12px',
              fontSize: '11.5px', color: '#64748b', lineHeight: 1.6,
              display: 'flex', alignItems: 'flex-start', gap: '6px',
            }}>
              <Lightbulb size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
              样式调整独立于模板，切换模板后重置
            </div>
          </div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {tab === 'hist' && (
          <div style={{ padding: '14px' }}>

            {historyEntries.length === 0 ? (
              <div style={{
                textAlign: 'center', color: '#94a3b8',
                fontSize: '13px', padding: '32px 0',
              }}>
                暂无保存记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {historyEntries.map(entry => (
                  <div
                    key={entry.id}
                    onClick={() => {
                      if (confirmDeleteId === entry.id || entry.id === currentHistoryId) return
                      const fresh = loadHistory().find(h => h.id === entry.id) ?? entry
                      setHistoryEntries(loadHistory())
                      onLoadHistory?.(fresh)
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: `1px solid ${confirmDeleteId === entry.id ? '#fca5a5' : entry.id === currentHistoryId ? 'rgba(7,137,236,0.3)' : '#e2e8f0'}`,
                      background: confirmDeleteId === entry.id ? '#fff5f5' : entry.id === currentHistoryId ? '#f0f8ff' : '#f8fafc',
                      transition: 'all 0.15s',
                      cursor: confirmDeleteId === entry.id || entry.id === currentHistoryId ? 'default' : 'pointer',
                    }}
                  >
                    {confirmDeleteId === entry.id ? (
                      <div>
                        <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600, marginBottom: '8px', wordBreak: 'break-word' }}>
                          确定删除「{entry.name}」？
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              deleteHistory(entry.id)
                              setHistoryEntries(loadHistory())
                              setConfirmDeleteId(null)
                              onHistoryDelete?.(entry.id)
                            }}
                            style={{
                              flex: 1, padding: '5px', borderRadius: '8px', fontSize: '12px',
                              border: 'none', background: '#dc2626',
                              color: 'white', fontWeight: 600, cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >删除</button>
                          <button
                            onClick={e => { e.stopPropagation(); setConfirmDeleteId(null) }}
                            style={{
                              flex: 1, padding: '5px', borderRadius: '8px', fontSize: '12px',
                              border: '1px solid #e2e8f0', background: 'white',
                              color: '#64748b', cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >取消</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '12.5px', fontWeight: 600, color: '#0f172a',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>{entry.id === currentHistoryId && currentDocTitle !== undefined ? currentDocTitle : entry.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            {formatDate(entry.savedAt)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              const fresh = loadHistory().find(h => h.id === entry.id) ?? entry
                              onDuplicateHistory?.(fresh)
                              setHistoryEntries(loadHistory())
                            }}
                            title="复制简历"
                            style={{
                              padding: '4px 7px', borderRadius: '8px', fontSize: '12px',
                              border: '1px solid #e2e8f0', background: 'white',
                              color: '#64748b', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setConfirmDeleteId(entry.id) }}
                            style={{
                              padding: '4px 7px', borderRadius: '8px', fontSize: '12px',
                              border: '1px solid #e2e8f0', background: 'white',
                              color: '#94a3b8', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const FONT_PAIRS: { value: FontPair; label: string; desc: string; cssFont: string }[] = [
  { value: 'modern-sans', label: '无衬线体', desc: '简洁现代，通用性强', cssFont: "Inter, sans-serif" },
  { value: 'serif-heading', label: '衬线体', desc: '典雅正式，学术感强', cssFont: "Georgia, 'Noto Serif SC', serif" },
  { value: 'mono-accent', label: '等宽体', desc: '技术感，代码/设计行业', cssFont: "'JetBrains Mono', 'Courier New', monospace" },
]

const ACCENT_STYLES: { value: AccentStyle; label: string }[] = [
  { value: 'underline-bar', label: '下划线条' },
  { value: 'left-bar',      label: '左侧竖线' },
  { value: 'side-icon',     label: '圆点连线' },
  { value: 'background-pill', label: '背景色块' },
  { value: 'thin-line',     label: '细线底框' },
  { value: 'double-line',   label: '双线夹标题' },
  { value: 'triple-bar',    label: '渐变竖条' },
  { value: 'arrow-trio',   label: '渐隐箭头' },
  { value: 'gradient-band', label: '渐变色带' },
  { value: 'flanked-line',  label: '双侧横线' },
  { value: 'slash-prefix',  label: '斜杠前缀' },
  { value: 'highlight-mark', label: '荧光划线' },
  { value: 'plain-bold',    label: '粗体简洁' },
]

function SquirclePill({ children, bg }: { children: React.ReactNode; bg: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = () => {
      const w = el.offsetWidth, h = el.offsetHeight
      if (!w || !h) return
      const r = 2, l = r * 1.528, k = r * 0.569
      el.style.clipPath = `path('M ${l} 0 H ${w-l} C ${w-k} 0 ${w} ${k} ${w} ${l} V ${h-l} C ${w} ${h-k} ${w-k} ${h} ${w-l} ${h} H ${l} C ${k} ${h} 0 ${h-k} 0 ${h-l} V ${l} C 0 ${k} ${k} 0 ${l} 0 Z')`
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return <span ref={ref} style={{ display: 'inline-block', background: bg, padding: '3px 7px' }}>{children}</span>
}

function AccentStylePreview({ style, color }: { style: AccentStyle; color: string }) {
  const c = color || '#0f172a'
  const text = '工作经历'

  const baseText: React.CSSProperties = {
    fontSize: '9px', fontWeight: 700, color: c,
    letterSpacing: '0.8px', textTransform: 'uppercase',
    lineHeight: 1, whiteSpace: 'nowrap',
  }

  switch (style) {
    case 'underline-bar':
      return (
        <div style={{ height: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px' }}>
          <div style={baseText}>{text}</div>
          <div style={{ height: '2px', width: '24px', background: c }} />
        </div>
      )
    case 'left-bar':
      return (
        <div style={{ height: '30px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '3px', height: '13px', background: c, flexShrink: 0 }} />
          <div style={baseText}>{text}</div>
        </div>
      )
    case 'side-icon':
      return (
        <div style={{ height: '30px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: c, flexShrink: 0 }} />
          <div style={baseText}>{text}</div>
          <div style={{ flex: 1, height: '1px', background: c, opacity: 0.3 }} />
        </div>
      )
    case 'background-pill':
      return (
        <div style={{ height: '30px', display: 'flex', alignItems: 'center' }}>
          <SquirclePill bg={c}>
            <span style={{ ...baseText, color: '#fff' }}>{text}</span>
          </SquirclePill>
        </div>
      )
    case 'thin-line':
      return (
        <div style={{ height: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px' }}>
          <div style={baseText}>{text}</div>
          <div style={{ height: '1px', background: c }} />
        </div>
      )
    case 'double-line':
      return (
        <div style={{ height: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
          <div style={{ height: '1px', background: c }} />
          <div style={{ ...baseText, textAlign: 'center' }}>{text}</div>
          <div style={{ height: '1px', background: c }} />
        </div>
      )
    case 'triple-bar':
      return (
        <div style={{ height: '30px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={baseText}>{text}</div>
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginLeft: '2px' }}>
            <div style={{ width: '4px', height: '10px', background: c }} />
            <div style={{ width: '3px', height: '10px', background: c, opacity: 0.6 }} />
            <div style={{ width: '2px', height: '10px', background: c, opacity: 0.3 }} />
          </div>
        </div>
      )
    case 'arrow-trio':
      return (
        <div style={{ height: '30px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={baseText}>{text}</div>
          <div style={{ display: 'flex', gap: '1px', alignItems: 'center', flexShrink: 0, lineHeight: 1 }}>
            <span style={{ fontSize: '11px', color: c, opacity: 1 }}>›</span>
            <span style={{ fontSize: '11px', color: c, opacity: 0.55 }}>›</span>
            <span style={{ fontSize: '11px', color: c, opacity: 0.22 }}>›</span>
          </div>
        </div>
      )
    case 'gradient-band':
      return (
        <div style={{ height: '30px', display: 'flex', alignItems: 'center', marginLeft: '-4px', paddingLeft: '6px', borderLeft: `2px solid ${c}`, background: `linear-gradient(to right, ${c}22, transparent)` }}>
          <div style={baseText}>{text}</div>
        </div>
      )
    case 'flanked-line':
      return (
        <div style={{ height: '30px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ flex: 1, height: '1px', background: c, opacity: 0.6 }} />
          <div style={{ ...baseText, whiteSpace: 'nowrap' }}>{text}</div>
          <div style={{ flex: 1, height: '1px', background: c, opacity: 0.6 }} />
        </div>
      )
    case 'slash-prefix':
      return (
        <div style={{ height: '30px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '9px', color: c, opacity: 0.45, letterSpacing: '-1px', lineHeight: 1, flexShrink: 0 }}>//</span>
          <div style={baseText}>{text}</div>
        </div>
      )
    case 'highlight-mark':
      return (
        <div style={{ height: '30px', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{ ...baseText, position: 'relative', zIndex: 1 }}>{text}</div>
            <div style={{ position: 'absolute', bottom: '-1px', left: '-2px', right: '-2px', height: '42%', background: `${c}38`, borderRadius: '1px', zIndex: 0 }} />
          </div>
        </div>
      )
    case 'plain-bold':
    default:
      return (
        <div style={{ height: '30px', display: 'flex', alignItems: 'center' }}>
          <div style={{ ...baseText, fontSize: '10px' }}>{text}</div>
        </div>
      )
  }
}

function TplCard({ tpl, active, onClick, isPro, isLocked, thumbW }: {
  tpl: TemplateConfig; active: boolean; onClick: () => void; isPro?: boolean; isLocked?: boolean; thumbW?: number
}) {
  return (
    <div data-tpl-id={tpl.id} onClick={onClick} style={{
      borderRadius: '4px',
      border: `2px solid ${active ? '#0f172a' : '#e2e8f0'}`,
      cursor: 'pointer', overflow: 'hidden',
      transition: 'all 0.2s',
      boxShadow: active ? '0 0 0 2px rgba(15, 23, 42, 0.1)' : 'none',
      position: 'relative', background: 'white',
      opacity: isLocked ? 0.75 : 1,
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#94a3b8' }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#e2e8f0' }}
    >
      <div style={{ background: '#f1f5f9' }}>
        {thumbW ? <TemplateThumbnail template={tpl} width={thumbW} /> : null}
      </div>
      {isPro && (
        <div style={{
          position: 'absolute', top: '4px', right: '4px',
          background: isLocked ? '#94a3b8' : '#f59e0b', color: 'white',
          fontSize: '8px', padding: '2px 5px', borderRadius: '5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
          fontWeight: 700,
        }}>
          {isLocked && <Lock size={7} />} Pro
        </div>
      )}
      <div style={{ padding: '6px 8px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{
          fontSize: '11px', fontWeight: 600, color: '#0f172a',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{tpl.name}</div>
      </div>
    </div>
  )
}

const infoBtn: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  borderRadius: '10px', border: '1px solid #e2e8f0',
  background: '#f8fafc', fontSize: '12.5px',
  color: '#334155', fontWeight: 500,
  cursor: 'pointer', fontFamily: 'var(--font-sans)',
  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px',
}
