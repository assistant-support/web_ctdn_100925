'use client'

import { useEffect, useRef } from 'react'

export default function RevealOnScroll({ children, delay = 0 }) {
    const ref = useRef(null)
    useEffect(() => {
        const el = ref.current; if (!el) return
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                el.classList.remove('opacity-0', 'translate-y-3')
                el.classList.add('opacity-100', 'translate-y-0')
                io.disconnect()
            }
        }, { threshold: 0.15 })
        io.observe(el)
        return () => io.disconnect()
    }, [])
    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className="opacity-0 translate-y-3 transition-all duration-700 will-change-transform"
        >
            {children}
        </div>
    )
}
