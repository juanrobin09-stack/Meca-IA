import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, PerspectiveCamera } from '@react-three/drei'
import { useEffect, useRef, useState, Suspense } from 'react'
import * as THREE from 'three'

interface AvatarProps {
  isSpeaking: boolean
  isListening?: boolean
  speechIntensity?: number
}

function LiveAvatar({ isSpeaking, isListening = false, speechIntensity = 0 }: AvatarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Object3D | null>(null)
  const meshesRef = useRef<THREE.SkinnedMesh[]>([])

  // Avatar Alex - URL qui fonctionne
  const { scene } = useGLTF('https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb')

  // Trouver les parties pour animations
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        const name = child.name.toLowerCase()

        if (name.includes('head') || name.includes('neck') || name === 'Head') {
          headRef.current = child
        }

        // Collecter les meshes pour morph targets
        if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
          meshesRef.current.push(child as THREE.SkinnedMesh)
        }
      })
    }
  }, [scene])

  // Animations en temps reel
  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    if (!groupRef.current) return

    // === RESPIRATION SUBTILE ===
    groupRef.current.position.y = -1.5 + Math.sin(time * 1.2) * 0.01

    if (headRef.current) {
      // === QUAND IL PARLE ===
      if (isSpeaking) {
        // Tete bouge naturellement
        headRef.current.rotation.y = Math.sin(time * 3) * 0.1
        headRef.current.rotation.x = Math.sin(time * 2.5) * 0.05
        headRef.current.rotation.z = Math.sin(time * 2) * 0.03

        // Leger mouvement corps
        groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.02
      }
      // === QUAND IL ECOUTE ===
      else if (isListening) {
        // Tete inclinee (ecoute attentive)
        headRef.current.rotation.y = Math.sin(time * 0.5) * 0.12
        headRef.current.rotation.x = 0.08
        headRef.current.rotation.z = 0
        groupRef.current.rotation.z = 0
      }
      // === IDLE ===
      else {
        // Micro-mouvements naturels
        headRef.current.rotation.y = Math.sin(time * 0.3) * 0.05
        headRef.current.rotation.x = Math.sin(time * 0.25) * 0.02
        headRef.current.rotation.z = 0
        groupRef.current.rotation.z = 0
      }
    }

    // Morph targets pour lip sync (si disponibles)
    meshesRef.current.forEach(mesh => {
      if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
        const mouthOpenIndex = mesh.morphTargetDictionary['mouthOpen'] ?? mesh.morphTargetDictionary['jawOpen']
        if (mouthOpenIndex !== undefined && isSpeaking) {
          mesh.morphTargetInfluences[mouthOpenIndex] = 0.3 + Math.sin(time * 8) * 0.2 * speechIntensity
        } else if (mouthOpenIndex !== undefined) {
          mesh.morphTargetInfluences[mouthOpenIndex] = 0
        }
      }
    })
  })

  return (
    <primitive
      ref={groupRef}
      object={scene}
      scale={1.8}
      position={[0, -1.5, 0]}
      rotation={[0, Math.PI * 0.1, 0]}
    />
  )
}

// Effets visuels particules
function AvatarEffects({ isSpeaking }: { isSpeaking: boolean }) {
  const particlesRef = useRef<THREE.Points>(null)

  useFrame((state) => {
    if (particlesRef.current && isSpeaking) {
      particlesRef.current.rotation.y += 0.005
      particlesRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1
    }
  })

  const particleCount = 40
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2
    const radius = 1.2 + Math.random() * 0.5
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2
    positions[i * 3 + 2] = Math.sin(angle) * radius
  }

  if (!isSpeaking) return null

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#60a5fa"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  )
}

function LoadingAvatar() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#3b82f6" />
    </mesh>
  )
}

export function AlexAvatar3D({ isSpeaking, isListening = false }: AvatarProps) {
  const [speechIntensity, setSpeechIntensity] = useState(0)

  // Simuler intensite parole
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setSpeechIntensity(0.5 + Math.random() * 0.5)
      }, 100)
      return () => clearInterval(interval)
    } else {
      setSpeechIntensity(0)
    }
  }, [isSpeaking])

  return (
    <div className="relative w-full h-full">
      {/* Glow effect quand il parle */}
      {isSpeaking && (
        <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-3xl animate-pulse pointer-events-none"></div>
      )}

      {/* Status badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl border transition-all ${
          isSpeaking
            ? 'bg-green-500/20 border-green-500/30'
            : isListening
            ? 'bg-blue-500/20 border-blue-500/30'
            : 'bg-white/10 border-white/20'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isSpeaking ? 'bg-green-400 shadow-lg shadow-green-400/50' :
            isListening ? 'bg-blue-400 shadow-lg shadow-blue-400/50' :
            'bg-gray-400'
          } ${(isSpeaking || isListening) ? 'animate-pulse' : ''}`}></div>
          <span className="text-white text-xs font-semibold">
            {isSpeaking ? 'Parle' : isListening ? 'Ecoute' : 'En ligne'}
          </span>
        </div>
      </div>

      {/* Canvas 3D */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        className="rounded-3xl"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
      >
        <PerspectiveCamera
          makeDefault
          position={[0, 0.3, 2.8]}
          fov={35}
        />

        {/* Eclairage dynamique */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 5, 3]} intensity={1.2} castShadow />
        <spotLight
          position={[-2, 3, 2]}
          intensity={0.8}
          angle={0.5}
          penumbra={0.5}
          color={isSpeaking ? "#60a5fa" : "#94a3b8"}
        />
        <pointLight
          position={[0, 1, -1]}
          intensity={isSpeaking ? 0.8 : 0.3}
          color="#3b82f6"
        />

        {/* Avatar */}
        <Suspense fallback={<LoadingAvatar />}>
          <LiveAvatar
            isSpeaking={isSpeaking}
            isListening={isListening}
            speechIntensity={speechIntensity}
          />
        </Suspense>

        {/* Effets particules */}
        <AvatarEffects isSpeaking={isSpeaking} />

        {/* Environnement */}
        <Environment preset="city" background={false} />
      </Canvas>

      {/* Ring glow */}
      <div className={`absolute inset-0 rounded-3xl pointer-events-none transition-all duration-300 ${
        isSpeaking
          ? 'ring-2 ring-blue-400/50 shadow-2xl shadow-blue-500/30'
          : isListening
          ? 'ring-2 ring-purple-400/50 shadow-2xl shadow-purple-500/30'
          : 'ring-1 ring-white/10'
      }`}></div>
    </div>
  )
}

useGLTF.preload('https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb')
