'use client'
import { useState, useEffect } from 'react'
import {
  Briefcase, GraduationCap, FileText, Zap, Globe, MessageSquare,
  Trophy, FileCheck, HandHelping, Sparkles, UserRound, Mail, Camera,
  Trash2, Lock, Lightbulb, History, Plus, X,
} from 'lucide-react'
import { TEMPLATES, TemplateConfig } from '../../lib/templates-config'
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
  onAddModule: (key: string) => void
  data: ResumeData
  onUpdate: (patch: Partial<ResumeData>) => void
  onSaveHistory?: () => void
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
  onProTemplateLocked?: () => void
}

export default function LeftPanel({
  templateId, onTemplateChange, onColorChange, currentColor, onAddModule, data, onUpdate,
  onSaveHistory, onLoadHistory, onHistoryDelete, historyRefreshKey, currentHistoryId, currentDocTitle,
  isMobile, onClose, forceTab, disabled, canUseProTemplate = false, onProTemplateLocked,
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
  const TAB_LABELS = ['模板', '模块', '颜色', '我的']

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
          <div>
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
                {proTpls.map(tpl => (
                  <TplCard key={tpl.id} tpl={tpl} active={templateId === tpl.id}
                    onClick={() => canUseProTemplate ? onTemplateChange(tpl.id) : onProTemplateLocked?.()}
                    isPro locked={!canUseProTemplate} />
                ))}
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
                <Mail size={13} /> 联系方式
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

        {/* ===== COLOR TAB ===== */}
        {tab === 'color' && (
          <div style={{ padding: '18px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '12px' }}>
              主题色
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => onColorChange(c)} style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: c, cursor: 'pointer',
                  border: '2px solid white',
                  boxShadow: currentColor === c ? `0 0 0 2.5px #0f172a` : '0 0 0 1.5px #e2e8f0',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', color: 'white',
                }}>
                  {currentColor === c ? '✓' : ''}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px' }}>
              自定义颜色
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="color" defaultValue={currentColor} id="customColor"
                style={{ width: '38px', height: '38px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '2px', background: '#f8fafc' }}
              />
              <button onClick={() => {
                const el = document.getElementById('customColor') as HTMLInputElement
                if (el) onColorChange(el.value)
              }} style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                background: 'white', fontSize: '12px', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', color: '#334155', fontWeight: 500,
              }}>应用</button>
            </div>

            <div style={{
              marginTop: '24px', padding: '14px',
              background: '#f8fafc', borderRadius: '8px',
              fontSize: '12px', color: '#64748b', lineHeight: 1.6,
              display: 'flex', alignItems: 'flex-start', gap: '6px',
            }}>
              <Lightbulb size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
              主题色影响标题、边框等强调元素，切换模板后会保持
            </div>
          </div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {tab === 'hist' && (
          <div style={{ padding: '14px' }}>
            <button
              onClick={disabled ? undefined : () => onSaveHistory?.()}
              disabled={disabled}
              style={{
                width: '100%', padding: '9px 14px',
                borderRadius: '8px', border: `1px solid ${disabled ? '#e2e8f0' : 'var(--theme-blue)'}`,
                background: disabled ? '#f8fafc' : '#e0f0fd', fontSize: '12.5px',
                color: disabled ? '#94a3b8' : 'var(--theme-blue)', fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                marginBottom: '14px', opacity: disabled ? 0.5 : 1,
              }}
            >
              <Plus size={13} /> 保存当前
            </button>

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

function TplCard({ tpl, active, onClick, isPro, locked }: {
  tpl: TemplateConfig; active: boolean; onClick: () => void; isPro?: boolean; locked?: boolean
}) {
  return (
    <div onClick={onClick} style={{
      borderRadius: '8px',
      border: `2px solid ${active ? '#0f172a' : '#e2e8f0'}`,
      cursor: 'pointer', overflow: 'hidden',
      transition: 'all 0.2s',
      boxShadow: active ? '0 0 0 2px rgba(15, 23, 42, 0.1)' : 'none',
      position: 'relative', background: 'white',
      opacity: locked ? 0.75 : 1,
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = locked ? '#fbbf24' : '#94a3b8' }}
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
          background: locked ? '#f59e0b' : '#0f172a', color: 'white',
          fontSize: '8px', padding: '2px 5px', borderRadius: '3px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
        }}>
          <Lock size={8} color="white" />
          {locked && <span style={{ fontSize: '7px', fontWeight: 700 }}>Pro</span>}
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
