import { useEffect, useRef, useState } from 'react'

/**
 * Custom magnetic follower cursor with exclusion blend mode.
 * Automatically disabled on touch screens and prefers-reduced-motion.
 */
export default function MagneticCursor({ children }) {
  const cursorDotRef = useRef(null)
  const cursorRingRef = useRef(null)
  const [enabled] = useState(() => {
    if (typeof window === 'undefined') return false
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return !isTouch && !prefersReducedMotion
  })

  useEffect(() => {
    if (!enabled) return

    let mouseX = -100
    let mouseY = -100
    let ringX = -100
    let ringY = -100
    let isHovered = false
    let isClicking = false
    let animationFrameId = null

    function handleMouseMove(e) {
      mouseX = e.clientX
      mouseY = e.clientY

      // Check if hovering over magnetic or clickable element
      const target = e.target
      const interactiveEl = target.closest(
        '[data-magnetic], a, button, input, select, [role="button"]',
      )
      isHovered = Boolean(interactiveEl)
    }

    function handleMouseDown() {
      isClicking = true
    }

    function handleMouseUp() {
      isClicking = false
    }

    function renderLoop() {
      // Smooth lerp for outer ring
      const ease = 0.18
      ringX += (mouseX - ringX) * ease
      ringY += (mouseY - ringY) * ease

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
      }

      if (cursorRingRef.current) {
        const scale = isClicking ? 0.75 : isHovered ? 1.8 : 1
        const opacity = isHovered ? 0.9 : 0.6
        cursorRingRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) scale(${scale})`
        cursorRingRef.current.style.opacity = opacity
      }

      animationFrameId = requestAnimationFrame(renderLoop)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown, { passive: true })
    window.addEventListener('mouseup', handleMouseUp, { passive: true })
    animationFrameId = requestAnimationFrame(renderLoop)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [enabled])

  return (
    <>
      {enabled && (
        <>
          {/* Inner Sharp Dot */}
          <div
            ref={cursorDotRef}
            className="fixed top-0 left-0 w-2 h-2 -ml-1 -mt-1 rounded-full bg-white pointer-events-none z-[99999] mix-blend-exclusion transition-opacity duration-200"
            style={{ willChange: 'transform' }}
          />
          {/* Outer Smooth Ring */}
          <div
            ref={cursorRingRef}
            className="fixed top-0 left-0 w-8 h-8 -ml-4 -mt-4 rounded-full border border-white pointer-events-none z-[99998] mix-blend-exclusion transition-[transform,opacity] duration-150 ease-out"
            style={{ willChange: 'transform' }}
          />
        </>
      )}
      {children}
    </>
  )
}
