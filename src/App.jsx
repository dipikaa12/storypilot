import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Generate from './pages/Generate'
import Context from './pages/Context'
import Coverage from './pages/Coverage'
import History from './pages/History'
import Settings from './pages/Settings'
import Analysis from "./pages/Analysis";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Generate />} />
            <Route path="analysis" element={<Analysis />} />
            <Route path="context" element={<Context />} />
            <Route path="coverage" element={<Coverage />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
