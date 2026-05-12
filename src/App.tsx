import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/compose" element={<Compose />} />
          <Route path="/media" element={<MediaLibrary />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/ai-studio" element={<AIStudio />} />
          <Route path="/team" element={<Team />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
