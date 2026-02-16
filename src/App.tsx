import { useState, useEffect, lazy, Suspense, memo } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { UserLimitsProvider } from '@/contexts/UserLimitsContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Toaster } from 'sonner'

// Lazy loaded pages - Code splitting pour performance
const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/Login'))
const Signup = lazy(() => import('@/pages/Signup'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
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
const SoundScan = lazy(() => import('@/pages/SoundScan'))
const MechanicChat = lazy(() => import('@/pages/MechanicChat'))
const Settings = lazy(() => import('@/pages/Settings'))
const AuthCallback = lazy(() => import('@/pages/AuthCallback'))
const VehicleHistory = lazy(() => import('@/pages/VehicleHistory'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'))
const EmailConfirmation = lazy(() => import('@/pages/EmailConfirmation'))

// Lazy load heavy components
const Onboarding = lazy(() => import('@/components/Onboarding'))
const CookieBanner = lazy(() => import('@/components/CookieBanner'))
const TikTokPixel = lazy(() => import('@/components/analytics/TikTokPixel'))

// Memoized AuthRedirect
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

  const shouldShowInitially = user && localStorage.getItem('mecaia_show_onboarding') === 'true'
  const [showOnboarding, setShowOnboarding] = useState(shouldShowInitially)

  useEffect(() => {
    if (user && localStorage.getItem('mecaia_show_onboarding') === 'true' && !showOnboarding) {
      setShowOnboarding(true) // eslint-disable-line react-hooks/set-state-in-effect
    } else if (!user && showOnboarding) {
      setShowOnboarding(false)
    }
  }, [user, showOnboarding])

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
    <ErrorBoundary>
    <BrowserRouter>
      <UserLimitsProvider>
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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/email-confirmation" element={<EmailConfirmation />} />

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
              path="/payment-success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
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
              path="/app/sound-scan"
              element={
                <ProtectedRoute>
                  <SoundScan />
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
            <Route
              path="/app/vehicle-history"
              element={
                <ProtectedRoute>
                  <VehicleHistory />
                </ProtectedRoute>
              }
            />

            {/* Public pages */}
            <Route path="/pricing" element={<Pricing />} />

            {/* Legal pages */}
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/cgu" element={<CGU />} />
            <Route path="/confidentialite" element={<Confidentialite />} />

            {/* Redirects for removed routes */}
            <Route path="/app/chat" element={<Navigate to="/app/mechanic-chat" replace />} />
            <Route path="/app/chat/:id" element={<Navigate to="/app/mechanic-chat" replace />} />
            <Route path="/app/diagnostic-pro" element={<Navigate to="/app" replace />} />
            <Route path="/app/prevision-pannes" element={<Navigate to="/app" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

        <Suspense fallback={null}>
          <CookieBanner />
        </Suspense>

        {/* TikTok Pixel - loads asynchronously with consent check */}
        <Suspense fallback={null}>
          <TikTokPixel />
        </Suspense>

        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: { background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa' },
          }}
        />
      </OnboardingWrapper>
      </UserLimitsProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
