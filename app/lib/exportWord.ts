import type { ResumeData } from './types'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function section(title: string, body: string): string {
  return `<h2>${esc(title)}</h2>${body}`
}

function entryBlock(e: { title: string; sub: string; date: string; bullets: string[] }): string {
  const header = `<p class="eh"><b>${esc(e.title)}</b>${e.sub ? ` · ${esc(e.sub)}` : ''}<span class="date">${esc(e.date || '')}</span></p>`
  const bullets = e.bullets.filter(b => b.trim())
  const list = bullets.length
    ? `<ul>${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
    : ''
  return header + list
}

/**
 * Generate a Word-compatible HTML blob URL that browsers can trigger as a .doc download.
 * Word opens HTML files natively; this avoids any external package dependency.
 */
export function generateWordBlob(data: ResumeData): Blob {
  let body = ''

  // ── Header ───────────────────────────────────────────────
  if (data.photo) {
    body += `<div class="ph-wrap"><img src="${data.photo}" class="ph" /><div class="ph-info"><h1 style="margin:0 0 4pt">${esc(data.name || '')}</h1>`
    if (data.jobtitle) body += `<p class="sub" style="margin:0 0 4pt">${esc(data.jobtitle)}</p>`
    const contacts = [data.email, data.phone, data.city, data.website].filter(Boolean)
    if (contacts.length) body += `<p class="ct" style="margin:0">${contacts.map(esc).join(' · ')}</p>`
    body += `</div></div>`
  } else {
    body += `<h1>${esc(data.name || '')}</h1>`
    if (data.jobtitle) body += `<p class="sub">${esc(data.jobtitle)}</p>`
    const contacts = [data.email, data.phone, data.city, data.website].filter(Boolean)
    if (contacts.length) body += `<p class="ct">${contacts.map(esc).join(' · ')}</p>`
  }

  // ── Summary ───────────────────────────────────────────────
  if (data.hasSummary && data.summary)
    body += section('Professional Summary', `<p>${esc(data.summary)}</p>`)

  // ── Experience ────────────────────────────────────────────
  if (data.exp.length)
    body += section('Work Experience', data.exp.map(entryBlock).join(''))

  // ── Education ─────────────────────────────────────────────
  if (data.edu.length)
    body += section('Education', data.edu.map(entryBlock).join(''))

  // ── Skills ────────────────────────────────────────────────
  if (data.hasSkills && data.skills.filter(Boolean).length)
    body += section('Skills', `<p>${data.skills.filter(Boolean).map(esc).join(' · ')}</p>`)

  // ── Projects ──────────────────────────────────────────────
  if (data.hasProject && data.project.length)
    body += section('Projects', data.project.map(entryBlock).join(''))

  // ── Awards ────────────────────────────────────────────────
  if (data.hasAward && data.award.length)
    body += section('Awards & Honors', data.award.map(entryBlock).join(''))

  // ── Certs ─────────────────────────────────────────────────
  if (data.hasCert && data.cert.length)
    body += section('Certifications',
      data.cert.map(e => `<p>${esc(e.title)}${e.sub ? ` · ${esc(e.sub)}` : ''}${e.date ? ` (${esc(e.date)})` : ''}</p>`).join('')
    )

  // ── Languages ─────────────────────────────────────────────
  if (data.hasLanguage && data.language.length)
    body += section('Languages',
      data.language.map(e => `<p>${esc(e.title)}${e.sub ? ` — ${esc(e.sub)}` : ''}</p>`).join('')
    )

  // ── Volunteer ─────────────────────────────────────────────
  if (data.hasVolunteer && data.volunteer.length)
    body += section('Volunteering', data.volunteer.map(entryBlock).join(''))

  // ── Interests ─────────────────────────────────────────────
  if (data.hasInterest && data.interest.filter(e => e.title).length)
    body += section('Interests',
      `<p>${data.interest.filter(e => e.title).map(e => esc(e.title)).join(' · ')}</p>`
    )

  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
  xmlns:w='urn:schemas-microsoft-com:office:word'
  xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'>
<style>
  body { font-family: 'Microsoft YaHei', 'SimSun', sans-serif; font-size: 10.5pt; color: #1a1a1a; margin: 2cm 2.5cm; }
  h1   { font-size: 22pt; font-weight: 700; margin: 0 0 4pt; color: #0f172a; }
  h2   { font-size: 11pt; font-weight: 700; border-bottom: 1pt solid #0f172a;
         padding-bottom: 2pt; margin: 14pt 0 6pt; color: #0f172a; }
  p    { margin: 0 0 4pt; line-height: 1.55; }
  ul   { margin: 2pt 0 6pt; padding-left: 18pt; }
  li   { margin-bottom: 2pt; line-height: 1.55; }
  .sub { font-size: 12pt; color: #475569; margin: 2pt 0 4pt; }
  .ct  { font-size: 9pt; color: #64748b; margin: 4pt 0 14pt; }
  .eh  { margin: 8pt 0 2pt; }
  .date { float: right; font-size: 9pt; color: #64748b; font-weight: 400; }
  .ph-wrap { display: flex; align-items: center; gap: 16pt; margin-bottom: 10pt; }
  .ph  { width: 72pt; height: 72pt; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .ph-info { flex: 1; }
</style>
</head><body>${body}</body></html>`

  return new Blob([html], { type: 'application/msword' })
}
