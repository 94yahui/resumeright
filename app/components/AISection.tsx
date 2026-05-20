'use client'
import { Sparkles, FileText, Target, MessageCircle } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    rgb: '56,189,248',
    iconBg: 'rgba(56,189,248,0.12)',
    title: '智能内容优化',
    desc: '选中任意文字模块，一键让 AI 帮你改写成更专业、更有力的表达。数字化成果、量化描述、行业术语——AI 全部帮你处理。',
    tag: '内容优化',
  },
  {
    icon: FileText,
    rgb: '251,191,36',
    iconBg: 'rgba(251,191,36,0.12)',
    title: '简历智能解析',
    desc: '上传你的旧简历（PDF / Word），AI 自动识别所有内容，并按照你选择的新模板重新排版填充，秒级完成迁移。',
    tag: '文档解析',
  },
  {
    icon: Target,
    rgb: '248,113,113',
    iconBg: 'rgba(248,113,113,0.12)',
    title: '岗位匹配分析',
    desc: '粘贴目标职位的 JD，AI 分析你的简历与岗位要求的匹配度，并给出具体的优化建议和关键词补充。',
    tag: 'Pro 功能',
  },
  {
    icon: MessageCircle,
    rgb: '167,139,250',
    iconBg: 'rgba(167,139,250,0.12)',
    title: '面试问题预测',
    desc: '基于你的简历内容，AI 预测面试官可能提问的问题，并帮你准备 STAR 法则结构的参考回答。',
    tag: 'Pro 功能',
  },
]

export default function AISection() {
  return (
    <section style={{
      background: 'linear-gradient(160deg, black 0%, var(--ink) 55%, black 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Dot grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />
      {/* Ambient orbs */}
      <div style={{
        position: 'absolute', width: '640px', height: '640px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(7,137,236,0.14) 0%, transparent 70%)',
        top: '-260px', left: '-160px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '520px', height: '520px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(109,40,217,0.12) 0%, transparent 70%)',
        bottom: '-180px', right: '-60px', pointerEvents: 'none',
      }} />

      <div id="ai" style={{ padding: '96px 32px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }} className="fade-in">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.22)',
            padding: '5px 14px', borderRadius: '20px',
            marginBottom: '22px',
          }}>
            <Sparkles size={11} color="#38bdf8" />
            <span style={{
              fontSize: '11px', letterSpacing: '2.5px', textTransform: 'uppercase',
              color: '#38bdf8', fontWeight: 600,
            }}>
              AI 智能功能
            </span>
          </div>

          <h2 style={{
            fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
            fontSize: 'clamp(28px, 4vw, 40px)',
            letterSpacing: '-1px', color: '#ffffff',
            lineHeight: 1.2, marginBottom: '16px',
          }}>
            让 AI 成为你的{' '}
            <span style={{
              background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              简历顾问
            </span>
          </h2>

          <p style={{
            fontSize: '15px', color: 'rgba(255,255,255,0.42)',
            maxWidth: '440px', margin: '0 auto', lineHeight: 1.75,
          }}>
            从内容优化到岗位匹配，AI 贯穿简历创作的每一个环节
          </p>
        </div>

        {/* Cards grid */}
        <div className="ai-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '20px', marginTop: '56px',
        }}>
          {features.map((f, i) => (
            <AICard key={f.title} feature={f} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  )
}

function AICard({ feature, delay }: { feature: typeof features[0], delay: number }) {
  const Icon = feature.icon
  const color = `rgb(${feature.rgb})`
  const glow = `rgba(${feature.rgb},0.18)`
  const borderActive = `rgba(${feature.rgb},0.32)`

  return (
    <div className="fade-in" style={{ transitionDelay: `${delay}s` }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px', padding: '32px',
          position: 'relative', overflow: 'hidden',
          transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
          cursor: 'default', height: '100%', boxSizing: 'border-box',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = borderActive
          e.currentTarget.style.boxShadow = `0 0 48px ${glow}, 0 8px 32px rgba(0,0,0,0.35)`
          e.currentTarget.style.transform = 'translateY(-3px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Corner glow blob */}
        <div style={{
          position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${feature.rgb},0.10) 0%, transparent 70%)`,
          top: '-60px', right: '-60px', filter: 'blur(24px)',
          pointerEvents: 'none',
        }} />

        {/* Icon box */}
        <div style={{
          width: '48px', height: '48px',
          background: feature.iconBg,
          borderRadius: '14px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid rgba(${feature.rgb},0.18)`,
        }}>
          <Icon size={22} color={color} strokeWidth={1.8} />
        </div>

        <h3 style={{
          fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
          fontSize: '19px', fontWeight: 600,
          color: '#ffffff', marginBottom: '10px', letterSpacing: '-0.3px',
        }}>
          {feature.title}
        </h3>

        <p style={{
          fontSize: '14px', color: 'rgba(255,255,255,0.44)',
          lineHeight: 1.78, fontWeight: 400,
        }}>
          {feature.desc}
        </p>

        <div style={{
          display: 'inline-block', marginTop: '22px',
          padding: '4px 12px',
          background: feature.iconBg,
          color, borderRadius: '20px',
          fontSize: '11px', fontWeight: 600,
          border: `1px solid rgba(${feature.rgb},0.2)`,
        }}>
          {feature.tag}
        </div>
      </div>
    </div>
  )
}
