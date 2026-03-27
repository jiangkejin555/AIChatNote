'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { cn } from '@/lib/utils'

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
}

interface Star {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  twinkleSpeed: number
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [stars, setStars] = useState<Star[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isLogoHovered, setIsLogoHovered] = useState(false)
  const [logoParticles, setLogoParticles] = useState<Particle[]>([])

  // Initialize stars
  useEffect(() => {
    const newStars: Star[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      twinkleSpeed: Math.random() * 3 + 2,
    }))
    setStars(newStars)
  }, [])

  // Handle click ripple effect
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = leftPanelRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newRipple: Ripple = {
      id: Date.now(),
      x,
      y,
      size: 0,
    }

    setRipples(prev => [...prev, newRipple])

    // Create burst particles
    const burstParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      size: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * 200,
      speedY: (Math.random() - 0.5) * 200,
      opacity: 1,
    }))
    setParticles(prev => [...prev, ...burstParticles])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 1000)
  }, [])

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return

    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.speedX * 0.02,
            y: p.y + p.speedY * 0.02,
            speedX: p.speedX * 0.95,
            speedY: p.speedY * 0.95,
            opacity: p.opacity - 0.02,
            size: p.size * 0.98,
          }))
          .filter(p => p.opacity > 0)
      )
    }, 16)

    return () => clearInterval(interval)
  }, [particles.length])

  // Handle mouse move for parallax
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = leftPanelRef.current?.getBoundingClientRect()
    if (!rect) return

    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    })
  }, [])

  // Logo hover particle burst
  const handleLogoHover = useCallback((hovering: boolean) => {
    setIsLogoHovered(hovering)

    if (hovering) {
      const burst: Particle[] = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: 24, // Center of logo
        y: 24,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 100,
        speedY: (Math.random() - 0.5) * 100,
        opacity: 1,
      }))
      setLogoParticles(prev => [...prev, ...burst])
    }
  }, [])

  // Animate logo particles
  useEffect(() => {
    if (logoParticles.length === 0) return

    const interval = setInterval(() => {
      setLogoParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.speedX * 0.02,
            y: p.y + p.speedY * 0.02,
            opacity: p.opacity - 0.03,
          }))
          .filter(p => p.opacity > 0)
      )
    }, 16)

    return () => clearInterval(interval)
  }, [logoParticles.length])

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Visual */}
      <div
        ref={leftPanelRef}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 cursor-crosshair"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      >
        {/* Interactive stars background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {stars.map(star => (
            <div
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
                animation: `twinkle ${star.twinkleSpeed}s ease-in-out infinite`,
                transform: `translate(${(mousePos.x - 0.5) * 10}px, ${(mousePos.y - 0.5) * 10}px)`,
                transition: 'transform 0.3s ease-out',
              }}
            />
          ))}
        </div>

        {/* Animated gradient orbs with parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-500/30 to-transparent rounded-full blur-3xl animate-pulse"
            style={{
              animationDuration: '4s',
              transform: `translate(${(mousePos.x - 0.5) * 30}px, ${(mousePos.y - 0.5) * 30}px)`,
              transition: 'transform 0.5s ease-out',
            }}
          />
          <div
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-500/20 to-transparent rounded-full blur-3xl animate-pulse"
            style={{
              animationDuration: '6s',
              animationDelay: '1s',
              transform: `translate(${(mousePos.x - 0.5) * -20}px, ${(mousePos.y - 0.5) * -20}px)`,
              transition: 'transform 0.5s ease-out',
            }}
          />
          <div
            className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-gradient-to-bl from-fuchsia-500/10 to-transparent rounded-full blur-2xl animate-pulse"
            style={{
              animationDuration: '5s',
              animationDelay: '2s',
              transform: `translate(${(mousePos.x - 0.5) * 15}px, ${(mousePos.y - 0.5) * 15}px)`,
              transition: 'transform 0.5s ease-out',
            }}
          />
        </div>

        {/* Click ripples */}
        {ripples.map(ripple => (
          <div
            key={ripple.id}
            className="absolute rounded-full border-2 border-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)',
              animation: 'ripple 1s ease-out forwards',
            }}
          />
        ))}

        {/* Burst particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 pointer-events-none"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 10px rgba(167, 139, 250, 0.5)',
            }}
          />
        ))}

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          {/* Logo with interactive hover */}
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-3 cursor-pointer group"
              onMouseEnter={() => handleLogoHover(true)}
              onMouseLeave={() => handleLogoHover(false)}
            >
              <div
                className={cn(
                  "relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center shadow-lg transition-all duration-300",
                  isLogoHovered
                    ? "shadow-violet-500/60 scale-110 rotate-3"
                    : "shadow-violet-500/30"
                )}
              >
                {/* Glow effect */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 blur-xl transition-opacity duration-300",
                    isLogoHovered ? "opacity-50" : "opacity-0"
                  )}
                />

                {/* Logo particles */}
                {logoParticles.map(p => (
                  <div
                    key={p.id}
                    className="absolute w-2 h-2 rounded-full bg-white pointer-events-none"
                    style={{
                      left: p.x,
                      top: p.y,
                      opacity: p.opacity,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}

                <svg
                  className={cn(
                    "w-7 h-7 text-white transition-transform duration-300",
                    isLogoHovered && "scale-110 rotate-12"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <span
                className={cn(
                  "text-2xl font-semibold text-white tracking-tight transition-all duration-300",
                  isLogoHovered && "text-violet-200"
                )}
              >
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">AI</span>
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-2 delay-75">Chat</span>
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-3 delay-150">Note</span>
              </span>
            </div>
          </div>

          {/* Headline with hover glow */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6 group">
            <span className="inline-block transition-all duration-300 hover:text-violet-200 hover:-translate-y-1 cursor-default">
              聊天即生产
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 inline-block transition-all duration-300 hover:from-fuchsia-300 hover:to-violet-300 cursor-default hover:scale-105 origin-left">
              对话即沉淀
            </span>
          </h1>

          <p className="text-lg text-violet-200/70 max-w-md mb-12 leading-relaxed transition-colors duration-300 hover:text-violet-200/90 cursor-default">
            AI 聊天聚合与知识库管理。每一次对话，都成为有价值的知识资产。
          </p>

          {/* Interactive Features */}
          <div className="space-y-4">
            {[
              { icon: '✦', text: '多模型聚合，自由切换' },
              { icon: '◈', text: '智能总结，自动归档' },
              { icon: '❖', text: '知识库管理，随时检索' },
            ].map((feature, i) => (
              <div
                key={i}
                className="group flex items-center gap-4 text-violet-200/80 cursor-pointer transition-all duration-300 hover:translate-x-2"
              >
                <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm transition-all duration-300 group-hover:bg-violet-500/20 group-hover:border-violet-400/30 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-violet-500/20">
                  <span className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125">
                    {feature.icon}
                  </span>
                </span>
                <span className="text-sm transition-colors duration-300 group-hover:text-violet-100">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-8 left-16 xl:left-24 text-xs text-violet-300/40 transition-opacity duration-300 hover:opacity-100 hover:text-violet-300/70">
          © 2024 AI Chat Note
        </div>

        {/* CSS Animations */}
        <style jsx global>{`
          @keyframes ripple {
            0% {
              width: 0;
              height: 0;
              opacity: 0.5;
            }
            100% {
              width: 500px;
              height: 500px;
              opacity: 0;
            }
          }

          @keyframes twinkle {
            0%, 100% {
              opacity: 0.2;
              transform: scale(1);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.5);
            }
          }
        `}</style>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <span className="text-xl font-semibold tracking-tight">AI Chat Note</span>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
