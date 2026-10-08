import { useEffect, useRef, useState } from 'react'

/**
 * 3D Rotating Dotted Wireframe Earth Globe.
 * Exact replication of wireframe-dotted-globe from the reference project.
 * Uses real Natural Earth GeoJSON 110m land data with orthographic 3D projection,
 * latitude/longitude graticules, coastline vectors, and halftone continent dot matrix.
 * Implemented with pure Canvas 2D math (zero external dependencies, no d3, no gsap).
 */
export default function RotatingEarth({
  width = 520,
  height = 500,
  className = '',
}) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    // Set up responsive dimensions matching reference
    const containerWidth = Math.min(width, window.innerWidth - 40)
    const containerHeight = Math.min(height, window.innerHeight - 100)
    const baseRadius = Math.min(containerWidth, containerHeight) / 2.5
    let currentScale = baseRadius

    const dpr = window.devicePixelRatio || 1
    canvas.width = containerWidth * dpr
    canvas.height = containerHeight * dpr
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${containerHeight}px`
    context.scale(dpr, dpr)

    const cx = containerWidth / 2
    const cy = containerHeight / 2

    // Rotation state: [longitude, latitude] starting at [0, 0]
    const rotation = [0, 0]
    let autoRotate = true
    const rotationSpeed = 0.5

    // Land data & Halftone dots
    let landFeatures = null
    const allDots = []

    function pointInPolygon(point, polygon) {
      const [x, y] = point
      let inside = false
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]
        const [xj, yj] = polygon[j]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside
        }
      }
      return inside
    }

    function pointInFeature(point, feature) {
      const geom = feature.geometry
      if (!geom) return false
      if (geom.type === 'Polygon') {
        const coords = geom.coordinates
        if (!pointInPolygon(point, coords[0])) return false
        for (let i = 1; i < coords.length; i++) {
          if (pointInPolygon(point, coords[i])) return false
        }
        return true
      } else if (geom.type === 'MultiPolygon') {
        for (const polygon of geom.coordinates) {
          if (pointInPolygon(point, polygon[0])) {
            let inHole = false
            for (let i = 1; i < polygon.length; i++) {
              if (pointInPolygon(point, polygon[i])) {
                inHole = true
                break
              }
            }
            if (!inHole) return true
          }
        }
      }
      return false
    }

    // Generate dense dots matching reference (dotSpacing = 16 => stepSize = 1.28 deg)
    function generateDotsInFeature(feature, dotSpacing = 16) {
      const dots = []
      let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90

      function scanCoords(coords) {
        if (typeof coords[0] === 'number') {
          minLng = Math.min(minLng, coords[0])
          maxLng = Math.max(maxLng, coords[0])
          minLat = Math.min(minLat, coords[1])
          maxLat = Math.max(maxLat, coords[1])
        } else {
          for (let i = 0; i < coords.length; i++) scanCoords(coords[i])
        }
      }
      scanCoords(feature.geometry.coordinates)

      const stepSize = dotSpacing * 0.08 // 1.28 degrees
      for (let lng = minLng; lng <= maxLng; lng += stepSize) {
        for (let lat = minLat; lat <= maxLat; lat += stepSize) {
          if (pointInFeature([lng, lat], feature)) {
            dots.push({ lng, lat })
          }
        }
      }
      return dots
    }

    // 3D Orthographic projection identical to d3.geoOrthographic
    function project3D(lng, lat, rotX, rotY) {
      const rad = Math.PI / 180
      const lambda = (lng + rotX) * rad
      const phi = lat * rad
      const gamma = rotY * rad

      const cosPhi = Math.cos(phi)
      const sinPhi = Math.sin(phi)
      const cosLambda = Math.cos(lambda)
      const sinLambda = Math.sin(lambda)
      const cosGamma = Math.cos(gamma)
      const sinGamma = Math.sin(gamma)

      // Unrotated unit sphere coordinates
      const x0 = cosPhi * sinLambda
      const y0 = sinPhi
      const z0 = cosPhi * cosLambda

      // Pitch rotation around X axis (latitude tilt)
      const x = x0
      const y = y0 * cosGamma - z0 * sinGamma
      const z = y0 * sinGamma + z0 * cosGamma

      return {
        x,
        y,
        z,
        visible: z >= 0,
        screenX: cx + currentScale * x,
        screenY: cy - currentScale * y,
      }
    }

    // Draw line segment clipped to the horizon circle
    function drawClippedSegment(p1, p2) {
      if (p1.visible && p2.visible) {
        context.lineTo(p2.screenX, p2.screenY)
      } else if (p1.visible && !p2.visible) {
        // Leaving visible hemisphere: find horizon crossing
        const t = p1.z / (p1.z - p2.z)
        let hx = p1.x + t * (p2.x - p1.x)
        let hy = p1.y + t * (p2.y - p1.y)
        const d = Math.sqrt(hx * hx + hy * hy) || 1
        hx /= d
        hy /= d
        context.lineTo(cx + currentScale * hx, cy - currentScale * hy)
      } else if (!p1.visible && p2.visible) {
        // Entering visible hemisphere: find horizon crossing
        const t = p1.z / (p1.z - p2.z)
        let hx = p1.x + t * (p2.x - p1.x)
        let hy = p1.y + t * (p2.y - p1.y)
        const d = Math.sqrt(hx * hx + hy * hy) || 1
        hx /= d
        hy /= d
        context.moveTo(cx + currentScale * hx, cy - currentScale * hy)
        context.lineTo(p2.screenX, p2.screenY)
      }
    }

    function render() {
      context.clearRect(0, 0, containerWidth, containerHeight)
      const scaleFactor = currentScale / baseRadius

      // 1. Draw ocean (globe background circle)
      context.beginPath()
      context.arc(cx, cy, currentScale, 0, 2 * Math.PI)
      context.fillStyle = '#001a14'
      context.fill()
      context.strokeStyle = '#4edea3'
      context.lineWidth = 2 * scaleFactor
      context.stroke()

      if (landFeatures) {
        // 2. Draw graticule (latitudes & meridians)
        context.strokeStyle = '#6cf8bb'
        context.lineWidth = 1 * scaleFactor
        context.globalAlpha = 0.2

        // Latitudes
        const latSteps = [-60, -30, 0, 30, 60]
        for (let i = 0; i < latSteps.length; i++) {
          const lat = latSteps[i]
          context.beginPath()
          let prev = project3D(-180, lat, rotation[0], rotation[1])
          if (prev.visible) context.moveTo(prev.screenX, prev.screenY)
          for (let lng = -178; lng <= 180; lng += 3) {
            const curr = project3D(lng, lat, rotation[0], rotation[1])
            drawClippedSegment(prev, curr)
            prev = curr
          }
          context.stroke()
        }

        // Meridians
        for (let lng = -180; lng < 180; lng += 30) {
          context.beginPath()
          let prev = project3D(lng, -90, rotation[0], rotation[1])
          if (prev.visible) context.moveTo(prev.screenX, prev.screenY)
          for (let lat = -88; lat <= 90; lat += 3) {
            const curr = project3D(lng, lat, rotation[0], rotation[1])
            drawClippedSegment(prev, curr)
            prev = curr
          }
          context.stroke()
        }

        context.globalAlpha = 1

        // 3. Draw land outlines
        context.beginPath()
        context.strokeStyle = '#4edea3'
        context.lineWidth = 1.2 * scaleFactor

        for (let f = 0; f < landFeatures.features.length; f++) {
          const feat = landFeatures.features[f]
          const geom = feat.geometry
          if (!geom) continue

          const rings = geom.type === 'Polygon' ? geom.coordinates : geom.coordinates.flat(1)
          for (let r = 0; r < rings.length; r++) {
            const ring = rings[r]
            if (!ring || ring.length < 2) continue
            let prev = project3D(ring[0][0], ring[0][1], rotation[0], rotation[1])
            if (prev.visible) context.moveTo(prev.screenX, prev.screenY)

            for (let i = 1; i < ring.length; i++) {
              const curr = project3D(ring[i][0], ring[i][1], rotation[0], rotation[1])
              drawClippedSegment(prev, curr)
              prev = curr
            }
          }
        }
        context.stroke()

        // 4. Draw halftone dots
        const dotRadius = 1.2 * scaleFactor
        context.fillStyle = '#6cf8bb'

        for (let i = 0; i < allDots.length; i++) {
          const pt = project3D(allDots[i].lng, allDots[i].lat, rotation[0], rotation[1])
          if (
            pt.visible &&
            pt.screenX >= 0 &&
            pt.screenX <= containerWidth &&
            pt.screenY >= 0 &&
            pt.screenY <= containerHeight
          ) {
            context.beginPath()
            context.arc(pt.screenX, pt.screenY, dotRadius, 0, 2 * Math.PI)
            context.fill()
          }
        }
      }
    }

    // Auto-rotation loop
    let animFrame = null
    function tick() {
      if (autoRotate) {
        rotation[0] += rotationSpeed
        render()
      }
      animFrame = requestAnimationFrame(tick)
    }

    // Fetch Natural Earth 110m land GeoJSON
    async function loadWorldData() {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json',
        )
        if (!response.ok) throw new Error('Failed to load land data')
        landFeatures = await response.json()

        for (let i = 0; i < landFeatures.features.length; i++) {
          const dots = generateDotsInFeature(landFeatures.features[i], 16)
          for (let d = 0; d < dots.length; d++) {
            allDots.push(dots[d])
          }
        }

        render()
      } catch (err) {
        setError(err.message)
      }
    }

    // Mouse and Touch Drag Interactions
    function handlePointerDown(e) {
      autoRotate = false
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const startX = clientX
      const startY = clientY
      const startRotX = rotation[0]
      const startRotY = rotation[1]

      function handlePointerMove(moveEvent) {
        const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX
        const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY
        const sensitivity = 0.5
        const dx = currentX - startX
        const dy = currentY - startY

        rotation[0] = startRotX + dx * sensitivity
        rotation[1] = startRotY - dy * sensitivity
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]))

        render()
      }

      function handlePointerUp() {
        window.removeEventListener('mousemove', handlePointerMove)
        window.removeEventListener('mouseup', handlePointerUp)
        window.removeEventListener('touchmove', handlePointerMove)
        window.removeEventListener('touchend', handlePointerUp)

        setTimeout(() => {
          autoRotate = true
        }, 10)
      }

      window.addEventListener('mousemove', handlePointerMove, { passive: true })
      window.addEventListener('mouseup', handlePointerUp)
      window.addEventListener('touchmove', handlePointerMove, { passive: true })
      window.addEventListener('touchend', handlePointerUp)
    }

    function handleWheel(e) {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 0.9 : 1.1
      currentScale = Math.max(baseRadius * 0.5, Math.min(baseRadius * 3, currentScale * factor))
      render()
    }

    canvas.addEventListener('mousedown', handlePointerDown)
    canvas.addEventListener('touchstart', handlePointerDown, { passive: true })
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    loadWorldData()
    animFrame = requestAnimationFrame(tick)

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame)
      canvas.removeEventListener('mousedown', handlePointerDown)
      canvas.removeEventListener('touchstart', handlePointerDown)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [width, height])

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 text-center ${className}`}>
        <p className="text-emerald-400 text-sm">Visualización global disponible</p>
      </div>
    )
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-2xl bg-transparent cursor-grab active:cursor-grabbing"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  )
}
