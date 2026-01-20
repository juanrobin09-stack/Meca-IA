import { Canvas } from '@react-three/fiber'
import { useGLTF, Environment, PerspectiveCamera } from '@react-three/drei'
import { useEffect, useRef, Suspense } from 'react'
import * as THREE from 'three'

interface AvatarProps {
  isSpeaking: boolean
  isListening?: boolean
  emotion?: 'neutral' | 'happy' | 'thinking' | 'concerned'
}

function AvatarModel({ isSpeaking, isListening = false, emotion = 'neutral' }: AvatarProps) {
  const avatarRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Object3D | null>(null)

  // Charger avatar Ready Player Me
  const { scene } = useGLTF('https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb')

  // Trouver la tête pour animations ciblées
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.name.toLowerCase().includes('head') || child.name.toLowerCase().includes('neck')) {
          headRef.current = child
        }
      })
    }
  }, [scene])

  // Animations avancées
  useEffect(() => {
    if (!avatarRef.current) return

    let animationId: number
    let time = 0

    const animate = () => {
      time += 0.016 // ~60fps

      if (avatarRef.current) {
        // Respiration subtile
        avatarRef.current.position.y = -2.2 + Math.sin(time * 1.5) * 0.015

        // Si parle : mouvements de tête naturels
        if (isSpeaking && headRef.current) {
          headRef.current.rotation.y = Math.sin(time * 4) * 0.08
          headRef.current.rotation.x = Math.sin(time * 3) * 0.04
          headRef.current.rotation.z = Math.sin(time * 2.5) * 0.03
        }
        // Si écoute : léger mouvement de curiosité
        else if (isListening && headRef.current) {
          headRef.current.rotation.y = Math.sin(time * 0.8) * 0.12
          headRef.current.rotation.x = Math.sin(time * 0.5) * 0.05
        }
        // Idle : respiration et petit mouvement
        else {
          if (headRef.current) {
            headRef.current.rotation.y = Math.sin(time * 0.3) * 0.06
            headRef.current.rotation.x = 0
            headRef.current.rotation.z = 0
          }
        }

        // Émotions
        if (emotion === 'thinking' && headRef.current) {
          headRef.current.rotation.x = -0.15 // Baisse tête (réfléchit)
        } else if (emotion === 'happy' && avatarRef.current) {
          avatarRef.current.position.y += Math.sin(time * 3) * 0.005 // Léger bounce
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [isSpeaking, isListening, emotion])

  return (
    <primitive
      ref={avatarRef}
      object={scene}
      scale={2.2}
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

export function AlexAvatar3D({ isSpeaking, isListening = false, emotion = 'neutral' }: AvatarProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden relative">

      {/* Badge statut */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full">
        <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-400 animate-pulse' : isListening ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'}`}></div>
        <span className="text-white text-xs font-medium">
          {isSpeaking ? 'Parle...' : isListening ? 'Ecoute...' : 'En ligne'}
        </span>
      </div>

      {/* Canvas 3D */}
      <Canvas
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        {/* Caméra optimisée pour voir le corps entier */}
        <PerspectiveCamera
          makeDefault
          position={[0, 0.5, 4]}
          fov={45}
        />

        {/* Éclairage cinématique */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
        />
        <spotLight
          position={[-5, 5, 5]}
          intensity={0.6}
          angle={0.5}
          penumbra={0.5}
        />
        <pointLight position={[0, 2, -2]} intensity={0.3} color="#4f46e5" />

        {/* Avatar avec Suspense */}
        <Suspense fallback={<LoadingAvatar />}>
          <AvatarModel
            isSpeaking={isSpeaking}
            isListening={isListening}
            emotion={emotion}
          />
        </Suspense>

        {/* Environnement (reflets réalistes) */}
        <Environment preset="sunset" />

        {/* Sol (optionnel, donne du réalisme) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.2} />
        </mesh>
      </Canvas>

      {/* Overlay gradient bas (effet profondeur) */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
    </div>
  )
}

useGLTF.preload('https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb')
