import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import Onboarding from '@/components/Onboarding'

// Pages
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Dashboard from '@/pages/Dashboard'
import Chat from '@/pages/Chat'
import History from '@/pages/History'
import Account from '@/pages/Account'
import Success from '@/pages/Success'
import AnalyseDevis from '@/pages/AnalyseDevis'
import Garages from '@/pages/Garages'
import Pieces from '@/pages/Pieces'
import MentionsLegales from '@/pages/MentionsLegales'
import CGU from '@/pages/CGU'
import Confidentialite from '@/pages/Confidentialite'
import NotFound from '@/pages/NotFound'

// Components
import CookieBanner from '@/components/CookieBanner'

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}

function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (user) {
      const done = localStorage.getItem('mecaia_onboarding_done')
      if (!done) {
        setShowOnboarding(true)
      }
    }
  }, [user])

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>
      {children}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <OnboardingWrapper>
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

        {/* Legal pages */}
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/cgu" element={<CGU />} />
        <Route path="/confidentialite" element={<Confidentialite />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CookieBanner />
      </OnboardingWrapper>
    </BrowserRouter>
  )
}
