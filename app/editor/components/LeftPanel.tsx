'use client'
import { useState, useEffect } from 'react'
import {
  Briefcase, GraduationCap, FileText, Zap, Globe, MessageSquare,
  Trophy, FileCheck, HandHelping, Sparkles, UserRound, Mail, Camera,
  Trash2, Lock, Lightbulb, History, X, Check,
} from 'lucide-react'
import { TEMPLATES, TemplateConfig, AccentStyle, FontPair } from '../../lib/templates-config'
import TemplateThumbnail from '../../lib/TemplateThumbnail'
import { ResumeData, Entry } from '../../lib/types'
import { loadHistory, deleteHistory, HistoryEntry } from '../../lib/storage'

const FLAG_MAP: Partial<Record<string, keyof ResumeData>> = {
  summary: 'hasSummary',
  skills: 'hasSkills',
  project: 'hasProject',
  language: 'hasLanguage',
  award: 'hasAward',
  cert: 'hasCert',
  volunteer: 'hasVolunteer',
  interest: 'hasInterest',
}

const MODULES: { key: string; label: string; icon: React.ReactNode; bg: string; isEntry: boolean }[] = [
  { key: 'exp',       label: '工作经历', icon: <Briefcase size={14} color="#334155" />,     bg: '#dbeafe', isEntry: true },
  { key: 'edu',       label: '教育背景', icon: <GraduationCap size={14} color="#334155" />,  bg: '#fef3c7', isEntry: true },
  { key: 'summary',   label: '个人简介', icon: <FileText size={14} color="#334155" />,       bg: '#f1f5f9', isEntry: false },
  { key: 'skills',    label: '专业技能', icon: <Zap size={14} color="#334155" />,            bg: '#fee2e2', isEntry: false },
  { key: 'project',   label: '项目经历', icon: <Globe size={14} color="#334155" />,          bg: '#dbeafe', isEntry: true },
  { key: 'language',  label: '语言能力', icon: <MessageSquare size={14} color="#334155" />,  bg: '#ede9fe', isEntry: true },
  { key: 'award',     label: '荣誉奖项', icon: <Trophy size={14} color="#334155" />,         bg: '#fef3c7', isEntry: true },
  { key: 'cert',      label: '资质证书', icon: <FileCheck size={14} color="#334155" />,      bg: '#dbeafe', isEntry: true },
  { key: 'volunteer', label: '志愿服务', icon: <HandHelping size={14} color="#334155" />,    bg: '#f1f5f9', isEntry: true },
  { key: 'interest',  label: '兴趣爱好', icon: <Sparkles size={14} color="#334155" />,       bg: '#fee2e2', isEntry: true },
]

const COLORS = [
  '#0f172a', '#1e3a8a', '#0789ec', '#d4a017',
  '#dc2626', '#7c3aed', '#ec4899', '#0891b2',
  '#ea580c', '#16a34a',
]

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
  onLoadHistory, onHistoryDelete, historyRefreshKey, currentHistoryId, currentDocTitle,
  isMobile, onClose, forceTab, disabled, canUseProTemplate = false, unlockedProTemplateId, onProTemplateLocked,
  loggedIn = false, onShowLogin,
}: Props) {
  const [tab, setTab] = useState<'tpl' | 'mod' | 'color' | 'hist'>('tpl')

  useEffect(() => {
    if (forceTab) setTab(forceTab)
  }, [forceTab])
  const [showPro, setShowPro] = useState(false)
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const freeTpls = TEMPLATES.filter(t => t.free)
  const proTpls = TEMPLATES.filter(t => !t.free)

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
      height: '100%',
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

      <div className="overlay-scroll" style={{ flex: 1, overflowY: 'auto' }}>

        {/* ===== TEMPLATE TAB ===== */}
        {tab === 'tpl' && (
          <div style={disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
            <div style={{ padding: '14px 14px 6px', fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--theme-blue)' }}>
              免费模板 ({freeTpls.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 14px 14px' }}>
              {freeTpls.map(tpl => (
                <TplCard key={tpl.id} tpl={tpl} active={templateId === tpl.id} onClick={() => onTemplateChange(tpl.id)} />
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', padding: '10px 14px' }}>
              <button onClick={() => setShowPro(v => !v)} style={{
                width: '100%', padding: '10px',
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
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
                      isPro isLocked={!unlocked} />
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== MODULE TAB ===== */}
        {tab === 'mod' && (
          <div style={disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
            {/* Personal info */}
            <div style={{ padding: '12px 14px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b' }}>
              个人信息
            </div>
            <div style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={() => onAddModule('name')} style={infoBtn}>
                <UserRound size={13} /> 姓名 / 职位
              </button>
              <button onClick={() => onAddModule('contact')} style={infoBtn}>
                <Mail size={13} /> 联系方式/基本信息
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

            {MODULES.map(m => {
              const flagKey = FLAG_MAP[m.key]
              const isEnabled = !flagKey || !!data[flagKey]
              return (
                <div key={m.key} style={{
                  display: 'flex', alignItems: 'center',
                  padding: '7px 14px', gap: '8px',
                  opacity: flagKey && !isEnabled ? 0.55 : 1,
                  transition: 'opacity 0.15s',
                }}>
                  {flagKey ? (
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={e => {
                        if (e.target.checked) {
                          // Auto-add first entry if section is entry-based and currently empty
                          if (m.isEntry) {
                            const existing = data[m.key as keyof ResumeData]
                            if (!Array.isArray(existing) || (existing as Entry[]).length === 0) {
                              onAddModule(m.key)
                              return
                            }
                          }
                          // Summary: inject default text via onAddModule when empty
                          if (m.key === 'summary' && !data.summary) {
                            onAddModule(m.key)
                            return
                          }
                          // Skills: delegate to onAddModule so sample data is injected when empty
                          if (m.key === 'skills' && data.skills.length === 0) {
                            onAddModule(m.key)
                            return
                          }
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
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    background: m.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{m.icon}</div>
                  <span style={{
                    flex: 1, fontSize: '12.5px',
                    color: isEnabled ? '#0f172a' : '#94a3b8',
                    fontWeight: 500,
                  }}>{m.label}</span>
                  <button
                    onClick={() => onAddModule(m.key)}
                    style={{
                      padding: '3px 10px', borderRadius: '5px', fontSize: '12px',
                      border: '1px solid #e2e8f0', background: 'white',
                      color: 'var(--theme-blue)', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', flexShrink: 0,
                    }}
                  >
                    {m.isEntry ? '+' : '编辑'}
                  </button>
                </div>
              )
            })}
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
                style={{ width: '36px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '2px', background: '#f8fafc' }}
              />
              <button onClick={() => {
                const el = document.getElementById('customColor') as HTMLInputElement
                if (el) onColorChange(el.value)
              }} style={{
                padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
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
                  padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                  border: `1.5px solid ${currentFontPair === fp.value ? '#0f172a' : '#e2e8f0'}`,
                  background: currentFontPair === fp.value ? '#f8fafc' : 'white',
                  fontFamily: 'var(--font-sans)', textAlign: 'left', width: '100%',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f1f5f9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  padding: '8px 10px 8px', borderRadius: '8px', cursor: 'pointer',
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
              background: '#f8fafc', borderRadius: '8px',
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
                  <div key={entry.id} style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${confirmDeleteId === entry.id ? '#fca5a5' : '#e2e8f0'}`,
                    background: confirmDeleteId === entry.id ? '#fff5f5' : '#f8fafc',
                    transition: 'all 0.15s',
                  }}>
                    {confirmDeleteId === entry.id ? (
                      <div>
                        <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600, marginBottom: '8px', wordBreak: 'break-word' }}>
                          确定删除「{entry.name}」？
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              deleteHistory(entry.id)
                              setHistoryEntries(loadHistory())
                              setConfirmDeleteId(null)
                              onHistoryDelete?.(entry.id)
                            }}
                            style={{
                              flex: 1, padding: '5px', borderRadius: '5px', fontSize: '12px',
                              border: 'none', background: '#dc2626',
                              color: 'white', fontWeight: 600, cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >删除</button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            style={{
                              flex: 1, padding: '5px', borderRadius: '5px', fontSize: '12px',
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
                          {entry.id === currentHistoryId ? (
                            <div style={{
                              padding: '4px 8px', borderRadius: '5px', fontSize: '11px',
                              background: '#e0f0fd', color: 'var(--theme-blue)', fontWeight: 600,
                              border: '1px solid rgba(13,148,136,0.3)',
                              display: 'flex', alignItems: 'center', gap: '3px',
                              whiteSpace: 'nowrap',
                            }}>
                              ✦ 当前编辑
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const fresh = loadHistory().find(h => h.id === entry.id) ?? entry
                                setHistoryEntries(loadHistory())
                                onLoadHistory?.(fresh)
                              }}
                              style={{
                                padding: '4px 10px', borderRadius: '5px', fontSize: '12px',
                                border: '1px solid var(--theme-blue)', background: 'white',
                                color: 'var(--theme-blue)', fontWeight: 600, cursor: 'pointer',
                                fontFamily: 'var(--font-sans)',
                              }}
                            >
                              加载
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDeleteId(entry.id)}
                            style={{
                              padding: '4px 7px', borderRadius: '5px', fontSize: '12px',
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
  { value: 'gradient-band', label: '渐变色带' },
  { value: 'plain-bold',    label: '粗体简洁' },
]

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
          <div style={{ background: c, borderRadius: '3px', padding: '3px 7px' }}>
            <span style={{ ...baseText, color: '#fff' }}>{text}</span>
          </div>
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
    case 'gradient-band':
      return (
        <div style={{ height: '30px', display: 'flex', alignItems: 'center', marginLeft: '-4px', paddingLeft: '6px', borderLeft: `2px solid ${c}`, background: `linear-gradient(to right, ${c}22, transparent)` }}>
          <div style={baseText}>{text}</div>
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

function TplCard({ tpl, active, onClick, isPro, isLocked }: {
  tpl: TemplateConfig; active: boolean; onClick: () => void; isPro?: boolean; isLocked?: boolean
}) {
  return (
    <div onClick={onClick} style={{
      borderRadius: '8px',
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
      <div style={{
        background: '#f1f5f9', padding: '6px',
        display: 'flex', justifyContent: 'center',
      }}>
        <TemplateThumbnail template={tpl} width={104} />
      </div>
      {isPro && (
        <div style={{
          position: 'absolute', top: '4px', right: '4px',
          background: isLocked ? '#94a3b8' : '#f59e0b', color: 'white',
          fontSize: '8px', padding: '2px 5px', borderRadius: '3px',
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
  borderRadius: '7px', border: '1px solid #e2e8f0',
  background: '#f8fafc', fontSize: '12.5px',
  color: '#334155', fontWeight: 500,
  cursor: 'pointer', fontFamily: 'var(--font-sans)',
  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px',
}
