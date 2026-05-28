'use client'
import { Sparkles, FileText, Target, MessageCircle, Globe2, Minimize2 } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    rgb: '56,189,248',
    solidColor: '#38bdf8',
    iconBg: 'rgba(56,189,248,0.15)',
    cardBg: 'rgba(56,189,248,0.06)',
    borderColor: 'rgba(56,189,248,0.3)',
    title: 'AI 简历优化',
    desc: '选中工作经历或项目，AI 精读每条描述，用高亮和删除线直接在简历上标注改写建议。强化动词、理清逻辑、补充行为结果——完全基于你已有的经历，不编造任何数字。',
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
    title: '简历智能导入',
    desc: '上传旧简历（PDF / Word），AI 自动识别所有内容，按你选择的模板重新排版填充；同步生成整体诊断和改进建议，省去手动录入，秒级完成迁移。',
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
    desc: '粘贴目标职位 JD，AI 即时给出匹配度评分和各维度拆解，标出简历与岗位的差距，并列出缺失的关键技能，帮你有的放矢地补强。',
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
    title: '面试题预测',
    desc: '基于简历内容与目标岗位，AI 生成 10 道定制面试题，覆盖技术深度、项目细节、行为情景与职业规划，并附 STAR 结构回答建议，帮你提前备战。',
    tag: 'Pro 功能',
    num: '4',
  },
  {
    icon: Globe2,
    rgb: '52,211,153',
    solidColor: '#34d399',
    iconBg: 'rgba(52,211,153,0.15)',
    cardBg: 'rgba(52,211,153,0.05)',
    borderColor: 'rgba(52,211,153,0.3)',
    title: '一键生成英文简历',
    desc: '点击即可将中文简历翻译为地道英文版本，自动存为独立记录方便随时调用。投递外资、港澳台或海外岗位，不再需要手动逐条翻译。',
    tag: 'Pro 功能',
    num: '5',
  },
  {
    icon: Minimize2,
    rgb: '251,146,60',
    solidColor: '#fb923c',
    iconBg: 'rgba(251,146,60,0.15)',
    cardBg: 'rgba(251,146,60,0.05)',
    borderColor: 'rgba(251,146,60,0.3)',
    title: '一键压缩至 1 页',
    desc: '简历超出一页时自动提示。轻微溢出直接微调字号；大幅超出则 AI 精简冗余描述，用高亮和删除线标注每处改动，确认后一键压缩完成，全程可撤销。',
    tag: 'Pro 功能',
    num: '6',
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
            maxWidth: '540px', margin: '0 auto', lineHeight: 1.8, fontWeight: 400,
          }}>
            从内容优化到岗位匹配，从智能导入到一键压缩，AI 贯穿简历创作的每一个环节
          </p>
        </div>

        {/* Cards grid */}
        <div className="ai-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '18px', marginTop: '60px',
        }}>
          {features.map((f, i) => (
            <AICard key={f.title} feature={f} delay={i * 0.08} />
          ))}
        </div>

        <style>{`
          @media (max-width: 900px) { .ai-grid { grid-template-columns: 1fr 1fr !important; } }
          @media (max-width: 520px) { .ai-grid { grid-template-columns: 1fr !important; } }
        `}</style>
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
