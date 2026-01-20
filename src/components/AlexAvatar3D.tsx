import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, PerspectiveCamera } from '@react-three/drei'
import { useEffect, useRef, useState, Suspense } from 'react'
import * as THREE from 'three'

interface AvatarProps {
  isSpeaking: boolean
  isListening?: boolean
  speechIntensity?: number
  isMobile?: boolean
}

function LiveAvatar({ isSpeaking, isListening = false, speechIntensity = 0, isMobile = false }: AvatarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Object3D | null>(null)
  const meshesRef = useRef<THREE.SkinnedMesh[]>([])

  // Avatar Ready Player Me - URL valide et testee
  const { scene } = useGLTF('https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb')

  // Position Y de base selon device
  const baseY = isMobile ? -1.6 : -1.8

  // Trouver les parties du visage pour animations
  useEffect(() => {
    if (scene) {
      meshesRef.current = []
      scene.traverse((child) => {
        const name = child.name.toLowerCase()

        if (name.includes('head') || name.includes('neck') || name === 'Head') {
          headRef.current = child
        }

        // Collecter les skinned meshes pour morph targets (lip sync)
        if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
          meshesRef.current.push(child as THREE.SkinnedMesh)
        }
      })

      console.log('Avatar loaded, meshes found:', meshesRef.current.length)
    }
  }, [scene])

  // Lip sync + expressions faciales REALISTES
  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    if (!groupRef.current) return

    // === RESPIRATION SUBTILE ===
    groupRef.current.position.y = baseY + Math.sin(time * 1.2) * 0.01

    if (headRef.current) {
      // === QUAND IL PARLE ===
      if (isSpeaking) {
        // Tete bouge naturellement quand il parle
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
        headRef.current.rotation.x = 0.08 // Leger nod
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

    // LIP SYNC avec morph targets
    meshesRef.current.forEach(mesh => {
      if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
        // Chercher les blendshapes pour la bouche
        const mouthOpen = mesh.morphTargetDictionary['mouthOpen'] ??
                         mesh.morphTargetDictionary['jawOpen'] ??
                         mesh.morphTargetDictionary['viseme_aa']

        const mouthSmile = mesh.morphTargetDictionary['mouthSmile'] ??
                          mesh.morphTargetDictionary['viseme_O']

        if (isSpeaking) {
          // Bouche s'ouvre selon l'intensite
          if (mouthOpen !== undefined) {
            mesh.morphTargetInfluences[mouthOpen] = 0.2 + Math.sin(time * 10) * 0.25 * speechIntensity
          }
          if (mouthSmile !== undefined) {
            mesh.morphTargetInfluences[mouthSmile] = 0.1 + Math.sin(time * 6) * 0.15
          }
        } else {
          // Bouche fermee
          if (mouthOpen !== undefined) mesh.morphTargetInfluences[mouthOpen] = 0
          if (mouthSmile !== undefined) mesh.morphTargetInfluences[mouthSmile] = 0
        }

        // Clignement des yeux (idle)
        const eyeBlinkL = mesh.morphTargetDictionary['eyeBlinkLeft'] ?? mesh.morphTargetDictionary['eyeBlink_L']
        const eyeBlinkR = mesh.morphTargetDictionary['eyeBlinkRight'] ?? mesh.morphTargetDictionary['eyeBlink_R']

        if (!isSpeaking && !isListening) {
          const blinkCycle = (time % 4) / 4
          const blinkValue = blinkCycle > 0.95 ? 1 : 0
          if (eyeBlinkL !== undefined) mesh.morphTargetInfluences[eyeBlinkL] = blinkValue
          if (eyeBlinkR !== undefined) mesh.morphTargetInfluences[eyeBlinkR] = blinkValue
        } else {
          if (eyeBlinkL !== undefined) mesh.morphTargetInfluences[eyeBlinkL] = 0
          if (eyeBlinkR !== undefined) mesh.morphTargetInfluences[eyeBlinkR] = 0
        }
      }
    })
  })

  return (
    <primitive
      ref={groupRef}
      object={scene}
      scale={isMobile ? 2.0 : 2.2}
      position={[0, baseY, 0]}
      rotation={[0, Math.PI * 0.1, 0]}
    />
  )
}

// Effets visuels particules autour de l'avatar
function AvatarEffects({ isSpeaking }: { isSpeaking: boolean }) {
  const particlesRef = useRef<THREE.Points>(null)

  useFrame((state) => {
    if (particlesRef.current && isSpeaking) {
      particlesRef.current.rotation.y += 0.008
      particlesRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1
    }
  })

  const particleCount = 50
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2
    const radius = 1.3 + Math.random() * 0.4
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2.5
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
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

function LoadingAvatar() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime()
    }
  })

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[0.3, 0.1, 100, 16]} />
      <meshStandardMaterial color="#3b82f6" wireframe />
    </mesh>
  )
}

export function AlexAvatar3D({ isSpeaking, isListening = false }: AvatarProps) {
  const [speechIntensity, setSpeechIntensity] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Detection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Simuler intensite parole pour lip sync
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setSpeechIntensity(0.5 + Math.random() * 0.5)
      }, 80)
      return () => clearInterval(interval)
    } else {
      setSpeechIntensity(0)
    }
  }, [isSpeaking])

  return (
    <div className="relative w-full h-full">
      {/* Glow effect quand il parle */}
      {isSpeaking && (
        <div className="absolute inset-0 bg-blue-500/30 rounded-2xl md:rounded-3xl blur-3xl animate-pulse pointer-events-none"></div>
      )}

      {/* Status badge moderne - plus petit sur mobile */}
      <div className="absolute top-2 left-2 md:top-3 md:left-3 z-10">
        <div className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full backdrop-blur-xl border transition-all duration-300 ${
          isSpeaking
            ? 'bg-green-500/30 border-green-400/40'
            : isListening
            ? 'bg-blue-500/30 border-blue-400/40'
            : 'bg-white/10 border-white/20'
        }`}>
          <div className={`relative w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${
            isSpeaking ? 'bg-green-400' :
            isListening ? 'bg-blue-400' :
            'bg-gray-400'
          }`}>
            {(isSpeaking || isListening) && (
              <div className={`absolute inset-0 rounded-full animate-ping ${
                isSpeaking ? 'bg-green-400' : 'bg-blue-400'
              }`}></div>
            )}
          </div>
          <span className="text-white text-[10px] md:text-xs font-semibold">
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
        className="rounded-2xl md:rounded-3xl"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
      >
        <PerspectiveCamera
          makeDefault
          position={isMobile ? [0, 0.3, 2.5] : [0, 0.5, 2.8]}
          fov={isMobile ? 50 : 45}
        />

        {/* Eclairage dynamique cinematique */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[3, 5, 3]}
          intensity={1.2}
          castShadow
        />
        <spotLight
          position={[-2, 3, 2]}
          intensity={isSpeaking ? 1.2 : 0.6}
          angle={0.5}
          penumbra={0.5}
          color={isSpeaking ? "#60a5fa" : "#94a3b8"}
        />
        <pointLight
          position={[0, 1, -1]}
          intensity={isSpeaking ? 1 : 0.3}
          color="#3b82f6"
        />
        {/* Rim light */}
        <spotLight
          position={[2, 2, -2]}
          intensity={0.5}
          angle={0.6}
          penumbra={0.8}
          color="#8b5cf6"
        />

        {/* Avatar avec lip sync */}
        <Suspense fallback={<LoadingAvatar />}>
          <LiveAvatar
            isSpeaking={isSpeaking}
            isListening={isListening}
            speechIntensity={speechIntensity}
            isMobile={isMobile}
          />
        </Suspense>

        {/* Effets particules */}
        <AvatarEffects isSpeaking={isSpeaking} />

        {/* Environnement */}
        <Environment preset="city" background={false} />
      </Canvas>

      {/* Ring glow autour */}
      <div className={`absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none transition-all duration-500 ${
        isSpeaking
          ? 'ring-2 ring-blue-400/60 shadow-2xl shadow-blue-500/40'
          : isListening
          ? 'ring-2 ring-purple-400/60 shadow-2xl shadow-purple-500/40'
          : 'ring-1 ring-white/10'
      }`}></div>
    </div>
  )
}

useGLTF.preload('https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb')
