'use client'
import { useState, useCallback, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EditorTopbar from './components/EditorTopbar'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import { DownloadModal, UploadModal } from './components/Modals'
import PaginatedResume from '../lib/PaginatedResume'
import { ResumeData, SelectionType, SectionKey, Entry, DEMO_DATA } from '../lib/types'
import { getTemplate } from '../lib/templates-config'

const HISTORY_LIMIT = 30

function EditorInner() {
  const searchParams = useSearchParams()
  const initTemplate = searchParams.get('template') || 'classic-pro'

  // ============ History (undo/redo) ============
  const [history, setHistory] = useState<ResumeData[]>([DEMO_DATA])
  const [historyIdx, setHistoryIdx] = useState(0)
  const data = history[historyIdx]

  const setData = useCallback((updater: ResumeData | ((prev: ResumeData) => ResumeData)) => {
    setHistory(prev => {
      const cur = prev[historyIdx]
      const next = typeof updater === 'function' ? (updater as (p: ResumeData) => ResumeData)(cur) : updater
      const truncated = prev.slice(0, historyIdx + 1)
      const newHistory = [...truncated, next].slice(-HISTORY_LIMIT)
      setHistoryIdx(newHistory.length - 1)
      return newHistory
    })
  }, [historyIdx])

  const undo = useCallback(() => {
    if (historyIdx > 0) setHistoryIdx(historyIdx - 1)
  }, [historyIdx])

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) setHistoryIdx(historyIdx + 1)
  }, [historyIdx, history.length])

  // ============ Other state ============
  const [templateId, setTemplateId] = useState(initTemplate)
  const [color, setColor] = useState<string | undefined>(undefined)
  const [selection, setSelection] = useState<SelectionType>({ kind: 'none' })
  const [zoom, setZoom] = useState(70)
  const [docTitle, setDocTitle] = useState('我的简历')
  const [modal, setModal] = useState<'none' | 'download' | 'upload'>('none')
  const [toast, setToast] = useState('')
  const [pageCount, setPageCount] = useState(1)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const template = getTemplate(templateId)
  const effectiveColor = color || template.accentColor

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(''), 2200)
  }

  // ============ Data updates (all push history) ============
  const updateData = useCallback((patch: Partial<ResumeData>) => {
    setData(prev => ({ ...prev, ...patch }))
  }, [setData])

  const updateEntry = useCallback((sec: SectionKey, idx: number, patch: Partial<Entry>) => {
    setData(prev => {
      const arr = [...(prev[sec] as Entry[])]
      arr[idx] = { ...arr[idx], ...patch }
      return { ...prev, [sec]: arr }
    })
  }, [setData])

  const deleteEntry = useCallback((sec: SectionKey, idx: number) => {
    setData(prev => ({ ...prev, [sec]: (prev[sec] as Entry[]).filter((_, i) => i !== idx) }))
    setSelection({ kind: 'none' })
    showToast('已删除')
  }, [setData])

  const addEntry = useCallback((sec: SectionKey, flagPatch?: Partial<ResumeData>) => {
    const defaults: Record<SectionKey, Entry> = {
      exp:       { id: Date.now()+'-exp', title: '新职位', sub: '公司名称', date: '开始 — 结束', bullets: ['描述工作职责和成就...'] },
      edu:       { id: Date.now()+'-edu', title: '专业名称', sub: '学校名称', date: '入学 — 毕业', bullets: [] },
      project:   { id: Date.now()+'-prj', title: '项目名称', sub: '项目角色', date: '时间', bullets: ['项目详情...'] },
      award:     { id: Date.now()+'-awd', title: '奖项名称', sub: '颁奖机构', date: '年份', bullets: [] },
      cert:      { id: Date.now()+'-crt', title: '证书名称', sub: '颁发机构', date: '年份', bullets: [] },
      volunteer: { id: Date.now()+'-vol', title: '志愿活动', sub: '机构名称', date: '时间', bullets: [] },
      interest:  { id: Date.now()+'-itr', title: '兴趣爱好', sub: '简短描述', date: '', bullets: [] },
      language:  { id: Date.now()+'-lng', title: '英语', sub: '流利', date: '', bullets: [] },
    }
    // Merge flag change + entry addition in a single history push to avoid two-click race
    setData(prev => ({
      ...prev,
      ...(flagPatch || {}),
      [sec]: [...(prev[sec] as Entry[]), defaults[sec]],
    }))
    showToast(`✓ 已添加${({ exp:'工作经历', edu:'教育背景', language:'语言能力', award:'荣誉奖项', project:'项目经历', cert:'资质证书', volunteer:'志愿服务', interest:'兴趣爱好' } as Record<string,string>)[sec]}`)
    setTimeout(() => {
      setSelection({ kind: 'entry', sec, idx: (data[sec] as Entry[]).length })
    }, 80)
  }, [data, setData])

  const handleAddModule = useCallback((key: string) => {
    // Personal info shortcuts
    if (key === 'name') {
      setSelection({ kind: 'field', field: 'name' })
      return
    }
    if (key === 'contact') {
      setSelection({ kind: 'contact' })
      return
    }
    if (key === 'photo') {
      photoInputRef.current?.click()
      return
    }
    if (key === 'photo-clear') {
      updateData({ photo: '' })
      showToast('已移除照片')
      return
    }

    const flagMap: Record<string, keyof ResumeData> = {
      summary: 'hasSummary', skills: 'hasSkills', project: 'hasProject', language: 'hasLanguage',
      award: 'hasAward', cert: 'hasCert', volunteer: 'hasVolunteer', interest: 'hasInterest',
    }
    const sectionKeys: Record<string, SectionKey> = {
      exp: 'exp', edu: 'edu', project: 'project', award: 'award',
      cert: 'cert', volunteer: 'volunteer', interest: 'interest', language: 'language',
    }

    if (key === 'summary') {
      updateData({ hasSummary: true })
      setSelection({ kind: 'field', field: 'summary' })
      showToast('✓ 已添加个人简介')
    } else if (key === 'skills') {
      updateData({ hasSkills: true })
      setSelection({ kind: 'skills' })
      showToast('✓ 已显示技能区块')
    } else if (sectionKeys[key]) {
      const sec = sectionKeys[key]
      const flag = flagMap[key]
      // Pass flag as part of the same history entry to avoid two-state-update race
      addEntry(sec, flag ? { [flag]: true } as Partial<ResumeData> : undefined)
    }
  }, [addEntry])

  // ============ Photo upload ============
  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      updateData({ photo: dataUrl })
      showToast('✓ 照片已上传')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ============ Open a clean new window with resume HTML ============
  const openResumeWindow = useCallback((autoprint = false) => {
    // Clear selection so no highlight outline appears in preview
    setSelection({ kind: 'none' })
    setTimeout(() => {
      const printArea = document.querySelector('.resume-print-area')
      if (!printArea) return
      const html = printArea.innerHTML
      const w = window.open('', '_blank', 'width=900,height=1100')
      if (!w) return
      const title = docTitle || '我的简历'
      w.document.write(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${title}${autoprint ? '' : ' - 预览'}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;600;700&family=Noto+Serif+SC:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: ${autoprint ? 'white' : '#e2e8f0'};
    padding: ${autoprint ? '0' : '40px'};
    font-family: Inter, 'Noto Sans SC', sans-serif;
    min-height: 100vh;
  }
  .preview-wrap { display: flex; flex-direction: column; align-items: center; gap: ${autoprint ? '0' : '24px'}; }
  @media print {
    @page { size: A4; margin: 0; }
    body { background: white; padding: 0; }
    .preview-wrap { gap: 0; }
    .resume-page { page-break-after: always; break-after: page; box-shadow: none !important; }
    .resume-page:last-child { page-break-after: auto; break-after: auto; }
  }
</style>
</head>
<body>
<div class="preview-wrap">${html}</div>
${autoprint ? `<script>window.onload=function(){setTimeout(function(){window.print();},600);};<\/script>` : ''}
</body>
</html>`)
      w.document.close()
    }, 80)
  }, [docTitle])

  // ============ Keyboard shortcuts ============
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  return (
    <div className="editor-outer" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoFile} style={{ display: 'none' }} />

      <div className="no-print">
        <EditorTopbar
          docTitle={docTitle} setDocTitle={setDocTitle}
          onPreview={() => openResumeWindow(false)}
          onUpload={() => setModal('upload')}
          onDownload={() => setModal('download')}
          onUndo={undo}
          onRedo={redo}
          canUndo={historyIdx > 0}
          canRedo={historyIdx < history.length - 1}
        />
      </div>

      <div className="editor-content" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div className="no-print" style={{ display: 'contents' }}>
          <LeftPanel
            templateId={templateId}
            onTemplateChange={(id) => { setTemplateId(id); showToast('✓ 模板已切换') }}
            currentColor={effectiveColor}
            onColorChange={(c) => { setColor(c); showToast('✓ 颜色已应用') }}
            onAddModule={handleAddModule}
            data={data}
            onUpdate={updateData}
          />
        </div>

        <div className="editor-canvas-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#e2e8f0' }}>
          {/* Toolbar */}
          <div className="no-print" style={{
            height: '44px', background: 'white', borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', padding: '0 14px', gap: '8px', flexShrink: 0,
          }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>共 {pageCount} 页</span>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', minWidth: '40px', textAlign: 'center' }}>{zoom}%</span>
              {([['－', -10], ['＋', 10]] as [string, number][]).map(([l, d]) => (
                <button key={l} onClick={() => setZoom(z => Math.min(130, Math.max(40, z + d)))} style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '13px',
                  cursor: 'pointer', border: '1px solid #e2e8f0',
                  background: 'white', color: '#334155', fontFamily: 'var(--font-sans)',
                }}>{l}</button>
              ))}
              <button onClick={() => setZoom(70)} style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                cursor: 'pointer', border: '1px solid #e2e8f0',
                background: 'white', color: '#64748b', fontFamily: 'var(--font-sans)',
              }}>重置</button>
            </div>
          </div>

          {/* Canvas */}
          <div
            className="print-canvas"
            style={{
              flex: 1, overflow: 'auto',
              display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
              padding: '32px 24px',
            }}
            onClick={() => setSelection({ kind: 'none' })}
          >
            <div className="print-scale-wrapper" style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}>
              <div className="resume-print-area">
                <PaginatedResume
                  data={data}
                  template={template}
                  color={effectiveColor}
                  interactive
                  selection={selection}
                  onSelect={setSelection}
                  onPhotoUpload={() => photoInputRef.current?.click()}
                  onPagesChange={setPageCount}
                />
              </div>
            </div>
          </div>
        </div>

        {selection.kind !== 'none' && (
          <div className="no-print" style={{ display: 'contents' }}>
            <RightPanel
              selection={selection}
              data={data}
              onUpdate={updateData}
              onUpdateEntry={updateEntry}
              onDeleteEntry={deleteEntry}
              onAddEntry={addEntry}
              onClose={() => setSelection({ kind: 'none' })}
            />
          </div>
        )}
      </div>

      {modal === 'download' && (
        <DownloadModal
          onClose={() => setModal('none')}
          onPrintPDF={() => {
            setModal('none')
            setSelection({ kind: 'none' })
            setTimeout(() => window.print(), 200)
          }}
        />
      )}
      {modal === 'upload' && <UploadModal onClose={() => setModal('none')} />}

      {/* Toast */}
      <div className="no-print" style={{
        position: 'fixed', bottom: '24px', left: '50%',
        transform: `translateX(-50%) translateY(${toast ? '0' : '60px'})`,
        background: '#0f172a', color: '#fff',
        padding: '11px 22px', borderRadius: '10px',
        fontSize: '13px', fontWeight: 500, zIndex: 300,
        transition: 'transform 0.3s', pointerEvents: 'none',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.25)',
      }}>{toast}</div>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'var(--font-sans)', color:'#64748b' }}>
        加载中...
      </div>
    }>
      <EditorInner />
    </Suspense>
  )
}
