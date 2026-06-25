import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Show } from '@clerk/react'
import { Layout } from './components/layout/Layout'
import { LandingPage } from './pages/Landing'
import { AuthPage } from './pages/Auth'
import { AcceptInvite } from './pages/AcceptInvite'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { TermsOfService } from './pages/TermsOfService'
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Compose = lazy(() => import('./pages/Compose').then(m => ({ default: m.Compose })))
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })))
const MediaLibrary = lazy(() => import('./pages/MediaLibrary').then(m => ({ default: m.MediaLibrary })))
const AIStudio = lazy(() => import('./pages/AIStudio').then(m => ({ default: m.AIStudio })))
const Channels = lazy(() => import('./pages/Channels').then(m => ({ default: m.Channels })))
const Calendar = lazy(() => import('./pages/Calendar').then(m => ({ default: m.Calendar })))
const Team = lazy(() => import('./pages/Team').then(m => ({ default: m.Team })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const Inbox = lazy(() => import('./pages/Inbox').then(m => ({ default: m.Inbox })))
const PhotoEditor = lazy(() => import('./pages/PhotoEditor').then(m => ({ default: m.PhotoEditor })))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in/*" element={<AuthPage />} />
        <Route path="/sign-up/*" element={<AuthPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        
        {/* Legacy/Convenience Redirects */}
        <Route path="/calendar" element={<Navigate to="/app/calendar" replace />} />
        <Route path="/compose" element={<Navigate to="/app/compose" replace />} />
        <Route path="/media" element={<Navigate to="/app/media" replace />} />
        <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
        <Route path="/channels" element={<Navigate to="/app/channels" replace />} />
        <Route path="/ai-studio" element={<Navigate to="/app/ai-studio" replace />} />
        <Route path="/team" element={<Navigate to="/app/team" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
        
        {/* Protected Routes */}
        <Route path="/app/*" element={
          <>
            <Show when="signed-in">
              <Layout />
            </Show>
            <Show when="signed-out">
              <Navigate to="/sign-in" replace />
            </Show>
          </>
        }>
          <Route path="" element={
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="calendar" element={
            <Suspense fallback={<LoadingFallback />}>
              <Calendar />
            </Suspense>
          } />
          <Route path="inbox" element={
            <Suspense fallback={<LoadingFallback />}>
              <Inbox />
            </Suspense>
          } />
          <Route path="media/editor" element={
            <Suspense fallback={<LoadingFallback />}>
              <PhotoEditor />
            </Suspense>
          } />
          <Route path="compose" element={
            <Suspense fallback={<LoadingFallback />}>
              <Compose />
            </Suspense>
          } />
          <Route path="media" element={
            <Suspense fallback={<LoadingFallback />}>
              <MediaLibrary />
            </Suspense>
          } />
          <Route path="analytics" element={
            <Suspense fallback={<LoadingFallback />}>
              <Analytics />
            </Suspense>
          } />
          <Route path="channels" element={
            <Suspense fallback={<LoadingFallback />}>
              <Channels />
            </Suspense>
          } />
          <Route path="ai-studio" element={
            <Suspense fallback={<LoadingFallback />}>
              <AIStudio />
            </Suspense>
          } />
          <Route path="team" element={
            <Suspense fallback={<LoadingFallback />}>
              <Team />
            </Suspense>
          } />
          <Route path="settings" element={
            <Suspense fallback={<LoadingFallback />}>
              <Settings />
            </Suspense>
          } />
        </Route>
      </Routes>
    </Router>
  )
}

export default App


