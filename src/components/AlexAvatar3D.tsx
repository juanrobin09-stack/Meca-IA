import { Canvas } from '@react-three/fiber'
import { useGLTF, Environment, PerspectiveCamera } from '@react-three/drei'
import { useEffect, useRef, Suspense } from 'react'
import * as THREE from 'three'

interface AvatarProps {
  isSpeaking: boolean
  isListening?: boolean
}

function MechanicAvatar({ isSpeaking, isListening = false }: AvatarProps) {
  const avatarRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Object3D | null>(null)

  // Avatar HOMME mecanicien
  const { scene } = useGLTF('https://models.readyplayer.me/6508e35e0b33c63548f51b28.glb')

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.name.toLowerCase().includes('head') ||
            child.name.toLowerCase().includes('neck') ||
            child.name === 'Head') {
          headRef.current = child
        }
      })
    }
  }, [scene])

  // Animations ULTRA REALISTES
  useEffect(() => {
    if (!avatarRef.current) return

    let animationId: number
    let time = 0

    const animate = () => {
      time += 0.016

      if (avatarRef.current) {
        // Respiration naturelle
        avatarRef.current.position.y = -2.2 + Math.sin(time * 1.2) * 0.02

        if (headRef.current) {
          if (isSpeaking) {
            // Mouvements tete quand il parle (NATUREL)
            headRef.current.rotation.y = Math.sin(time * 5) * 0.1
            headRef.current.rotation.x = Math.sin(time * 4) * 0.05
            headRef.current.rotation.z = Math.sin(time * 3) * 0.03

            // Legere inclinaison corps
            avatarRef.current.rotation.z = Math.sin(time * 2) * 0.02
          } else if (isListening) {
            // Ecoute attentive (tete legerement inclinee)
            headRef.current.rotation.y = Math.sin(time * 0.5) * 0.08
            headRef.current.rotation.x = 0.05 // Regarde vers le bas (ecoute)
          } else {
            // Idle naturel
            headRef.current.rotation.y = Math.sin(time * 0.3) * 0.04
            headRef.current.rotation.x = 0
            headRef.current.rotation.z = 0
            avatarRef.current.rotation.z = 0
          }
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [isSpeaking, isListening])

  return (
    <primitive
      ref={avatarRef}
      object={scene}
      scale={2.4}
      position={[0, -2.2, 0]}
      rotation={[0, 0, 0]}
    />
  )
}

function LoadingAvatar() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#f97316" />
    </mesh>
  )
}

export function AlexAvatar3D({ isSpeaking, isListening = false }: AvatarProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 overflow-hidden relative">

      {/* Status badge PREMIUM */}
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10">
          <div className={`relative w-3 h-3 rounded-full ${
            isSpeaking ? 'bg-green-400' : isListening ? 'bg-blue-400' : 'bg-gray-400'
          }`}>
            {(isSpeaking || isListening) && (
              <div className={`absolute inset-0 rounded-full ${
                isSpeaking ? 'bg-green-400' : 'bg-blue-400'
              } animate-ping opacity-75`}></div>
            )}
          </div>
          <span className="text-white text-sm font-medium">
            {isSpeaking ? 'Parle' : isListening ? 'Ecoute' : 'En ligne'}
          </span>
        </div>
      </div>

      {/* Canvas 3D AAA */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <PerspectiveCamera
          makeDefault
          position={[0, 0.8, 3.5]}
          fov={40}
        />

        {/* Eclairage CINEMATIQUE */}
        <ambientLight intensity={0.3} />

        {/* Key light (principale) */}
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.5}
          castShadow
        />

        {/* Fill light (adoucit ombres) */}
        <directionalLight
          position={[-3, 4, -2]}
          intensity={0.4}
        />

        {/* Rim light (contour) */}
        <spotLight
          position={[-2, 3, -3]}
          intensity={0.8}
          angle={0.6}
          penumbra={0.5}
          color="#60a5fa"
        />

        {/* Accent light bleu */}
        <pointLight position={[0, 1, -2]} intensity={0.5} color="#3b82f6" />

        {/* Avatar HOMME */}
        <Suspense fallback={<LoadingAvatar />}>
          <MechanicAvatar
            isSpeaking={isSpeaking}
            isListening={isListening}
          />
        </Suspense>

        {/* Environnement HD */}
        <Environment
          preset="city"
          background={false}
        />

        {/* Sol avec ombres */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]} receiveShadow>
          <planeGeometry args={[15, 15]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
      </Canvas>

      {/* Gradient overlay professionnel */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent pointer-events-none"></div>
    </div>
  )
}

useGLTF.preload('https://models.readyplayer.me/6508e35e0b33c63548f51b28.glb')
