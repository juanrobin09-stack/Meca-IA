import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment } from '@react-three/drei'
import { useEffect, useRef, Suspense } from 'react'
import * as THREE from 'three'

interface AvatarProps {
  isSpeaking: boolean
  emotion?: 'neutral' | 'happy' | 'thinking' | 'concerned'
}

function AvatarModel({ isSpeaking, emotion = 'neutral' }: AvatarProps) {
  const avatarRef = useRef<THREE.Group>(null)

  // Use Ready Player Me generic avatar
  const { scene } = useGLTF('https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb')

  // Clone the scene to avoid issues with multiple instances
  const clonedScene = scene.clone()

  // Animation idle (respiration + mouvements)
  useEffect(() => {
    if (!avatarRef.current) return

    let animationId: number
    let time = 0

    const animate = () => {
      time += 0.016

      if (avatarRef.current) {
        // Respiration
        avatarRef.current.position.y = -1.5 + Math.sin(time * 2) * 0.02

        // Si parle, bouge légèrement la tête
        if (isSpeaking) {
          avatarRef.current.rotation.y = Math.sin(time * 8) * 0.05
          avatarRef.current.rotation.x = Math.sin(time * 6) * 0.02
        } else {
          // Idle: regarde lentement autour
          avatarRef.current.rotation.y = Math.sin(time * 0.5) * 0.1
          avatarRef.current.rotation.x = 0
        }

        // Emotion affects scale slightly
        const scaleBase = 2
        if (emotion === 'concerned') {
          avatarRef.current.scale.setScalar(scaleBase * (1 + Math.sin(time * 4) * 0.01))
        } else if (emotion === 'happy') {
          avatarRef.current.scale.setScalar(scaleBase * 1.02)
        } else {
          avatarRef.current.scale.setScalar(scaleBase)
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [isSpeaking, emotion])

  return (
    <primitive
      ref={avatarRef}
      object={clonedScene}
      scale={2}
      position={[0, -1.5, 0]}
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

export function AlexAvatar3D({ isSpeaking, emotion }: AvatarProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Lumières */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <spotLight position={[-5, 5, 5]} intensity={0.5} angle={0.3} />

        {/* Avatar avec Suspense pour le chargement */}
        <Suspense fallback={<LoadingAvatar />}>
          <AvatarModel isSpeaking={isSpeaking} emotion={emotion} />
        </Suspense>

        {/* Environnement (reflets) */}
        <Environment preset="city" />

        {/* Contrôles souris (optionnel) */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 2.5}
          minAzimuthAngle={-Math.PI / 6}
          maxAzimuthAngle={Math.PI / 6}
        />
      </Canvas>
    </div>
  )
}

// Preload avatar
useGLTF.preload('https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb')
