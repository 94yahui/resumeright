import { NextRequest, NextResponse } from 'next/server'
import { inflateRaw } from 'zlib'
import { promisify } from 'util'
import { guardAI, checkServerQuota, incrementQuota } from '../_guard'

const inflateRawAsync = promisify(inflateRaw)
const QWEN_BASE = process.env.QWEN_BASE_URL || 'https://api.deepseek.com'
const MODEL     = process.env.QWEN_MODEL    || 'deepseek-chat'

// ── Parse prompt (for editor pre-fill only — not for ATS scoring) ─────────────
const PARSE_SYSTEM = `You are a resume parser. Extract all information and return ONLY valid JSON (no markdown):
{"isResume":true,"name":string,"jobtitle":string,"email":string,"phone":string,"city":string,"website":string,"extraWebsites":string[],"photo":"","summary":string,"hasSummary":boolean,"hasSkills":boolean,"hasProject":boolean,"hasLanguage":boolean,"hasAward":boolean,"hasCert":boolean,"hasVolunteer":boolean,"hasInterest":boolean,"exp":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"edu":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"project":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"award":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"cert":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"volunteer":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"interest":[{"id":string,"title":string,"sub":string,"date":string,"bullets":string[]}],"language":[{"id":string,"title":string,"sub":string,"date":"","bullets":[]}],"skills":string[],"skillCategories":null}
Generate unique ids like "e1","d1","p1"; photo always ""; set hasXxx true if section has content; preserve original language.
If NOT a resume return ONLY: {"isResume":false}`

// ── DOCX text extraction ──────────────────────────────────────────────────────
async function extractDocxText(buf: Buffer): Promise<string> {
  const SIG = [0x50, 0x4b, 0x03, 0x04]
  let pos = 0
  while (pos < buf.length - 30) {
    if (buf[pos] === SIG[0] && buf[pos+1] === SIG[1] && buf[pos+2] === SIG[2] && buf[pos+3] === SIG[3]) {
      const method    = buf.readUInt16LE(pos + 8)
      const compSize  = buf.readUInt32LE(pos + 18)
      const fnameLen  = buf.readUInt16LE(pos + 26)
      const extraLen  = buf.readUInt16LE(pos + 28)
      const fname     = buf.subarray(pos + 30, pos + 30 + fnameLen).toString('utf8')
      const dataStart = pos + 30 + fnameLen + extraLen
      if (fname === 'word/document.xml') {
        const chunk = buf.subarray(dataStart, dataStart + compSize)
        const xml = method === 0 ? chunk.toString('utf8') : (await inflateRawAsync(chunk)).toString('utf8')
        return xml
          .replace(/<w:p[ />]/g, '\n').replace(/<w:br[^/]*/g, '\n').replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/\n{3,}/g, '\n\n').trim()
      }
      pos = dataStart + compSize
    } else { pos++ }
  }
  return ''
}

async function extractPdfText(buf: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js')
  const data = await pdfParse(buf)
  return (data.text as string).replace(/\n{3,}/g, '\n\n').trim()
}

// ── Statistical helpers ───────────────────────────────────────────────────────
function medianOf(arr: number[]): number {
  if (arr.length === 0) return 0
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}

// ── Rule-based ATS analysis ───────────────────────────────────────────────────
interface Dim { key: string; name: string; score: number; feedback: string }

function runATSChecks(text: string, buf: Buffer, mime: string): {
  dims: Dim[]; totalScore: number; overview: string; name: string; jobtitle: string
} {
  const charCount  = text.length
  const fileSizeKB = buf.length / 1024
  const lines      = text.split('\n')
  const nonEmpty   = lines.filter(l => l.trim().length > 2)

  // ── Dim 1: 文字可提取性 ───────────────────────────────────────────────────
  const replacements   = (text.match(/�/g) || []).length
  const replaceRatio   = charCount > 0 ? replacements / charCount : 1
  const isLikelyImage  = charCount < 80 && fileSizeKB > 40

  let d1Score = 20, d1Fb = ''
  if (isLikelyImage) {
    d1Score = 0
    d1Fb = `疑似扫描件/图片型PDF（仅提取${charCount}字，文件${fileSizeKB.toFixed(0)}KB），ATS完全无法读取文字，必须使用可编辑版本`
  } else if (charCount < 200) {
    d1Score = 4
    d1Fb = `提取到文字过少（${charCount}字），内容严重不足，ATS无法完整解析`
  } else if (replaceRatio > 0.08) {
    d1Score = 5
    d1Fb = `乱码字符占比 ${(replaceRatio * 100).toFixed(1)}%（${replacements}处U+FFFD），字体未嵌入导致ATS读到乱码`
  } else if (replaceRatio > 0.015) {
    d1Score = 12
    d1Fb = `少量乱码字符（${replacements}处），可能是部分字体未嵌入，建议重新导出PDF并嵌入字体`
  } else if (charCount < 400) {
    d1Score = 14
    d1Fb = `内容偏少（${charCount}字），建议检查是否有内容未能提取`
  } else {
    d1Score = 20
    d1Fb = `文字提取正常（${charCount}字），ATS可完整读取`
  }

  // ── Dim 2: 编码与乱码 ─────────────────────────────────────────────────────
  const specialBullets = (text.match(/[◆◇□■●▶▸►◀‣⁃◦▪▫✦✧★☆]/g) || []).length
  const controlChars   = (text.match(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g) || []).length
  const compatCJK      = (text.match(/[豈-﫿︰-﹏]/g) || []).length
  const specialRatio   = charCount > 0 ? specialBullets / charCount : 0

  let d2Score = 20, d2Fb = ''
  if (replaceRatio > 0.05 || controlChars > 20) {
    d2Score = 3
    d2Fb = `严重编码异常：${replacements}处替换字符 + ${controlChars}个控制字符，字体嵌入失败，ATS解析错误`
  } else if (controlChars > 5) {
    d2Score = 9
    d2Fb = `${controlChars}个控制字符（非打印字符），会干扰ATS对段落和字段的识别，建议用纯文本格式重新制作`
  } else if (specialRatio > 0.025) {
    d2Score = 10
    d2Fb = `大量特殊装饰符号（${specialBullets}处，如◆●■等），部分ATS无法识别，建议改为"-"或"·"`
  } else if (compatCJK > 15) {
    d2Score = 13
    d2Fb = `${compatCJK}个CJK兼容区汉字（可能来自繁体或旧字符集），建议统一使用标准GB/Unicode汉字`
  } else if (specialBullets > 15) {
    d2Score = 16
    d2Fb = `${specialBullets}处特殊符号，主流ATS基本可识别，少量存在被忽略的风险`
  } else {
    d2Score = 20
    d2Fb = `字符编码规范，无异常符号，ATS可正常读取全部字符`
  }

  // ── Dim 3: 版面结构兼容 ───────────────────────────────────────────────────
  const lineLengths  = nonEmpty.map(l => l.trim().length)
  const tabCount     = (text.match(/\t/g) || []).length
  const tabRatio     = charCount > 0 ? tabCount / charCount : 0
  const med          = medianOf(lineLengths)
  const shortRatio   = lineLengths.length > 0
    ? lineLengths.filter(l => l < 28).length / lineLengths.length : 0

  let d3Score = 20, d3Fb = ''
  if (tabRatio > 0.025) {
    d3Score = 4
    d3Fb = `大量制表符（Tab）：${tabCount}处，判定为表格布局。ATS提取内容顺序将严重错乱，必须改为纯文字排版`
  } else if (shortRatio > 0.62 && med < 38) {
    d3Score = 6
    d3Fb = `${(shortRatio*100).toFixed(0)}%行长<28字符（中位数${med.toFixed(0)}字），判定为双栏布局。ATS提取时两列内容混在一起，无法正确解析`
  } else if (shortRatio > 0.5 && med < 48) {
    d3Score = 12
    d3Fb = `行长分布不均（${(shortRatio*100).toFixed(0)}%短行），疑似双栏或含文本框，ATS解析顺序可能错乱`
  } else if (tabRatio > 0.008) {
    d3Score = 14
    d3Fb = `检测到制表符（${tabCount}处），可能含有局部表格，建议全部替换为空格或纯文字排版`
  } else if (med < 30 && nonEmpty.length > 10) {
    d3Score = 15
    d3Fb = `平均行长较短（中位数${med.toFixed(0)}字），排版较紧凑，建议确认是否为单栏连续文字`
  } else {
    d3Score = 20
    d3Fb = `单栏布局，行长分布均匀（中位数${med.toFixed(0)}字/行），ATS解析顺序正确`
  }

  // ── Dim 4: 关键字段可识别率 ───────────────────────────────────────────────
  const hasEmail    = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/.test(text)
  const hasPhone    = /1[3-9]\d{9}/.test(text.replace(/[\s\-]/g, ''))
  const hasWork     = /工作经历|工作经验|职业经历|work experience|employment/i.test(text)
  const hasEdu      = /教育背景|教育经历|education|学历|毕业/i.test(text)
  const hasSkill    = /技能|skills?|专业技能|expertise/i.test(text)
  const hasDate     = /\d{4}[.\-/年]\d{1,2}|\d{4}\s*[~–\-至]\s*(\d{4}|至今|present)/i.test(text)
  const misses: string[] = []

  let d4Score = 0
  if (hasEmail) d4Score += 5; else misses.push('邮箱')
  if (hasPhone) d4Score += 5; else misses.push('手机号')
  if (hasWork)  d4Score += 4; else misses.push('工作经历标题')
  if (hasEdu)   d4Score += 3; else misses.push('教育背景标题')
  if (hasSkill) d4Score += 1
  if (hasDate)  d4Score += 2; else misses.push('标准日期格式')
  d4Score = Math.min(20, d4Score)

  const d4Fb = misses.length === 0
    ? `邮箱、手机、章节标题、日期均可被ATS正确识别与提取`
    : `无法识别：${misses.join('、')}——ATS将无法正确提取这些字段，影响候选人信息入库`

  // ── Dim 5: 文件格式规范 ────────────────────────────────────────────────────
  const isDocx = mime.includes('openxmlformats') || mime.includes('docx')
  const isPdf  = mime.includes('pdf')
  const isDoc  = (mime.includes('msword') || mime.includes('.doc')) && !isDocx
  const sizeMB = fileSizeKB / 1024
  const sizeDeduct = sizeMB > 5 ? 8 : sizeMB > 3 ? 5 : sizeMB > 2 ? 2 : 0

  let d5Score = 20, d5Fb = ''
  if (isDocx) {
    d5Score = Math.max(0, 20 - sizeDeduct)
    d5Fb = sizeDeduct > 0
      ? `Word(.docx)兼容性最佳，但文件偏大（${sizeMB.toFixed(1)}MB），部分ATS有超时风险，建议压缩图片至2MB以内`
      : `Word(.docx)格式，国内主流ATS（Moka/北森/Beisen）兼容性最佳，字段解析最准确`
  } else if (isPdf) {
    if (isLikelyImage) {
      d5Score = 2
      d5Fb = `图片型PDF，ATS无法提取任何文字，请提交可编辑的Word文档或文字型PDF`
    } else {
      d5Score = Math.max(0, 16 - sizeDeduct)
      d5Fb = sizeDeduct > 0
        ? `PDF格式偏大（${sizeMB.toFixed(1)}MB），建议压缩至1MB以内；文字型PDF解析可行但不如Word稳定`
        : `文字型PDF，主流ATS可解析，但部分系统对PDF字段提取不如Word准确`
    }
  } else if (isDoc) {
    d5Score = Math.max(0, 11 - sizeDeduct)
    d5Fb = `旧版.doc格式（Word 97-2003），现代ATS解析不稳定，强烈建议另存为.docx后重新上传`
  } else {
    d5Score = 4
    d5Fb = `未知文件格式，ATS可能拒绝或无法识别，请提交.docx或文字型.pdf`
  }

  const dims: Dim[] = [
    { key: 'extractability', name: '文字提取',   score: d1Score, feedback: d1Fb },
    { key: 'encoding',       name: '编码规范',   score: d2Score, feedback: d2Fb },
    { key: 'layout',         name: '版面结构',   score: d3Score, feedback: d3Fb },
    { key: 'field_detect',   name: '字段识别',   score: d4Score, feedback: d4Fb },
    { key: 'file_format',    name: '文件格式',   score: d5Score, feedback: d5Fb },
  ]
  const totalScore = dims.reduce((s, d) => s + d.score, 0)

  // Generate overview from scores
  const worst = [...dims].sort((a, b) => a.score - b.score)[0]
  const best  = [...dims].sort((a, b) => b.score - a.score)[0]
  let overview: string
  if (totalScore >= 95) {
    overview = `ATS通过率完美（${totalScore}/100）。所有维度均表现优秀，简历完全符合 ATS 规范。`
  } else if (totalScore >= 85) {
    overview = `ATS通过率高（${totalScore}/100）。整体符合 ATS 规范，仅需小幅优化。最需改进的是${worst.name}（${worst.score}/20）：${worst.feedback}`
  } else if (totalScore >= 60) {
    overview = `ATS通过率中等（${totalScore}/100），存在可修复的技术问题。最需改进的是${worst.name}（${worst.score}/20）：${worst.feedback}——修复后通过率可显著提升。`
  } else {
    overview = `ATS通过率偏低（${totalScore}/100），存在严重技术问题，可能在自动筛选阶段被直接过滤。最关键问题：${worst.name}（${worst.score}/20）——${worst.feedback}`
  }

  // Extract name/jobtitle heuristically from first few lines
  const topLines = lines.slice(0, 6).map(l => l.trim()).filter(l => l.length > 0)
  const name = topLines[0] ?? ''
  const jobtitle = topLines[1] ?? ''

  return { dims, totalScore, overview, name, jobtitle }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.QWEN_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    const formData = await req.formData()
    const file     = formData.get('file') as File | null
    const deviceId = String(formData.get('deviceId') ?? '')
    if (!file) return NextResponse.json({ error: '请上传简历文件' }, { status: 400 })

    const guard = guardAI(req, deviceId)
    if (guard) return guard

    const quotaGuard = await checkServerQuota(req, 'ats-score', deviceId)
    if (quotaGuard) return quotaGuard

    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: '文件过大，请上传 5 MB 以内的文件' }, { status: 413 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const mime   = file.type || ''
    const name   = file.name.toLowerCase()

    // ── Extract text ──
    let resumeText = ''
    if (mime.includes('pdf') || name.endsWith('.pdf')) {
      resumeText = await extractPdfText(buffer)
    } else if (mime.includes('docx') || mime.includes('openxmlformats') || name.endsWith('.docx')) {
      resumeText = await extractDocxText(buffer)
    } else if (mime.includes('doc') || name.endsWith('.doc')) {
      resumeText = buffer.toString('utf8', 0, Math.min(buffer.length, 50000))
        .replace(/[^\x20-\x7e一-鿿　-〿＀-￯\n\r\t]/g, ' ').replace(/ {3,}/g, ' ').trim()
    } else {
      return NextResponse.json({ error: '请上传 PDF 或 Word（.docx/.doc）格式的简历' }, { status: 415 })
    }

    // ── Rule-based ATS analysis (instant, no AI needed) ──
    const { dims, totalScore, overview, name: hName, jobtitle: hTitle } =
      runATSChecks(resumeText, buffer, mime)

    // ── AI parse call (for editor pre-fill, runs in background) ──
    let parsedData: Record<string, unknown> | null = null
    let aiName = hName, aiTitle = hTitle
    if (resumeText.length >= 30) {
      try {
        const parseText = resumeText.slice(0, 12000)
        const parseRes = await fetch(`${QWEN_BASE}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: MODEL, temperature: 0.1,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: PARSE_SYSTEM },
              { role: 'user',   content: `Parse this resume:\n\n${parseText}` },
            ],
          }),
        })
        if (parseRes.ok) {
          const pd = await parseRes.json()
          const raw = JSON.parse(pd.choices?.[0]?.message?.content ?? '{}')
          if (raw.isResume !== false) {
            parsedData = raw
            if (raw.name)    aiName  = String(raw.name)
            if (raw.jobtitle) aiTitle = String(raw.jobtitle)
          }
        }
      } catch { /* ignore — ATS result still returned */ }
    }

    await incrementQuota(req, 'ats-score', deviceId)

    return NextResponse.json({
      name:       aiName,
      jobtitle:   aiTitle,
      totalScore: Math.min(100, Math.max(0, totalScore)),
      overview,
      dimensions: dims,
      parsedData,
    })
  } catch (e) {
    console.error('ats-score error:', e)
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 })
  }
}
