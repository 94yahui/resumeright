'use client'
import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react'
import {
  DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import {
  Briefcase, GraduationCap, FileText, Zap, Globe, MessageSquare,
  Trophy, FileCheck, HandHelping, Sparkles, UserRound, Camera,
  Trash2, Lightbulb, X, Check, Copy, Pencil, GripVertical,
} from 'lucide-react'
import { TEMPLATES, TemplateConfig, AccentStyle, FontPair, ORDERED_TEMPLATES, ACCENT_COLOR_PRESETS, ACCENT_STYLES, isSingleColumn } from '../../lib/templates-config'
import Dropdown from '../../components/Dropdown'
import TemplateThumbnail from '../../lib/TemplateThumbnail'
import AccentStylePreview from '../../lib/AccentStylePreview'
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
  exp:       { label: 'Work Experience', icon: <Briefcase size={14} color="#334155" />,     bg: '#dbeafe', isEntry: true },
  edu:       { label: 'Education', icon: <GraduationCap size={14} color="#334155" />,  bg: '#fef3c7', isEntry: true },
  summary:   { label: 'Summary', icon: <FileText size={14} color="#334155" />,       bg: '#f1f5f9', isEntry: false },
  skills:    { label: 'Skills', icon: <Zap size={14} color="#334155" />,            bg: '#fee2e2', isEntry: false },
  project:   { label: 'Projects', icon: <Globe size={14} color="#334155" />,          bg: '#dbeafe', isEntry: true },
  language:  { label: 'Languages', icon: <MessageSquare size={14} color="#334155" />,  bg: '#ede9fe', isEntry: true },
  award:     { label: 'Awards', icon: <Trophy size={14} color="#334155" />,         bg: '#fef3c7', isEntry: true },
  cert:      { label: 'Certifications', icon: <FileCheck size={14} color="#334155" />,      bg: '#dbeafe', isEntry: true },
  volunteer: { label: 'Volunteering', icon: <HandHelping size={14} color="#334155" />,    bg: '#f1f5f9', isEntry: true },
  interest:  { label: 'Interests', icon: <Sparkles size={14} color="#334155" />,       bg: '#fee2e2', isEntry: true },
}

const DEFAULT_SECTION_ORDER: SectionKey[] = ['exp', 'project', 'edu', 'language', 'award', 'cert', 'volunteer', 'interest']

// Keys that are orderable per layout type
function getOrderableKeys(layout: string): SectionKey[] {
  if (layout === 'two-column-balance') return ['exp', 'project', 'volunteer', 'interest']
  return DEFAULT_SECTION_ORDER
}

const COLORS = ACCENT_COLOR_PRESETS

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
          title="Rename"
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
          {m.isEntry ? '+' : 'Edit'}
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
  onForceTabConsumed?: () => void
  disabled?: boolean
  loggedIn?: boolean
  onShowLogin?: () => void
}

export default function LeftPanel({
  templateId, onTemplateChange, onColorChange, currentColor,
  currentAccentStyle, onAccentStyleChange, currentFontPair, onFontPairChange,
  onAddModule, data, onUpdate,
  onLoadHistory, onDuplicateHistory, onHistoryDelete, historyRefreshKey, currentHistoryId, currentDocTitle,
  isMobile, onClose, forceTab, onForceTabConsumed, disabled,
  loggedIn = false, onShowLogin,
}: Props) {
  const [tab, setTab] = useState<'tpl' | 'mod' | 'color' | 'hist'>('tpl')
  const [editingLabelKey, setEditingLabelKey] = useState<string | null>(null)
  const [editingLabelValue, setEditingLabelValue] = useState('')
  const labelInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [thumbW, setThumbW] = useState(0)
  const [filterShadow, setFilterShadow] = useState(false)

  // Keep a ref that always reflects the current forceTab value.
  // The historyRefreshKey effect reads this to avoid switching to 'hist'
  // when forceTab is simultaneously requesting 'tpl' (e.g. after import).
  const forceTabRef = useRef<typeof forceTab>(forceTab)
  forceTabRef.current = forceTab

  useEffect(() => {
    if (forceTab) {
      setTab(forceTab)
      // Signal the parent that this forced tab has been consumed so it can
      // reset leftPanelTab to null — preventing stale forceTab from blocking
      // future historyRefreshKey tab-switches (e.g. after duplicating a resume).
      onForceTabConsumed?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceTab])
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [layoutFilter, setLayoutFilter] = useState<string>('all')

  const filteredTpls = ORDERED_TEMPLATES.filter(t => {
    if (layoutFilter === 'photo')   return t.showPhoto
    if (layoutFilter === 'nophoto') return !t.showPhoto
    if (layoutFilter === 'single')  return isSingleColumn(t.layout)
    if (layoutFilter === 'double')  return !isSingleColumn(t.layout)
    return true
  })

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
      setHistoryEntries(loadHistory())
      // Don't switch to 'hist' when a forced tab ('tpl') was set in the same
      // render batch (e.g. after landing-page import or ATS detection). The ref
      // always holds the current render's forceTab value, so this check is safe.
      if (!forceTabRef.current) {
        setTab('hist')
      }
    }
  }, [historyRefreshKey])

  // Measure scroll container width so thumbnails get the right size without ResizeObserver lag.
  // scrollContainerRef is always visible (not display:none), so clientWidth is always accurate.
  useLayoutEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const measure = () => setThumbW(Math.floor(el.clientWidth - 28)) // 28=lr padding; single column
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Stable set of currently-visible template IDs — only changes when filters change,
  // not on every render. Used by Effect B as a dependency to re-run after filter reset.
  const filteredIdSet = useMemo(
    () => new Set(filteredTpls.map(t => t.id)),
    [layoutFilter] // eslint-disable-line react-hooks/exhaustive-deps
  )
  // Ref lets Effect A read the current set without adding it to its own deps.
  const filteredIdSetRef = useRef(filteredIdSet)
  filteredIdSetRef.current = filteredIdSet

  const prevTabRef = useRef<string>('')
  const pendingScrollRef = useRef(false)

  // Effect A: decide whether to reset filters and/or flag a pending scroll.
  // Runs on tab switch and external templateId changes (loading a different resume).
  useEffect(() => {
    const prevTab = prevTabRef.current
    prevTabRef.current = tab
    if (tab !== 'tpl') return

    if (!filteredIdSetRef.current.has(templateId)) {
      // Active template is hidden by current filters — reset so it becomes visible,
      // then let Effect B scroll after the re-render.
      pendingScrollRef.current = true
      setLayoutFilter('all')
    } else if (prevTab !== 'tpl') {
      // Normal tab switch with template already in view — scroll immediately via Effect B.
      pendingScrollRef.current = true
    }
    // templateId changed while already on tpl tab AND template is visible
    // → user clicked a card, it's already in view, no scroll needed.
  }, [tab, templateId])

  // Effect B: scroll to the active template once it's present in the DOM.
  // Runs on tab/templateId change (normal path) and on filteredIdSet change
  // (deferred path: after filter-reset re-render makes the template visible).
  useEffect(() => {
    if (!pendingScrollRef.current) return
    if (tab !== 'tpl') return
    if (!filteredIdSet.has(templateId)) return   // still waiting for filter-reset re-render

    pendingScrollRef.current = false
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
  }, [tab, templateId, filteredIdSet])

  function formatDate(ts: number): string {
    const d = new Date(ts)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${month}/${day} ${hh}:${mm}`
  }

  const TABS = ['tpl', 'mod', 'color', 'hist'] as const
  const TAB_LABELS = ['Templates', 'Modules', 'Style', 'Mine']

  return (
    <div style={{
      width: '264px', background: 'white',
      borderRight: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden',
      // Use flex longhand (not the `flex` shorthand) so toggling isMobile never
      // mixes shorthand + longhand on the same element — React warns on that.
      ...(isMobile ? { height: '100%' } : { flexGrow: 1, flexBasis: 0, minHeight: 0 }),
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

      <div ref={scrollContainerRef} className="overlay-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
        onScroll={e => setFilterShadow((e.currentTarget.scrollTop > 0))}>

        {/* ===== TEMPLATE TAB ===== */}
        {/* Keep always mounted so thumbnails stay alive; CSS hides when inactive */}
        <div style={{ display: tab === 'tpl' ? 'block' : 'none' }}>
          <div style={disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
            {/* Sticky filter rows */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 10,
              background: 'white',
              boxShadow: filterShadow ? '0 3px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'box-shadow 0.2s',
            }}>
            {/* Layout / photo filter */}
            <div style={{ padding: '10px 12px 10px' }}>
              <Dropdown
                size="sm"
                minWidth={0}
                value={layoutFilter}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'photo', label: 'With photo' },
                  { value: 'nophoto', label: 'No photo' },
                  { value: 'single', label: 'One column' },
                  { value: 'double', label: 'Two column' },
                ]}
                onChange={v => { setLayoutFilter(v); scrollContainerRef.current?.scrollTo({ top: 0 }) }}
              />
            </div>
            </div>
            {/* Count */}
            <div style={{ padding: '0 14px 6px', fontSize: '10px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.5px' }}>
              {filteredTpls.length} templates
            </div>
            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', padding: '0 14px 14px' }}>
              {filteredTpls.map(tpl => (
                <TplCard key={tpl.id} tpl={tpl} active={templateId === tpl.id} onClick={() => onTemplateChange(tpl.id)} thumbW={thumbW} />
              ))}
              {filteredTpls.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: '13px' }}>
                  No matching templates
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== MODULE TAB ===== */}
        {tab === 'mod' && (
          <div style={disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
            {/* Personal info */}
            <div style={{ padding: '12px 14px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b' }}>
              Personal info
            </div>
            <div style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={() => onAddModule('contact')} style={infoBtn}>
                <UserRound size={13} /> Basic info & contact
              </button>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => onAddModule('photo')} style={{ ...infoBtn, flex: 1 }}>
                  <Camera size={13} /> Upload photo
                </button>
                {data.photo && (
                  <button onClick={() => onAddModule('photo-clear')} style={{ ...infoBtn, flex: 1, color: '#dc2626', borderColor: 'rgba(220,38,38,0.25)' }}>
                    <Trash2 size={13} /> Remove photo
                  </button>
                )}
              </div>
            </div>

            <div style={{ height: '1px', background: '#e2e8f0', margin: '0 14px 4px' }} />

            {/* Section list */}
            <div style={{ padding: '10px 14px 6px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b' }}>
              Content modules
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
              Theme color
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
              }}>Apply</button>
            </div>

            {/* Font pair */}
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px' }}>
              Font style
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
              Heading style
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '20px' }}>
              {ACCENT_STYLES.map(as => (
                <button key={as.value} onClick={() => onAccentStyleChange?.(as.value)} style={{
                  padding: '8px 10px 8px', borderRadius: '12px', cursor: 'pointer',
                  border: `1.5px solid ${currentAccentStyle === as.value ? '#0f172a' : '#e2e8f0'}`,
                  background: currentAccentStyle === as.value ? '#f8fafc' : 'white',
                  fontFamily: 'var(--font-sans)', textAlign: 'left',
                  transition: 'all 0.15s', position: 'relative',
                  minWidth: 0, overflow: 'hidden',
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
              Style tweaks are independent of the template and reset when you switch templates
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
                No saved resumes yet
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
                          Delete "{entry.name}"?
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
                          >Delete</button>
                          <button
                            onClick={e => { e.stopPropagation(); setConfirmDeleteId(null) }}
                            style={{
                              flex: 1, padding: '5px', borderRadius: '8px', fontSize: '12px',
                              border: '1px solid #e2e8f0', background: 'white',
                              color: '#64748b', cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >Cancel</button>
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
                            title="Duplicate resume"
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
  { value: 'modern-sans', label: 'Sans-serif', desc: 'Clean, modern, versatile', cssFont: "Inter, sans-serif" },
  { value: 'serif-heading', label: 'Serif', desc: 'Elegant, formal, academic', cssFont: "Georgia, 'Noto Serif SC', serif" },
  { value: 'mono-accent', label: 'Monospace', desc: 'Technical, for code/design fields', cssFont: "'JetBrains Mono', 'Courier New', monospace" },
]


function TplCard({ tpl, active, onClick, thumbW }: {
  tpl: TemplateConfig; active: boolean; onClick: () => void; thumbW?: number
}) {
  return (
    <div data-tpl-id={tpl.id} onClick={onClick} style={{
      borderRadius: '4px',
      border: `2px solid ${active ? '#0f172a' : '#e2e8f0'}`,
      cursor: 'pointer', overflow: 'hidden',
      transition: 'all 0.2s',
      boxShadow: active ? '0 0 0 2px rgba(15, 23, 42, 0.1)' : 'none',
      position: 'relative', background: 'white',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#94a3b8' }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#e2e8f0' }}
    >
      <div style={{ background: '#f1f5f9' }}>
        {thumbW ? <TemplateThumbnail template={tpl} width={thumbW} /> : null}
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
