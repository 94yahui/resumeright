'use client'
import { useEffect } from 'react'

export default function ScrollObserver() {
  useEffect(() => {
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
      cancelAnimationFrame(rafId)
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
