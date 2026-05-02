'use client'
import { useState } from 'react'
import { TEMPLATES, TemplateConfig } from '../../lib/templates-config'
import TemplateThumbnail from '../../lib/TemplateThumbnail'
import { ResumeData, Entry } from '../../lib/types'

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

const MODULES = [
  { key: 'exp',       label: '工作经历', icon: '💼', bg: '#ccfbf1', isEntry: true },
  { key: 'edu',       label: '教育背景', icon: '🎓', bg: '#fef3c7', isEntry: true },
  { key: 'summary',   label: '个人简介', icon: '📝', bg: '#f1f5f9', isEntry: false },
  { key: 'skills',    label: '专业技能', icon: '⚡', bg: '#fee2e2', isEntry: false },
  { key: 'project',   label: '项目经历', icon: '🌐', bg: '#dbeafe', isEntry: true },
  { key: 'language',  label: '语言能力', icon: '🗣️', bg: '#ede9fe', isEntry: true },
  { key: 'award',     label: '荣誉奖项', icon: '🏆', bg: '#fef3c7', isEntry: true },
  { key: 'cert',      label: '资质证书', icon: '📜', bg: '#ccfbf1', isEntry: true },
  { key: 'volunteer', label: '志愿服务', icon: '🤝', bg: '#f1f5f9', isEntry: true },
  { key: 'interest',  label: '兴趣爱好', icon: '✨', bg: '#fee2e2', isEntry: true },
]

const COLORS = [
  '#0f172a', '#1e3a8a', '#0d9488', '#d4a017',
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
}

export default function LeftPanel({
  templateId, onTemplateChange, onColorChange, currentColor, onAddModule, data, onUpdate,
}: Props) {
  const [tab, setTab] = useState<'tpl' | 'mod' | 'color'>('tpl')
  const [showPro, setShowPro] = useState(false)

  const freeTpls = TEMPLATES.filter(t => t.free)
  const proTpls = TEMPLATES.filter(t => !t.free)

  return (
    <div style={{
      width: '264px', background: 'white',
      borderRight: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
        {(['tpl', 'mod', 'color'] as const).map((t, i) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px 4px',
            fontSize: '12px', fontWeight: 600,
            color: tab === t ? '#0f172a' : '#64748b',
            cursor: 'pointer', background: 'transparent',
            border: 'none', fontFamily: 'var(--font-sans)',
            borderBottom: `2px solid ${tab === t ? '#0f172a' : 'transparent'}`,
            transition: 'all 0.15s',
          }}>{['模板', '模块', '颜色'][i]}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ===== TEMPLATE TAB ===== */}
        {tab === 'tpl' && (
          <div>
            <div style={{ padding: '14px 14px 6px', fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#0d9488' }}>
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
                🔒 Pro 模板 ({proTpls.length}) {showPro ? '▲' : '▼'}
              </button>
            </div>

            {showPro && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 14px 14px' }}>
                {proTpls.map(tpl => (
                  <TplCard key={tpl.id} tpl={tpl} active={templateId === tpl.id} onClick={() => onTemplateChange(tpl.id)} isPro />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== MODULE TAB ===== */}
        {tab === 'mod' && (
          <div>
            {/* Personal info */}
            <div style={{ padding: '12px 14px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b' }}>
              个人信息
            </div>
            <div style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={() => onAddModule('name')} style={infoBtn}>
                👤 姓名 / 职位
              </button>
              <button onClick={() => onAddModule('contact')} style={infoBtn}>
                📧 联系方式
              </button>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => onAddModule('photo')} style={{ ...infoBtn, flex: 1 }}>
                  📷 上传照片
                </button>
                {data.photo && (
                  <button onClick={() => onAddModule('photo-clear')} style={{ ...infoBtn, flex: 1, color: '#dc2626', borderColor: 'rgba(220,38,38,0.25)' }}>
                    🗑 移除照片
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
                          onUpdate({ [flagKey]: true } as Partial<ResumeData>)
                        } else {
                          onUpdate({ [flagKey]: false } as Partial<ResumeData>)
                        }
                      }}
                      style={{ accentColor: '#0d9488', flexShrink: 0, width: '14px', height: '14px', cursor: 'pointer' }}
                    />
                  ) : (
                    <div style={{ width: '14px', flexShrink: 0 }} />
                  )}
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    background: m.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', flexShrink: 0,
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
                      color: '#0d9488', fontWeight: 600, cursor: 'pointer',
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
            }}>
              💡 主题色影响标题、边框等强调元素，切换模板后会保持
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TplCard({ tpl, active, onClick, isPro }: {
  tpl: TemplateConfig; active: boolean; onClick: () => void; isPro?: boolean
}) {
  return (
    <div onClick={onClick} style={{
      borderRadius: '8px',
      border: `2px solid ${active ? '#0f172a' : '#e2e8f0'}`,
      cursor: 'pointer', overflow: 'hidden',
      transition: 'all 0.2s',
      boxShadow: active ? '0 0 0 2px rgba(15, 23, 42, 0.1)' : 'none',
      position: 'relative', background: 'white',
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
          background: '#0f172a', color: 'white',
          fontSize: '8px', padding: '2px 5px', borderRadius: '3px',
        }}>🔒</div>
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
