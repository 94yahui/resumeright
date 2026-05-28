'use client'
import { useState } from 'react'

const tips = [
  { tag: '格式', text: '简历控制在 1 页以内，内容精炼比数量多更重要' },
  { tag: '措辞', text: '每条工作描述以动词开头：主导、设计、优化、搭建' },
  { tag: '技能', text: '只列真正熟练的技能，避免简历水分拉低整体评价' },
  { tag: '简介', text: '个人简介 2–3 句话，聚焦核心优势而非空洞的自我评价' },
  { tag: '量化', text: '不说"提高效率"，说"缩短处理时间 40%"——数字更有力' },
  { tag: '学历', text: '写学校、专业、学位即可，不需要列出修读课程' },
  { tag: '排序', text: '工作经历倒序排列，最近的放最上面，让 HR 看到最新状态' },
  { tag: '措辞', text: '避免"负责"开头，改用"主导""推动""独立完成"' },
  { tag: '定制', text: '针对不同岗位定制简历，一份简历打天下效果大打折扣' },
  { tag: '项目', text: '项目经历写清楚你的角色和具体贡献，不要只写项目简介' },
  { tag: '格式', text: '字体用无衬线体，字号 10–12pt，留白充足阅读不累' },
  { tag: '投递', text: '简历以 PDF 格式发送，避免因软件版本不同导致格式错乱' },
  { tag: '关键词', text: '使用与职位描述一致的关键词，提高 ATS 筛选通过率' },
  { tag: '实习', text: '志愿服务和实习经历对应届生很重要，不要因为"小"而忽略' },
  { tag: '措辞', text: '避免"善于沟通""积极主动"——这些词每个人都会写，毫无区别' },
  { tag: '链接', text: '有 GitHub 或作品集时一定放进联系方式，直接展示实力' },
  { tag: '空白期', text: '工作空白期不用刻意隐瞒，简短说明学习方向即可' },
  { tag: '成果', text: '写工作内容的同时写成果，两者结合才能说服面试官' },
  { tag: '应届', text: '经历不足时，校内项目、竞赛奖项和课外实践都是好素材' },
  { tag: '格式', text: '不要在简历里写期望薪资，这是面试环节谈的事' },
  { tag: '措辞', text: '用词简洁：一个词能说清楚就不用两个词，减少认知负担' },
  { tag: '内容', text: '每段工作经历至少写 3 条有效描述，太少显得经验单薄' },
  { tag: '内容', text: '不要把所有工作细节都堆上去，只写最能体现价值的部分' },
  { tag: '投递', text: '每次投递后保存一份对应版本，方便后续回顾和复盘' },
  { tag: '内推', text: '内推比简历投递成功率高很多，提前建立圈子很重要' },
  { tag: '格式', text: '模板不要太花哨，结构清晰、易读的简历才能获得好印象' },
  { tag: '一致性', text: 'LinkedIn 头像和简历内容保持一致，避免面试官困惑' },
  { tag: '细节', text: '逐字检查简历，一个错别字或标点错误会显得非常不专业' },
  { tag: '技能', text: '技能熟练程度分"熟练/了解"，避免把所有技能都写"精通"' },
  { tag: '规模', text: '在工作描述中提到团队规模或用户量，体现你的影响力范围' },
  { tag: '管理', text: '管理职位一定要写带团队的规模和带出的具体成果' },
  { tag: '离职', text: '不要把离职原因写在简历上，这是面试时才需要解释的' },
  { tag: '语言', text: '语言能力写 CET-6/雅思分数，比"流利"更可信' },
  { tag: '复查', text: '完成后请朋友帮你审一遍，自己看不出来的错误别人能发现' },
  { tag: '成果', text: '用 STAR 法则描述经历：情境、任务、行动、结果' },
  { tag: '格式', text: 'ATS 系统不识别表格和图片，纯文本结构通过率更高' },
  { tag: '邮箱', text: '邮箱用专业格式，"姓名拼音+数字"比昵称显得更成熟' },
  { tag: '成就', text: '把最亮眼的经历放在最上面，HR 只扫前几秒钟' },
  { tag: '学历', text: '工作经验超过 3 年后，学历移到简历底部，经历优先' },
  { tag: '奖项', text: '奖项和证书写清楚颁发机构和获奖时间，增加可信度' },
  { tag: '技术', text: '技术岗位列出熟悉的编程语言、框架和工具，越具体越好' },
  { tag: '专注', text: '一份简历只针对一个方向，不要"全能型简历"什么岗都投' },
  { tag: '调研', text: '投递前研究公司文化，让简历语气和公司调性相匹配' },
  { tag: '跳槽', text: '跳槽频繁时，注意每段经历的叙述逻辑，说清楚成长路径' },
  { tag: '应届', text: '应届生简历着重展示学习能力、快速上手和解决问题的经历' },
  { tag: '外企', text: '投外企时注意英文拼写和语法，错误率直接影响第一印象' },
  { tag: '隐私', text: '不要写婚育状况、家庭信息等无关隐私，与求职无关' },
  { tag: '求职信', text: '求职信不能复制简历，要说明为什么选这家公司这个岗位' },
  { tag: '头像', text: '非创意类职位不建议附照片，减少无意识偏见的影响' },
  { tag: '长度', text: '超过 5 年经验也保持 1–2 页，删掉早期不相关的经历' },
]

const CARD_W = 280
const CARD_GAP = 16

const tagColors: Record<string, { bg: string; color: string }> = {
  格式: { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8' },
  措辞: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
  技能: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
  简介: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
  量化: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
  学历: { bg: 'rgba(129,140,248,0.12)', color: '#818cf8' },
  排序: { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8' },
  定制: { bg: 'rgba(251,146,60,0.12)', color: '#fb923c' },
  项目: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
  投递: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
  关键词: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
  实习: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
  链接: { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8' },
  空白期: { bg: 'rgba(129,140,248,0.12)', color: '#818cf8' },
  成果: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
  应届: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
  内推: { bg: 'rgba(251,146,60,0.12)', color: '#fb923c' },
  一致性: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
  细节: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
  规模: { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8' },
  管理: { bg: 'rgba(129,140,248,0.12)', color: '#818cf8' },
  离职: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
  语言: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
  复查: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
  奖项: { bg: 'rgba(251,146,60,0.12)', color: '#fb923c' },
  技术: { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8' },
  专注: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
  调研: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
  跳槽: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
  外企: { bg: 'rgba(129,140,248,0.12)', color: '#818cf8' },
  隐私: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
  求职信: { bg: 'rgba(251,146,60,0.12)', color: '#fb923c' },
  头像: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
  长度: { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8' },
  内容: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
  邮箱: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
  成就: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
}

function getTagStyle(tag: string) {
  return tagColors[tag] ?? { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' }
}

export default function ResumeTips() {
  const [paused, setPaused] = useState(false)
  const doubled = [...tips, ...tips]  // duplicate for seamless loop

  return (
    <section style={{ background: '#060d1a', padding: '80px 0 72px', overflow: 'hidden' }}>
      <style>{`
        @keyframes scrollTips {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .tips-track {
          display: flex;
          gap: ${CARD_GAP}px;
          width: max-content;
          animation: scrollTips 60s linear infinite;
        }
        .tips-track.paused {
          animation-play-state: paused;
        }
        .tip-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          cursor: default;
        }
        .tip-card:hover {
          transform: scale(1.04) translateY(-3px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.45) !important;
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px', padding: '0 32px' }} className="fade-in">
        <div style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: '12px' }}>
          写简历的小技巧
        </div>
        <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', letterSpacing: '-0.5px', color: 'white', margin: 0, fontWeight: 700 }}>
          让每一行字都<em style={{ fontStyle: 'italic', color: 'var(--theme-blue)' }}>值得</em>
        </h2>
      </div>

      {/* Scrolling track */}
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ padding: '8px 0' }}
      >
        <div className={`tips-track${paused ? ' paused' : ''}`}>
          {doubled.map((tip, i) => {
            const ts = getTagStyle(tip.tag)
            return (
              <div
                key={i}
                className="tip-card"
                style={{
                  width: `${CARD_W}px`,
                  flexShrink: 0,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: '14px',
                  padding: '20px 20px 18px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
                    padding: '3px 9px', borderRadius: '20px',
                    background: ts.bg, color: ts.color,
                    border: `1px solid ${ts.color}40`,
                  }}>{tip.tag}</span>
                </div>
                <p style={{
                  fontSize: '13.5px', color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.65, margin: 0, fontWeight: 400,
                }}>
                  {tip.text}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
