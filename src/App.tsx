import { useState, useEffect, lazy, Suspense, memo } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoadingSkeleton from '@/components/LoadingSkeleton'

// Lazy loaded pages - Code splitting pour performance
const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/Login'))
const Signup = lazy(() => import('@/pages/Signup'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Chat = lazy(() => import('@/pages/Chat'))
const History = lazy(() => import('@/pages/History'))
const Account = lazy(() => import('@/pages/Account'))
const Success = lazy(() => import('@/pages/Success'))
const AnalyseDevis = lazy(() => import('@/pages/AnalyseDevis'))
const Garages = lazy(() => import('@/pages/Garages'))
const Pieces = lazy(() => import('@/pages/Pieces'))
const MentionsLegales = lazy(() => import('@/pages/MentionsLegales'))
const CGU = lazy(() => import('@/pages/CGU'))
const Confidentialite = lazy(() => import('@/pages/Confidentialite'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Pricing = lazy(() => import('@/pages/Pricing'))
const Vehicles = lazy(() => import('@/pages/Vehicles'))
const DiagnosticVideo = lazy(() => import('@/pages/DiagnosticVideo'))
const VideoChatAlex = lazy(() => import('@/pages/VideoChatAlex'))
const PrevisionPannes = lazy(() => import('@/pages/PrevisionPannes'))
const MechanicChat = lazy(() => import('@/pages/MechanicChat'))
const Settings = lazy(() => import('@/pages/Settings'))
const AuthCallback = lazy(() => import('@/pages/AuthCallback'))

// Lazy load heavy components
const Onboarding = lazy(() => import('@/components/Onboarding'))
const CookieBanner = lazy(() => import('@/components/CookieBanner'))

// Memoized AuthRedirect pour éviter re-renders inutiles
const AuthRedirect = memo(function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSkeleton />
  }

  if (user) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
})

// Memoized OnboardingWrapper
const OnboardingWrapper = memo(function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (user) {
      const shouldShow = localStorage.getItem('mecaia_show_onboarding')
      if (shouldShow === 'true') {
        setShowOnboarding(true)
      }
    }
  }, [user])

  const handleComplete = () => {
    localStorage.removeItem('mecaia_show_onboarding')
    setShowOnboarding(false)
  }

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <Suspense fallback={null}>
            <Onboarding onComplete={handleComplete} />
          </Suspense>
        )}
      </AnimatePresence>
      {children}
    </>
  )
})

export default function App() {
  return (
    <BrowserRouter>
      <OnboardingWrapper>
        <Suspense fallback={<LoadingSkeleton />}>
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                <AuthRedirect>
                  <Landing />
                </AuthRedirect>
              }
            />
            <Route
              path="/login"
              element={
                <AuthRedirect>
                  <Login />
                </AuthRedirect>
              }
            />
            <Route
              path="/signup"
              element={
                <AuthRedirect>
                  <Signup />
                </AuthRedirect>
              }
            />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/chat/:id"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/analyser-devis"
              element={
                <ProtectedRoute>
                  <AnalyseDevis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/garages"
              element={
                <ProtectedRoute>
                  <Garages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/pieces"
              element={
                <ProtectedRoute>
                  <Pieces />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route
              path="/success"
              element={
                <ProtectedRoute>
                  <Success />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/vehicules"
              element={
                <ProtectedRoute>
                  <Vehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/diagnostic-video"
              element={
                <ProtectedRoute>
                  <DiagnosticVideo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/video-chat"
              element={
                <ProtectedRoute>
                  <VideoChatAlex />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/prevision-pannes"
              element={
                <ProtectedRoute>
                  <PrevisionPannes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/mechanic-chat"
              element={
                <ProtectedRoute>
                  <MechanicChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Public pages */}
            <Route path="/pricing" element={<Pricing />} />

            {/* Legal pages */}
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/cgu" element={<CGU />} />
            <Route path="/confidentialite" element={<Confidentialite />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

        <Suspense fallback={null}>
          <CookieBanner />
        </Suspense>
      </OnboardingWrapper>
    </BrowserRouter>
  )
}
