import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import { NotificationProvider } from './context/NotificationContext'
import Dashboard from './pages/Dashboard'
import DroneFeed from './pages/DroneFeed'
import Analytics from './pages/Analytics'
import About from './pages/About'

function App() {
  return (
    <NotificationProvider>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Navbar />
          <div className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/feeds" element={<DroneFeed />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </div>
      </div>
    </NotificationProvider>
  )
}

export default App
