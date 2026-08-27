import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface WaveBackgroundProps {
  isMobile: boolean
}

export default function WaveBackground({ isMobile }: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Track mouse for parallax — stable ref so the rAF closure always sees latest
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isMobile,
      powerPreference: 'low-power',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    // ── Scene + Camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, canvas.clientWidth / canvas.clientHeight, 0.1, 3000)
    camera.position.set(0, 22, 80)
    camera.lookAt(0, 8, -300)

    // ── Geometry ──────────────────────────────────────────────────────────────
    // Live site: PlaneGeometry(900, 1200, segs, floor(segs*1.3))
    // Desktop segs=110, mobile segs=55
    const segs = isMobile ? 55 : 110
    const planeW = 900
    const planeH = 1200
    const geometry = new THREE.PlaneGeometry(planeW, planeH, segs, Math.floor(segs * 1.3))
    geometry.rotateX(-Math.PI / 2)
    geometry.translate(0, 0, -120)

    // Cache original XZ positions for wave computation
    const posAttr = geometry.attributes.position
    const vertCount = posAttr.count
    const baseXZ = new Float32Array(vertCount * 2)
    for (let i = 0; i < vertCount; i++) {
      baseXZ[i * 2]     = posAttr.getX(i)   // x
      baseXZ[i * 2 + 1] = posAttr.getZ(i)   // z
    }

    // ── Material ──────────────────────────────────────────────────────────────
    const material = new THREE.MeshBasicMaterial({
      color: 0x181818,
      wireframe: true,
      transparent: true,
      opacity: isMobile ? 0.08 : 0.1,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // ── Resize handler ────────────────────────────────────────────────────────
    function handleResize() {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    // ── Mouse parallax (desktop only) ─────────────────────────────────────────
    function handleMouseMove(e: MouseEvent) {
      mouse.current.targetX = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1
    }
    if (!isMobile) window.addEventListener('mousemove', handleMouseMove)

    // ── Animation loop ────────────────────────────────────────────────────────
    let rafId: number
    const startTime = performance.now()

    function animate() {
      rafId = requestAnimationFrame(animate)
      const t = (performance.now() - startTime) * 0.001

      // Smooth mouse interpolation
      const m = mouse.current
      m.x += (m.targetX - m.x) * 0.04
      m.y += (m.targetY - m.y) * 0.04

      for (let i = 0; i < vertCount; i++) {
        const x = baseXZ[i * 2]
        const z = baseXZ[i * 2 + 1]

        // Amplitude increases toward the back of the plane
        const depthFactor = 12 + Math.max(0, Math.min(1, -z / planeH)) * 6

        const w1 = Math.sin(x * 0.018 + t * 0.32) * Math.cos(z * 0.015 + t * 0.25) * depthFactor
        const w2 = Math.sin(x * 0.04  - t * 0.48) * Math.sin(z * 0.025 + t * 0.38) * (depthFactor * 0.5)
        const w3 = Math.cos(x * 0.012 + z * 0.01 + t * 0.16) * (depthFactor * 0.35)
        const w4 = Math.sin(x * 0.008 - z * 0.012 + t * 0.1)  * (depthFactor * 0.28)

        // Mouse cursor ripple
        const mx = m.x * 120
        const mz = -m.y * 80 - 60
        const dist2 = (x - mx) * (x - mx) + (z - mz) * (z - mz)
        const ripple = Math.exp(-dist2 * 0.00015) * 9

        posAttr.setY(i, w1 + w2 + w3 + w4 + ripple)
      }

      posAttr.needsUpdate = true
      renderer.render(scene, camera)
    }
    animate()

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      if (!isMobile) window.removeEventListener('mousemove', handleMouseMove)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [isMobile])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
