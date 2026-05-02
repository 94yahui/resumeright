'use client'
import { useState } from 'react'

export function DownloadModal({ onClose, onPrintPDF }: { onClose: () => void; onPrintPDF: () => void }) {
  return (
    <ModalWrap onClose={onClose}>
      <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>下载简历</div>
      <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
        将弹出浏览器打印对话框，选择"另存为 PDF"即可
      </p>

      <div onClick={onPrintPDF} style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 16px',
        border: '2px solid #0d9488',
        borderRadius: '10px', cursor: 'pointer', marginBottom: '10px',
        background: '#f0fdfa',
        transition: 'all 0.2s',
      }}>
        <span style={{ fontSize: '24px' }}>📕</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>PDF 格式</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>推荐 · 适合投递使用</div>
        </div>
        <span style={{ fontSize: '14px', color: '#0d9488' }}>→</span>
      </div>

      {[
        { icon: '📘', label: 'Word (.docx)', sub: 'Pro 功能 · 即将上线' },
        { icon: '🖼️', label: 'PNG 图片', sub: 'Pro 功能 · 即将上线' },
      ].map(o => (
        <div key={o.label} style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '14px 16px',
          border: '1.5px solid #e2e8f0',
          borderRadius: '10px', marginBottom: '10px',
          background: 'white', opacity: 0.5,
        }}>
          <span style={{ fontSize: '24px' }}>{o.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{o.label}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{o.sub}</div>
          </div>
        </div>
      ))}

      <button onClick={onClose} style={{
        width: '100%', marginTop: '4px', padding: '11px',
        border: '1px solid #e2e8f0', background: 'transparent',
        borderRadius: '8px', fontFamily: 'var(--font-sans)',
        fontSize: '13px', cursor: 'pointer', color: '#64748b',
      }}>取消</button>
    </ModalWrap>
  )
}

export function UploadModal({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<'idle'|'selected'|'parsing'|'done'>('idle')
  const handleClick = () => {
    if (state === 'idle') setState('selected')
    else if (state === 'selected') { setState('parsing'); setTimeout(() => setState('done'), 2000) }
    else if (state === 'done') onClose()
  }
  return (
    <ModalWrap onClose={onClose} wide>
      <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>AI 解析简历</div>
      <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
        上传旧简历，AI 自动识别内容并填充到当前模板
      </p>
      <div onClick={handleClick} style={{
        border: `2px dashed ${state !== 'idle' ? '#0d9488' : '#cbd5e1'}`,
        borderRadius: '12px', padding: '36px', textAlign: 'center',
        cursor: state === 'parsing' ? 'wait' : 'pointer',
        transition: 'all 0.2s',
        background: state !== 'idle' ? '#f0fdfa' : '#f8fafc',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>
          {{'idle':'📄','selected':'✅','parsing':'⏳','done':'🎉'}[state]}
        </div>
        <div style={{ fontSize: '14px', color: state !== 'idle' ? '#0d9488' : '#334155', fontWeight: 500 }}>
          {{
            'idle':'点击选择文件（PDF / Word）',
            'selected':'resume_2024.pdf 已选择',
            'parsing':'AI 正在识别...',
            'done':'解析完成！内容已填充'
          }[state]}
        </div>
        {state === 'idle' && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>最大 10MB</div>}
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button onClick={onClose} style={{
          flex: 1, padding: '11px', borderRadius: '8px',
          border: '1.5px solid #e2e8f0', background: 'transparent',
          fontFamily: 'var(--font-sans)', fontSize: '14px',
          cursor: 'pointer', color: '#334155',
        }}>{state === 'done' ? '关闭' : '取消'}</button>
        {state !== 'done' && (
          <button onClick={handleClick} disabled={state === 'parsing'} style={{
            flex: 1, padding: '11px', borderRadius: '8px',
            border: 'none', background: state==='idle' ? '#0f172a' : '#0d9488',
            color: 'white', fontFamily: 'var(--font-sans)',
            fontSize: '14px', fontWeight: 500,
            cursor: state==='parsing' ? 'wait' : 'pointer',
          }}>
            {{'idle':'选择文件','selected':'开始解析','parsing':'解析中...'}[state]}
          </button>
        )}
      </div>
    </ModalWrap>
  )
}

function ModalWrap({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} className="no-print"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '36px', width: wide ? '480px' : '420px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)',
        animation: 'fadeUp 0.2s ease',
      }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
        {children}
      </div>
    </div>
  )
}
