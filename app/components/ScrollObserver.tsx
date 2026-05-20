'use client'
import { useEffect } from 'react'

export default function ScrollObserver() {
  useEffect(() => {
    // Enable smooth scrolling only while the landing page is mounted.
    // Keeping it global causes an animated scroll-to-top on Next.js route changes,
    // making the editor appear to "slide in from above".
    document.documentElement.style.scrollBehavior = 'smooth'

    // Scrollbar: show on scroll, fade out after 1.2s of no scrolling
    const html = document.documentElement
    let scrollTimer: ReturnType<typeof setTimeout> | null = null
    const onScroll = () => {
      html.classList.add('page-scrolling')
      if (scrollTimer) clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => html.classList.remove('page-scrolling'), 1200)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // threshold:0 fires as soon as any pixel enters the viewport
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0 }
    )

    const observeNew = () => {
      document.querySelectorAll('.fade-in:not([data-io])').forEach(el => {
        (el as HTMLElement).dataset.io = '1'
        // Immediately reveal elements already in viewport
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight) {
          el.classList.add('visible')
        } else {
          io.observe(el)
        }
      })
    }

    // Double-rAF ensures the browser has fully painted and laid out elements
    // before we check their positions — fixes blank sections on client navigation.
    let rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(observeNew)
    })

    // Watch for dynamically added elements (filter changes, show-all, etc.)
    const mo = new MutationObserver(observeNew)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.documentElement.style.scrollBehavior = ''
      window.removeEventListener('scroll', onScroll)
      if (scrollTimer) clearTimeout(scrollTimer)
      html.classList.remove('page-scrolling')
      cancelAnimationFrame(rafId)
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
