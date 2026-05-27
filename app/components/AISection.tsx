'use client'
import { Sparkles, FileText, Target, MessageCircle } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    rgb: '56,189,248',
    solidColor: '#38bdf8',
    iconBg: 'rgba(56,189,248,0.15)',
    cardBg: 'rgba(56,189,248,0.06)',
    borderColor: 'rgba(56,189,248,0.3)',
    title: '智能内容优化',
    desc: '选中任意文字模块，一键让 AI 帮你改写成更专业、更有力的表达。数字化成果、量化描述、行业术语——AI 全部帮你处理。',
    tag: '内容优化',
    num: '1',
  },
  {
    icon: FileText,
    rgb: '251,191,36',
    solidColor: '#fbbf24',
    iconBg: 'rgba(251,191,36,0.15)',
    cardBg: 'rgba(251,191,36,0.05)',
    borderColor: 'rgba(251,191,36,0.3)',
    title: '简历智能解析',
    desc: '上传你的旧简历（PDF / Word），AI 自动识别所有内容，并按照你选择的新模板重新排版填充，秒级完成迁移。',
    tag: '文档解析',
    num: '2',
  },
  {
    icon: Target,
    rgb: '248,113,113',
    solidColor: '#f87171',
    iconBg: 'rgba(248,113,113,0.15)',
    cardBg: 'rgba(248,113,113,0.05)',
    borderColor: 'rgba(248,113,113,0.3)',
    title: '岗位匹配分析',
    desc: '粘贴目标职位详情，AI 分析你的简历与岗位要求的匹配度，并给出具体的优化建议和关键词补充。',
    tag: 'Pro 功能',
    num: '3',
  },
  {
    icon: MessageCircle,
    rgb: '167,139,250',
    solidColor: '#a78bfa',
    iconBg: 'rgba(167,139,250,0.15)',
    cardBg: 'rgba(167,139,250,0.05)',
    borderColor: 'rgba(167,139,250,0.3)',
    title: '面试问题预测',
    desc: '基于你的简历内容，AI 预测面试官可能提问的问题，并帮你准备 STAR 法则结构的参考回答。',
    tag: 'Pro 功能',
    num: '4',
  },
]

export default function AISection() {
  return (
    <section style={{
      background: 'linear-gradient(160deg, #06080f 0%, #001d3d 50%, #06080f 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />
      {/* Ambient orbs */}
      <div style={{
        position: 'absolute', width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 65%)',
        top: '-300px', left: '-200px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(109,40,217,0.1) 0%, transparent 65%)',
        bottom: '-200px', right: '-100px', pointerEvents: 'none',
      }} />

      <div id="ai" style={{ padding: '96px 32px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }} className="fade-in">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(56,189,248,0.12)',
            border: '1px solid rgba(56,189,248,0.35)',
            padding: '5px 14px', borderRadius: '20px',
            marginBottom: '22px',
          }}>
            <Sparkles size={11} color="#38bdf8" />
            <span style={{
              fontSize: '11px', letterSpacing: '2.5px', textTransform: 'uppercase',
              color: '#38bdf8', fontWeight: 700,
            }}>
              AI 智能功能
            </span>
          </div>

          <h2 style={{
            fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
            fontSize: 'clamp(28px, 4vw, 42px)',
            letterSpacing: '-1px', color: '#ffffff',
            lineHeight: 1.2, marginBottom: '18px', fontWeight: 700,
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
            fontSize: '16px', color: 'rgba(255,255,255,0.72)',
            maxWidth: '480px', margin: '0 auto', lineHeight: 1.8, fontWeight: 400,
          }}>
            从内容优化到岗位匹配，AI 贯穿简历创作的每一个环节
          </p>
        </div>

        {/* Cards grid */}
        <div className="ai-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '20px', marginTop: '60px',
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

  return (
    <div className="fade-in" style={{ transitionDelay: `${delay}s` }}>
      <div
        style={{
          background: feature.cardBg,
          border: `1px solid ${feature.borderColor}`,
          borderRadius: '20px', padding: '32px',
          position: 'relative', overflow: 'hidden',
          transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
          cursor: 'default', height: '100%', boxSizing: 'border-box',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = feature.solidColor
          e.currentTarget.style.boxShadow = `0 0 40px rgba(${feature.rgb},0.18), 0 8px 32px rgba(0,0,0,0.4)`
          e.currentTarget.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = feature.borderColor
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Number watermark */}
        <div style={{
          position: 'absolute', top: '20px', right: '-5px',
          fontSize: '240px', fontWeight: 800, fontStyle: "italic", color: `rgba(${feature.rgb},0.03)`,
          letterSpacing: '-2px', lineHeight: 1, pointerEvents: 'none',
          fontFamily: "'Inter', sans-serif",
        }}>
          {feature.num}
        </div>

        {/* Icon box */}
        <div style={{
          width: '52px', height: '52px',
          background: feature.iconBg,
          borderRadius: '14px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid rgba(${feature.rgb},0.25)`,
        }}>
          <Icon size={24} color={feature.solidColor} strokeWidth={1.8} />
        </div>

        {/* Tag */}
        <div style={{
          display: 'inline-block', marginBottom: '12px',
          padding: '3px 10px',
          background: `rgba(${feature.rgb},0.15)`,
          color: feature.solidColor, borderRadius: '20px',
          fontSize: '11px', fontWeight: 700,
          border: `1px solid rgba(${feature.rgb},0.3)`,
          letterSpacing: '0.5px',
        }}>
          {feature.tag}
        </div>

        <h3 style={{
          fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
          fontSize: '19px', fontWeight: 700,
          color: '#ffffff', marginBottom: '12px', letterSpacing: '-0.3px',
          display: 'block',
        }}>
          {feature.title}
        </h3>

        <p style={{
          fontSize: '14px', color: 'var(--paper3)',
          lineHeight: 1.8, fontWeight: 400, margin: 0,
        }}>
          {feature.desc}
        </p>
      </div>
    </div>
  )
}
