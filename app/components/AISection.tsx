'use client'

const features = [
  {
    icon: '✦',
    iconBg: 'var(--teal-light)',
    title: '智能内容优化',
    desc: '选中任意文字模块，一键让 AI 帮你改写成更专业、更有力的表达。数字化成果、量化描述、行业术语——AI 全部帮你处理。',
    tag: '内容优化',
  },
  {
    icon: '📄',
    iconBg: 'var(--gold-light)',
    title: '简历智能解析',
    desc: '上传你的旧简历（PDF / Word），AI 自动识别所有内容，并按照你选择的新模板重新排版填充，秒级完成迁移。',
    tag: '文档解析',
  },
  {
    icon: '🎯',
    iconBg: '#fde8e8',
    title: '岗位匹配分析',
    desc: '粘贴目标职位的 JD，AI 分析你的简历与岗位要求的匹配度，并给出具体的优化建议和关键词补充。',
    tag: 'Pro 功能',
  },
  {
    icon: '💬',
    iconBg: '#f0e8fd',
    title: '面试问题预测',
    desc: '基于你的简历内容，AI 预测面试官可能提问的问题，并帮你准备 STAR 法则结构的参考回答。',
    tag: 'Pro 功能',
  },
]

export default function AISection() {
  return (
    <section style={{
      background: 'var(--paper2)',
      borderTop: '1px solid var(--paper3)',
      borderBottom: '1px solid var(--paper3)',
    }}>
      <div id="ai" style={{ padding: '80px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }} className="fade-in">
          <div style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 500, marginBottom: '12px' }}>
            AI 智能功能
          </div>
          <h2 style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif", fontSize: 'clamp(26px, 4vw, 36px)', letterSpacing: '-1px' }}>
            让 AI 成为你的<em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>简历顾问</em>
          </h2>
        </div>

        <div className="ai-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '24px', marginTop: '56px',
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
  return (
    <div className="fade-in" style={{
      background: 'white', borderRadius: '16px',
      padding: '32px', border: '1px solid var(--paper3)',
      position: 'relative', overflow: 'hidden',
      transition: 'all 0.25s',
      transitionDelay: `${delay}s`,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,24,20,0.10)'
      e.currentTarget.style.transform = 'translateY(-2px)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = 'none'
      e.currentTarget.style.transform = 'translateY(0)'
    }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, var(--teal), var(--gold))',
      }} />

      <div style={{
        width: '44px', height: '44px',
        background: feature.iconBg,
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px', marginBottom: '18px',
      }}>{feature.icon}</div>

      <h3 style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif", fontSize: '22px', marginBottom: '10px' }}>
        {feature.title}
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--ink3)', lineHeight: 1.7, fontWeight: 300 }}>
        {feature.desc}
      </p>
      <div style={{
        display: 'inline-block', marginTop: '16px',
        padding: '4px 12px',
        background: 'var(--teal-light)', color: 'var(--teal)',
        borderRadius: '20px', fontSize: '11px', fontWeight: 600,
      }}>{feature.tag}</div>
    </div>
  )
}
