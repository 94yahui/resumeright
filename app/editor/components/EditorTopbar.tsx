'use client'
import Link from 'next/link'
import whiteLogo from "../../../public/logo-white.png"
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Eye, Download, Save, Undo2, Redo2 } from 'lucide-react'

interface Props {
  docTitle: string
  setDocTitle: (v: string) => void
  onPreview: () => void
  onAIAnalyze: () => void
  onDownload: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onSave: () => void
  isMobile?: boolean
  onNewResume?: () => void
  onImportFile?: () => void
  onTranslate?: () => void
  translateLoading?: boolean
  disabled?: boolean
}

export default function EditorTopbar({
  docTitle, setDocTitle, onPreview, onAIAnalyze, onDownload,
  onUndo, onRedo, canUndo, canRedo, onSave, isMobile,
  onNewResume, onImportFile, onTranslate, translateLoading, disabled,
}: Props) {
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropOpen) return
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropOpen])

  return (
    <div style={{
      position: 'relative', height: '52px', background: '#0f172a',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: '12px', flexShrink: 0, zIndex: 100,
    }}>
      <Link href="/" style={{
        color: '#fff', fontSize: '16px', fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: '8px',
        textDecoration: 'none', flexShrink: 0,
      }}>
        <Image src={whiteLogo} alt="简力全开" width={26} />
        {!isMobile && '简力全开'}
      </Link>

      <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.12)' }} />

      {/* Title input + New resume "+" */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <input
          value={docTitle}
          onChange={e => setDocTitle(e.target.value)}
          placeholder="简历名称"
          style={{
            boxSizing: 'border-box',
            height: '26px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.9)',
            fontFamily: 'var(--font-sans)', fontSize: '13px',
            outline: 'none', width: '140px', cursor: 'text',
            padding: '0 8px', borderRadius: '5px',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.borderColor = 'rgba(255,255,255,0.25)' }}
          onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.07)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
        />

        {/* + dropdown */}
        <div ref={dropRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setDropOpen(v => !v)}
            title="创建 / 导入简历"
            style={{
              width: '26px', height: '26px', borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: dropOpen ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.9)',
              cursor: 'pointer', fontSize: '18px', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >+</button>

          {dropOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0,
              background: 'white', borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
              border: '1px solid #e2e8f0',
              padding: '5px',
              zIndex: 200,
              minWidth: '148px',
              animation: 'tbDropDown 0.15s ease',
            }}>
              <style>{`@keyframes tbDropDown{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <button
                onClick={() => { setDropOpen(false); onNewResume?.() }}
                style={dropItem}
                onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                创建新简历
              </button>
              <button
                onClick={() => { setDropOpen(false); onImportFile?.() }}
                style={dropItem}
                onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                导入简历
              </button>
              <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 6px' }} />
              <button
                onClick={() => { setDropOpen(false); onTranslate?.() }}
                disabled={translateLoading || disabled}
                style={{ ...dropItem, color: (translateLoading || disabled) ? '#94a3b8' : '#334155', cursor: translateLoading ? 'wait' : disabled ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!translateLoading && !disabled) e.currentTarget.style.background = '#f1f5f9' }}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {translateLoading ? '翻译中...' : '🌐 生成英文版'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Undo/Redo */}
      <div style={{ display: isMobile ? 'none' : 'flex', gap: '2px' }}>
        <button onClick={onUndo} disabled={!canUndo} title="撤销"
          style={{
            padding: '6px 10px', borderRadius: '6px',
            fontSize: '12px', fontFamily: 'var(--font-sans)',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            color: canUndo ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center',
          }}><Undo2 size={12} /></button>
        <button onClick={onRedo} disabled={!canRedo} title="重做"
          style={{
            padding: '6px 10px', borderRadius: '6px',
            fontSize: '12px', fontFamily: 'var(--font-sans)',
            cursor: canRedo ? 'pointer' : 'not-allowed',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            color: canRedo ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center',
          }}><Redo2 size={12} /></button>
      </div>

      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>已自动保存</span>
        </div>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!isMobile && (
          <button onClick={disabled ? undefined : onSave} disabled={disabled} style={{ ...tbBtn, display: 'flex', alignItems: 'center', gap: '5px', opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <Save size={13} /> 保存
          </button>
        )}
        {!isMobile && (
          <button onClick={disabled ? undefined : onPreview} disabled={disabled} style={{ ...tbBtn, display: 'flex', alignItems: 'center', gap: '5px', opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <Eye size={13} /> 预览
          </button>
        )}
        <button onClick={disabled ? undefined : onAIAnalyze} disabled={disabled} style={{ ...tbBtn, background: disabled ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, var(--ai-color-1), var(--ai-color-2))', borderColor: 'var(--paper)', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>✦ {isMobile ? 'AI' : 'AI 解析'}</button>
        <button onClick={disabled ? undefined : onDownload} disabled={disabled} style={{ ...tbBtn, background: disabled ? 'rgba(255,255,255,0.06)' : 'var(--theme-blue)', borderColor: disabled ? 'rgba(255,255,255,0.15)' : 'var(--theme-blue)', color: disabled ? 'rgba(255,255,255,0.3)' : 'var(--paper)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
          <Download size={13} /> {isMobile ? 'PDF' : '下载 PDF'}
        </button>
      </div>
    </div>
  )
}

const tbBtn: React.CSSProperties = {
  padding: '6px 14px', borderRadius: '7px',
  fontSize: '12px', fontWeight: 500,
  cursor: 'pointer', fontFamily: 'var(--font-sans)',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.85)',
  transition: 'all 0.15s',
}

const dropItem: React.CSSProperties = {
  display: 'block', width: '100%',
  padding: '9px 13px', textAlign: 'left',
  background: 'transparent', border: 'none',
  borderRadius: '7px', cursor: 'pointer',
  fontSize: '13px', color: '#334155',
  fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
  transition: 'background 0.1s',
}
