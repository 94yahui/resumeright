'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FileUp } from 'lucide-react'

export default function UploadModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const pickFile = (f: File) => { setFile(f); setError('') }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }

  const handleStart = async () => {
    if (!file || loading) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/ai/parse-resume', { method: 'POST', body: formData })
      if (res.status === 422) {
        setError('未检测到简历内容，请上传简历文件')
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error('parse failed')
      const json = await res.json()
      const filename = file.name.replace(/\.[^.]+$/, '')
      sessionStorage.setItem('resumecraft_landing_import', JSON.stringify({ data: json.data, filename }))
      router.push('/editor')
    } catch {
      setError('解析失败，请重试')
      setLoading(false)
    }
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && !loading && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26,24,20,0.6)', backdropFilter: 'blur(4px)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
      <input
        ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = '' }}
      />

      <div style={{
        background: 'white', borderRadius: '20px', padding: '40px',
        maxWidth: '480px', width: '90%',
        boxShadow: '0 20px 60px rgba(26,24,20,0.25)', animation: 'fadeUp 0.25s ease',
      }}>
        <h2 style={{ fontFamily: "'Inter','Noto Sans SC',sans-serif", fontSize: '26px', marginBottom: '8px' }}>
          上传已有简历
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--ink3)', marginBottom: '28px', fontWeight: 300 }}>
          AI 将自动识别你的简历内容，并按照默认模板重新排版
        </p>

        <div
          onClick={() => !loading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          style={{
            border: `2px dashed ${file ? 'var(--theme-blue)' : 'var(--paper3)'}`,
            borderRadius: '12px', padding: '36px 24px',
            textAlign: 'center', cursor: loading ? 'default' : 'pointer',
            background: file ? '#e0f0fd' : 'var(--paper)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!file && !loading) { e.currentTarget.style.borderColor = 'var(--theme-blue)'; e.currentTarget.style.background = '#e0f0fd' } }}
          onMouseLeave={e => { if (!file) { e.currentTarget.style.borderColor = 'var(--paper3)'; e.currentTarget.style.background = 'var(--paper)' } }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <FileUp size={32} color={file ? 'var(--theme-blue)' : '#94a3b8'} />
          </div>
          <div style={{ fontSize: '14px', color: file ? 'var(--theme-blue)' : 'var(--ink2)' }}>
            {file ? (
              <>
                <strong>{file.name}</strong>
                <br />
                <span style={{ fontSize: '12px', color: '#64748b' }}>点击重新选择文件</span>
              </>
            ) : (
              <>
                <strong style={{ color: 'var(--theme-blue)' }}>点击选择文件</strong> 或拖拽到此处
                <br />
                <span style={{ fontSize: '12px', color: 'var(--ink3)', display: 'block', marginTop: '6px' }}>
                  支持 PDF、Word (.docx)，最大 10MB
                </span>
              </>
            )}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '10px', fontSize: '13px', color: '#dc2626', textAlign: 'center' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={onClose} disabled={loading}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px',
              border: '1.5px solid var(--paper3)', background: 'transparent',
              fontFamily: "'Inter','Noto Sans SC',sans-serif", fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer', color: 'var(--ink2)',
              opacity: loading ? 0.5 : 1,
            }}
          >取消</button>
          <button
            onClick={handleStart} disabled={!file || loading}
            style={{
              flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
              background: file && !loading ? 'var(--theme-blue)' : '#94a3b8',
              color: 'white', fontFamily: "'Inter','Noto Sans SC',sans-serif",
              fontSize: '14px', fontWeight: 500,
              cursor: file && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                  animation: 'spin 0.8s linear infinite', flexShrink: 0,
                }} />
                AI 解析中...
              </>
            ) : '开始解析'}
          </button>
        </div>
      </div>
    </div>
  )
}
