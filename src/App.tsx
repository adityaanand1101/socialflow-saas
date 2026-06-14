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


