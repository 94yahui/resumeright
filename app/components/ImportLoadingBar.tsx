'use client'
import { useState, useEffect } from 'react'

const DEFAULT_STAGES = [
  { after: 0,     msg: '正在上传并扫描文档…' },
  { after: 2000,  msg: '提取个人信息与联系方式…' },
  { after: 5000,  msg: '识别工作经历与技能模块…' },
  { after: 8000,  msg: '解析教育背景与项目经历…' },
  { after: 12000, msg: '生成结构化简历数据…' },
  { after: 16000, msg: '正在填入专业模版…' },
]

interface Props {
  stages?: Array<{ after: number; msg: string }>
}

export default function ImportLoadingBar({ stages }: Props) {
  const STAGES = stages ?? DEFAULT_STAGES
  const [msg, setMsg] = useState(STAGES[0].msg)

  useEffect(() => {
    setMsg(STAGES[0].msg)
    const timers = STAGES.slice(1).map(({ after, msg }) =>
      setTimeout(() => setMsg(msg), after)
    )
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '220px', height: '3px',
        background: '#e2e8f0', borderRadius: '3px',
        position: 'relative', overflow: 'hidden',
        margin: '0 auto 16px',
      }}>
        <div style={{
          position: 'absolute', top: 0,
          width: '44%', height: '100%',
          background: 'var(--theme-blue)', borderRadius: '3px',
          animation: 'importSlide 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
        }} />
      </div>
      <div style={{
        fontSize: '13px', color: '#64748b',
        fontFamily: "'Inter','Noto Sans SC',sans-serif",
        minHeight: '20px',
      }}>
        {msg}
      </div>
    </div>
  )
}
