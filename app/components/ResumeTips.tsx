'use client'
import { useState } from 'react'

const tips = [
  { tag: 'Format', text: 'Keep your resume to one page — concise content beats sheer volume.' },
  { tag: 'Wording', text: 'Start every bullet with a verb: led, designed, optimized, built.' },
  { tag: 'Skills', text: 'List only skills you are genuinely proficient in; padding lowers credibility.' },
  { tag: 'Summary', text: 'Keep your summary to 2–3 sentences focused on core strengths, not fluff.' },
  { tag: 'Metrics', text: 'Say "cut processing time 40%", not "improved efficiency" — numbers persuade.' },
  { tag: 'Education', text: 'School, major, and degree are enough; you don\'t need to list coursework.' },
  { tag: 'Order', text: 'List experience in reverse chronological order, most recent first.' },
  { tag: 'Wording', text: 'Avoid starting with "responsible for"; use "led", "drove", "delivered".' },
  { tag: 'Tailor', text: 'Tailor your resume to each role — one generic resume rarely works well.' },
  { tag: 'Projects', text: 'Spell out your role and concrete contribution, not just a project blurb.' },
  { tag: 'Format', text: 'Use a sans-serif font at 10–12pt with generous whitespace for readability.' },
  { tag: 'Sending', text: 'Send your resume as a PDF to avoid formatting breaking across apps.' },
  { tag: 'Keywords', text: 'Use keywords that match the job description to pass ATS screening.' },
  { tag: 'Internship', text: 'Internships and volunteering matter for new grads — don\'t skip them.' },
  { tag: 'Wording', text: 'Avoid "great communicator" / "self-motivated" — everyone writes these.' },
  { tag: 'Links', text: 'If you have a GitHub or portfolio, add it to your contacts to show your work.' },
  { tag: 'Gaps', text: 'No need to hide employment gaps; briefly note what you focused on.' },
  { tag: 'Results', text: 'Pair what you did with the outcome — together they convince interviewers.' },
  { tag: 'New grad', text: 'Short on experience? Class projects, competitions, and clubs are great material.' },
  { tag: 'Format', text: 'Don\'t put expected salary on your resume — that\'s for the interview.' },
  { tag: 'Wording', text: 'Be concise: if one word will do, don\'t use two.' },
  { tag: 'Content', text: 'Write at least 3 strong bullets per role; too few looks thin.' },
  { tag: 'Content', text: 'Don\'t dump every detail — keep only what best shows your value.' },
  { tag: 'Sending', text: 'Save a copy of each version you submit for later review.' },
  { tag: 'Referral', text: 'Referrals convert far better than cold applications — build your network early.' },
  { tag: 'Format', text: 'Skip flashy templates; clear, readable structure makes the best impression.' },
  { tag: 'Consistency', text: 'Keep your LinkedIn and resume consistent to avoid confusing interviewers.' },
  { tag: 'Details', text: 'Proofread word by word — a single typo looks unprofessional.' },
  { tag: 'Skills', text: 'Mark proficiency (proficient/familiar); don\'t label everything "expert".' },
  { tag: 'Scale', text: 'Mention team size or user numbers to convey your scope of impact.' },
  { tag: 'Management', text: 'For management roles, state team size and concrete results delivered.' },
  { tag: 'Departure', text: 'Don\'t put reasons for leaving on your resume — explain those in interviews.' },
  { tag: 'Language', text: 'Give language scores (e.g. IELTS/TOEFL); they read as more credible than "fluent".' },
  { tag: 'Review', text: 'Have a friend review it — others catch mistakes you can\'t see.' },
  { tag: 'Results', text: 'Use the STAR method: Situation, Task, Action, Result.' },
  { tag: 'Format', text: 'ATS systems can\'t read tables or images; plain-text structure passes more often.' },
  { tag: 'Email', text: 'Use a professional email; "name + number" reads more mature than a nickname.' },
  { tag: 'Highlights', text: 'Put your strongest experience at the top — recruiters scan the first seconds.' },
  { tag: 'Education', text: 'With 3+ years of experience, move education to the bottom; experience first.' },
  { tag: 'Awards', text: 'List the issuing body and date for awards and certificates to add credibility.' },
  { tag: 'Technical', text: 'For technical roles, list languages, frameworks, and tools — the more specific the better.' },
  { tag: 'Focus', text: 'Aim each resume at one direction; avoid an "all-rounder" resume for every job.' },
  { tag: 'Research', text: 'Research the company culture before applying and match your tone to it.' },
  { tag: 'Job hops', text: 'If you switch jobs often, make the narrative clear and show your growth path.' },
  { tag: 'New grad', text: 'New-grad resumes should highlight learning ability and problem-solving.' },
  { tag: 'Overseas', text: 'For roles abroad, watch your English spelling and grammar — errors hurt first impressions.' },
  { tag: 'Privacy', text: 'Leave out marital status, family info, and other irrelevant private details.' },
  { tag: 'Cover letter', text: 'A cover letter shouldn\'t copy your resume — say why this company and this role.' },
  { tag: 'Photo', text: 'For non-creative roles, skip the photo to reduce unconscious bias.' },
  { tag: 'Length', text: 'Even with 5+ years, keep it to 1–2 pages; drop early, irrelevant roles.' },
]

const CARD_W = 268
const CARD_GAP = 14

const tagColors: Record<string, { bg: string; color: string }> = {
  'Format': { bg: 'rgba(56,189,248,0.12)', color: '#0ea5e9' },
  'Wording': { bg: 'rgba(167,139,250,0.12)', color: '#8b5cf6' },
  'Skills': { bg: 'rgba(52,211,153,0.12)', color: '#10b981' },
  'Summary': { bg: 'rgba(251,191,36,0.12)', color: '#d97706' },
  'Metrics': { bg: 'rgba(248,113,113,0.12)', color: '#ef4444' },
  'Education': { bg: 'rgba(129,140,248,0.12)', color: '#6366f1' },
  'Order': { bg: 'rgba(56,189,248,0.12)', color: '#0ea5e9' },
  'Tailor': { bg: 'rgba(251,146,60,0.12)', color: '#ea580c' },
  'Projects': { bg: 'rgba(52,211,153,0.12)', color: '#10b981' },
  'Sending': { bg: 'rgba(167,139,250,0.12)', color: '#8b5cf6' },
  'Keywords': { bg: 'rgba(248,113,113,0.12)', color: '#ef4444' },
  'Internship': { bg: 'rgba(251,191,36,0.12)', color: '#d97706' },
  'Links': { bg: 'rgba(56,189,248,0.12)', color: '#0ea5e9' },
  'Gaps': { bg: 'rgba(129,140,248,0.12)', color: '#6366f1' },
  'Results': { bg: 'rgba(248,113,113,0.12)', color: '#ef4444' },
  'New grad': { bg: 'rgba(52,211,153,0.12)', color: '#10b981' },
  'Referral': { bg: 'rgba(251,146,60,0.12)', color: '#ea580c' },
  'Consistency': { bg: 'rgba(167,139,250,0.12)', color: '#8b5cf6' },
  'Details': { bg: 'rgba(248,113,113,0.12)', color: '#ef4444' },
  'Scale': { bg: 'rgba(56,189,248,0.12)', color: '#0ea5e9' },
  'Management': { bg: 'rgba(129,140,248,0.12)', color: '#6366f1' },
  'Departure': { bg: 'rgba(251,191,36,0.12)', color: '#d97706' },
  'Language': { bg: 'rgba(52,211,153,0.12)', color: '#10b981' },
  'Review': { bg: 'rgba(167,139,250,0.12)', color: '#8b5cf6' },
  'Awards': { bg: 'rgba(251,146,60,0.12)', color: '#ea580c' },
  'Technical': { bg: 'rgba(56,189,248,0.12)', color: '#0ea5e9' },
  'Focus': { bg: 'rgba(248,113,113,0.12)', color: '#ef4444' },
  'Research': { bg: 'rgba(52,211,153,0.12)', color: '#10b981' },
  'Job hops': { bg: 'rgba(251,191,36,0.12)', color: '#d97706' },
  'Overseas': { bg: 'rgba(129,140,248,0.12)', color: '#6366f1' },
  'Privacy': { bg: 'rgba(167,139,250,0.12)', color: '#8b5cf6' },
  'Cover letter': { bg: 'rgba(251,146,60,0.12)', color: '#ea580c' },
  'Photo': { bg: 'rgba(248,113,113,0.12)', color: '#ef4444' },
  'Length': { bg: 'rgba(56,189,248,0.12)', color: '#0ea5e9' },
  'Content': { bg: 'rgba(52,211,153,0.12)', color: '#10b981' },
  'Email': { bg: 'rgba(251,191,36,0.12)', color: '#d97706' },
  'Highlights': { bg: 'rgba(248,113,113,0.12)', color: '#ef4444' },
}

function getTagStyle(tag: string) {
  return tagColors[tag] ?? { bg: 'rgba(100,116,139,0.12)', color: '#475569' }
}

function TipCard({ tip }: { tip: typeof tips[0] }) {
  const ts = getTagStyle(tip.tag)
  return (
    <div
      className="tip-card"
      style={{
        width: `${CARD_W}px`,
        flexShrink: 0,
        background: 'var(--paper)',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: '14px',
        padding: '18px 18px 16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        <span style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px',
          padding: '3px 9px', borderRadius: '20px',
          background: ts.bg, color: ts.color,
          border: `1px solid ${ts.color}44`,
        }}>{tip.tag}</span>
      </div>
      <p style={{
        fontSize: '13px', color: '#334155',
        lineHeight: 1.65, margin: 0, fontWeight: 400,
      }}>
        {tip.text}
      </p>
    </div>
  )
}

const row1 = tips.slice(0, 25)
const row2 = tips.slice(25)
const doubled1 = [...row1, ...row1]
const doubled2 = [...row2, ...row2]

export default function ResumeTips() {
  const [paused, setPaused] = useState(false)

  return (
    <section style={{ background: '#060d1a', padding: '80px 0 72px' }}>
      <style>{`
        @keyframes scrollLeft {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes scrollRight {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        .tips-row-left {
          display: flex;
          gap: ${CARD_GAP}px;
          width: max-content;
          animation: scrollLeft 130s linear infinite;
        }
        .tips-row-right {
          display: flex;
          gap: ${CARD_GAP}px;
          width: max-content;
          animation: scrollRight 110s linear infinite;
        }
        .tips-row-left.paused,
        .tips-row-right.paused {
          animation-play-state: paused;
        }
        .tip-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          cursor: default;
        }
        .tip-card:hover {
          transform: scale(1.04) translateY(-3px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
        }
        .tips-fade-mask { width: 160px; }
        @media (max-width: 640px) {
          .tips-fade-mask { display: none; }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px', padding: '0 32px' }} className="fade-in">
        <div style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: '12px' }}>
          Resume writing tips
        </div>
        <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', letterSpacing: '-0.5px', color: 'white', margin: 0, fontWeight: 700 }}>
          Make every line <em style={{ fontStyle: 'italic', color: 'var(--theme-blue)' }}>count</em>
        </h2>
      </div>

      {/* Two-row scrolling area */}
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ position: 'relative' }}
      >
        {/* Left fade mask */}
        <div className="tips-fade-mask" style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          background: 'linear-gradient(to right, #060d1a 0%, transparent 100%)',
          zIndex: 2, pointerEvents: 'none',
        }} />
        {/* Right fade mask */}
        <div className="tips-fade-mask" style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          background: 'linear-gradient(to left, #060d1a 0%, transparent 100%)',
          zIndex: 2, pointerEvents: 'none',
        }} />

        {/* Row 1 — scrolls left */}
        <div style={{ overflow: 'hidden', padding: '8px 0' }}>
          <div className={`tips-row-left${paused ? ' paused' : ''}`}>
            {doubled1.map((tip, i) => <TipCard key={i} tip={tip} />)}
          </div>
        </div>

        {/* Row 2 — scrolls right */}
        <div style={{ overflow: 'hidden', padding: '8px 0' }}>
          <div className={`tips-row-right${paused ? ' paused' : ''}`}>
            {doubled2.map((tip, i) => <TipCard key={i} tip={tip} />)}
          </div>
        </div>
      </div>
    </section>
  )
}
