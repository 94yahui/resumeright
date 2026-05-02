'use client'
import Link from 'next/link'
import logo from "../../../public/resume-logo.png"
import Image from 'next/image'

interface Props {
  docTitle: string
  setDocTitle: (v: string) => void
  onPreview: () => void
  onUpload: () => void
  onDownload: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export default function EditorTopbar({
  docTitle, setDocTitle, onPreview, onUpload, onDownload,
  onUndo, onRedo, canUndo, canRedo,
}: Props) {
  return (
    <div style={{
      height: '52px', background: '#0f172a',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: '12px', flexShrink: 0, zIndex: 50,
    }}>
      <Link href="/" style={{
        color: '#fff', fontSize: '16px', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: '8px',
        textDecoration: 'none', flexShrink: 0,
      }}>
        <Image src={logo} alt="简历帮" width={26} />
        简历帮
      </Link>

      <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.12)' }} />

      <input
        value={docTitle}
        onChange={e => setDocTitle(e.target.value)}
        placeholder="简历名称"
        style={{
          background: 'transparent', border: 'none',
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'var(--font-sans)', fontSize: '13px',
          outline: 'none', width: '180px', cursor: 'text',
          padding: '4px 6px', borderRadius: '4px',
        }}
        onFocus={e => (e.target.style.background = 'rgba(255,255,255,0.05)')}
        onBlur={e => (e.target.style.background = 'transparent')}
      />

      {/* Undo/Redo */}
      <div style={{ display: 'flex', gap: '2px' }}>
        <button onClick={onUndo} disabled={!canUndo}
          style={{
            padding: '6px 10px', borderRadius: '6px',
            fontSize: '12px', fontFamily: 'var(--font-sans)',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            color: canUndo ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.15s',
          }}>↶ 撤销</button>
        <button onClick={onRedo} disabled={!canRedo}
          style={{
            padding: '6px 10px', borderRadius: '6px',
            fontSize: '12px', fontFamily: 'var(--font-sans)',
            cursor: canRedo ? 'pointer' : 'not-allowed',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            color: canRedo ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.15s',
          }}>↷ 重做</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>已自动保存</span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={onPreview} style={tbBtn}>👁 预览</button>
        <button onClick={onUpload} style={{ ...tbBtn, background: '#0d9488', borderColor: '#0d9488', color: '#fff' }}>✦ AI 解析</button>
        <button onClick={onDownload} style={{ ...tbBtn, background: '#d4a017', borderColor: '#d4a017', color: '#1a1814', fontWeight: 600 }}>⬇ 下载 PDF</button>
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
