'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileUp } from 'lucide-react'
import { getDeviceId, getProStatus, checkUsage, recordUsage, type ProStatus } from '../lib/payment'
import { setPendingImport } from '../lib/pendingImport'
import { useAuth } from '../hooks/useAuth'

const SUB_PLANS = new Set(['monthly', 'quarterly', 'yearly', 'trial7'])

export default function UploadModal({ onClose, onLoginRequest }: { onClose: () => void; onLoginRequest?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [limitHit, setLimitHit] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [guestProStatus, setGuestProStatus] = useState<ProStatus>({ kind: 'free' })
  const auth = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const did = getDeviceId()
    setDeviceId(did)
    setGuestProStatus(getProStatus(did))
  }, [])

  // Import limit for logged-in users, derived from DB-sourced membership in auth state
  const isSubscriber = auth.loggedIn && !!auth.membership &&
    SUB_PLANS.has(auth.membership.plan) &&
    (!auth.membership.expires_at || auth.membership.expires_at > Date.now())
  const isSingle = auth.loggedIn && auth.membership?.plan === 'single'
  const importLimit = isSubscriber ? 10 : isSingle ? 5 : 2

  const pickFile = (f: File) => { setFile(f); setError('') }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }

  const handleStart = () => {
    if (!file) return

    if (auth.loggedIn) {
      // Logged-in: use DB-sourced daily import count from useAuth
      if (auth.dailyImportUsed >= importLimit) {
        setError(`今日导入次数已用完（${importLimit} 次/天），明日 00:00 自动重置`)
        return
      }
    } else {
      // Guest: check localStorage (no DB endpoint for guest counts)
      const check = checkUsage(deviceId, 'import', guestProStatus)
      if (!check.allowed) {
        setLimitHit(true)
        return
      }
      recordUsage(deviceId, 'import', guestProStatus)
    }
    setLimitHit(false)

    const filename = file.name.replace(/\.[^.]+$/, '')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('deviceId', deviceId)

    const promise = fetch('/api/ai/parse-resume', { method: 'POST', body: formData })
      .then(async res => {
        if (res.status === 422) throw new Error('empty')
        if (res.status === 429) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || '今日导入次数已用完')
        }
        if (!res.ok) throw new Error('parse failed')
        const json = await res.json()
        // Refresh auth so daily import count updates in profile and editor
        window.dispatchEvent(new Event('rc:login'))
        return { data: (json.data ?? {}) as Record<string, unknown>, filename }
      })

    setPendingImport(promise)
    router.push('/editor')
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26,24,20,0.6)', backdropFilter: 'blur(4px)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
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
          {limitHit && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 12px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px' }}>
              <span style={{ fontSize: '12.5px', color: '#854d0e' }}>今日导入次数已用完，登录后次数重置</span>
              <button
                onClick={() => { onClose(); onLoginRequest?.() }}
                style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', background: 'var(--highlight)', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter','Noto Sans SC',sans-serif", flexShrink: 0 }}
              >登录</button>
            </div>
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
      </div>
    </div>
  )
}
