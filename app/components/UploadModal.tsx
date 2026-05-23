'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileUp } from 'lucide-react'
import { getDeviceId, getProStatus, checkUsage, recordUsage, type ProStatus } from '../lib/payment'

export default function UploadModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [proStatus, setProStatus] = useState<ProStatus>({ kind: 'free' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const router = useRouter()

  useEffect(() => {
    const did = getDeviceId()
    setDeviceId(did)
    setProStatus(getProStatus(did))
  }, [])

  // Abort in-flight request on unmount (SPA back-navigation closes the modal)
  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  // Abort on page refresh or tab close while loading
  useEffect(() => {
    if (!loading) return
    const handler = () => { abortRef.current?.abort() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [loading])

  const pickFile = (f: File) => { setFile(f); setError('') }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }

  const handleStart = async () => {
    if (!file || loading) return

    const check = checkUsage(deviceId, 'import', proStatus)
    if (!check.allowed) {
      setError(`今日 ${check.limit} 次免费次数已用完，请升级 Pro 继续使用`)
      return
    }

    setLoading(true)
    setError('')
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('deviceId', deviceId)
      const res = await fetch('/api/ai/parse-resume', { method: 'POST', body: formData, signal: controller.signal })
      if (res.status === 422) {
        setError('未检测到简历内容，请上传简历文件')
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error('parse failed')
      const json = await res.json()
      recordUsage(deviceId, 'import', proStatus)
      const filename = file.name.replace(/\.[^.]+$/, '')
      sessionStorage.setItem('resumecraft_landing_import', JSON.stringify({ data: json.data, filename }))
      router.push('/editor')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
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
        @keyframes uploadBounce { 0%,80%,100%{transform:translateY(0);opacity:.35} 40%{transform:translateY(-8px);opacity:1} }
      `}</style>
      <input
        ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = '' }}
      />

      <div style={{
        background: 'white', borderRadius: '20px',
        maxWidth: '480px', width: '90%',
        boxShadow: '0 20px 60px rgba(26,24,20,0.25)', animation: 'fadeUp 0.25s ease',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '52px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '10px', height: '10px', borderRadius: '50%', background: 'var(--theme-blue)',
                  animation: `uploadBounce 1.2s ${i * 0.18}s infinite`,
                }} />
              ))}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '6px', fontFamily: "'Inter','Noto Sans SC',sans-serif" }}>
              AI 正在识别简历
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', fontFamily: "'Inter','Noto Sans SC',sans-serif" }}>
              正在解析「{file?.name}」，请稍候...
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px' }}>
            <h2 style={{ fontFamily: "'Inter','Noto Sans SC',sans-serif", fontSize: '26px', marginBottom: '8px' }}>
              上传已有简历
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--ink3)', marginBottom: '28px', fontWeight: 300 }}>
              AI 将自动识别你的简历内容，并按照默认模板重新排版
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              style={{
                border: `2px dashed ${file ? 'var(--theme-blue)' : 'var(--paper3)'}`,
                borderRadius: '12px', padding: '36px 24px',
                textAlign: 'center', cursor: 'pointer',
                background: file ? '#e0f0fd' : 'var(--paper)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!file) { e.currentTarget.style.borderColor = 'var(--theme-blue)'; e.currentTarget.style.background = '#e0f0fd' } }}
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
                onClick={onClose}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1.5px solid var(--paper3)', background: 'transparent',
                  fontFamily: "'Inter','Noto Sans SC',sans-serif", fontSize: '14px',
                  cursor: 'pointer', color: 'var(--ink2)',
                }}
              >取消</button>
              <button
                onClick={handleStart} disabled={!file}
                style={{
                  flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
                  background: file ? 'var(--theme-blue)' : '#94a3b8',
                  color: 'white', fontFamily: "'Inter','Noto Sans SC',sans-serif",
                  fontSize: '14px', fontWeight: 500,
                  cursor: file ? 'pointer' : 'not-allowed',
                }}
              >开始导入</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
