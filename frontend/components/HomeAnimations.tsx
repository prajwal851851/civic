'use client'

import { useEffect, useRef } from 'react'

export function HomeReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const els = el.querySelectorAll<HTMLElement>('.hm-reveal')
    if (!els.length) return
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            const idx = Array.prototype.indexOf.call(els, el)
            el.style.transitionDelay = (idx * 0.06) + 's'
            el.classList.add('hm-visible')
            obs.unobserve(entry.target)
          }
        })
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
      els.forEach((el) => obs.observe(el))
    } else {
      els.forEach((el) => el.classList.add('hm-visible'))
    }
  }, [])

  return <div ref={ref} style={{ display: 'contents' }} />
}

export function HomeCounters() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const counters = el.querySelectorAll<HTMLElement>('.hm-impact-number[data-target]')
    if (!counters.length) return

    const animate = (counter: HTMLElement) => {
      const target = parseInt(counter.dataset.target || '0', 10)
      if (target <= 0) return
      const duration = 1500
      const start = performance.now()

      function update(now: number) {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        counter.textContent = Math.floor(eased * target).toString()
        if (progress < 1) requestAnimationFrame(update)
        else counter.textContent = target.toString()
      }
      requestAnimationFrame(update)
    }

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target as HTMLElement)
            obs.unobserve(entry.target)
          }
        })
      }, { threshold: 0.3 })
      counters.forEach((c) => obs.observe(c))
    } else {
      counters.forEach((c) => animate(c))
    }
  }, [])

  return <div ref={ref} style={{ display: 'contents' }} />
}
