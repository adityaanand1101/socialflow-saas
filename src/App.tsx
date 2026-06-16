import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Show } from '@clerk/react'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Compose } from './pages/Compose'
import { Analytics } from './pages/Analytics'
import { MediaLibrary } from './pages/MediaLibrary'
import { AIStudio } from './pages/AIStudio'
import { Channels } from './pages/Channels'
import { Calendar } from './pages/Calendar'
import { Team } from './pages/Team'
import { Settings } from './pages/Settings'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { TermsOfService } from './pages/TermsOfService'
import { AuthPage } from './pages/Auth'

import { LandingPage } from './pages/Landing'

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
          <Route path="" element={<Dashboard />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="compose" element={<Compose />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="channels" element={<Channels />} />
          <Route path="ai-studio" element={<AIStudio />} />
          <Route path="team" element={<Team />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App


