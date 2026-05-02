'use client'
import { useState } from 'react'

export default function UploadModal({ onClose }: { onClose: () => void }) {
  const [uploaded, setUploaded] = useState(false)

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26,24,20,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: 'white', borderRadius: '20px',
        padding: '40px', maxWidth: '480px', width: '90%',
        boxShadow: '0 20px 60px rgba(26,24,20,0.25)',
        animation: 'fadeUp 0.25s ease',
      }}>
        <style>{`@keyframes fadeUp { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>

        <h2 style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif", fontSize: '26px', marginBottom: '8px' }}>
          上传已有简历
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--ink3)', marginBottom: '28px', fontWeight: 300 }}>
          AI 将自动识别你的简历内容，并按照所选模板重新排版
        </p>

        <div
          onClick={() => setUploaded(true)}
          style={{
            border: `2px dashed ${uploaded ? 'var(--teal)' : 'var(--paper3)'}`,
            borderRadius: '12px', padding: '40px',
            textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.2s',
            background: uploaded ? 'var(--teal-light)' : 'var(--paper)',
          }}
          onMouseEnter={e => { if (!uploaded) { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.background = 'var(--teal-light)' } }}
          onMouseLeave={e => { if (!uploaded) { e.currentTarget.style.borderColor = 'var(--paper3)'; e.currentTarget.style.background = 'var(--paper)' } }}
        >
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>{uploaded ? '✅' : '📄'}</div>
          <div style={{ fontSize: '14px', color: uploaded ? 'var(--teal)' : 'var(--ink2)' }}>
            {uploaded ? (
              <><strong>resume_2024.pdf</strong><br /><span style={{ fontSize: '12px' }}>文件已选择，准备解析</span></>
            ) : (
              <><strong style={{ color: 'var(--teal)' }}>点击选择文件</strong> 或拖拽到此处<br /><span style={{ fontSize: '12px', color: 'var(--ink3)', display: 'block', marginTop: '6px' }}>支持 PDF、Word (.docx)，最大 10MB</span></>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: '10px',
            border: '1.5px solid var(--paper3)', background: 'transparent',
            fontFamily: "'Inter', 'Noto Sans SC', sans-serif", fontSize: '14px',
            cursor: 'pointer', color: 'var(--ink2)', transition: 'all 0.2s',
          }}>取消</button>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: '10px',
            border: 'none', background: 'var(--teal)', color: 'white',
            fontFamily: "'Inter', 'Noto Sans SC', sans-serif", fontSize: '14px',
            fontWeight: 500, cursor: 'pointer',
          }}>开始解析</button>
        </div>
      </div>
    </div>
  )
}
